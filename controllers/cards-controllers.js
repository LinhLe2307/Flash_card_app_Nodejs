// const uuid = require('uuid/v4');
const HttpError = require('../models/http-error');
const {validationResult} = require('express-validator')

let DUMMY_CARDS = [
    {
      id: 'c1',
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
    const card = DUMMY_CARDS.find(card => card.id === cardId)
    if (!card) {
        next(new HttpError('Could not find a card for the provided id.'), 404)
    }

    return res.json({card})
}

const getCardsByUserId = (req, res, next) => {
    const userId = req.params.uid 
    const cards = DUMMY_CARDS.filter(c => {
      return c.creator === userId
    })

    if (!cards || cards.length === 0) {
      return next(
        new HttpError('Could not find cards for the provided user id.', 404)
      );
    } 
    res.json({ cards });
}

const createCard = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log(errors)
      throw new HttpError('Invalid inputs passed, please check your data', 422)
    }
    const {title, description, creator, ...rest} = req.body
    
    const createdCard = {
        id: 1,
        title, description, creator,
        ...rest
    }

    DUMMY_CARDS.push(createdCard)
    res.status(201).json({ card: createdCard })
}

const updateCard = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log(errors)
    throw new HttpError('Invalid inputs passed, please check your data', 422)
  }
  const cardId = req.params.cid
  const {title, description, ...rest} = req.body

  const updatedCard = {...DUMMY_CARDS.find(card => card.id === cardId)}
  const cardIndex = DUMMY_CARDS.findIndex(card => card.id === cardId);

  updatedCard.title = title
  updatedCard.description = description
  
  Object.entries(rest).map(([key, value]) => {
    return(
      updatedCard[key] = {
        ...updatedCard[key],
        term: value.term ? value.term : updatedCard[key].term,
        definition: value.definition ? value.definition : updatedCard[key].definition
      }
    )
  })
  DUMMY_CARDS[cardIndex] = updatedCard
  res.status(201).json({ card: updatedCard })
}

const deleteCard = (req, res, next) => {
  const cardId = req.params.cid
  if (DUMMY_CARDS.find(card => card.id === cardId)) {
    next(new HttpError('Could not find a card for that id.', 404));
  }
  DUMMY_CARDS = DUMMY_CARDS.filter(card => card.id === cardId)
  res.status(200).json({message: 'Deleted card.'})
}

exports.getCardById = getCardById;
exports.getCardsByUserId = getCardsByUserId;
exports.createCard = createCard;
exports.updateCard = updateCard;
exports.deleteCard = deleteCard;