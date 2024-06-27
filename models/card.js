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

const createSubcardQuery = async() => {
    
}

const createCardQuery = async(tagId) => {
    return await client.query(`
        WITH create_subcard AS (
            INSERT INTO subcard(term, definition, subcard_image)
            VALUES('doraemn', 'nobita', '')
            RETURNING subcard_id
        ), insert_flashcard AS (
            INSERT INTO flashcard(title, description, subcard_id) 
            SELECT 'movie', 'long movie', ARRAY[s.subcard_id]::smallint[]
            FROM create_subcard s
            RETURNING flashcard_id, title, description, subcard_id
        ),
            update_flashcard_tag AS (
            INSERT INTO flashcard_tag(flashcard_id, tag_id)
            SELECT f.flashcard_id, 1003
            FROM insert_flashcard f
            RETURNING flashcard_id, tag_id
        )

        SELECT 
            f.flashcard_id,
            f.title, 
            f.description, 
            JSON_AGG(JSON_BUILD_OBJECT(
                'tag_id', t.tag_id, 'name', t.name
            )) AS tags,
            JSON_AGG(JSON_BUILD_OBJECT(
                'subcard_id', g.subcard_id, 'term', g.term, 'definition', g.definition, 'image', g.subcard_image
            )) AS subcards
        FROM insert_flashcard f
        JOIN subcard g ON g.subcard_id = ANY(f.subcard_id)
        JOIN update_flashcard_tag ft ON ft.flashcard_id = f.flashcard_id
        JOIN tag t ON t.tag_id = ft.tag_id
        GROUP BY f.flashcard_id, f.title, f.description, t.tag_id;
`)}

exports.createCardQuery=createCardQuery