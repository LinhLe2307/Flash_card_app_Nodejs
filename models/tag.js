const client = require('../postgresql/db')

const getSingleTagByNameQuery = async(tagNames) => {
    return await client.query(`SELECT * FROM tag WHERE tag=$1`, [tagNames])
}

const createTagQuery = async(tagNames) => {
     // Convert array elements to formatted strings
    const inArray = tagNames.map(element => `'${element.toLowerCase()}'`);
    
    // Join formatted elements into a single string
    const inArrayFormattedString = `(${inArray.join(',')})`;
    const formattedTagsValues = tagNames.map(tag => `('${tag.toLowerCase()}')`).join(',');
    const query = `
        WITH ins AS (
            INSERT INTO tag (name)
            VALUES ${formattedTagsValues}
            ON CONFLICT (name) DO NOTHING
            RETURNING *
        )
        SELECT tag_id, "name" FROM ins
        UNION ALL
        SELECT tag_id, "name" FROM tag WHERE name IN ${inArrayFormattedString};

    `
    return await client.query(query)
}

exports.getSingleTagByNameQuery=getSingleTagByNameQuery
exports.createTagQuery=createTagQuery