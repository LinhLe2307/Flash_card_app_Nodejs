const { Client } = require('pg')

const client = new Client({
    user: 'linhle',
    password: '1368',
    port: 5432,
    database: 'pernflashcard',
    host: 'localhost'
})

module.exports = client