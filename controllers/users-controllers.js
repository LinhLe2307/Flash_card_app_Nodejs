
const HttpError = require('../models/http-error');
const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const User = require('../models/user');
const { default: mongoose } = require('mongoose');
const fs = require('fs')
const { deleteS3 } = require('../middleware/s3Service');

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

const updateUser = async(req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return next(new HttpError('Invalid inputs passed, please check your data', 422))
  }

  const userId = req.userData.userId

  const {firstName, 
    lastName, 
    phone, 
    country, 
    language, 
    aboutMe,
    x,
    linkedIn,
    instagram,
    github,
    website
  } = req.body
  
  let user 
  
  try {
    user = await User.findById(userId)
  } catch(err) {
    const error = new HttpError(
      'Fetching users failed, please try again later'
      )
      return next(error)
  }

  if (!user.image) {
    const error= new HttpError('Could not find image path for provided id.', 404)
    return next(error)
  }

  let image = user.image;
  if (req.imagePath) {
      // Delete existing image, then upload a new one
    try {
      await deleteS3(user.image);
      image = await req.imagePath
    } catch(err) {
      const error = new HttpError('Something went wrong, could not update image', 500)
      return next(error)
    }
  }

  const data = {
    firstName, 
    lastName, 
    phone, 
    country, 
    language, 
    image: image, 
    aboutMe,
    x,
    linkedIn,
    instagram,
    github,
    website
  }
 
  try {
    user = await User.findByIdAndUpdate(userId, {$set: data},
      {
        new: true,
      })
  } catch(err) {
    const error = new HttpError(
      'Fetching users failed, please try again later'
    )
    return next(error)
  }

  if (!user) {
    return next(new HttpError('Could not find a user for the provided id.', 404))
  }


  try {
    await user.save()
  } catch(err) {
    const error = new HttpError('Something went wrong, could not update user', 500)
    return next(error)
  }
  res.status(201).json({ user: user.toObject({getters: true}) })
}

const deleteUser = async(req, res, next) => {
  const userId = req.userData.userId
  let user
  try {
    user = await User.findById(userId).populate('cards')
  } catch(err) {
    const error = new HttpError(
      'Fetching users failed, please try again later'
    )
    return next(error)
  }

  if(!user){
    const error= new HttpError('Could not find user for provided id.', 404)
    return next(error)
  }

  if (!user.image) {
    const error= new HttpError('Could not find image path for provided id.', 404)
    return next(error)
  }

  // Delete existing image
  try {
    await deleteS3(user.image);
  } catch(err) {
    const error = new HttpError('Something went wrong, could not delete image', 500)
    return next(error)
  }

  try {
    const sess = await mongoose.startSession()
    sess.startTransaction()

    await mongoose.model('Card').deleteMany({ creator: userId })
    await user.deleteOne({session: sess})

    await sess.commitTransaction()

  } catch(err){
    const error = new HttpError('Something went wrong, could not delete user', 500)
    return next(error)
  }
  
  res.status(200).json({message: 'Deleted user'})
}

const signup = async(req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const error = new HttpError('Invalid inputs passed, please check your data', 422)
        return next(error)
    }
    const { firstName, 
      lastName, 
      phone, 
      country, 
      language, 
      email, 
      password, 
      aboutMe,
      x,
      linkedIn,
      instagram,
      github,
      website
    } = req.body

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
            'Password invalid, please try again',
            500
        )
        return next(error)
    }

    const createdUser = new User({
        firstName, 
        lastName, 
        phone, country, language, email, aboutMe,
        x, linkedIn, instagram, github, website,
        password: hashedPassword,
        image: req.imagePath,
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
exports.updateUser = updateUser
exports.deleteUser = deleteUser