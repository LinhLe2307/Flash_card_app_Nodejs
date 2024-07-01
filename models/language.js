const client = require('../postgresql/db')

const getSingleLanguageQuery = async (languageId) => {
    return await client.query(`
        SELECT * FROM language
        WHERE language_id=$1
    `, [languageId])
}


const getAllLanguagesQuery = async() => {
    let query=`
        SELECT * FROM language;
    `
    return await client.query(query)
}

exports.getSingleLanguageQuery = getSingleLanguageQuery
exports.getAllLanguagesQuery = getAllLanguagesQuery