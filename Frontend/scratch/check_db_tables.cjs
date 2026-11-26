const mysql = require('C:/Users/ADMIN/Documents/ARPPB/node_modules/mysql2/promise');

async function main() {
  const conn = await mysql.createConnection({
    host: 'srv1061.hstgr.io',
    user: 'u819242402_arppbuser',
    password: 'Pirnav@2026',
    database: 'u819242402_arppb',
    port: 3306
  });

  const [productTables] = await conn.query('SHOW TABLES LIKE "%product%"');
  console.log('Product tables:', productTables);

  const [finishedTables] = await conn.query('SHOW TABLES LIKE "%finished%"');
  console.log('Finished tables:', finishedTables);

  const [vpBatches] = await conn.query('SELECT * FROM vp_finished_product_batches LIMIT 5');
  console.log('vp_finished_product_batches count & sample:', vpBatches.length, vpBatches[0]);

  const [vfp] = await conn.query('SELECT * FROM vendor_finished_products');
  console.log('vendor_finished_products count & sample:', vfp.length, vfp);

  const [vpSales] = await conn.query('SELECT * FROM vp_sales');
  console.log('vp_sales count & rows:', vpSales.length, vpSales);

  const [vpSaleItems] = await conn.query('SELECT * FROM vp_sale_items');
  console.log('vp_sale_items count & rows:', vpSaleItems.length, vpSaleItems);

  const [custOrders] = await conn.query('SHOW TABLES LIKE "%order%"');
  console.log('Order tables:', custOrders);

  const [vco] = await conn.query('SELECT * FROM vendor_customer_orders');
  console.log('vendor_customer_orders count & rows:', vco.length, vco);

  await conn.end();
}

main().catch(console.error);
