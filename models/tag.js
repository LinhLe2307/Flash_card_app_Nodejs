// const mongoose = require('mongoose')
// const Schema = mongoose.Schema

// const tagSchema = new Schema({
//     name: { type: String}, 
//     cards: [{ type: mongoose.Types.ObjectId, required: true, ref: 'Card'  }]
// }, {strict: false})

// module.exports = mongoose.model('Tag', tagSchema)

const client = require('../postgresql/db')

const getSingleTagByNameQuery = async(tagName) => {
    return await client.query(`SELECT * FROM tag WHERE tag=$1`, [tagName])
}

const createTagQuery = async(tagName) => {
    return await client.query(`INSERT INTO tag(name) VALUES($1) RETURNING *;`, [tagName])
}

exports.getSingleTagByNameQuery=getSingleTagByNameQuery
exports.createTagQuery=createTagQuery