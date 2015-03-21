const mysql = require('mysql');
// Creating mysql pool connection 
global.pool = mysql.createPool({
 // connectionLimit: 10,
  host: 'localhost',
  user: 'missio',
  password: 'missio',
  database: 'agfolks'
  /*user: "nhdigita_missio",
  password: "MW12gGo%7N.R",
  database: "nhdigital_missio"*/
});
