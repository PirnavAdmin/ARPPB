const mysql = require('mysql2/promise');

async function runScenarios() {
  const connection = await mysql.createConnection({
    host: 'srv1061.hstgr.io',
    port: 3306,
    user: 'u819242402_arppbuser',
    password: 'Pirnav@2026',
    database: 'u819242402_arppb',
    multipleStatements: true,
  });

  console.log('--- CONNECTED TO MARIADB ---');

  try {
    // Check an existing vendor
    const [vendors] = await connection.query('SELECT Id, FullName, Email FROM Users WHERE Role = "Vendor" LIMIT 1');
    const vendorId = vendors[0]?.Id || 1;
    console.log(`Using Vendor ID: ${vendorId} (${vendors[0]?.FullName || 'Vendor'})`);

    // Ensure we have a farmer or middleman for purchase testing
    const [farmers] = await connection.query('SELECT Id, FullName, FarmerCode FROM vendor_farmers WHERE VendorId = ? LIMIT 1', [vendorId]);
    const farmer = farmers[0] || { Id: 1, FullName: 'Ramesh Patel', FarmerCode: 'FAR-0001' };

    console.log('\n======================================================');
    console.log('TEST SUITE: MY LEDGER PARTIAL PAYMENT & SETTLE AUDIT');
    console.log('======================================================\n');

    // Create a unique test purchase transaction with original amount 10000.00
    const testTxCode = `PUR-TST-${Date.now().toString().slice(-6)}`;
    const originalAmount = 10000.00;

    console.log(`[SETUP] Creating test purchase entry: ${testTxCode} for ₹${originalAmount}...`);

    const [insertResult] = await connection.query(
      `INSERT INTO vp_ledger_entries 
        (vendor_id, transaction_code, entry_date, description, party_name, party_code, party_category, ledger_category, debit, credit, expected_payment_date, status, settled_amount)
       VALUES (?, ?, UTC_TIMESTAMP(6), ?, ?, ?, 'Farmer', 'Purchase', 0, ?, DATE_ADD(UTC_DATE(), INTERVAL 15 DAY), 'Unpaid', 0)`,
      [vendorId, testTxCode, `Procurement testing for ${testTxCode}`, farmer.FullName, farmer.FarmerCode, originalAmount]
    );

    const testEntryId = insertResult.insertId;
    const testVoucherCode = `VCH-${String(testEntryId).padStart(4, '0')}`;
    await connection.query('UPDATE vp_ledger_entries SET voucher_code = ? WHERE id = ?', [testVoucherCode, testEntryId]);

    console.log(`[SETUP] Created Ledger Entry ID: ${testEntryId}, Voucher: ${testVoucherCode}`);

    // Frontend condition simulation helper
    function evaluateFrontendCanSettle(row) {
      const debit = Number(row.debit || 0);
      const credit = Number(row.credit || 0);
      const total = debit > 0 ? debit : credit;
      const settled = Number(row.settled_amount || row.settledAmount || 0);
      const outstanding = total - settled;
      if (outstanding <= 0) return false;
      const statusNorm = String(row.status || '').trim().toLowerCase();
      if (['paid', 'fully paid', 'settled', 'cancelled'].includes(statusNorm)) return false;
      const cat = String(row.ledger_category || row.category || '').toLowerCase();
      const pCat = String(row.party_category || row.partyCategory || '').toLowerCase();
      const isSettleable = cat.includes('purchase') || cat.includes('sale') || ['farmer', 'middleman', 'customer'].includes(pCat);
      const isNonPayment = !cat.includes('payment') && !cat.includes('receipt');
      return isSettleable && isNonPayment;
    }

    // ------------------------------------------------------------------------
    // SCENARIO 1: First Partial Payment (₹3,000 of ₹10,000 -> ₹7,000 remaining)
    // ------------------------------------------------------------------------
    console.log('\n--- SCENARIO 1: 1st Partial Payment (₹3,000 of ₹10,000) ---');
    const payment1 = 3000.00;
    
    // Call sp_vp_ledger_pay_supplier
    await connection.query('CALL sp_vp_ledger_pay_supplier(?, ?, ?, ?, ?, ?)', [
      vendorId, testEntryId, farmer.FullName, payment1, 'NEFT / RTGS', `REF-S1-${Date.now().toString().slice(-4)}`
    ]);

    const [[s1Entry]] = await connection.query('SELECT * FROM vp_ledger_entries WHERE id = ?', [testEntryId]);
    const s1Remaining = Number(s1Entry.credit) - Number(s1Entry.settled_amount);
    const s1CanSettle = evaluateFrontendCanSettle(s1Entry);

    console.log(`Status after 1st payment: "${s1Entry.status}"`);
    console.log(`Original: ₹${s1Entry.credit}, Settled: ₹${s1Entry.settled_amount}, Remaining: ₹${s1Remaining}`);
    console.log(`Settle Button Visible: ${s1CanSettle ? 'YES (VISIBLE)' : 'NO (MISSING)'}`);

    if (s1Entry.status === 'Partial' && s1Remaining === 7000.00 && s1CanSettle === true) {
      console.log('✅ SCENARIO 1 PASSED: Status is "Partial", remaining is ₹7,000, and Settle button is visible.');
    } else {
      throw new Error(`Scenario 1 Failed! status=${s1Entry.status}, remaining=${s1Remaining}, canSettle=${s1CanSettle}`);
    }

    // ------------------------------------------------------------------------
    // SCENARIO 2: Second Partial Payment (₹2,000 -> Cumulative ₹5,000, ₹5,000 remaining)
    // ------------------------------------------------------------------------
    console.log('\n--- SCENARIO 2: 2nd Partial Payment (₹2,000 -> ₹5,000 remaining) ---');
    const payment2 = 2000.00;

    await connection.query('CALL sp_vp_ledger_pay_supplier(?, ?, ?, ?, ?, ?)', [
      vendorId, testEntryId, farmer.FullName, payment2, 'UPI / IMPS', `REF-S2-${Date.now().toString().slice(-4)}`
    ]);

    const [[s2Entry]] = await connection.query('SELECT * FROM vp_ledger_entries WHERE id = ?', [testEntryId]);
    const s2Remaining = Number(s2Entry.credit) - Number(s2Entry.settled_amount);
    const s2CanSettle = evaluateFrontendCanSettle(s2Entry);

    console.log(`Status after 2nd payment: "${s2Entry.status}"`);
    console.log(`Original: ₹${s2Entry.credit}, Settled: ₹${s2Entry.settled_amount}, Remaining: ₹${s2Remaining}`);
    console.log(`Settle Button Visible: ${s2CanSettle ? 'YES (VISIBLE)' : 'NO (MISSING)'}`);

    if (s2Entry.status === 'Partial' && s2Remaining === 5000.00 && s2CanSettle === true) {
      console.log('✅ SCENARIO 2 PASSED: Status is "Partial", remaining is ₹5,000, and Settle button remains visible.');
    } else {
      throw new Error(`Scenario 2 Failed! status=${s2Entry.status}, remaining=${s2Remaining}, canSettle=${s2CanSettle}`);
    }

    // ------------------------------------------------------------------------
    // SCENARIO 4: Overpayment Rejection Test (Attempting to pay ₹6,000 when only ₹5,000 remains)
    // ------------------------------------------------------------------------
    console.log('\n--- SCENARIO 4: Overpayment Rejection Test (Attempting ₹6,000 > ₹5,000 remaining) ---');
    const overpayment = 6000.00;
    let overpaymentBlocked = false;
    let errorMessage = '';

    try {
      await connection.query('CALL sp_vp_ledger_pay_supplier(?, ?, ?, ?, ?, ?)', [
        vendorId, testEntryId, farmer.FullName, overpayment, 'NEFT', 'REF-OVERPAY'
      ]);
    } catch (err) {
      overpaymentBlocked = true;
      errorMessage = err.message;
      console.log(`Database intercepted and rejected overpayment: "${errorMessage}"`);
    }

    // Verify entry was not altered
    const [[s4Entry]] = await connection.query('SELECT * FROM vp_ledger_entries WHERE id = ?', [testEntryId]);
    const s4Remaining = Number(s4Entry.credit) - Number(s4Entry.settled_amount);

    if (overpaymentBlocked && s4Remaining === 5000.00) {
      console.log('✅ SCENARIO 4 PASSED: Overpayment successfully rejected, database rolled back, balance intact at ₹5,000.');
    } else {
      throw new Error(`Scenario 4 Failed! overpaymentBlocked=${overpaymentBlocked}, remaining=${s4Remaining}`);
    }

    // ------------------------------------------------------------------------
    // SCENARIO 3: Final Settlement Payment (Remaining ₹5,000 -> ₹0 remaining)
    // ------------------------------------------------------------------------
    console.log('\n--- SCENARIO 3: Final Settlement Payment (Remaining ₹5,000 -> Fully Settled) ---');
    const payment3 = 5000.00;

    await connection.query('CALL sp_vp_ledger_pay_supplier(?, ?, ?, ?, ?, ?)', [
      vendorId, testEntryId, farmer.FullName, payment3, 'NEFT / RTGS', `REF-S3-${Date.now().toString().slice(-4)}`
    ]);

    const [[s3Entry]] = await connection.query('SELECT * FROM vp_ledger_entries WHERE id = ?', [testEntryId]);
    const s3Remaining = Number(s3Entry.credit) - Number(s3Entry.settled_amount);
    const s3CanSettle = evaluateFrontendCanSettle(s3Entry);

    console.log(`Status after final payment: "${s3Entry.status}"`);
    console.log(`Original: ₹${s3Entry.credit}, Settled: ₹${s3Entry.settled_amount}, Remaining: ₹${s3Remaining}`);
    console.log(`Settle Button Visible: ${s3CanSettle ? 'YES (VISIBLE)' : 'NO (DISAPPEARED/DISABLED)'}`);

    if (s3Entry.status === 'Paid' && s3Remaining === 0.00 && s3CanSettle === false) {
      console.log('✅ SCENARIO 3 PASSED: Status is "Paid", remaining balance is ₹0, and Settle button disappeared.');
    } else {
      throw new Error(`Scenario 3 Failed! status=${s3Entry.status}, remaining=${s3Remaining}, canSettle=${s3CanSettle}`);
    }

    // ------------------------------------------------------------------------
    // SCENARIO 5: Refresh & Data Persistence Verification
    // ------------------------------------------------------------------------
    console.log('\n--- SCENARIO 5: Refresh & Data Persistence Verification ---');
    
    // Query vouchers linked to this transaction
    const [linkedVouchers] = await connection.query(
      `SELECT id, voucher_code, transaction_code, entry_date, debit, credit, status, payment_mode, reference_no, related_entry_id
       FROM vp_ledger_entries 
       WHERE (id = ? OR related_entry_id = ? OR transaction_code = ?)
       ORDER BY id ASC`,
      [testEntryId, testEntryId, testTxCode]
    );

    console.log(`Total vouchers associated with ${testTxCode}: ${linkedVouchers.length}`);
    linkedVouchers.forEach((v) => {
      console.log(`  - [${v.voucher_code || v.id}] ${v.transaction_code} | Debit: ₹${v.debit} | Credit: ₹${v.credit} | Mode: ${v.payment_mode || 'N/A'} | Status: ${v.status}`);
    });

    // Verify parent has 3 child payment vouchers
    const paymentVouchers = linkedVouchers.filter(v => v.id !== testEntryId);
    const totalPaymentsRecorded = paymentVouchers.reduce((sum, v) => sum + Number(v.debit), 0);

    console.log(`Total payment vouchers persisted: ${paymentVouchers.length}`);
    console.log(`Sum of payments: ₹${totalPaymentsRecorded} (Expected: ₹10,000)`);

    if (linkedVouchers.length === 4 && totalPaymentsRecorded === 10000.00) {
      console.log('✅ SCENARIO 5 PASSED: All transaction history, payment vouchers, and ledger records persist accurately after refresh.');
    } else {
      throw new Error(`Scenario 5 Failed! vouchers=${linkedVouchers.length}, totalPayments=${totalPaymentsRecorded}`);
    }

    // ------------------------------------------------------------------------
    // SCENARIO 6: Duplicate Payment / Already Settled Prevention
    // ------------------------------------------------------------------------
    console.log('\n--- SCENARIO 6: Duplicate Payment / Already Settled Prevention ---');
    let duplicateBlocked = false;
    let dupError = '';

    try {
      await connection.query('CALL sp_vp_ledger_pay_supplier(?, ?, ?, ?, ?, ?)', [
        vendorId, testEntryId, farmer.FullName, 1000.00, 'NEFT', 'REF-DUP-TEST'
      ]);
    } catch (err) {
      duplicateBlocked = true;
      dupError = err.message;
      console.log(`Database intercepted and rejected duplicate payment on settled transaction: "${dupError}"`);
    }

    if (duplicateBlocked) {
      console.log('✅ SCENARIO 6 PASSED: Further payments on fully settled entry are strictly prevented.');
    } else {
      throw new Error('Scenario 6 Failed! Duplicate payment was allowed on settled entry.');
    }

    console.log('\n======================================================');
    console.log('ALL MANDATORY TESTING SCENARIOS 1-6 PASSED 100%');
    console.log('======================================================\n');

  } finally {
    await connection.end();
  }
}

runScenarios().catch(err => {
  console.error('\n❌ TEST SUITE FAILED:', err);
  process.exit(1);
});
