const mongoose = require('mongoose')
const Schema = mongoose.Schema

const tagSchema = new Schema({
    name: { type: String, required: true }, 
    cards: [{ type: mongoose.Types.ObjectId, required: true, ref: 'Card'  }]
}, {strict: false})

module.exports = mongoose.model('Tag', tagSchema)