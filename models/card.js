const mongoose = require('mongoose')
const Schema = mongoose.Schema

const cardSchema = new Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    tags: { type: Array, required: false },
    creator: { type: mongoose.Types.ObjectId, required: true, ref: 'User' },
    any: Schema.Types.Mixed
}, {strict: false})

module.exports = mongoose.model('Card', cardSchema)