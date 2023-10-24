const express = require('express')
const {check} = require('express-validator')
const cardsController = require('../controllers/cards-controllers')
const checkAuth = require('../middleware/check-auth')

const router = express.Router()

router.get('/:cid', cardsController.getCardById)

router.get('/user/:uid', cardsController.getCardsByUserId)

router.use(checkAuth)

router.post(
    '/', [
    check('title')
        .not()
        .isEmpty(),
    check('description').isLength({ min: 5}),
    ], 
    cardsController.createCard)

router.patch('/:cid',
    [
        check('title')
        .not()
        .isEmpty(),
        check('description').isLength({ min: 5 })
    ],
    cardsController.updateCard)

router.delete('/:cid', cardsController.deleteCard)

module.exports = router