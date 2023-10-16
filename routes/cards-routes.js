const express = require('express')
const cardsControllers = require('../controllers/cards-controllers')

const router = express.Router()

router.get("/:cid", cardsControllers.getCardById)
router.post("/")
module.exports = router