// const { createPool }= require("mysql2");
const mysql = require('mysql2');

const pool = mysql.createPool({
    port: process.env.DB_PORT,
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    connectionLimit:10,
    waitForConnections: true,
    queueLimit: 0
});
pool.on('connection', function (connection) {
    console.log('MySQL Pool connected: threadId ' + connection.threadId);
});

pool.on('error', function (err) {
    console.error('MySQL Pool Error:', err);
    if (err.code === 'PROTOCOL_CONNECTION_LOST') {
        console.log('Database connection lost. Reconnecting...');
    } else {
        throw err;
    }
});
module.exports = pool;