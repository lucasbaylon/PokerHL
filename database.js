const mysql = require('mysql2/promise');
let connection;

async function connectDatabase() {
    connection = await mysql.createConnection({
        host: 'localhost',
        user: process.env.NODE_ENV === 'production' ? "zartop" : "root",
        password: process.env.NODE_ENV === 'production' ? "#$W&5*grhqd^BScca6kg" : "",
        database: 'pokertraining'
    });
    console.log('Connected to the database');
}

async function getConnection() {
    if (!connection) {
        await connectDatabase();
    }
    return connection;
}

module.exports = {
    getConnection
};