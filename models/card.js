const mongoose = require('mongoose')
const Schema = mongoose.Schema

const cardSchema = new Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    creator: { type: String, required: true },
    any: Schema.Types.Mixed
}, {strict: false})

module.exports = mongoose.model('Card', cardSchema)