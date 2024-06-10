const HttpError = require('../models/http-error');
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const User = require('../models/user');
const { default: mongoose } = require('mongoose');
const fs = require('fs')
const { deleteS3 } = require('../middleware/s3Service');

require('dotenv').config()

const getUsers = async() => {
    let users
    try {
      users = await User.find({}, '-password').populate({
        path: 'cards',
        populate: {
          path: 'tags'
        }
      })
    } catch(err) {
        throw new HttpError(
            'Fetching users failed, please try again later'
        )
    }
    return users
}

const getSingleUser = async(userId) => {
  let user
  try {
    user = await User.findById(userId, '-password').populate({
      path: 'cards',
      populate: {
        path: 'tags'
      }
    })
  } catch(err) {
      throw new HttpError(
          'Fetching user failed, please try again later'
      )
    }
    
  if (!user) {
    throw new HttpError('Could not find a user for the provided id.', 404)
  }

  return user
}

const updateUser = async(userId, firstName, lastName, imagePath, phone, country, language, aboutMe, x, linkedIn, instagram, github, website) => {
  let user 
  
  try {
    user = await User.findById(userId)
  } catch(err) {
    throw new HttpError(
      'Fetching users failed, please try again later'
      )
  }

  if (!user.image) {
    throw new HttpError('Could not find image path for provided id.', 404)
  }

  let userImage = user.image;
  if (imagePath !== userImage) {
      // Delete existing image, then upload a new one
    try {
      await deleteS3(user.image);
      userImage = await imagePath
    } catch(err) {
      throw new HttpError('Something went wrong, could not update image', 500)
    }
  }

  const data = {
    firstName, 
    lastName, 
    phone, 
    country, 
    language, 
    image: userImage, 
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
    throw new HttpError(
      'Fetching users failed, please try again later'
    )
  }

  if (!user) {
    throw (new HttpError('Could not find a user for the provided id.', 404))
  }


  try {
    await user.save()
  } catch(err) {
    throw new HttpError('Something went wrong, could not update user', 500)
  }
  return user
}

const deleteUser = async(userId) => {
  let user
  try {
    user = await User.findById(userId).populate('cards')
  } catch(err) {
    throw new HttpError(
      'Fetching users failed, please try again later'
    )
  }

  if(!user){
    throw new HttpError('Could not find user for provided id.', 404)
  }

  if (!user.image) {
    throw new HttpError('Could not find image path for provided id.', 404)
  }

  // Delete existing image
  try {
    await deleteS3(user.image);
  } catch(err) {
    throw new HttpError('Could not delete the user image, please try again', 500)
  }

  try {
    const sess = await mongoose.startSession()
    sess.startTransaction()
    
    for (const card of user.cards) {
      // Remove the card ID from associated tags
      await mongoose.model('Tag').updateMany(
        { cards: card._id },
        { $pull: { cards: card._id } }
      );
      // await card.remove()
    }
    await mongoose.model('Card').deleteMany({ creator: userId })
    await user.deleteOne({session: sess})
    console.log('user', user)
    await sess.commitTransaction()

  } 
  catch(err) {
    throw new HttpError('Something went wrong, could not delete user', 500)
  }
  
  return 'Deleted User'
}

const signup = async(firstName, lastName, imagePath, phone, country, language, email, password, aboutMe, x,
  linkedIn, instagram, github, website) => {
    let existingUser
    try {
        existingUser = await User.findOne({email: email})
    } catch(err) {
        throw new HttpError('Signing up failed, please try again later', 500)
    }

    if (existingUser) {
        throw new HttpError('User exists already, please login instead', 422)
    }

    let hashedPassword
    try {
        hashedPassword = await bcrypt.hash(password, 12)
    } catch(err) {
        throw new HttpError(
            'Password invalid, please try again',
            500
        )
    }

    const createdUser = new User({
      firstName, 
      lastName, 
      phone, country, language, email, aboutMe,
      x, linkedIn, instagram, github, website,
      password: hashedPassword,
      image: imagePath,
      cards:[]
    })

    try {
        await createdUser.save()
    } catch(err) {
      console.log(err)
      throw new HttpError('Creating user failed, please try again', 422)
    }

    let token
    try {
      token = jwt.sign({ userId: createdUser.id, email: createdUser.email }, process.env.TOKEN_KEY, {expiresIn: '1h'} )
    } catch(err) {
      throw new HttpError(
        'Signing up failed, please try again later.',
        500
      )
    }

  return({ userId: createdUser.id, email: createdUser.email, token: token });

}

const login = async (email, password) => {
  
    let existingUser;

    try {
      existingUser = await User.findOne({ email: email });
    } catch (err) {
      throw new HttpError(
        'Logging in failed, please try again later.',
        500
      );
    }
  
    if (!existingUser) {
      throw new HttpError(
        'Invalid users, could not log you in.',
        401
      );
    }
  
    let isValidPassword = false;
    try {
      isValidPassword = await bcrypt.compare(password, existingUser.password);
    } catch (err) {
      throw new HttpError(
        'Could not log you in, please check your credentials and try again.',
        500
      );
    }
  
    if (!isValidPassword) {
      throw new HttpError(
        'Invalid credentials, could not log you in.',
        401
      );
    }
  
    let token;
    try {
      token = jwt.sign(
        { userId: existingUser.id, email: existingUser.email },
        process.env.TOKEN_KEY,
        { expiresIn: '1h' }
      );
    } catch (err) {
      throw new HttpError(
        'Logging in failed, please try again later.',
        500
      );
    }
  
    return({
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