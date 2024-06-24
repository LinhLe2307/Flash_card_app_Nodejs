// const mongoose = require('mongoose')
// const Schema = mongoose.Schema

// const cardSchema = new Schema({
//     title: { type: String, required: true },
//     description: { type: String, required: true },
//     tags: [{ type: mongoose.Types.ObjectId, required: true, ref: 'Tag' }],
//     creator: { type: mongoose.Types.ObjectId, required: true, ref: 'User' },
//     any: Schema.Types.Mixed
// }, {strict: false})

// module.exports = mongoose.model('Card', cardSchema)

const client = require('../postgresql/db')

const createCardQuery = async(tagId) => {
    return await client.query(`
        WITH create_subcard AS (
            INSERT INTO subcard(term, definition, subcard_image)
            VALUES('INSERT', 'insert2', '')
            RETURNING subcard_id
        ), insert_flashcard AS (
            INSERT INTO flashcard(title, description, tag_id, subcard_id) 
            SELECT 'title', 'desc', ARRAY[1003]::smallint[], ARRAY[s.subcard_id]::smallint[]
            FROM create_subcard s
            RETURNING flashcard_id, title, description, subcard_id
        )

        SELECT 
            f.flashcard_id,
            f.title, 
            f.description, 
            JSON_AGG(JSON_BUILD_OBJECT(
                'subcard_id', g.subcard_id, 'term', g.term, 'definition', g.definition, 'image', g.subcard_image
            )) AS subcards
        FROM insert_flashcard f
        JOIN subcard g ON g.subcard_id = ANY(f.subcard_id)
        GROUP BY f.flashcard_id, f.title, f.description;
`)}

exports.createCardQuery=createCardQuery