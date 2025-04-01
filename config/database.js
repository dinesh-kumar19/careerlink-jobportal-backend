const { createPool }= require("mysql2");
const mysql = require('mysql2');

// const pool = mysql.createPool({
//     port:process.env.DB_PORT,
//     host:"localhost",
//     user:"root",
//     password:"123456",
//     database:"job_portal",
//     connectionLimit:10
// });
// Use environment variables to get the database configuration
const pool = mysql.createPool({
    port: process.env.DB_PORT || 3306, 
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root', 
    password: process.env.DB_PASS || '', 
    database: process.env.DB_NAME || 'job_portal', 
    connectionLimit: 10
});
module.exports = pool;