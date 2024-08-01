const client = require('../postgresql/db')

const allCreatorsQuery = async() => {
    return await client.query(`
        WITH get_subcard AS (
            SELECT 
                s.subcard_id, 
                s.term, 
                s.definition, 
                s.subcard_image
            FROM subcard s
        ),
        flashcard_tags AS (
            SELECT 
                f.flashcard_id,
                JSON_AGG(JSON_BUILD_OBJECT('id', t.tag_id, 'name', t.name)) AS tags
            FROM flashcard f
            LEFT JOIN flashcard_tag ft ON ft.flashcard_id = f.flashcard_id
            LEFT JOIN tag t ON t.tag_id = ft.tag_id
            GROUP BY f.flashcard_id
        ),
        flashcard_subcards AS (
            SELECT 
                f.flashcard_id,
                JSON_AGG(JSON_BUILD_OBJECT('id', s.subcard_id, 'term', s.term, 'definition', s.definition, 'imageUrl', s.subcard_image)) AS subcards
            FROM flashcard f
            LEFT JOIN get_subcard s ON s.subcard_id = ANY(f.subcard_id::integer[])
            GROUP BY f.flashcard_id
        ),
        get_flashcard AS (
            SELECT 
                f.flashcard_id,
                f.title, 
                f.description,
                ft.tags,
                fs.subcards
            FROM flashcard f
            LEFT JOIN flashcard_tags ft ON ft.flashcard_id = f.flashcard_id
            LEFT JOIN flashcard_subcards fs ON fs.flashcard_id = f.flashcard_id
        )

        SELECT 
            c.creator_id AS "id",
            c.first_name AS "firstName",
            c.last_name AS "lastName",
            c.email, 
	 		c.image,
            c.create_date AS "createDate", 
            c.last_update AS "lastUpdate",
            c.about_me AS "about Me",
            c.phone, 
	 		l.name AS language,
            co.country,
            JSON_AGG(
                JSON_BUILD_OBJECT(
                    'id', g.flashcard_id,
                    'title', g.title,
                    'description', g.description,
                    'tags', g.tags,
                    'subcards', g.subcards
                )
            ) FILTER (WHERE g.flashcard_id IS NOT NULL) AS cards
        FROM creator c
        LEFT JOIN get_flashcard g ON g.flashcard_id = ANY(c.flashcard_id::integer[])
	 	INNER JOIN language l ON l.language_id = c.language_id
        INNER JOIN country co ON co.country_id = c.country_id
        GROUP BY c.image, c.creator_id, c.first_name, c.last_name, c.email, c.create_date, c.last_update, c.phone, co.country, c.about_me, l.name;
    `)
}

const getCardsAndInfoByUserIdQuery = async (userId) => {
    return await client.query(`
        WITH get_subcard AS (
            SELECT 
                s.subcard_id, 
                s.term, 
                s.definition, 
                s.subcard_image
            FROM subcard s
        ),
        flashcard_tags AS (
            SELECT 
                f.flashcard_id,
                JSON_AGG(JSON_BUILD_OBJECT('id', t.tag_id, 'name', t.name)) AS tags
            FROM flashcard f
            LEFT JOIN flashcard_tag ft ON ft.flashcard_id = f.flashcard_id
            LEFT JOIN tag t ON t.tag_id = ft.tag_id
            GROUP BY f.flashcard_id
        ),
        flashcard_subcards AS (
            SELECT 
                f.flashcard_id,
                JSON_AGG(JSON_BUILD_OBJECT('id', s.subcard_id, 'term', s.term, 'definition', s.definition, 'imageUrl', s.subcard_image)) AS subcards
            FROM flashcard f
            LEFT JOIN get_subcard s ON s.subcard_id = ANY(f.subcard_id::integer[])
            GROUP BY f.flashcard_id
        ),
        get_flashcard AS (
            SELECT 
                f.flashcard_id,
                f.title, 
                f.description,
                ft.tags,
                fs.subcards
            FROM flashcard f
            LEFT JOIN flashcard_tags ft ON ft.flashcard_id = f.flashcard_id
            LEFT JOIN flashcard_subcards fs ON fs.flashcard_id = f.flashcard_id
        )

        SELECT 
            c.creator_id AS "id",
            c.first_name AS "firstName",
            c.last_name AS "lastName",
            c.email, 
            c.create_date AS "createDate", 
            c.last_update AS "lastUpdate",
            c.about_me AS "aboutMe",
            c.phone,
            c.image,
			m.x, m.linkedin AS "linkedIn", m.instagram, m.github, m.website,
			l.name AS language,
            co.country,
            JSON_AGG(
                JSON_BUILD_OBJECT(
                    'id', g.flashcard_id,
                    'title', g.title,
                    'description', g.description,
                    'tags', g.tags,
                    'subcards', g.subcards
                )
            ) FILTER (WHERE g.flashcard_id IS NOT NULL) AS cards
        FROM creator c
        LEFT JOIN get_flashcard g ON g.flashcard_id = ANY(c.flashcard_id::integer[])
        INNER JOIN country co ON co.country_id = c.country_id
		INNER JOIN language l ON l.language_id = c.language_id
		INNER JOIN media m ON m.media_id = c.media_id
		WHERE c.creator_id=$1
        GROUP BY c.image, l.name, c.creator_id, c.first_name, c.last_name, c.email, c.create_date, c.last_update, 
			c.phone, co.country, c.about_me, m.x, m.linkedin, m.instagram, m.github, m.website;
    `, [userId])
}

const getUserByEmail = async (email) => {
    return await client.query(`
        SELECT c.creator_id "userId" FROM creator c
        WHERE c.email = $1;
    `, [email])
}

const createCustomerQuery = async(x, linkedin, instagram, github, website,
    firstName, lastName, email, countryId, languageId, password, image, aboutMe, phone
) => {
    let numberCountryId = +countryId
    let numberLanguageId = +languageId
    return await client.query(`
        WITH insert_media AS (
            INSERT INTO media (x, linkedin, instagram, github, website)
			VALUES(
                COALESCE($1, ''), COALESCE($2, ''), COALESCE($3, ''),
                COALESCE($4, ''), COALESCE($5, ''))
			RETURNING media_id
        )

        INSERT INTO creator(first_name, last_name, email, country_id, language_id, media_id, password, image, about_me, phone) 
            SELECT $6, $7, $8, $9, $10, i.media_id, $11, $12, $13, $14
            FROM insert_media i
	    RETURNING *;`, [x, linkedin, instagram, github, website,
            firstName, lastName, email, numberCountryId, numberLanguageId, password, image, aboutMe, phone])
}

const updateCustomerQuery = async (x, linkedin, instagram, github, website,
    firstName, lastName, countryId, languageId, image, aboutMe, phone, userId) => {
        let query = `
        WITH update_media AS (
            UPDATE media m
            SET x = COALESCE(NULLIF('${x}', ''), m.x), 
                linkedin = COALESCE(NULLIF('${linkedin}', ''), m.linkedin),
                instagram = COALESCE(NULLIF('${instagram}', ''), m.instagram),
                github = COALESCE(NULLIF('${github}', ''), m.github),
                website = COALESCE(NULLIF('${website}', ''), m.website)
            FROM creator c
            WHERE c.media_id=m.media_id AND c.creator_id = ${userId}
            RETURNING m.media_id
        )
        
        UPDATE creator
        SET first_name='${firstName}',
            last_name='${lastName}',
            country_id=${countryId},
            language_id=${languageId},
            image='${image}',
            about_me='${aboutMe}',
            phone='${phone}',
            media_id= (SELECT media_id FROM update_media)
        WHERE creator_id=${userId};
    `
    return await client.query(query)
}

const deleteUserQuery = async(userId) => {
    let query=`
        DELETE FROM creator
        WHERE creator_id=${userId};
    `
    return await client.query(query)
}

const forgotPasswordQuery = async(password, userId) => {
    let query = `
        UPDATE creator
        SET password = ${password}
        WHERE creator_id = ${userId}
        RETURNING *;
    `
    return await client.query(query)
}

exports.allCreatorsQuery = allCreatorsQuery
exports.createCustomerQuery = createCustomerQuery
exports.updateCustomerQuery = updateCustomerQuery
exports.forgotPasswordQuery = forgotPasswordQuery
exports.getUserByEmail = getUserByEmail
exports.getCardsAndInfoByUserIdQuery = getCardsAndInfoByUserIdQuery
exports.deleteUserQuery = deleteUserQuery