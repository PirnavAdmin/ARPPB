const mysql = require('mysql2/promise');

async function runCustomerSaleScenarios() {
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
    const vendorId = 53;
    const [custs] = await connection.query(
      `SELECT c.UserId AS Id, u.FullName AS CustomerName, c.CustomerCode 
       FROM Customers c 
       JOIN Users u ON u.Id = c.UserId 
       WHERE u.IsActive = 1 
       LIMIT 1`
    );
    const cust = custs[0] || { Id: 63, CustomerName: 'Budigina Ganesh', CustomerCode: 'CUST-2026-0063' };

    console.log(`Using Customer: ${cust.CustomerName} (${cust.CustomerCode})`);

    // Ensure we have a product batch with stock
    const [batches] = await connection.query(
      `SELECT id, product_name, quantity_available, suggested_price 
       FROM vp_finished_product_batches 
       WHERE vendor_id = ? AND quantity_available >= 5
       LIMIT 1`,
      [vendorId]
    );

    if (batches.length === 0) {
      console.log('No existing batches with stock >= 5. Inserting test batch...');
      const [bInsert] = await connection.query(
        `INSERT INTO vp_finished_product_batches
          (vendor_id, product_name, batch_code, unit, quantity_available, cost_per_unit, suggested_price, status)
         VALUES (?, 'Organic Wheat Flour', CONCAT('BAT-', SUBSTRING(UUID(), 1, 8)), 'kg', 100, 40.00, 50.00, 'Active')`,
        [vendorId]
      );
      batches.push({ id: bInsert.insertId, product_name: 'Organic Wheat Flour', quantity_available: 100, suggested_price: 50.00 });
    }

    const batch = batches[0];
    const unitPrice = 1000.00; // 10 units @ 1000 = 10,000 total
    const qty = 10;
    const totalAmount = 10000.00;

    console.log('\n=============================================================');
    console.log('TEST SUITE: CUSTOMER SALE PARTIAL RECEIPT & SETTLEMENT AUDIT');
    console.log('=============================================================\n');

    // 1. Create a Sale for ₹10,000 with 0 initial payment (Full Credit)
    const saleItemsJson = JSON.stringify([{
      finishedBatchId: batch.id,
      quantity: qty,
      pricePerUnit: unitPrice
    }]);

    console.log(`[1] Creating customer sale with 10 units @ ₹${unitPrice} = ₹${totalAmount}...`);
    const [saleRes] = await connection.query(
      `CALL sp_vp_sale_save(?, NULL, ?, NULL, 0.00, 0.00, 0.00, 0.00, '2026-12-01', '2026-12-15', 'Net 15', 'Test customer sale', ?, 1, 'MOCK_OTP_HASH', 15)`,
      [vendorId, cust.Id, saleItemsJson]
    );

    // Get the newly created sale
    const [[sale]] = await connection.query('SELECT * FROM vp_sales WHERE vendor_id = ? ORDER BY id DESC LIMIT 1', [vendorId]);
    console.log(`Created Sale ID: ${sale.id}, Code: ${sale.sale_code}, Total: ₹${sale.total_amount}, Received: ₹${sale.amount_received}, Status: ${sale.payment_status}`);

    // Verify parent ledger entry exists
    const [[parentLedger]] = await connection.query('SELECT * FROM vp_ledger_entries WHERE sale_id = ? OR transaction_code = ?', [sale.id, sale.sale_code]);
    console.log(`Associated Ledger Entry: ID ${parentLedger.id}, Voucher: ${parentLedger.voucher_code}, Debit: ₹${parentLedger.debit}, Settled: ₹${parentLedger.settled_amount}, Status: ${parentLedger.status}`);

    // 2. First Receipt of ₹3,000
    console.log('\n[2] Recording 1st Customer Receipt of ₹3,000...');
    await connection.query('CALL sp_vp_ledger_record_receipt(?, ?, ?, ?, ?, ?)', [
      vendorId, sale.id, cust.Id, 3000.00, 'NEFT / RTGS', 'UTR-REC-1'
    ]);

    const [[sAfter1]] = await connection.query('SELECT * FROM vp_sales WHERE id = ?', [sale.id]);
    const [[ldgAfter1]] = await connection.query('SELECT * FROM vp_ledger_entries WHERE id = ?', [parentLedger.id]);
    console.log(`Sale after 1st receipt: Received=₹${sAfter1.amount_received}, Due=₹${Number(sAfter1.total_amount) - Number(sAfter1.amount_received)}, Status=${sAfter1.payment_status}`);
    console.log(`Ledger after 1st receipt: Settled=₹${ldgAfter1.settled_amount}, Status=${ldgAfter1.status}`);

    if (Number(sAfter1.amount_received) === 3000.00 && ldgAfter1.status === 'Partial') {
      console.log('✅ 1st Customer Receipt successful: Status is Partial, remaining is ₹7,000.');
    } else {
      throw new Error(`Receipt 1 verification failed! sale_rcv=${sAfter1.amount_received}, ldg_status=${ldgAfter1.status}`);
    }

    // 3. Second Receipt of ₹2,000
    console.log('\n[3] Recording 2nd Customer Receipt of ₹2,000...');
    await connection.query('CALL sp_vp_ledger_record_receipt(?, ?, ?, ?, ?, ?)', [
      vendorId, sale.id, cust.Id, 2000.00, 'UPI / IMPS', 'UTR-REC-2'
    ]);

    const [[sAfter2]] = await connection.query('SELECT * FROM vp_sales WHERE id = ?', [sale.id]);
    const [[ldgAfter2]] = await connection.query('SELECT * FROM vp_ledger_entries WHERE id = ?', [parentLedger.id]);
    console.log(`Sale after 2nd receipt: Received=₹${sAfter2.amount_received}, Due=₹${Number(sAfter2.total_amount) - Number(sAfter2.amount_received)}, Status=${sAfter2.payment_status}`);

    if (Number(sAfter2.amount_received) === 5000.00 && ldgAfter2.status === 'Partial') {
      console.log('✅ 2nd Customer Receipt successful: Status is Partial, remaining is ₹5,000.');
    } else {
      throw new Error(`Receipt 2 verification failed!`);
    }

    // 4. Overpayment Rejection
    console.log('\n[4] Testing Overpayment Rejection (Attempting ₹6,000 > ₹5,000 remaining)...');
    let custOverpayBlocked = false;
    try {
      await connection.query('CALL sp_vp_ledger_record_receipt(?, ?, ?, ?, ?, ?)', [
        vendorId, sale.id, cust.Id, 6000.00, 'NEFT', 'UTR-REC-OVERPAY'
      ]);
    } catch (err) {
      custOverpayBlocked = true;
      console.log(`Database intercepted and rejected customer overpayment: "${err.message}"`);
    }

    if (custOverpayBlocked) {
      console.log('✅ Customer overpayment successfully rejected.');
    } else {
      throw new Error('Customer overpayment was not rejected!');
    }

    // 5. Final Receipt of remaining ₹5,000
    console.log('\n[5] Recording Final Customer Receipt of ₹5,000...');
    await connection.query('CALL sp_vp_ledger_record_receipt(?, ?, ?, ?, ?, ?)', [
      vendorId, sale.id, cust.Id, 5000.00, 'NEFT / RTGS', 'UTR-REC-3'
    ]);

    const [[sAfter3]] = await connection.query('SELECT * FROM vp_sales WHERE id = ?', [sale.id]);
    const [[ldgAfter3]] = await connection.query('SELECT * FROM vp_ledger_entries WHERE id = ?', [parentLedger.id]);
    console.log(`Sale after final receipt: Received=₹${sAfter3.amount_received}, Status=${sAfter3.payment_status}`);
    console.log(`Ledger after final receipt: Settled=₹${ldgAfter3.settled_amount}, Status=${ldgAfter3.status}`);

    if (Number(sAfter3.amount_received) === 10000.00 && sAfter3.payment_status === 'Paid' && ldgAfter3.status === 'Paid') {
      console.log('✅ Final Customer Receipt successful: Status is "Paid", fully settled.');
    } else {
      throw new Error('Final customer receipt failed!');
    }

    console.log('\n=============================================================');
    console.log('CUSTOMER SALE PARTIAL RECEIPT SUITE PASSED 100%');
    console.log('=============================================================\n');

  } finally {
    await connection.end();
  }
}

runCustomerSaleScenarios().catch(err => {
  console.error('\n❌ CUSTOMER SALE TEST SUITE FAILED:', err);
  process.exit(1);
});
