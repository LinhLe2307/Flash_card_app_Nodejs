const client = require('../postgresql/db')

const getSingleCountryQuery = async (countryId) => {
    return await client.query(`
        SELECT * FROM country
        WHERE country_id=$1
    `, [countryId])
}

const getAllCountriesAndLanguagesQuery = async() => {
    let query=`
        WITH get_countries AS (
            SELECT JSON_AGG(
                JSON_BUILD_OBJECT('id', c.country_id, 'country', c.country) 
            ) AS countries
            FROM country c
        ), get_languages AS (
            SELECT JSON_AGG(
            JSON_BUILD_OBJECT('id', l.language_id, 'name', l.name)) AS languages
            FROM language l
            
        )
        SELECT c.countries, l.languages
        FROM get_countries c
        CROSS JOIN get_languages l;
    `
    return await client.query(query)
}
 
exports.getSingleCountryQuery = getSingleCountryQuery
exports.getAllCountriesAndLanguagesQuery = getAllCountriesAndLanguagesQuery