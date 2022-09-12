const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authorizeToken = require('../middleware/authorizeToken');

// get all users
router.get('/', userController.gets);

// get specific users by name
router.get('/:name', userController.get);

// register / create user
router.post('/create', userController.create);

// update user information (avatar, password, ...)
router.put('/password', authorizeToken, userController.changePassword);

// set user role (member, contributor, moderator, admin)
router.put('/role', authorizeToken, userController.setRole);

// award a prize for user
router.put('/award', authorizeToken, userController.award);

// ban/delete user
router.delete('/:name', authorizeToken, userController.delete);

module.exports = router;
