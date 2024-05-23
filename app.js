const express = require('express');
const { ApolloServer } = require('@apollo/server')
const { startStandaloneServer } = require('@apollo/server/standalone')
// import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer'
const { GraphQLError } = require('graphql')
// import express from 'express';
// import bodyParser from 'body-parser';
// import { ApolloServer } from '@apollo/server';
// import { graphqlHTTP } from 'express-graphql';
// import { startStandaloneServer } from '@apollo/server/standalone';
// import { GraphQLSchema, GraphQLObjectType, GraphQLString } from 'graphql';
// import cors from 'cors';
// import mongoose from 'mongoose';
// import axios from 'axios';
// import {GraphQLUpload} from 'graphql-upload/GraphQLUpload.js'
// import {graphqlUploadExpress} from 'graphql-upload/graphqlUploadExpress.js'
// import {GraphQLUpload, graphqlUploadExpress} from 'graphql-upload'
// import {
//   ApolloServerPluginLandingPageLocalDefault
// } from 'apollo-server-core';
// import { finished } from 'stream/promises';

// import dotenv from 'dotenv'
// dotenv.config()

require('dotenv').config()

const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const cors = require('cors');
const axios = require('axios')
const { GraphQLSchema, GraphQLObjectType, GraphQLString } = require('graphql');
const { GraphQLUpload, graphqlUploadExpress } = require('graphql-upload');
require('dotenv').config();

const HttpError = require('./models/http-error'); // Import HttpError model
const cardsRoutes = require('./routes/cards-routes');
const usersRoutes = require('./routes/users-routes');
const User = require('./models/user');
const fileUpload = require('./middleware/file-upload')
const s3Uploadv2 = require('./middleware/s3Service')
const { signup, getSingleUser, login, getUsers, updateUser, deleteUser } = require('./controllers/users-controllers');
const { getCardById, getCardsByUserId, createCard, updateCard, deleteCard } = require('./controllers/cards-controllers')

// import { signup, getSingleUser, login, getUsers, updateUser, deleteUser } from './controllers/users-controllers.js'
// import {  getCardById, getCardsByUserId, createCard, updateCard, deleteCard  } from './controllers/cards-controllers'

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.options('*', cors());

// add CORS middleware
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, PUT, DELETE, OPTIONS');
  next();
});

app.use(graphqlUploadExpress({ maxFileSize: 10000000, maxFiles: 10 }))

// app.use('/api/cards', cardsRoutes);
// app.use('/api/users', usersRoutes);

// Handle unknown routes
app.use((req, res, next) => {
  const error = new HttpError('Could not find this route.', 404);
  throw error;
});

// Error handling middleware
app.use((err, req, res, next) => {
  res.locals.error = err;
  if (res.headerSent) {
    return next(err);
  }
  const statusCode = err.code || 500;
  res.status(statusCode);
  res.json({ message: err.message || 'An unknown error occurred!' });
});

// Connect to MongoDB and start the server
mongoose.connect(`mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.gde7zzo.mongodb.net/${process.env.DB_NAME}`)
  .then(() => {
    console.log('connected to MongoDB')
  })
  .catch(err => {
    console.log(err);
  });

const typeDefs = `
  scalar Upload
  type Query {
    getUsers(searchInput: String): [User]
    getUserDetail(userId: ID!): User
    getCountries: [Country]
  }

  type Country {
      name: String!
  }

  type LoginUser {
    userId: ID!
    email: String!
    token: String!
  }

  type Mutation {
    loginAuth(email: String!, password: String!): LoginUser
    signUpAuth(
      firstName: String!
      lastName: String!
      aboutMe: String
      country: String!
      password: String!
      email: String!
      image: Upload!
      phone: String
      language: String
      x: String
      linkedIn: String
      instagram: String
      github: String
      website: String
    ): LoginUser
    updateUser(
      userId: String!
      firstName: String!
      lastName: String!
      aboutMe: String
      country: String!
      email: String!
      phone: String
      language: String
      x: String
      linkedIn: String
      instagram: String
      github: String
      website: String
    ): User
    deleteUser(userId: ID!): String!

  }

  type File {
    id: Int!
    name: String!
    content: String!
  }

  type User {
    id: ID!
    firstName: String!
    lastName: String!
    aboutMe: String
    country: String!
    email: String!
    image: String!
    phone: String
    language: String
    x: String
    linkedIn: String
    instagram: String
    github: String
    website: String
    cards: [Card]
  }

  type Card {
    id: ID!
    title: String!
    description: String!
    creator: User!
    tags: [Tag]
  }

  type Tag {
    id: ID!
    name: String
    cards: [Card]
  }
`

const resolvers = {
  // Upload: GraphQLUpload,
  Query: {
    getUsers: async(root, args) => {
      return getUsers(args.searchInput)
    },
    getUserDetail: async(root, args) => {
      return getSingleUser(args.userId)
    },
    getCountries: async(root, args) => {
      try {
        const response = await axios.get(`https://restcountries.com/v3.1/all?fields=name,flags`)
        console.log(response) 
        return response.data
      } catch(error) {
        console.error(error);
        // throw new Error('Failed to fetch countries');
      }
    },
    // getCardById: async(root, args) => {
    //   return getCardById(args.cardId)
    // },
    // getCardsByUserId: async(root, args) => {
    //   return getCardsByUserId(args.userId)
    // }
  },
  Mutation: {
    loginAuth: async(root, args) => {
      return login( args.email, args.password)
    },
    signUpAuth: async(root, { firstName, lastName, image, 
      phone, country, language, email, password, aboutMe, x,
      linkedIn, instagram, github, website }) => {
        console.log(firstName, lastName, image, 
          phone, country, language, email, password, aboutMe, x,
          linkedIn, instagram, github, website)
      // const file = image.then(file => {
      //   const {createReadStream, filename, mimetype} = file

      //   const fileStream = createReadStream()

      //   fileStream.pipe(fs.createWriteStream(`./uploadedFiles/${filename}`))

      //   return file;
      // });

      
      // await s3Uploadv2(image)
      // const file = await args.image
      // const {createReadStream, filename, mimetype} = file
      // const fileStream = createReadStream()

      // //Here stream it to S3
      // // Enter your bucket name here next to "Bucket: "
      // const uploadParams = {
      //   Bucket: process.env.AWS_BUCKET_NAME,
      //   Key: `uploads/${uuid()}-${file.originalname}`,
      //   Body: file.buffer,
      //   ContentType: file.mimetype,
      //   Metadata: {
      //       'Content-Disposition': 'inline' // Set the Content-Disposition header to 'inline'
      //   }
      // };
      // const result = await s3.upload(uploadParams).promise()

      // console.log(result)


      // return file;
      return signup( firstName, lastName, phone, country, language, email, password, aboutMe, x,
        linkedIn, instagram, github, website )
    },
    // updateUser: async(root, {userId, firstName, lastName, phone, country, language, aboutMe, x, linkedIn,
    //   instagram, github, website}) => {
    //   return updateUser(
    //     userId, firstName, lastName, phone, country, language, aboutMe, x, linkedIn, instagram, github, website
    //   )
    // },
    // deleteUser: async(root, args) => {
    //   return deleteUser(args.userId)
    // },
    // createCard: async() => {

    // },
    // deleteCard: async(root, args) => {
    //   return deleteCard(args.cardId)
    // }
  }
}

const server = new ApolloServer({
  typeDefs,
  resolvers,
      // Using graphql-upload without CSRF prevention is very insecure.
      // csrfPrevention: true,
      // cache: 'bounded',
      // plugins: [
      //   ApolloServerPluginLandingPageLocalDefault({ embed: true }),
      // ],
})

startStandaloneServer(server, {
  listen: { port: 5068 },

}).then(({ url }) => {
  console.log(`Server ready at ${url}`)
})