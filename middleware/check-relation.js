const client = require('../postgresql/db')
const checkMedia = (x, linkedin, instagram, github, website) => {
    if (!x.length && !linkedin.length && !instagram.length && !github.length && !website.length) {
        return false
    }
    return true
}

const checkFlashcardByUserId = async(userId, cardId) => {
    let query= `
        WITH creator_flashcards AS (SELECT flashcard_id FROM creator
            WHERE creator_id=${userId}
        )

        SELECT f.flashcard_id, f.subcard_id FROM creator_flashcards cf 
	    INNER JOIN flashcard f ON f.flashcard_id = ANY(cf.flashcard_id) 
        WHERE cf.flashcard_id && ARRAY[${cardId}]::smallint[];
    `
    return await client.query(query)
}

exports.checkMedia = checkMedia
exports.checkFlashcardByUserId = checkFlashcardByUserId