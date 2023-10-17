const express = require('express')
const bodyParser = require('body-parser');
const mongoose = require('mongoose')

const cardsRoutes = require('./routes/cards-routes')
const usersRoutes = require('./routes/users-routes')

const app = express()
app.use(bodyParser.json());

app.use('/api/cards', cardsRoutes)
app.use('/api/users', usersRoutes)

app.use((req, res, next) => {
    const error = new HttpError('Could not find this route.', 404);
    throw error;
  });
  
app.use((error, req, res, next) => {
    if (res.headerSent) {
      return next(error);
    }
    res.status(error.code || 500)
    res.json({message: error.message || 'An unknown error occurred!'});
  });

  mongoose
  .connect("mongodb+srv://lemylinh23071997:Noo23071997@cluster0.v4pexzo.mongodb.net/cards?retryWrites=true&w=majority")
  .then(() => {
      app.listen(5068) 
    })
    .catch(err => {
        console.log(err)
    })