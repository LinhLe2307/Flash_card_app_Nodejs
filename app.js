const { ApolloServer } = require('apollo-server-express');
const express = require('express');
const { graphqlUploadExpress } = require('graphql-upload');
const cors = require('cors');
const { typeDefs, resolvers } = require('./graphql')
const client = require('./postgresql/db')
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
  // Connect to Postgresql and start the server
  client.connect()
    .then(() => {
      const port = 5068;
      const host = '0.0.0.0';
      app.listen({ port, host }, () => {
        console.log(`Server ready at http://localhost:5068${server.graphqlPath}`);
      });
    })
    .catch(err => {
      console.log('Error connecting to PostgreSQL:', err);
    });
}

startServer();