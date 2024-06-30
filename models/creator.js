const client = require('../postgresql/db')

const allCreatorsQuery = async() => {
    return await client.query(`
        WITH get_subcard AS (
            SELECT term, definition, subcard_image, subcard_id FROM subcard
            ), get_flashcard AS (
                SELECT 
                    f.flashcard_id,
                    title, 
                    description, 
                    JSON_AGG(JSON_BUILD_OBJECT(
                        'subcard_id', g.subcard_id, 'term', g.term, 'definition', g.definition, 'image', g.subcard_image
                    )) AS subcards
                FROM flashcard f
                INNER JOIN get_subcard g ON g.subcard_id = ANY(f.subcard_id::integer[])
                GROUP BY title, description, f.flashcard_id
        )

        SELECT creator_id, first_name, last_name, email, create_date, c.last_update, phone, co.country,
        JSON_AGG(
			CASE WHEN c.flashcard_id IS NOT NULL
			THEN JSON_BUILD_OBJECT(
	            'flashcard_id', g.flashcard_id,
	            'title', g.title,
	            'description', g.description,
	            'subcards', g.subcards)
			END
		) FILTER (WHERE c.flashcard_id IS NOT NULL) AS flashcards
        FROM creator c
        LEFT JOIN get_flashcard g ON g.flashcard_id = ANY(c.flashcard_id::integer[])
        INNER JOIN country co ON co.country_id = c.country_id
        GROUP BY creator_id, first_name, last_name, email, create_date, c.last_update, phone, co.country;
    `)
}

const getSingleUserQuery = async (userId) => {
    return await client.query(`
        SELECT creator_id, first_name, last_name, email, country, l.name language, country, password, image, about_me, phone,
        x, linkedin, instagram, github, website
        FROM creator c
        LEFT JOIN language l ON l.language_id = c.language_id 
        LEFT JOIN country co ON co.country_id = c.country_id 
        LEFT JOIN media m ON m.media_id = c.media_id
        WHERE creator_id=$1;
    `, [userId])
}

const checkExistingUser = async (email) => {
    return await client.query(`
        SELECT * FROM creator c
        WHERE c.email = $1;
    `, [email])
}
                
const createCustomerQueryWithoutMedia = async (firstName, lastName, email, countryId, languageId, password, image, aboutMe, phone) => {
    return await client.query(`
        INSERT INTO creator(first_name, last_name, email, country_id, language_id, password, image, about_me, phone) 
            SELECT $1, $2, $3, $4, $5, $6, $7, $8, $9
            FROM insert_media i
	    RETURNING *;`, [firstName, lastName, email, countryId, languageId, password, image, aboutMe, phone])
}
                 
const createCustomerQueryWithMedia = async(x, linkedin, instagram, github, website,
    firstName, lastName, email, countryId, languageId, password, image, aboutMe, phone
) => {
    return await client.query(`
        WITH insert_media AS (
            INSERT INTO media(x, linkedin, instagram, github, website) 
            VALUES ($1, $2, $3, $4, $5) RETURNING media_id
        )
        INSERT INTO creator(first_name, last_name, email, country_id, language_id, media_id, password, image, about_me, phone) 
            SELECT $6, $7, $8, $9, $10, i.media_id, $11, $12, $13, $14
            FROM insert_media i
	    RETURNING *;`, [x, linkedin, instagram, github, website, firstName, lastName, email, countryId, languageId, password, image, aboutMe, phone])
}

const updateCustomerQuery = async (x, linkedin, instagram, github, website,
    firstName, lastName, countryId, languageId, image, aboutMe, phone, userId) => {
    return await client.query(`
        WITH update_media AS (
            UPDATE media m
            SET x=$1, 
                linkedin=$2,
                instagram=$3,
                github=$4,
                website=$5
            FROM creator c
            WHERE c.media_id=m.media_id
            RETURNING m.media_id
        )
        UPDATE creator
        SET first_name=$6,
            last_name=$7,
            country_id=$9,
            language_id=$10,
            image=$11,
            about_me=$12,
            phone=$13,
            media_id= (SELECT media_id FROM update_media)
        WHERE creator_id=$14;
    `, [x, linkedin, instagram, github, website,
        firstName, lastName, countryId, languageId, image, aboutMe, phone, userId])
}

const deleteUserQuery = async(userId) => {
    let query=`
        DELETE FROM creator
        WHERE creator_id=${userId};
    `
    return await client.query(query)
}

exports.allCreatorsQuery = allCreatorsQuery
exports.createCustomerQueryWithoutMedia = createCustomerQueryWithoutMedia
exports.createCustomerQueryWithMedia = createCustomerQueryWithMedia
exports.updateCustomerQuery = updateCustomerQuery
exports.checkExistingUser = checkExistingUser
exports.getSingleUserQuery = getSingleUserQuery
exports.deleteUserQuery = deleteUserQuery