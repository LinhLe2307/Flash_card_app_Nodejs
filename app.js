const express = require('express');
const { ApolloServer } = require('@apollo/server')
const { startStandaloneServer } = require('@apollo/server/standalone')
const { GraphQLError } = require('graphql')

const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const HttpError = require('./models/http-error'); // Import HttpError model
const cardsRoutes = require('./routes/cards-routes');
const usersRoutes = require('./routes/users-routes');
const User = require('./models/user');
const { getUsers } = require('./controllers/users-controllers');

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

app.use('/api/cards', cardsRoutes);
app.use('/api/users', usersRoutes);

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
  type Query {
    users(searchInput: String): [User]
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
  Query: {
    users: async(root, args) => {
      const users = await User.find({firstName: args.searchInput}).populate({
        path: 'cards',
        populate: {
          path: 'tags'
        }
      })

      if (!users.data) {
        return await User.find({}).populate({
          path: 'cards',
          populate: {
            path: 'tags'
          }
        })
      }
      return users
    }
  },
  
}

const server = new ApolloServer({
  typeDefs,
  resolvers
})

startStandaloneServer(server, {
  listen: { port: 5068 },

}).then(({ url }) => {
  console.log(`Server ready at ${url}`)
})