const client = require('../postgresql/db')

const getSingleCountryQuery = async (countryId) => {
    return await client.query(`
        SELECT * FROM country
        WHERE country_id=$1
    `, [countryId])
}

exports.getSingleCountryQuery = getSingleCountryQuery