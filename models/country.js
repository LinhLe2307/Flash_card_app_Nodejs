const client = require('../postgresql/db')

const getSingleCountryQuery = async (countryId) => {
    return await client.query(`
        SELECT * FROM country
        WHERE country_id=$1
    `, [countryId])
}

const getAllCountriesQuery = async() => {
    let query=`
        SELECT * FROM country;
    `
    return await client.query(query)
}
 
exports.getSingleCountryQuery = getSingleCountryQuery
exports.getAllCountriesQuery = getAllCountriesQuery