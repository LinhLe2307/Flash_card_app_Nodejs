const HttpError = require("../models/http-error");
const jwt = require('jsonwebtoken')
require('dotenv').config()

module.exports = (req, res, next) => {
    if (req.method === 'OPTIONS') {
        return next()
    } 
    try {
        // We use headers since not every path has body
        const token = req.headers.authorization.split(' ')[1]; // Authorization: 'Bearer TOKEN'
        if (!token) {
            const error = new HttpError('Authentication failed!', 403);
            return next(error)
        }
        const decodedToken = jwt.verify(token, process.env.TOKEN_KEY)
        req.userData = { userId: decodedToken.userId }
        next()

    } catch(err) {
        const error = new HttpError('Authentication failed!', 403);
        return next(error)
    }
}