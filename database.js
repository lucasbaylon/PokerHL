const mysql = require('mysql2/promise');
// let connection;

// Création du pool de connexions
const pool = mysql.createPool({
    host: 'localhost',
    user: process.env.NODE_ENV === 'production' ? "zartop" : "root",
    password: process.env.NODE_ENV === 'production' ? "#$W&5*grhqd^BScca6kg" : "",
    database: 'pokertraining',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// async function connectDatabase() {
//     connection = await mysql.createConnection({
//         host: 'localhost',
//         user: process.env.NODE_ENV === 'production' ? "zartop" : "root",
//         password: process.env.NODE_ENV === 'production' ? "#$W&5*grhqd^BScca6kg" : "",
//         database: 'pokertraining',
//         waitForConnections: true,
//         connectionLimit: 10,
//         queueLimit: 0
//     });
//     console.log('Connected to the database');
// }

// async function getConnection() {
//     if (!connection) {
//         await connectDatabase();
//     }
//     return connection;
// }

// Fonction pour obtenir une connexion du pool
async function getConnection() {
    return await pool.getConnection();
}

module.exports = {
    getConnection
};