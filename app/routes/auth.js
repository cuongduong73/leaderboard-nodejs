const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const middlewareUser = require('../middleware/user');
// login
router.post('/login', middlewareUser.getReqUserInfo, authController.login);

module.exports = router;
