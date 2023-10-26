const fs = require('fs')
const path = require('path');
const express = require('express')
const bodyParser = require('body-parser');
const mongoose = require('mongoose')
require('dotenv').config()

const cardsRoutes = require('./routes/cards-routes')
const usersRoutes = require('./routes/users-routes')

const app = express()
app.use(bodyParser.json());

app.use('/uploads/images', express.static(path.join('uploads', 'images')));

// add CORS. The idea here is when we don't send back a response, but that we just add certain
// headers to response so that when later a response is sent back from our more specific routes,
// it does have these headers attached
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*'); // it allows any domain to send requests
  // specify which headers these requests sent by the browser may have
   res.setHeader('Access-Control-Allow-Headers', 
   'X-Requested-With, content-type');
  //  'Access-Control-Allow-Headers, Origin, Accept, X-Requested-With, content-type, Access-Control-Request-Method, Access-Control-Request-Headers, Authorization');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE')
  next()
})

app.use('/api/cards', cardsRoutes)
app.use('/api/users', usersRoutes)

app.use((req, res, next) => {
    const error = new HttpError('Could not find this route.', 404);
    throw error;
  });
  
app.use((error, req, res, next) => {
    if (req.file) {
      fs.unlink(req.file.path, (err) => {
        console.log(err)
      })
    }
    if (res.headerSent) {
      return next(error);
    }
    res.status(error.code || 500)
    res.json({message: error.message || 'An unknown error occurred!'});
  });

  mongoose
  .connect(process.env.DEV_PORT)
  .then(() => {
      app.listen(5068) 
    })
    .catch(err => {
        console.log(err)
    })