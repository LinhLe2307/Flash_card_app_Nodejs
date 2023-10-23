const HttpError = require('../models/http-error');
const {validationResult} = require('express-validator')
const Card = require('../models/card')
const User = require('../models/user');
const { default: mongoose } = require('mongoose');

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

    let userWithCards
    try {
      userWithCards = await User.findById(userId).populate('cards')
    } catch(err) {
        const error = new HttpError('Something went wrong, could not find a card.', 500)
        return next(error)
      }

    // let cards
    // try {
    //   cards = await Card.find({creator: userId})
    // } catch(err) {
    //   const error = new HttpError('Something went wrong, could not find a card.', 500)
    //   return next(error)
    // }

    // if (!cards || cards.length === 0) {
    //   return next(
    //     new HttpError('Could not find cards for the provided user id.', 404)
    //   );
    // } 

    if (!userWithCards || userWithCards.length === 0) {
      return next(
        new HttpError('Could not find cards for the provided user id.', 404)
      );
    } 
    res.json({ cards: userWithCards.cards.map(card => card.toObject({getters: true})) });
}

const createCard = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      next(new HttpError('Invalid inputs passed, please check your data', 422))
    }
    const {title, description, creator, ...rest} = req.body
    
    const createdCard = new Card({
      title, description, creator, ...rest
    })

    let user
    try {
      user = await User.findById(creator)
    } catch(err) {
      const error = new HttpError(
        'Creating place failed, please try again',
        500
      )
      return next(error)
    }

    if(!user){
      const error= new HttpError('Could not find user for provideid id.', 404)
      return next(error)
    }

    try {
      const sess = await mongoose.startSession()
      sess.startTransaction()   
      await createdCard.save({session: sess}); // we store the place

      // we make sure the card is added to user
      user.cards.push(createdCard)
      await user.save({ session: sess });
      sess.commitTransaction()

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

  let card
  try {
    card = await Card.findByIdAndUpdate(cardId, {$set: data}, {
      new: true,
    })
    if (!card) {
      next(new HttpError('Could not find a card for that id.', 404))
    }
  } catch(err) {
    next(new HttpError('Could not find a card for that id.', 404))
  }
  // let card = await Card.findByIdAndUpdate(
  //   cardId,
  //   {$set: data},
  //   {
  //     new: true,
  //   }, (err, updatedDoc) => {
  //     if (err) {
  //       next(new HttpError('Could not find a card for that id.', 404))
  //       // Handle error
  //     } else {
  //       console.log(updatedDoc);
  //       // updatedDoc will contain the updated fields, but other fields will remain unchanged
  //     }
  //   }
  // )

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
    card = await Card.findById(cardId).populate('creator')
  } catch(err) {
    const error = new HttpError('Something went wrong, could not delete card', 500)
    return next(error)
  }

    if(!card){
      const error= new HttpError('Could not find card for provided id.', 404)
      return next(error)
    }

  try {
    const sess = await mongoose.startSession()
    sess.startTransaction()
    await card.deleteOne({session: sess})

    card.creator.cards.pull(card)
    await card.creator.save({session: sess})
    await sess.commitTransaction()
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