const mysql = require('C:/Users/ADMIN/Documents/ARPPB/node_modules/mysql2/promise');

async function test() {
  const conn = await mysql.createConnection({
    host: 'srv1061.hstgr.io',
    user: 'u819242402_arppbuser',
    password: 'Pirnav@2026',
    database: 'u819242402_arppb'
  });

  const [res] = await conn.query('CALL sp_Vendor_GetPurchases(27, "All", "All", NULL, NULL, NULL, NULL, 1, 10)');
  console.log('Result set 1:', res[0]);
  console.log('Result set 2 first row:', res[1][0]);
  await conn.end();
}

test().catch(console.error);
