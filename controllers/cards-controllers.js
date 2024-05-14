const HttpError = require('../models/http-error');
const {validationResult} = require('express-validator')
const Card = require('../models/card')
const User = require('../models/user');
const Tag = require('../models/tag');
const { default: mongoose } = require('mongoose');

const createTags = async (tags, tagIds) => {
  // if existing tags, then append. Otherwise, create a new one 
  try {
    for (const tagName of tags) {
      let tag
      // Find the tag by its name
      tag = await Tag.findOne({ name: tagName.toLowerCase() });
      // If tag doesn't exist, create a new one
      if (!tag) {
        tag = new Tag({ name: tagName.toLowerCase(), cards: [] });
      }
      tagIds.push(tag)
    }
  } catch(err) {
    const error = new HttpError(
      'Cannot find and create new tag , please try again',
      500
    )
    return next(error)
  }
  return tagIds
}

const getCardById = async (req, res, next) => {
    const cardId = req.params.cid

    let card 
    try {
      card = await Card.findById(cardId).populate('tags')
    } catch(err) {
      const error = new HttpError('Something went wrong, could not find a card.', 500)
      return next(error)
    }
    if (!card) {
      return next(new HttpError('Could not find a card for the provided id.', 404))
    }

    // Extract tag names from the populated tags array
    const tagNames = card.tags && card.tags.map(tag => tag.name);
    // Create a new object with tag names instead of tag objects
    const plainCard = {
      ...card.toObject({ getters: true }),
      tags: tagNames
    };
    try {
      res.json({card: plainCard})
    } catch(err) {
      const error = new HttpError('Internal server error.', 500)
      return next(error)
    }
}

const getCardsByUserId = async (req, res, next) => {
    const userId = req.params.uid 

    let userWithCards
    try {
      userWithCards = await User.findById(userId).populate({
        path: 'cards',
        populate: {
          path: 'tags',
          select: 'name' // Optionally, specify fields to include from the populated documents
        }
      });
    } catch(err) {
        const error = new HttpError('Something went wrong, could not find a card.', 500)
        return next(error)
      }

    if (!userWithCards || userWithCards.length === 0) {
      return next(
        new HttpError('Could not find cards for the provided user id.', 404)
      );
    } 
    res.json({ cards: userWithCards.cards.map(card => {
      // Convert Mongoose document to plain JavaScript object if necessary
      const plainCard = (card instanceof mongoose.Document) ? card.toObject({ getters: true }) : card;
      // Map over the tags array and extract only the names
      const tagNames = card.tags && card.tags.map(tag => tag.name);
      // Return the card object with the tags field replaced with tag names
      return { ...plainCard, tags: tagNames }
    }
    )});
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

    await createTags(tags, tagIds)

    try {
      const sess = await mongoose.startSession()
      sess.startTransaction()

      // Save all tags and associate each tag with the created card
      await Promise.all(tagIds.map(async (singleTag) => {
        singleTag.cards.push(createdCard._id); // Associate card with tag
        createdCard.tags.push(singleTag._id); // Associate tag with card
        await singleTag.save({ session: sess });
      }));

      // Save the created card
      await createdCard.save({ session: sess });
      
      // we make sure the card is added to user
      user.cards.push(createdCard._id)
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

  let card
  try {
    card = await Card.findById(cardId).populate('tags')
  } catch(err) {
    const error = new HttpError('Could not find a card for that id.', 500)
    return next(error) 
  }

  if (!card) {
    const error= new HttpError('Could not find card for provided id.', 404)
    return next(error)
  }
  
  if (card.creator.toString() !== req.userData.userId) {
    const error = new HttpError('You are not allowed to edit this card', 403)
    return next(error) 
  }

  // create if tag is not existed
  await createTags(tags, tagIds)

  // update Tags
  try {
    await Tag.updateMany(
      { _id: { $nin: tagIds } }, // Filter criteria: match tags by name in the provided list
      { $pull: { cards: cardId } } // Pull the card ID from the cards array
    )
  } catch (err) {
    const error = new HttpError('Error removing cards from tag.', 403)
    return next(error) 
  }

  
  // find Card and remove tags in Card
  try {
    await Card.findByIdAndUpdate(
      cardId, // Filter criteria
      { $pull: { tags: { $nin: tagIds } } }, // Pull tags to remove
    );
  } catch (err) {
    const error = new HttpError('Error removing tags from card.', 403)
    return next(error) 
  }

  try {
    await Card.findByIdAndUpdate(
      cardId,
      { $set: { title, description, ...rest } }
    )
  } catch (err) {
    const error = new HttpError('Error updating card.', 403)
    return next(error) 
  }
  
  try {
    let tagsToAdd = tagIds.filter(tagId => !card.tags.find(cardTag => cardTag._id.toString() === tagId._id.toString()))
    const sess = await mongoose.startSession()
    sess.startTransaction()
    
    // Save all tags and associate each tag with the created card
    await Promise.all(tagsToAdd.map(async (singleTag) => {
      singleTag.cards.push(cardId); // Associate card with tag
      card.tags.push(singleTag._id); // Associate tag with card
      await singleTag.save({ session: sess });
    }));
    // Save the created card
    await card.save({ session: sess });
    
    await sess.commitTransaction()
      
  } catch(err) {
    const error = new HttpError('Updating card failed, please try again.', 500)
    return next(error)
  }

  res.status(201).json({ card: card.toObject({getters: true}) })
}

const deleteCard = async(req, res, next) => {
  const cardId = req.params.cid

  let card
  try {
    card = await Card.findById(cardId).populate('creator').populate('tags')
  } catch(err) {
    const error = new HttpError('Could not find card for provided id.', 500)
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
    await Promise.all(card.tags.map(tag => {
      tag.cards.pull(card);
      tag.save({ session: sess })
    }))
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