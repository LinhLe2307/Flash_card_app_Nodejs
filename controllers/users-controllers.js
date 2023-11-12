const HttpError = require('../models/http-error');
const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const User = require('../models/user')

require('dotenv').config()
  
const getUsers = async(req, res, next) => {
    let users
    try {
        users = await User.find({}, '-password')
    } catch(err) {
        const error = new HttpError(
            'Fetching users failed, please try again later'
        )
        return next(error)
    }
    // const users = User.find({}, '--password')
    res.json({
        users: users.map(user => user.toObject({getters: true}))
    })
}

const getSingleUser = async(req, res, next) => {
  const userId = req.params.uid
  let user
  try {
    user = await User.findById(userId, '-password')
  } catch(err) {
      const error = new HttpError(
          'Fetching user failed, please try again later'
      )
      return next(error)
  }

  if (!user) {
    return next(new HttpError('Could not find a user for the provided id.', 404))
  }

  res.json({
      user: user.toObject({getters: true})
  })
}

const signup = async(req, res, next) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        const error = new HttpError('Invalid inputs passed, please check your data', 422)
        return next(error)
    }
    const {firstName, lastName, phone, country, language, email, password} = req.body

    let existingUser
    try {
        existingUser = await User.findOne({email: email})
    } catch(err) {
        const error = new HttpError('Signing up failed, please try again later', 500)
        return next(error)
    }

    if (existingUser) {
        const error = new HttpError('User exists already, please login instead', 422)
        return next(error)
    }

    let hashedPassword
    try {
        hashedPassword = await bcrypt.hash(password, 12)
    } catch(err) {
        const error = new HttpError(
            'Could not create user, please try again',
            500
        )
        return next(error)
    }

    const createdUser = new User({
        firstName, lastName, 
        phone, country, language, email,
        password: hashedPassword,
        image: req.file.path,
        cards:[]
    })

    try {
        await createdUser.save()
    } catch(err) {
        const error = new HttpError('Creating user failed, please try again', 422)
        return next(error)
    }

    let token
    try {
        token = jwt.sign({ userId: createdUser.id, email: createdUser.email }, process.env.TOKEN_KEY, {expiresIn: '1h'} )
    } catch(err) {
        const error = new HttpError(
            'Signing up failed, please try again later.',
            500
        )
        return next(error)
    }

  res.status(201).json({ userId: createdUser.id, email: createdUser.email, token: token });

}

const login = async (req, res, next) => {
    const { email, password } = req.body;
  
    let existingUser;

    try {
      existingUser = await User.findOne({ email: email });
    } catch (err) {
      const error = new HttpError(
        'Logging in failed, please try again later.',
        500
      );
      return next(error);
    }
  
    if (!existingUser) {
      const error = new HttpError(
        'Invalid users, could not log you in.',
        401
      );
      return next(error);
    }
  
    let isValidPassword = false;
    try {
      isValidPassword = await bcrypt.compare(password, existingUser.password);
    } catch (err) {
      const error = new HttpError(
        'Could not log you in, please check your credentials and try again.',
        500
      );
      return next(error);
    }
  
    if (!isValidPassword) {
      const error = new HttpError(
        'Invalid credentials, could not log you in.',
        401
      );
      return next(error);
    }
  
    let token;
    try {
      token = jwt.sign(
        { userId: existingUser.id, email: existingUser.email },
        process.env.TOKEN_KEY,
        { expiresIn: '1h' }
      );
    } catch (err) {
      const error = new HttpError(
        'Logging in failed, please try again later.',
        500
      );
      return next(error);
    }
  
    res.json({
      userId: existingUser.id,
      email: existingUser.email,
      token: token
    });
  };

exports.getUsers = getUsers
exports.signup = signup
exports.login = login
exports.getSingleUser = getSingleUser