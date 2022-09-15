const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authorizeToken = require('../middleware/authorizeToken');
const middlewareUser = require('../middleware/user');
// get all users
router.get(
    '/',
    authorizeToken,
    middlewareUser.getAuthUserInfo,
    userController.gets,
);

// get specific users by name
router.get(
    '/:name',
    authorizeToken,
    middlewareUser.getAuthUserInfo,
    middlewareUser.getParamUserInfo,
    userController.get,
);

// register / create user
router.post('/create', userController.create);

// update user information (avatar, password, ...)
router.put(
    '/password',
    authorizeToken,
    middlewareUser.getAuthUserInfo,
    userController.changePassword,
);

// set user role (member, contributor, moderator, admin)
router.put(
    '/role',
    authorizeToken,
    middlewareUser.getAuthUserInfo,
    middlewareUser.getReqUserInfo,
    middlewareUser.compareRole,
    userController.setRole,
);

// award a prize for user
router.put(
    '/award',
    authorizeToken,
    middlewareUser.getAuthUserInfo,
    middlewareUser.getReqUserInfo,
    middlewareUser.authRole(2),
    userController.award,
);

// ban/delete user
router.delete(
    '/:name',
    authorizeToken,
    middlewareUser.getAuthUserInfo,
    middlewareUser.getParamUserInfo,
    userController.delete,
);

module.exports = router;
