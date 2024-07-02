const { getUserByEmail, createCustomerQuery, updateCustomerQuery, getCardsAndInfoByUserIdQuery, deleteUserQuery, allCreatorsQuery, loginQuery } = require('../models/creator')
const { deleteS3 } = require('../middleware/s3Service')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const HttpError = require('../models/http-error')
require('dotenv').config()


const getUsers = async() => {
    let users
    try {
        users = await allCreatorsQuery()
    } catch(err) {
        throw new HttpError(
            'Fetching users failed, please try again later.'
        )
    }
    return users.rows
}

const getSingleUser = async(userId) => {
    let user
    try {
        user = await getCardsAndInfoByUserIdQuery(userId)
    } catch(err) {
        throw new HttpError(
            'Fetching user cards failed, please try again later'
        )
      }
      
    if (!user.rows.length) {
      throw new HttpError('Could not find user cards and information for the provided id.', 404)
    }
    return user.rows[0]
}

const updateUser = async(userId, firstName, lastName, imagePath, phone, countryId, languageId, aboutMe, x, linkedin, instagram, github, website) => {
  let user
    try {
        user = await getCardsAndInfoByUserIdQuery(userId)
    } catch(err) {
        throw new HttpError(
          'Fetching users failed, please try again later'
        )
    }

    if (!user.rows.length) {
        throw new HttpError('Could not find user for provided id.', 404)
        
    }

    if (!user.rows[0].image) {
        throw new HttpError('Could not find image path for provided id.', 404)
    }

    let userImage = user.rows[0].image;
    if (imagePath !== userImage) {
        // Delete existing image, then upload a new one
        try {
            await deleteS3(user.image);
            userImage = await imagePath
        } catch(err) {
            throw new HttpError('Something went wrong, could not update image', 500)
        }
    }

    let createdUser
    try {
        createdUser = await updateCustomerQuery(x, linkedin, instagram, github, website,
            firstName, lastName, countryId, languageId, userImage, aboutMe, phone, userId)
    } catch(err) {
        throw new HttpError('Something went wrong, could not update user', 500)
    }

    let singleUser = await getSingleUser(userId)

    return singleUser
}

const deleteUserById = async(userId) => {
    let user
    try {
        user = await getCardsAndInfoByUserIdQuery(userId)
    } catch(err) {
        throw new HttpError(
        'Fetching users failed, please try again later'
        )
    }

    if(!user.rows.length){
        throw new HttpError('Could not find user for provided id.', 404)
    }

    if (!user.rows[0].image) {
        throw new HttpError('Could not find image path for provided id.', 404)
    }

    // Delete existing image
    try {
        await deleteS3(user.rows[0].image);
    } catch(err) {
        throw new HttpError('Could not delete the user image, please try again', 500)
    }

    try {
        await deleteUserQuery(userId)
    } catch(err) {
        throw new HttpError('Something went wrong, could not delete user', 500)
    }

    return 'Deleted User'
}


const signup = async (
    firstName, lastName, image, 
    phone, countryId, languageId, email, password, aboutMe, x,
    linkedin, instagram, github, website
) => {
    let existingUser
    try {
        existingUser = await getUserByEmail(email)
    } catch(err) {
        throw new HttpError('Signing up failed, please try again later', 500)
    }

    if (existingUser.rows.length > 0) {
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

    let createdUser
    try {
        createdUser = await createCustomerQuery(x, linkedin, instagram, github, website,
            firstName, lastName, email, countryId, languageId, hashedPassword, image, aboutMe, phone)
    } catch(err) {
        throw new HttpError('Creating user failed, please try again')
    }
    
    let token
    try {
        token = jwt.sign({ userId: createdUser.rows[0].creator_id, email: createdUser.rows[0].email }, 
            process.env.TOKEN_KEY, 
            {expiresIn: '1h'} 
        )
    } catch(err) {
      throw new HttpError(
        'Signing up failed, please try again later.',
        500
      )
    }

    return({ userId: createdUser.rows[0].creator_id, 
        email: createdUser.rows[0].email, 
        token: token,
        image: createdUser.rows[0].image
    });
}

const login = async(email, password) => {
    let existingUser;

    try {
      existingUser = await getUserByEmail(email);
    } catch (err) {
      throw new HttpError(
        'Logging in failed, please try again later.',
        500
      );
    }
  
    if (!existingUser.rows.length) {
      throw new HttpError(
        'Invalid users, could not log you in.',
        401
      );
    }
  
    let isValidPassword = false;
    try {
      isValidPassword = await bcrypt.compare(password, existingUser.rows[0].password);
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
        { 
            userId: existingUser.rows[0].creator_id, 
            email: existingUser.rows[0].email 
        },
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
        userId: existingUser.rows[0].creator_id, 
        email: existingUser.rows[0].email,
        token: token,
        image: existingUser.rows[0].image
    });
}


exports.getUsers = getUsers
exports.getSingleUser = getSingleUser
exports.updateUser = updateUser
exports.deleteUserById = deleteUserById
exports.signup = signup
exports.login = login