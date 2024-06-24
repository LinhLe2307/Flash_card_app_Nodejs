const client = require('../postgresql/db')

const getSingleLanguageQuery = async (languageId) => {
    return await client.query(`
        SELECT * FROM language
        WHERE language_id=$1
    `, [languageId])
}

exports.getSingleLanguageQuery = getSingleLanguageQuery