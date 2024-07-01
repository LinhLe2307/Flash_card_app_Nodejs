const {createTagQuery} = require('../models/tag')
const {createSubcardQuery, createCardQuery, getCardByIdQuery, deleteCardByIdQuery, updateCardQuery} = require('../models/card')
const { getCardsAndInfoByUserIdQuery } = require('../models/creator')
const { checkFlashcardByUserId } = require('../middleware/check-relation')
const HttpError = require('../models/http-error');

const createCard = async (props) => {

  const { tags, title, description, userId, ...rest } = props

  let existingUser
  try {
    existingUser = await getCardsAndInfoByUserIdQuery(userId)
  }  catch(err) {
    throw new HttpError(
      'Finding user failed, please try again',
        500
      )
  }

  if(!existingUser.rows.length){
    throw new HttpError('Could not find user for provided id.', 404)
  }

  // Tags if not exist
  let createdTags
  try {
    createdTags= await createTagQuery(tags)
  } catch (err) {
    throw new HttpError('Could not update tags for provided id.', 500)
  }

  let tagIds = createdTags.rows.map(tag => tag.tag_id)

  // create subcard
  let createSubcards 
  try {
    createSubcards = await createSubcardQuery(rest)
  } catch(err) {
    throw new HttpError(
      'Could not create subcard, please try again',
        500
      )
  }
  let subcardIds = createSubcards.rows.map(subcard => subcard.subcard_id)

  // Create flashcard
  let createFlashcard
  try {
    createFlashcard = await createCardQuery(tagIds, subcardIds, title, description, userId)
  } catch(err) {
    throw new HttpError(
      'Could not create card, please try again',
      500
    )
  } 
  return createFlashcard.rows[0]
}

const getCardById = async(cardId) => {
  let card
  try {
    card = await getCardByIdQuery(cardId)
  } catch(err) {
    throw new HttpError('Something went wrong, could not find a card.', 500)
  }
  if (!card.rows.length) {
    throw (new HttpError('Could not find a card for the provided id.', 404))
  }
  return card.rows[0]
}

const deleteCardById = async(cardId) => {
  let card
  try {
    card = await getCardByIdQuery(cardId)
  } catch(err) {
    throw new HttpError('Could not find card for provided id.', 500)
  }

  if(!card.rows.length){
    throw new HttpError('Could not find card for provided id.', 404)
  }

  try {
    await deleteCardByIdQuery(cardId)
  } catch(err) {
    throw new HttpError('Something went wrong, could not delete card', 500)
  }
  return 'Deleted card.'
}

const updateCard = async(props) => {
  const { tags, title, description, userId, cardId, ...rest } = props
  let cardCreator
    try {
        cardCreator = await checkFlashcardByUserId(userId, cardId)
    } catch(err) {
        throw new HttpError('Could not find card for provided id.', 500)
    }
  
  if (!cardCreator.rows.length) {
    throw new HttpError('You are not allowed to edit this card.', 500)
  }
  
  // Tags if not exist
  let createdTags
  try {
    createdTags= await createTagQuery(tags)
  } catch (err) {
    throw new HttpError('Could not update tags for provided id.', 500)
  }

  let tagIds = createdTags.rows.map(tag => tag.tag_id)

  let existingSubcards = cardCreator.rows[0].subcard_id

  try {
    await updateCardQuery(title, description, tagIds, existingSubcards, rest, cardId)
  } catch(err) {
    throw new HttpError('Could not update card for provided id.', 500)
  }
  
  let singleCard
  try {
    singleCard = await getCardByIdQuery(cardId)
  } catch(err) {
    throw new HttpError('Could not get card for provided id.', 500)
  }
  
  return singleCard.rows
}

exports.createCard = createCard
exports.getCardById = getCardById
exports.deleteCardById = deleteCardById
exports.updateCard = updateCard