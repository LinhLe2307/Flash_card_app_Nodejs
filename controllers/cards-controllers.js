// const uuid = require('uuid/v4');
const HttpError = require('../models/http-error');

let DUMMY_CARDS = [
    {
      id: 'p1',
      title: 'Empire State Building',
      description: 'One of the most famous sky scrapers in the world!',
      one: {
        term: 'kissa',
        definition: 'new kissa'
      },
      creator: 'u1'
    }
  ];

const getCardById = (req, res, next) => {
    const cardId = req.params.cid
    const identifiedCard = DUMMY_CARDS.filter(card => card.id === cardId)
    if (!identifiedCard) {
        next(new HttpError('Could not find a card for the provided id.'), 404)
    }

    return res.json({cards: identifiedCard})
}

const getCardsByUserId = (req, res, next) => {
    
}

const createCard = (req, res, next) => {

}

const updateCard = (req, res, next) => {

}

const deleteCard = (req, res, next) => {

}

exports.getCardById = getCardById;
exports.getCardsByUserId = getCardsByUserId;
exports.createCard = createCard;
exports.updateCard = updateCard;
exports.deleteCard = deleteCard;