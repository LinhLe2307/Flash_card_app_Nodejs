const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const HttpError = require('./models/http-error'); // Import HttpError model
const cardsRoutes = require('./routes/cards-routes');
const usersRoutes = require('./routes/users-routes');

const app = express();
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
    app.listen(5068, () => {
      console.log('Server is running on port 5068');
    });
  })
  .catch(err => {
    console.log(err);
  });
