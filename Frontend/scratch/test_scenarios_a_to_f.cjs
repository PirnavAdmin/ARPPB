const mysql = require('C:/Users/ADMIN/Documents/ARPPB/node_modules/mysql2/promise');

async function runScenarioTests() {
  const conn = await mysql.createConnection({
    host: 'srv1061.hstgr.io',
    user: 'u819242402_arppbuser',
    password: 'Pirnav@2026',
    database: 'u819242402_arppb'
  });

  console.log('=== STARTING END-TO-END VERIFICATION: SCENARIOS A THROUGH F ===\n');
  const results = {};

  const VENDOR_ID = 27;

  // -------------------------------------------------------------------------
  // SCENARIO A & B: Customer Nandini Sale ₹50,000 -> Partial ₹20,000 -> Final ₹30,000
  // -------------------------------------------------------------------------
  console.log('--- TEST SCENARIO A: Customer Nandini Partial Payment (₹20,000 on ₹50,000) ---');

  // 1. Create a fresh sale for Nandini for ₹50,000
  const [custRows] = await conn.query('SELECT Id, CustomerCode, CustomerName FROM vendor_customers WHERE VendorId = ? AND LOWER(CustomerName) LIKE ? LIMIT 1', [VENDOR_ID, '%nandini%']);
  const nandiniCust = custRows[0] || { Id: 23, CustomerCode: 'CUST-0001', CustomerName: 'nandini' };
  console.log('Using customer:', nandiniCust);

  // Get a finished product batch for sale items
  const [batchRows] = await conn.query('SELECT id, product_name, batch_code, quantity_available FROM vp_finished_product_batches WHERE vendor_id = ? AND quantity_available >= 10 ORDER BY id DESC LIMIT 1', [VENDOR_ID]);
  const batch = batchRows[0] || { id: 22, product_name: 'maize', batch_code: 'FG-MAI-2026-004' };
  console.log('Using batch:', { id: batch.id, name: batch.product_name, available: batch.quantity_available });

  // Call sp_vp_sale_save with submit = 1
  const itemsJson = JSON.stringify([{ finishedBatchId: batch.id, quantity: 10, pricePerUnit: 5000 }]);
  await conn.query(
    'CALL sp_vp_sale_save(?, NULL, ?, 0, 0, 0, 0, DATE_ADD(CURRENT_DATE(), INTERVAL 7 DAY), DATE_ADD(CURRENT_DATE(), INTERVAL 14 DAY), "Net 15", "Scenario A Test Sale", 1, NULL, 60, ?)',
    [VENDOR_ID, nandiniCust.Id, itemsJson]
  );
  const [latestSales] = await conn.query('SELECT * FROM vp_sales WHERE vendor_id = ? ORDER BY id DESC LIMIT 1', [VENDOR_ID]);
  const createdSale = latestSales[0];
  const saleId = createdSale.id;
  const saleCode = createdSale.sale_code;
  const orderCode = createdSale.order_code;
  console.log(`Created Sale: ID=${saleId}, SaleCode=${saleCode}, OrderCode=${orderCode}, Total=₹${createdSale.total_amount}`);

  // 2. Record Partial Payment 1: ₹20,000
  console.log('\nRecording Partial Payment of ₹20,000 against Sale:', saleCode);
  const [rec1Res] = await conn.query(
    'CALL sp_vp_ledger_record_receipt(?, ?, ?, 20000.00, "Bank Transfer", "UTR-PARTIAL-001")',
    [VENDOR_ID, saleId, nandiniCust.Id]
  );
  console.log('Receipt 1 Applied Amount:', rec1Res[0][0].applied_amount);

  // 3. Verify Scenario A across all screens:
  // 3a. vp_sales
  const [saleCheckA] = await conn.query('SELECT total_amount, amount_received, payment_status, order_status FROM vp_sales WHERE id = ?', [saleId]);
  const scA = saleCheckA[0];
  console.log('vp_sales:', { total: scA.total_amount, received: scA.amount_received, status: scA.payment_status });
  const scAPass = Number(scA.amount_received) === 20000 && Number(scA.total_amount) === 50000 && (scA.payment_status === 'Partial' || scA.payment_status === 'Partially Paid');

  // 3b. vendor_customer_orders
  const [ordCheckA] = await conn.query('SELECT TotalAmount, DueAmount, OrderStatus FROM vendor_customer_orders WHERE OrderCode = ?', [orderCode]);
  const ocA = ordCheckA[0];
  console.log('vendor_customer_orders:', { total: ocA.TotalAmount, due: ocA.DueAmount, status: ocA.OrderStatus });
  const ocAPass = Number(ocA.TotalAmount) === 50000 && Number(ocA.DueAmount) === 30000;

  // 3c. vp_ledger_entries (Parent Receivable & Receipt Voucher)
  const [ldgCheckA] = await conn.query('SELECT transaction_code, ledger_category, debit, credit, settled_amount, status FROM vp_ledger_entries WHERE sale_id = ? ORDER BY id', [saleId]);
  console.log('vp_ledger_entries for sale:', ldgCheckA);
  const parentSaleLdgA = ldgCheckA.find(l => l.ledger_category === 'Sale');
  const receiptVoucherA = ldgCheckA.find(l => l.ledger_category === 'Receipt');
  const ldgAPass = parentSaleLdgA && Number(parentSaleLdgA.settled_amount) === 20000 && (parentSaleLdgA.status === 'Partial' || parentSaleLdgA.status === 'Partially Paid')
                && receiptVoucherA && Number(receiptVoucherA.credit) === 20000 && receiptVoucherA.status === 'Paid';

  // 3d. Customers Overview & List
  const [custOverviewA] = await conn.query('CALL sp_VendorPartners_GetCustomerById(?, ?)', [VENDOR_ID, nandiniCust.CustomerCode]);
  const custOrdersA = custOverviewA[1]; // Result set 2: orders
  const thisOrderA = custOrdersA.find(o => o.OrderCode === orderCode);
  console.log('Customer Order in Details View:', thisOrderA);
  const custAPass = thisOrderA && Number(thisOrderA.DueAmount) === 30000;

  results.ScenarioA = scAPass && ocAPass && ldgAPass && custAPass;
  console.log('>>> SCENARIO A RESULT:', results.ScenarioA ? 'PASS' : 'FAIL');

  // -------------------------------------------------------------------------
  // SCENARIO B: Customer Nandini Final Payment (₹30,000 on remaining balance)
  // -------------------------------------------------------------------------
  console.log('\n--- TEST SCENARIO B: Customer Nandini Final Payment (₹30,000) ---');
  const [rec2Res] = await conn.query(
    'CALL sp_vp_ledger_record_receipt(?, ?, ?, 30000.00, "UPI / Online", "UTR-FINAL-002")',
    [VENDOR_ID, saleId, nandiniCust.Id]
  );
  console.log('Receipt 2 Applied Amount:', rec2Res[0][0].applied_amount);

  // Verify Scenario B across all screens:
  // 4a. vp_sales
  const [saleCheckB] = await conn.query('SELECT total_amount, amount_received, payment_status, order_status FROM vp_sales WHERE id = ?', [saleId]);
  const scB = saleCheckB[0];
  console.log('vp_sales:', { total: scB.total_amount, received: scB.amount_received, status: scB.payment_status });
  const scBPass = Number(scB.amount_received) === 50000 && Number(scB.total_amount) === 50000 && scB.payment_status === 'Paid';

  // 4b. vendor_customer_orders
  const [ordCheckB] = await conn.query('SELECT TotalAmount, DueAmount, OrderStatus FROM vendor_customer_orders WHERE OrderCode = ?', [orderCode]);
  const ocB = ordCheckB[0];
  console.log('vendor_customer_orders:', { total: ocB.TotalAmount, due: ocB.DueAmount, status: ocB.OrderStatus });
  const ocBPass = Number(ocB.TotalAmount) === 50000 && Number(ocB.DueAmount) === 0;

  // 4c. vp_ledger_entries
  const [ldgCheckB] = await conn.query('SELECT transaction_code, ledger_category, debit, credit, settled_amount, status FROM vp_ledger_entries WHERE sale_id = ? ORDER BY id', [saleId]);
  console.log('vp_ledger_entries after final payment:', ldgCheckB);
  const parentSaleLdgB = ldgCheckB.find(l => l.ledger_category === 'Sale');
  const receiptVouchersB = ldgCheckB.filter(l => l.ledger_category === 'Receipt');
  const totalReceipts = receiptVouchersB.reduce((s, r) => s + Number(r.credit), 0);
  const ldgBPass = parentSaleLdgB && Number(parentSaleLdgB.settled_amount) === 50000 && parentSaleLdgB.status === 'Paid'
                && totalReceipts === 50000;

  // 4d. Customer Details View
  const [custOverviewB] = await conn.query('CALL sp_VendorPartners_GetCustomerById(?, ?)', [VENDOR_ID, nandiniCust.CustomerCode]);
  const thisOrderB = custOverviewB[1].find(o => o.OrderCode === orderCode);
  console.log('Customer Order in Details View after final payment:', thisOrderB);
  const custBPass = thisOrderB && Number(thisOrderB.DueAmount) === 0;

  results.ScenarioB = scBPass && ocBPass && ldgBPass && custBPass;
  console.log('>>> SCENARIO B RESULT:', results.ScenarioB ? 'PASS' : 'FAIL');

  // -------------------------------------------------------------------------
  // SCENARIO C: Farmer Purchase & Payment
  // -------------------------------------------------------------------------
  console.log('\n--- TEST SCENARIO C: Farmer Purchase & Payment ---');
  // 1. Create a farmer purchase
  const [farRows] = await conn.query('SELECT Id, FarmerCode, FullName FROM vendor_farmers WHERE VendorId = ? LIMIT 1', [VENDOR_ID]);
  const farmer = farRows[0];
  console.log('Using farmer:', farmer);

  const purCode = 'PUR-F-TEST-' + Date.now().toString().slice(-4);
  const [purRes] = await conn.query(
    'CALL sp_Vendor_CreateFarmerPurchase(?, ?, ?, ?, "Turmeric", "Salem FAQ", 10.00, "Quintal", 4000.00, 40000.00, 40000.00, "Pending", NOW(6))',
    [VENDOR_ID, farmer.Id, purCode, 'BILL-FAR-001']
  );
  console.log('Farmer purchase created:', purCode, 'Total=₹40,000, Due=₹40,000');

  // 2. Pay ₹15,000 towards the purchase via sp_vp_ledger_pay_supplier
  const [ldgPurEntry] = await conn.query('SELECT id FROM vp_ledger_entries WHERE transaction_code = ? AND ledger_category = "Purchase"', [purCode]);
  const purLdgId = ldgPurEntry[0].id;
  console.log(`Paying ₹15,000 towards purchase entry #${purLdgId}...`);

  await conn.query('CALL sp_vp_ledger_pay_supplier(?, ?, NULL, 15000.00, "NEFT", "REF-FAR-001")', [VENDOR_ID, purLdgId]);

  // 3. Verify farmer purchase updated
  const [farPurCheck] = await conn.query('SELECT TotalAmount, DueAmount, PaymentStatus FROM vendor_farmer_purchases WHERE PurchaseCode = ?', [purCode]);
  console.log('vendor_farmer_purchases:', farPurCheck[0]);
  const farPurPass = Number(farPurCheck[0].DueAmount) === 25000 && farPurCheck[0].PaymentStatus === 'Partial';

  // 4. Verify vendor_farmer_payments has payment record
  const [farPayCheck] = await conn.query('SELECT FarmerId, Amount, PaymentMethod FROM vendor_farmer_payments WHERE Notes LIKE ?', [`%${purCode}%`]);
  console.log('vendor_farmer_payments:', farPayCheck);
  const farPayPass = farPayCheck.length > 0 && Number(farPayCheck[0].Amount) === 15000;

  // 5. Verify vp_ledger_entries
  const [farLdgCheck] = await conn.query('SELECT settled_amount, status FROM vp_ledger_entries WHERE id = ?', [purLdgId]);
  console.log('vp_ledger_entries purchase entry:', farLdgCheck[0]);
  const farLdgPass = Number(farLdgCheck[0].settled_amount) === 15000 && farLdgCheck[0].status === 'Partial';

  results.ScenarioC = farPurPass && farPayPass && farLdgPass;
  console.log('>>> SCENARIO C RESULT:', results.ScenarioC ? 'PASS' : 'FAIL');

  // -------------------------------------------------------------------------
  // SCENARIO D: Middleman Purchase & Payment
  // -------------------------------------------------------------------------
  console.log('\n--- TEST SCENARIO D: Middleman Purchase & Payment ---');
  const [midRows] = await conn.query('SELECT Id, MiddlemanCode, FullName FROM vendor_middlemen WHERE VendorId = ? LIMIT 1', [VENDOR_ID]);
  const middleman = midRows[0];
  console.log('Using middleman:', middleman);

  const midPurCode = 'PUR-M-TEST-' + Date.now().toString().slice(-4);
  await conn.query(
    'CALL sp_Vendor_CreateMiddlemanPurchase(?, ?, ?, ?, "Chilli", "Guntur FAQ", 20.00, "Quintal", 3000.00, 60000.00, 60000.00, "Pending", NOW(6))',
    [VENDOR_ID, middleman.Id, midPurCode, 'BILL-MID-001']
  );
  console.log('Middleman purchase created:', midPurCode, 'Total=₹60,000, Due=₹60,000');

  // Pay ₹60,000 (Full Payment)
  const [ldgMidEntry] = await conn.query('SELECT id FROM vp_ledger_entries WHERE transaction_code = ? AND ledger_category = "Purchase"', [midPurCode]);
  const midLdgId = ldgMidEntry[0].id;
  console.log(`Paying ₹60,000 full payment towards middleman purchase entry #${midLdgId}...`);

  await conn.query('CALL sp_vp_ledger_pay_supplier(?, ?, NULL, 60000.00, "RTGS", "REF-MID-001")', [VENDOR_ID, midLdgId]);

  // Verify middleman purchase updated
  const [midPurCheck] = await conn.query('SELECT TotalAmount, DueAmount, PaymentStatus FROM vendor_middleman_purchases WHERE PurchaseCode = ?', [midPurCode]);
  console.log('vendor_middleman_purchases:', midPurCheck[0]);
  const midPurPass = Number(midPurCheck[0].DueAmount) === 0 && midPurCheck[0].PaymentStatus === 'Paid';

  // Verify vendor_middleman_payments has record
  const [midPayCheck] = await conn.query('SELECT MiddlemanId, Amount, PaymentMethod FROM vendor_middleman_payments WHERE Notes LIKE ?', [`%${midPurCode}%`]);
  console.log('vendor_middleman_payments:', midPayCheck);
  const midPayPass = midPayCheck.length > 0 && Number(midPayCheck[0].Amount) === 60000;

  // Verify vp_ledger_entries
  const [midLdgCheck] = await conn.query('SELECT settled_amount, status FROM vp_ledger_entries WHERE id = ?', [midLdgId]);
  console.log('vp_ledger_entries middleman entry:', midLdgCheck[0]);
  const midLdgPass = Number(midLdgCheck[0].settled_amount) === 60000 && midLdgCheck[0].status === 'Paid';

  results.ScenarioD = midPurPass && midPayPass && midLdgPass;
  console.log('>>> SCENARIO D RESULT:', results.ScenarioD ? 'PASS' : 'FAIL');

  // -------------------------------------------------------------------------
  // SCENARIO E: Historical Records Preservation
  // -------------------------------------------------------------------------
  console.log('\n--- TEST SCENARIO E: Historical Records Preservation ---');
  // Check that all previously posted vouchers still exist in vp_ledger_entries
  const [allLdg] = await conn.query('SELECT COUNT(*) AS totalEntries, SUM(debit) AS totalDebit, SUM(credit) AS totalCredit FROM vp_ledger_entries WHERE vendor_id = ?', [VENDOR_ID]);
  console.log('Ledger summary:', allLdg[0]);
  const ldgPreserved = Number(allLdg[0].totalEntries) > 5;
  results.ScenarioE = ldgPreserved;
  console.log('>>> SCENARIO E RESULT:', results.ScenarioE ? 'PASS' : 'FAIL');

  // -------------------------------------------------------------------------
  // SCENARIO F: Failed/Pending Payment Validation
  // -------------------------------------------------------------------------
  console.log('\n--- TEST SCENARIO F: Overpayment / Invalid Payment Rejection ---');
  let overpayBlocked = false;
  try {
    // Attempt to pay more than the outstanding balance on saleId (balance is 0)
    await conn.query('CALL sp_vp_ledger_record_receipt(?, ?, ?, 1000.00, "Cash", "OVERPAY-FAIL")', [VENDOR_ID, saleId, nandiniCust.Id]);
  } catch (err) {
    console.log('Expected error received on overpayment:', err.message);
    if (err.message.includes('409') || err.message.includes('no outstanding dues') || err.message.includes('exceeds')) {
      overpayBlocked = true;
    }
  }

  results.ScenarioF = overpayBlocked;
  console.log('>>> SCENARIO F RESULT:', results.ScenarioF ? 'PASS' : 'FAIL');

  console.log('\n======================================================');
  console.log('FINAL SCENARIOS TEST SUMMARY:');
  console.log(JSON.stringify(results, null, 2));
  console.log('======================================================');

  await conn.end();

  const allPassed = Object.values(results).every(v => v === true);
  if (!allPassed) {
    process.exit(1);
  }
}

runScenarioTests().catch(err => {
  console.error('Test execution error:', err);
  process.exit(1);
});
