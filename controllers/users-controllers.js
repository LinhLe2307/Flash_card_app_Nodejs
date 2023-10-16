// const uuid = require('uuid/v4');
// const HttpError = require('../models/http-error');
// const DUMMY_USERS = [
//     {
//       id: 'u1',
//       name: 'Max Schwarz',
//       email: 'test@test.com',
//       password: 'testers'
//     }
//   ];
  
// const getUsers = (req, res, next) => {
//     res.json({users: DUMMY_USERS})
// }
// const signup = (req, res, next) => {
//     const {name, email, password} = req.body

//     const createdUser = {
//         id: uuid(),
//         name, // name: name
//         email,
//         password
//     }

//   DUMMY_USERS.push(createdUser);
//   res.status(201).json({user: createdUser});

// }
// const login = (req, res, next) => {
//   const { email, password } = req.body;
//   const identifiedUser = DUMMY_USERS.find(u => u.email === email);

//   res.json({message: 'Logged in!'});
// }

// exports.getUsers = getUsers
// exports.signup = signup
// exports.login = login