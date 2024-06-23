const { checkExistingUser, createCustomerQueryWithMedia, createCustomerQueryWithoutMedia, updateCustomerQuery, getSingleUserQuery } = require('../models/creator')
const { checkMedia } = require('../middleware/check-relation')
const { getSingleLanguageQuery } = require('../models/language')
const { getSingleCountryQuery } = require('../models/country')

const HttpError = require('../models/http-error')
require('dotenv').config()


const getUsers = async() => {
    let users
    try {
        users = await allCreatorsQuery()
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
        user = await getSingleUserQuery(userId)
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

const updateUser = async(userId, firstName, lastName, imagePath, phone, countryId, languageId, aboutMe, x, linkedin, instagram, github, website) => {
    let user
    try {
        user = await getSingleUserQuery(userId)
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

    const isMediaValid = checkMedia(x, linkedin, instagram, github, website)
    const isValidLanguage = getSingleLanguageQuery(languageId)
    const isValidCountry = getSingleCountryQuery(countryId)

    if (!isValidLanguage.rows.length) {
        throw new HttpError('Invalid Language Id')
    }
        
    if (!isValidCountry.rows.length) {
        throw new HttpError('Invalid Country Id')

    }

    let createdUser
    try {
        if (isMediaValid) {
            createdUser = updateCustomerQueryWithMedia(x, linkedin, instagram, github, website,
                firstName, lastName, email, countryId, languageId, password, image, aboutMe, phone)
        } else {
            createdUser = updateCustomerQueryWithoutMedia(firstName, lastName, email, countryId, languageId, password, image, aboutMe, phone)
        }
    } catch(err) {
        throw new HttpError('Something went wrong, could not update user', 500)
    }
    return createdUser
}

const deleteUser = async(userId) => {
    let user
    try {
        
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

    } catch(err) {
        throw new HttpError('Something went wrong, could not delete user', 500)
    }

    return 'Deleted User'
}

const signup = async (firstName, lastName, email, countryId, languageId, password, image, aboutMe, phone) => {
    let existingUser
    try {
        existingUser = await checkExistingUser(email)
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
    const isValidLanguage = getSingleLanguageQuery(languageId)
    const isValidCountry = getSingleCountryQuery(countryId)

    if (!isValidLanguage.rows.length) {
        throw new HttpError('Invalid Language Id')
    }
        
    if (!isValidCountry.rows.length) {
        throw new HttpError('Invalid Country Id')
    }
    
    try {
        createdUser = await createCustomerQuery(x, linkedin, instagram, github, website,
            firstName, lastName, email, countryId, languageId, hashedPassword, image, aboutMe, phone)
    } catch(err) {
        throw new HttpError('Creating user failed, please try again')
    }
    
    let token
    try {
      token = jwt.sign({ userId: createdUser.creator_id, email: createdUser.email }, process.env.TOKEN_KEY, {expiresIn: '1h'} )
    } catch(err) {
      throw new HttpError(
        'Signing up failed, please try again later.',
        500
      )
    }

    return({ userId: createdUser.id, email: createdUser.email, token: token });
}



exports.getUsers = getUsers
exports.getSingleUser = getSingleUser
exports.updateUser = updateUser
exports.deleteUser = deleteUser
exports.signup = signup