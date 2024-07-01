const { Client } = require('pg')
require('dotenv').config();

let client 
if (process.env.DATABASE_URL) {
    client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: {
            rejectUnauthorized: false
        }
    })
} else {
    client = new Client({
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        port: process.env.DB_PORT,
        database: process.env.DB_NAME,
        host: process.env.DB_HOST
    })
}

module.exports = client