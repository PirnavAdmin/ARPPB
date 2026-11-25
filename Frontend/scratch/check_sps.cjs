const mysql = require('C:/Users/ADMIN/Documents/ARPPB/node_modules/mysql2/promise');

async function main() {
  const conn = await mysql.createConnection({
    host: 'srv1061.hstgr.io',
    user: 'u819242402_arppbuser',
    password: 'Pirnav@2026',
    database: 'u819242402_arppb',
    port: 3306
  });

  const [spAddOut] = await conn.query('SHOW CREATE PROCEDURE sp_Vendor_AddProcessingOutput');
  console.log('--- sp_Vendor_AddProcessingOutput ---');
  console.log(spAddOut[0]['Create Procedure']);

  const [spCreateFP] = await conn.query('SHOW CREATE PROCEDURE sp_Vendor_CreateFinishedProduct');
  console.log('--- sp_Vendor_CreateFinishedProduct ---');
  console.log(spCreateFP[0]['Create Procedure']);

  await conn.end();
}

main().catch(console.error);
