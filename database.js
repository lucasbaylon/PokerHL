const mysql = require('mysql2/promise');
// let connection;

const isProduction = process.env.NODE_ENV === 'production';

const dbConfig = isProduction
    ? {
        host: process.env.DB_HOST,
        user: process.env.DB_USERNAME,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        port: process.env.DB_PORT ? Number(process.env.DB_PORT) : undefined
    }
    : {
        host: process.env.LOCAL_DB_HOST || 'localhost',
        user: process.env.LOCAL_DB_USERNAME || 'root',
        password: process.env.LOCAL_DB_PASSWORD || '',
        database: process.env.LOCAL_DB_NAME || 'pokerhl_local',
        port: process.env.LOCAL_DB_PORT ? Number(process.env.LOCAL_DB_PORT) : 3306
    };

// Création du pool de connexions
const pool = mysql.createPool({
    ...dbConfig,
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
