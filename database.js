const mysql = require('mysql2/promise');
// let connection;

// Création du pool de connexions
const pool = mysql.createPool({
    host: process.env.NODE_ENV === 'production' ? process.env.DB_HOST : "localhost",
    user: process.env.NODE_ENV === 'production' ? process.env.DB_USERNAME : "root",
    password: process.env.NODE_ENV === 'production' ? process.env.DB_PASSWORD : "",
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Fonction pour obtenir une connexion du pool
async function getConnection() {
    return await pool.getConnection();
}

module.exports = {
    getConnection
};