const express = require('express')
const bodyParser = require('body-parser');
const cardsRoutes = require('./routes/cards-routes')
const usersRoutes = require('./routes/users-routes')

const app = express()
app.use(bodyParser.json());

app.use('/api/cards', cardsRoutes)
app.use('/api/users', usersRoutes)

app.listen(5068)