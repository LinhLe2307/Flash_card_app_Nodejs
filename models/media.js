const client = require('../postgresql/db')

const getSingleMediaQuery = async () => {
    return await client.query(`
        SELECT * FROM media
        WHERE 
    `)
}

exports.getSingleMediaQuery = getSingleMediaQuery
