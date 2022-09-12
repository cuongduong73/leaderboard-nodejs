const express = require('express');
const router = express.Router();
const leagueController = require('../controllers/leagueController');
const authorizeToken = require('../middleware/authorizeToken');

// get all league information (id, name, season, start, duration, contraint, users)
router.get('/', leagueController.gets);

router.get('/global', leagueController.getGlobal);

router.get('/:id/detail', leagueController.getDetail);
// get league study data by id (reviews, retention, minutes, study_days, ...)
// specify day data by query parameter ?day=10
router.get('/:id', leagueController.get);

// create private challenge
router.post('/create', authorizeToken, leagueController.create);

// update private challenge information
router.put('/:id/update', authorizeToken, leagueController.update);

// delete private challenge
router.delete('/:id', authorizeToken, leagueController.delete);

// submit join private challenge
router.post('/user/join', authorizeToken, leagueController.join);

// accept user to join private challenge / add user to challenge
router.post('/user/accept', authorizeToken, leagueController.acceptUser);

// remove user from the private challenge
router.post('/user/remove', authorizeToken, leagueController.removeUser);

// sync study data to global board
router.post('/sync/global', authorizeToken, leagueController.syncGlobal);

// sync overall study data to private challenge
router.post('/sync/private', authorizeToken, leagueController.syncLeague);

module.exports = router;
