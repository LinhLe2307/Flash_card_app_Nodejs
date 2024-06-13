const HttpError = require('../models/http-error');
const Card = require('../models/card')
const User = require('../models/user');
const Tag = require('../models/tag');
const { default: mongoose } = require('mongoose');

const createTags = async (tags) => {
  let tagIds = []
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
    throw new HttpError(
      'Cannot find and create new tag , please try again',
      500
    )
  }
  return tagIds
}

const addCardsToTags = async(tagIds, card, sess) => {
  if (tagIds.length > 0) {
    // initialize save
    tagIds[0].cards.push(card._id)
    card.tags.push(tagIds[0]._id); // Associate tag with card
    await tagIds[0].save({ session: sess });

    // Save all tags and associate each tag with the created card
    await Promise.all(tagIds.slice(1).map(async (singleTag) => {
      singleTag.cards.push(card._id); // Associate card with tag
      card.tags.push(singleTag._id); // Associate tag with card
      await singleTag.save({ session: sess });
    }));
  }

}

const getCardById = async (cardId) => {
    let card 
    try {
      card = await Card.findById(cardId).populate('tags').populate({
        path: 'creator',
        select: ['firstName', 'lastName', 'email', 'image']
      })
    } catch(err) {
      throw new HttpError('Something went wrong, could not find a card.', 500)
    }
    if (!card) {
       throw (new HttpError('Could not find a card for the provided id.', 404))
    }

    try {
      return card.toJSON()
    } catch(err) {
      throw new HttpError('Internal server error.', 500)
    }
}

const getCardsByUserId = async (userId) => {
    let userWithCards
    try {
      userWithCards = await User.findById(userId).populate({
        path: 'cards',
        populate:[ {
          path: 'tags'
        }, {
          path: 'creator'
        }]
      });
    } catch(err) {
        throw new HttpError('Something went wrong, could not find a card.', 500)
      }

    if (!userWithCards || userWithCards.length === 0) {
      throw new HttpError('Could not find cards for the provided user id.', 404)
    } 

    return userWithCards
}

const createCard = async (args) => {
  const {userId, title, description, tags, ...rest} = args

    const createdCard = new Card({
      title, description, 
      tags: [],
      creator: userId,
       ...rest
    })

    let user
    try {
      user = await User.findById(userId)
    } catch(err) {
      throw new HttpError(
        'Finding user failed, please try again',
        500
      )
    }

    if(!user){
      throw new HttpError('Could not find user for provided id.', 404)
    }

    const sess = await mongoose.startSession()
    try {
      sess.startTransaction()
      let tagIds = await createTags(tags); // Ensure this returns an array of tag document instances

      await addCardsToTags(tagIds, createdCard, sess)


      // Save the created card
      await createdCard.save({ session: sess });
      
      // we make sure the card is added to user
      user.cards.push(createdCard._id)
      await user.save({ session: sess });

      await sess.commitTransaction()
      
    } catch(err) {
      await sess.abortTransaction();
      throw new HttpError('Creating card failed, please try again.', 500)
    } finally {
      sess.endSession();
    }
    return createdCard.toJSON()
}

const updateCard = async(args) => {
  const {cardId, userId, title, description, tags, ...rest} = args

  let card
  try {
    card = await Card.findById(cardId).populate('tags')
  } catch(err) {
    throw new HttpError('Could not find a card for that id.', 500)
  }

  if (!card) {
    throw new HttpError('Could not find card for provided id.', 404)
  }
  
  if (card.creator.toString() !== userId) {
    throw new HttpError('You are not allowed to edit this card', 403)
  }

  // create if tag is not existed
  let tagIds = await createTags(tags)
  // console.log(tagIds)

  // update Tags
  try {
    await Tag.updateMany(
      { _id: { $nin: tagIds } }, // Filter criteria: match tags by name in the provided list
      { $pull: { cards: cardId } } // Pull the card ID from the cards array
    )
  } catch (err) {
   throw new HttpError('Error removing cards from tag.', 403)
  }
  
  // find Card and remove tags in Card
  try {
    await Card.findByIdAndUpdate(
      cardId, // Filter criteria
      { $pull: { tags: { $nin: tagIds } } }, // Pull tags to remove
    );
  } catch (err) {
    throw new HttpError('Error removing tags from card.', 403)
  }

  // Extract existing fields
  const currentFields = card.toObject();
    
  // Determine fields to unset
  const fieldsToUnset = Object.keys(currentFields).filter(
    field => !['creator', 'title', 'description', 'tags', ...Object.keys(rest)].includes(field) && field !== '_id' && field !== '__v'
  );

  try {
    await Card.findByIdAndUpdate(
      { _id: cardId},
      { $unset: fieldsToUnset.reduce((acc, field) => {
        acc[field] = "";
        return acc;
      }, {})},
      { new: true, runValidators: true }
    )
  } catch (err) {
    throw new HttpError('Error removing subcard from card.', 403)
  }

  try {
    await Card.findByIdAndUpdate(
      { _id: cardId},
      { $set: { title, description, ...rest } },
      { new: true, runValidators: true }
    )
  } catch (err) {
    throw new HttpError('Error updating card.', 403)
  }

  try {
    const sess = await mongoose.startSession()
    sess.startTransaction()
    let tagsToAdd = tagIds.filter(tagId => !card.tags.find(cardTag => cardTag._id.toString() === tagId._id.toString()))
    await addCardsToTags(tagsToAdd, card, sess)

    // Save the created card
    await card.save({ session: sess });
    
    await sess.commitTransaction()
      
  } catch(err) {
    throw new HttpError('Updating card failed, please try again.', 500)
  }

  return card.toJSON()
}

const deleteCard = async(cardId, userId) => {
  let card
  try {
    card = await Card.findById(cardId).populate('creator').populate('tags')
  } catch(err) {
    throw new HttpError('Could not find card for provided id.', 500)
  }

  if(!card){
    throw new HttpError('Could not find card for provided id.', 404)
  }

  if (card.creator.id !== userId) {
    throw new HttpError('You are not allowed to delete this card', 403)
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
  } 
  catch(err) {
    throw new HttpError('Something went wrong, could not delete card', 500)
  }
  return 'Deleted card.'
}

exports.getCardById = getCardById;
exports.getCardsByUserId = getCardsByUserId;
exports.createCard = createCard;
exports.updateCard = updateCard;
exports.deleteCard = deleteCard;