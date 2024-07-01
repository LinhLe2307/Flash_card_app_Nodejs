const { ApolloServer } = require('apollo-server-express');
const express = require('express');
const { graphqlUploadExpress } = require('graphql-upload');
const cors = require('cors');
const { typeDefs, resolvers } = require('./graphql')
const client = require('./postgresql/db')
require('dotenv').config(); // Load environment variables from .env file

const app = express();

// Configure CORS
app.use(cors());

// Middleware to handle multipart/form-data (necessary for file uploads)
app.use(graphqlUploadExpress());
// Create an instance of ApolloServer
const server = new ApolloServer({
  typeDefs,
  resolvers,
});
// Start the Apollo server and apply middleware to Express
async function startApolloServer() {
  await server.start();
  server.applyMiddleware({ app, path: '/' });
}

// Start the PostgreSQL client and Express server
async function startServer() {
  try {
    await client.connect();
    await startApolloServer();
    const port = 5068;
    app.listen({ port }, () => {
      console.log(`🚀 Server ready at http://localhost:${port}${server.graphqlPath}`);
    });
  } catch (err) {
    console.error('Error connecting to PostgreSQL:', err);
  }
}

// Call the function to start the server
startServer();