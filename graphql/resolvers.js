const axios = require('axios')
const HttpError = require('../models/http-error');
const { uploadS3 } = require('../middleware/s3Service')
const { signup, getUsers, getSingleUser, login, updateUser, deleteUserById } = require('../controllers/creators-controllers');
const { createCard, getCardById, deleteCardById, updateCard } = require('../controllers/cards-controllers');
const checkEmailValidation = require('../utils/checkEmailValidation');
const { getAllCountriesAndLanguagesQuery } = require('../models/country');
require('dotenv').config();

const resolvers = {
    Upload: require('graphql-upload').GraphQLUpload,
    JSON: require('graphql-type-json').GraphQLJSON,
  
    Query: {
      getUsers: async(root, args) => {
        return await getUsers()
      },
      getUserDetail: async(root, args) => {
        return await getSingleUser(args.userId)
      },
      getCountriesAndLanguages: async(root, args) => {
        try {
          const response = await getAllCountriesAndLanguagesQuery()
          return response.rows[0]
        } catch(error) {
          console.log(error)
          throw new HttpError('Failed to fetch countries');
        }
      },
      getCardsByUserId: async(root, args) => {
        return getSingleUser(args.userId)
      },
      getCardById: async(root, args) => {
        return await getCardById(args.cardId)
      },
    },
    Mutation: {
      loginAuth: async(root, args) => {
        return login( args.email, args.password)
      },
  
      signUpAuth: async(root, { firstName, lastName, image, 
        phone, country, language, email, password, aboutMe, x,
        linkedIn, instagram, github, website }) => {
        const isValidEmail = checkEmailValidation(email)
        if (isValidEmail) {
          const result = await uploadS3(image)
          return signup(firstName, lastName, result.Location, phone, country, language, email, password, aboutMe, x,
          linkedIn, instagram, github, website)
        } else {
          throw new HttpError("Email not in proper format")
        }
      },
            
      updateUser: async(root, {userId, firstName, lastName, image, phone, country, language, aboutMe, x, linkedIn,
        instagram, github, website}) => {
          let imageUrl
          if (image.file) {
            const result = await uploadS3(image.file)
            imageUrl = result.Location
          } else {
            imageUrl = image.url
          }
          return updateUser(
            userId, firstName, lastName, imageUrl, phone, country, language, aboutMe, x, linkedIn,
            instagram, github, website
          )
      },
      createCard: async(root, args) => {
        return await createCard(args.input)
      },
      updateCard: async(root, args) => {
        return await updateCard(args.input)
      },      
      deleteUser: async(root, args) => {
        return deleteUserById(args.userId)
      },
      deleteCard: async(root, args) => {
        return deleteCardById(args.cardId, args.userId)
      } 
    }
  };

module.exports = resolvers