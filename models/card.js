const client = require('../postgresql/db')

const createSubcardQuery = async(rest) => {
    const subcards = Object.values(rest).map(({term, definition, imageUrl}) => ({
        term,
        definition,
        subcard_image: imageUrl ?? '' // or whatever image path/URL you want to set
    }));
    
    // Create the values part of the query
    const values = subcards.map(
        (subcard, index) => `('${subcard.term}', '${subcard.definition}', '${subcard.subcard_image}')`
    ).join(',');
    
    const query = `
        INSERT INTO subcard(term, definition, subcard_image)
        VALUES ${values}
        RETURNING subcard_id
    `;
    
    return await client.query(query)
}

const updateCardQuery = async(title, description, tagIds, existingSubcards, rest, cardId) => {
    const updateQueries = [];
    Object.entries(rest).forEach( ([key, value]) => {
        if (existingSubcards.find(sub => +sub === +key)) {
            updateQueries.push(`(${key}, '${value.term}', '${value.definition}', '${value.imageUrl ?? ''}')`)
        } else {
            updateQueries.push(`(nextval('subcard_subcard_id_seq'), '${value.term}', '${value.definition}', '${value.imageUrl ?? ''}')`)
        }
    });
    let query =`
        WITH update_subcard AS (
            INSERT INTO subcard (subcard_id, term, definition, subcard_image)
            VALUES 
            ${updateQueries.join(', ')}
            ON CONFLICT (subcard_id) DO UPDATE
            SET
                term = EXCLUDED.term,
                definition = EXCLUDED.definition,
                subcard_image = EXCLUDED.subcard_image
            RETURNING subcard_id
        ), update_flashcard_tag AS (
            INSERT INTO flashcard_tag(flashcard_id, tag_id)
            SELECT ${cardId}, unnest(ARRAY[${tagIds}]::smallint[])
            ON CONFLICT (flashcard_id, tag_id) DO UPDATE
                SET flashcard_id = EXCLUDED.flashcard_id,
                    tag_id = EXCLUDED.tag_id
            RETURNING flashcard_id, tag_id
        ), delete_flashcard_tag AS (
			DELETE FROM flashcard_tag
			WHERE flashcard_id = ${cardId}
			  AND tag_id NOT IN (SELECT unnest(ARRAY[${tagIds}]::smallint[]))
		)

        UPDATE flashcard
        SET subcard_id = (
                SELECT array_agg(s.subcard_id)
                FROM update_subcard s
            ),
            title='${title}',
            description='${description}'
        WHERE flashcard_id = ${cardId}
        RETURNING *;
    `
    return await client.query(query)

}

const createCardQuery = async(tagIds, subcardIds, title, description, userId) => {
    const arrayLiteral = `ARRAY[${subcardIds.map(id => `${id}`).join(',')}]::smallint[]`;
    let query=`
        WITH insert_flashcard AS (
            INSERT INTO flashcard(title, description, subcard_id) 
            VALUES ('${title}', '${description}', ${arrayLiteral})
            RETURNING *
        ),
            update_flashcard_tag AS (
            INSERT INTO flashcard_tag(flashcard_id, tag_id)
            SELECT f.flashcard_id, unnest(ARRAY[${tagIds}])
            FROM insert_flashcard f
            RETURNING flashcard_id, tag_id
        ), 
			update_creator AS (
                UPDATE creator c
                SET flashcard_id = array_append(
                    COALESCE(c.flashcard_id, '{}'),
                    (SELECT f.flashcard_id FROM insert_flashcard f)
                )
                WHERE c.creator_id = ${userId}
                RETURNING c.creator_id, c.flashcard_id
        ), flashcard_tags AS (
		    SELECT 
		        ft.flashcard_id,
		        JSON_AGG(JSON_BUILD_OBJECT('id', t.tag_id, 'name', t.name)) AS tags
		    FROM update_flashcard_tag ft
		    JOIN tag t ON t.tag_id = ft.tag_id
		    GROUP BY ft.flashcard_id
		),
			flashcard_subcards AS (
		    SELECT 
		        f.flashcard_id,
		        JSON_AGG(JSON_BUILD_OBJECT(
                	'id', s.subcard_id, 'term', s.term, 'definition', s.definition, 'imageUrl', s.subcard_image
            	)) AS subcards
		    FROM insert_flashcard f
		    JOIN subcard s ON s.subcard_id = ANY(f.subcard_id)
		    GROUP BY f.flashcard_id
		)
		SELECT 
		    f.flashcard_id AS id,
		    f.title, 
		    f.description, 
		    ft.tags,
		    fs.subcards
		FROM insert_flashcard f
		LEFT JOIN flashcard_tags ft ON ft.flashcard_id = f.flashcard_id
		LEFT JOIN flashcard_subcards fs ON fs.flashcard_id = f.flashcard_id;
    `

    return await client.query(query)
}

const getCardByIdQuery = async(cardId) => {
    const query = `
        WITH flashcard_subcards AS (
            SELECT f.flashcard_id,
            JSON_AGG(
            JSON_BUILD_OBJECT(
                'id', g.subcard_id, 'term', g.term, 'definition', g.definition, 'imageUrl', g.subcard_image
            )) AS subcards
            FROM flashcard f
            LEFT JOIN subcard g ON g.subcard_id = ANY(f.subcard_id)
            GROUP BY f.flashcard_id
        ), flashcard_tags AS (
            SELECT 
                f.flashcard_id,
                JSON_AGG(
                    CASE WHEN t.tag_id IS NOT NULL
                    THEN JSON_BUILD_OBJECT(
                        'id', t.tag_id, 'name', t.name)
                    END
                    ) FILTER (WHERE t.tag_id IS NOT NULL) AS tags
            FROM flashcard f
            LEFT JOIN flashcard_tag ft ON ft.flashcard_id = f.flashcard_id
            LEFT JOIN tag t ON t.tag_id = ft.tag_id
            GROUP BY f.flashcard_id
        ), get_creator AS (
			SELECT 
			f.flashcard_id,
			JSON_AGG(JSON_BUILD_OBJECT(
                'image', image,
				'firstName', first_name,
				'lastName', last_name,
				'email', email
			)) as creator
			FROM flashcard f
			JOIN creator c ON f.flashcard_id = ANY(c.flashcard_id)
			GROUP BY f.flashcard_id
		)
        SELECT
            f.flashcard_id AS id,
            f.title, 
            f.description,
            c.creator,
            fs.subcards,
            ft.tags
        FROM flashcard f
        JOIN get_creator c ON f.flashcard_id = c.flashcard_id
        JOIN flashcard_subcards fs ON f.flashcard_id = fs.flashcard_id
        JOIN flashcard_tags ft ON f.flashcard_id = ft.flashcard_id
        WHERE f.flashcard_id=${cardId}
    `
    return await client.query(query)
}

const deleteCardByIdQuery = async(cardId) => {
    let query=`
        DELETE FROM flashcard
        WHERE flashcard_id=${cardId};
    `
    return await client.query(query)
}

exports.createCardQuery=createCardQuery
exports.createSubcardQuery=createSubcardQuery
exports.getCardByIdQuery=getCardByIdQuery
exports.deleteCardByIdQuery=deleteCardByIdQuery
exports.updateCardQuery=updateCardQuery