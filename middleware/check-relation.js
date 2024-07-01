const client = require('../postgresql/db')
const checkMedia = (x, linkedin, instagram, github, website) => {
    if (!x.length && !linkedin.length && !instagram.length && !github.length && !website.length) {
        return false
    }
    return true
}

const checkFlashcardByUserId = async(userId, cardId) => {
    let query= `
        SELECT f.*, c.creator_id
        FROM flashcard f
        JOIN creator c ON c.flashcard_id @> ARRAY[f.flashcard_id]::smallint[]
        WHERE f.flashcard_id =${cardId} AND c.creator_id=${userId};
    `
    return await client.query(query)
}

exports.checkMedia = checkMedia
exports.checkFlashcardByUserId = checkFlashcardByUserId