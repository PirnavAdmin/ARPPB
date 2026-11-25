const mysql = require('C:/Users/ADMIN/Documents/ARPPB/node_modules/mysql2/promise');

async function main() {
  const conn = await mysql.createConnection({
    host: 'srv1061.hstgr.io',
    user: 'u819242402_arppbuser',
    password: 'Pirnav@2026',
    database: 'u819242402_arppb',
    port: 3306
  });

  const [triggers] = await conn.query('SHOW TRIGGERS LIKE "vp_sales"');
  console.log('Triggers on vp_sales:', triggers);

  const [sp] = await conn.query('SHOW CREATE PROCEDURE sp_vp_sale_save');
  console.log('--- sp_vp_sale_save ---');
  console.log(sp[0]['Create Procedure']);

  await conn.end();
}

main().catch(console.error);
