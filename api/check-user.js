const sql = require('mssql');
const c = require('./bloom-sql-config.json');

sql.connect({
  server: c.SqlServer,
  database: c.SqlDatabase,
  user: c.SqlUser,
  password: c.SqlPassword,
  options: { encrypt: true }
}).then(async p => {
  const r = await p.query(`SELECT id, azure_ad_object_id, email, role FROM users WHERE azure_ad_object_id = '03f17678-7885-4e63-9b95-86e0498db620'`);
  console.log('User record:', r.recordset);
  
  if (r.recordset.length > 0) {
    const perms = await p.query(`SELECT permission FROM user_permissions WHERE user_id = '${r.recordset[0].id}'`);
    console.log('Permissions:', perms.recordset.map(x => x.permission));
  }
  
  process.exit();
}).catch(e => {
  console.error(e);
  process.exit(1);
});
