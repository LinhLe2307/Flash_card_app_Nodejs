const { uploadS3 } = require('../middleware/s3Service')
const axios = require('axios')
const HttpError = require('../models/http-error');
const { signup, getUsers, getSingleUser, login, updateUser, deleteUser } = require('../controllers/users-controllers');
const { getCardById, getCardsByUserId, createCard, updateCard, deleteCard } = require('../controllers/cards-controllers');
const checkEmailValidation = require('../utils/checkEmailValidation');
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
      getCountries: async(root, args) => {
        try {
          const response = await axios.get(`https://countriesnow.space/api/v0.1/countries`)
          return response.data.data.map(country => country.country)
        } catch(error) {
          console.log(error)
          throw new HttpError('Failed to fetch countries');
        }
      },
      getCardsByUserId: async(root, args) => {
        return getCardsByUserId(args.userId)
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
            userId, firstName, lastName, imageUrl, phone, country, language, aboutMe, x, linkedIn, instagram, github, website
          )
      },
      createCard: async(root, args) => {
        return await createCard(args.input)
      },
      updateCard: async(root, args) => {
        return await updateCard(args.input)
      },      
      deleteUser: async(root, args) => {
        return deleteUser(args.userId)
      },
      deleteCard: async(root, args) => {
        return deleteCard(args.cardId, args.userId)
      } 
    }
  };

module.exports = resolvers