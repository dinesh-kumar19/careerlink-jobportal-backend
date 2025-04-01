const { createPool }= require("mysql2");
const mysql = require('mysql2');

const pool = mysql.createPool({
    port:process.env.DB_PORT,
    host:"localhost",
    user:"root",
    password:"123456",
    database:"job_portal",
    connectionLimit:10
});
module.exports = pool;