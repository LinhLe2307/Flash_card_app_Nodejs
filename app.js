const { ApolloServer } = require('apollo-server-express');
const express = require('express');
const mongoose = require('mongoose');
const { graphqlUploadExpress } = require('graphql-upload');
const cors = require('cors');
const { typeDefs, resolvers } = require('./graphql')
require('dotenv').config(); // Load environment variables from .env file

async function startServer() {
  const app = express();

  // Enable CORS for all origins
  app.use(cors());

  // Middleware to handle multipart/form-data, which is necessary for file uploads
  app.use(graphqlUploadExpress());

  // Create an instance of ApolloServer
  const server = new ApolloServer({
    typeDefs,
    resolvers,
  });

  // Start the Apollo server
  await server.start();

  // Apply Apollo middleware to the Express app
  server.applyMiddleware({ app, path: '/' });

  // Start the Express server
  // Connect to MongoDB and start the server
  mongoose.connect(`mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.gde7zzo.mongodb.net/${process.env.DB_NAME}`, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
    .then(() => {
      app.listen({ port: 5068 }, () => {
        console.log(`Server ready at http://localhost:5068${server.graphqlPath}`);
      });
    })
    .catch(err => {
      console.log('Error connecting to MongoDB:', err);
    });
}

startServer();
