const mysql = require('mysql2');

// Create a connection pool
const pool = mysql.createPool({
  host: 'thsv80.hostatom.com',
  user: 'preme_aar_user',
  password: '93v4O~q7i',
  database: 'preme_project_aar_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Export the pool as a promise-based pool
module.exports = pool.promise();
