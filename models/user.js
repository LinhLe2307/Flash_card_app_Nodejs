const mongoose = require('mongoose')
const uniqueValidator = require('mongoose-unique-validator')

const Schema = mongoose.Schema

const userSchema = new Schema({
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    phone: { type: String },
    country: { type: String },
    language: { type: String },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true, minLength: 6 },
    image: { type: String, required: true },
    aboutMe: { type: String },
    cards: [{ type: mongoose.Types.ObjectId, required: true, ref: 'Card'  }]
})
userSchema.plugin(uniqueValidator)

module.exports = mongoose.model('User', userSchema)