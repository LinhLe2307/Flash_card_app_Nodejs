// const uuid = require('uuid/v4');
const HttpError = require('../models/http-error');
const {validationResult} = require('express-validator')
const Card = require('../models/card')

let DUMMY_CARDS = [
    {
      id: 'c1',
      title: 'Empire State Building',
      description: 'One of the most famous sky scrapers in the world!',
      one: {
        term: 'kissa',
        definition: 'new kissa',
        image: 'https://images.unsplash.com/photo-1697128439428-a68faa7f2537?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=987&q=80'
      },
      creator: 'u1'
    }
  ];

const getCardById = async (req, res, next) => {
    const cardId = req.params.cid

    let card 
    try {
      card = await Card.findById(cardId)
    } catch(err) {
      const error = new HttpError('Something went wrong, could not find a card.', 500)
      return next(error)
    }
    if (!card) {
      return next(new HttpError('Could not find a card for the provided id.', 404))
    }

    res.json({card: card.toObject({getters: true})})
}

const getCardsByUserId = async (req, res, next) => {
    const userId = req.params.uid 

    let cards
    try {
      cards = await Card.find({creator: userId})
    } catch(err) {
      const error = new HttpError('Something went wrong, could not find a card.', 500)
      return next(error)
    }

    if (!cards || cards.length === 0) {
      return next(
        new HttpError('Could not find cards for the provided user id.', 404)
      );
    } 
    res.json({ cards: cards.map(card => card.toObject({getters: true})) });
}

const createCard = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log(errors)
      throw new HttpError('Invalid inputs passed, please check your data', 422)
    }
    const {title, description, creator, ...rest} = req.body
    
    const createdCard = new Card({
      title, description, creator, ...rest
    })

    try {
      await createdCard.save()
    } catch(err) {
      const error = new HttpError('Creating card failed, please try again.', 500)
      next(error)
    }

    res.status(201).json({ card: createdCard.toObject({getters: true}) })
}

const updateCard = async(req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    next(new HttpError('Invalid inputs passed, please check your data', 422))
  }

  const cardId = req.params.cid
  const {title, description, ...rest} = req.body

  const data = {
    title: title,
    description: description,
    ...rest
  }

  let card = await Card.findByIdAndUpdate(
    cardId,
    {$set: data},
    {
      new: true,
    }, (err, updatedDoc) => {
      if (err) {
        next(new HttpError('Could not find a card for that id.', 404))
        // Handle error
      } else {
        console.log(updatedDoc);
        // updatedDoc will contain the updated fields, but other fields will remain unchanged
      }
    }
  )

  try {
    await card.save()
  } catch(err) {
    const error = new HttpError('Something went wrong, could not update card', 500)
    return next(error)
  }
  res.status(201).json({ card: card.toObject({getters: true}) })
}

const deleteCard = async(req, res, next) => {
  const cardId = req.params.cid

  let card
  try {
    card = await Card.findById(cardId)
  } catch(err) {
    const error = new HttpError('Something went wrong, could not delete card', 500)
    return next(error)
  }

  try {
    await card.deleteOne()
  } catch(err) {
    const error = new HttpError('Something went wrong, could not delete card', 500)
    return next(error)
  }

  res.status(200).json({message: 'Deleted card.'})
}

exports.getCardById = getCardById;
exports.getCardsByUserId = getCardsByUserId;
exports.createCard = createCard;
exports.updateCard = updateCard;
exports.deleteCard = deleteCard;