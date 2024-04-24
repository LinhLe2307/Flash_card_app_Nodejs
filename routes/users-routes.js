const express = require('express')
const {check} = require('express-validator')
const usersController = require('../controllers/users-controllers')
const checkAuth = require('../middleware/check-auth')
const fileUpload = require('../middleware/file-upload')
const { s3Uploadv2 } = require('../middleware/s3Service')

const router = express.Router()

router.get("/", usersController.getUsers)

router.post(
    '/signup',
    fileUpload.single('image'),
    s3Uploadv2,
    [
      check('firstName')
        .not()
        .isEmpty(),
      check('lastName')
        .not()
        .isEmpty(),
      check('country')
        .not()
        .isEmpty(),
      check('language')
        .not()
        .isEmpty(),
      check('email')
        .normalizeEmail() // Test@test.com => test@test.com
        .isEmail(),
      check('password').isLength({ min: 6 })
    ],
    usersController.signup
  );

router.post("/login", usersController.login)

router.get("/:uid", usersController.getSingleUser)
router.use(checkAuth)
router.patch("/:uid", 
  fileUpload.single('image'),
  s3Uploadv2,
  [
    check('firstName')
      .not()
      .isEmpty(),
    check('lastName')
      .not()
      .isEmpty(),
    check('country')
      .not()
      .isEmpty(),
    check('language')
      .not()
      .isEmpty()
  ],
  usersController.updateUser
)

router.delete("/:uid", usersController.deleteUser)

module.exports = router