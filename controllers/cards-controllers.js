const HttpError = require('../models/http-error');
const {validationResult} = require('express-validator')
const Card = require('../models/card')
const User = require('../models/user');
const Tag = require('../models/tag');
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
      userWithCards = await User.findById(userId)
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
      return next(new HttpError('Invalid inputs passed, please check your data', 422))
    }
    const {title, description, tags, creator, ...rest} = req.body
    const tagIds = [];

    const createdCard = new Card({
      title, description, 
      tags: [],
      creator: req.userData.userId,
       ...rest
    })

    let user
    try {
      user = await User.findById(req.userData.userId)
    } catch(err) {
      const error = new HttpError(
        'Finding user failed, please try again',
        500
      )
      return next(error)
    }

    if(!user){
      const error= new HttpError('Could not find user for provided id.', 404)
      return next(error)
    }

    // if existing tags, then append. Otherwise, create a new one 
    try {
      for (const tagName of tags) {
        let tag
        // Find the tag by its name
        tag = await Tag.findOne({ name: tagName });
        // If tag doesn't exist, create a new one
        if (!tag) {
          tag = new Tag({ name: tagName, cards: [] });
        }
        tagIds.push(tag)
      }
    } catch(err) {
      const error = new HttpError(
        'Cannot find tag , please try again',
        500
      )
      return next(error)
    }

    try {
      const sess = await mongoose.startSession()
      sess.startTransaction()

      // Save all tags and associate each tag with the created card
      await Promise.all(tagIds.map(async (singleTag) => {
        singleTag.cards.push(createdCard); // Associate card with tag
        createdCard.tags.push(singleTag); // Associate tag with card
        await singleTag.save({ session: sess });
      }));

      // Save the created card
      await createdCard.save({ session: sess });
      
      // we make sure the card is added to user
      user.cards.push(createdCard)
      await user.save({ session: sess });

      await sess.commitTransaction()

    } catch(err) {
      const error = new HttpError('Creating card failed, please try again.', 500)
      return next(error)
    }

    res.status(201).json({ card: createdCard.toObject({getters: true}) })
}

const updateCard = async(req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return next(new HttpError('Invalid inputs passed, please check your data', 422))
  }

  const cardId = req.params.cid
  const {title, description, tags, ...rest} = req.body

  const tagIds = []; 
  const data = {
    title,
    description,
    tags,
    creator: req.userData.userId,
    ...rest
  }

  let card
  try {
    card = await Card.findById(cardId).populate('tags')
  } catch(err) {
    const error = new HttpError('Could not find a card for that id.', 500)
    return next(error) 
  }
  
  if (card.creator.toString() !== req.userData.userId) {
    const error = new HttpError('You are not allowed to edit this card', 403)
    return next(error) 
  }

  const removeTags = card.tags.filter(tag => tags.indexOf(tag) !== -1)
  // Function to remove tags from a card where the tag IDs are not in the provided list
  try {
    // Update the card document by removing tags that are not in the provided list
    await Card.updateOne(
      { _id: card._id }, // Filter criteria: match card by ID
      { $pull: { tags: { $nin: removeTags } } } // Pull tags that are not in the provided list
    );
    // await card.tags.pull({ cards: { $nin: card }})
  } catch (err) {
    const error = new HttpError('Error removing tags from card:', 403)
    return next(error) 
  }

  try {
    await Tag.updateMany(
      { name: { $in: removeTags } }, // Filter criteria: match tags by name in the provided list
      { $pull: { cards: card._id } } // Pull the card ID from the cards array
    );
  } catch (err) {
    const error = new HttpError('Error removing cards from tag:', 403)
    return next(error) 
  }

  try {
    for (const tagName of tags) {
      // Find the tag by its name
      let tag = await Tag.findOne({ name: tagName });
      // If tag doesn't exist, create a new one
      if (!tag) {
        tag = new Tag({ name: tagName, cards: [] });
      }      
      tagIds.push(tag)
    }
  } catch(err) {
    const error = new HttpError(
      'Cannot find and create tag, please try again',
      500
    )
    return next(error)
  }

  try {
    card = await Card.findOneAndReplace({_id: cardId}, data, {
      new: true
    })
    if (!card) {
      return next(new HttpError('Card not found', 404))
    }
  } catch(err) {
    return next(new HttpError('Could not find a card for that id.', 404))
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

  // try {
  //   await card.save()
  // } catch(err) {
  //   const error = new HttpError('Something went wrong, could not update card', 500)
  //   return next(error)
  // }
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

  if (card.creator.id !== req.userData.userId) {
    const error = new HttpError('You are not allowed to delete this card', 403)
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