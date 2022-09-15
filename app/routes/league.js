const express = require('express');
const router = express.Router();
const leagueController = require('../controllers/leagueController');
const authorizeToken = require('../middleware/authorizeToken');
const middlewareLeague = require('../middleware/league');
const middlewareUser = require('../middleware/user');

// get all league information (id, name, season, start, duration, contraint, users)
router.get('/', leagueController.gets);

router.get('/global', leagueController.getGlobal);

// get league study data by id (reviews, retention, minutes, study_days, ...)
// specify day data by query parameter ?day=10
router.get('/:id/detail', leagueController.getDetail);

router.get('/:id', leagueController.get);

// create private challenge
router.post(
    '/create',
    authorizeToken,
    middlewareUser.getAuthUserInfo,
    middlewareUser.authRole(1),
    leagueController.create,
);

// update private challenge information
router.put(
    '/:id/update',
    authorizeToken,
    middlewareUser.getAuthUserInfo,
    middlewareLeague.getLeagueInfoByParam,
    middlewareLeague.canUpdateLeague,
    leagueController.update,
);

// delete private challenge
router.delete(
    '/:id',
    authorizeToken,
    middlewareUser.getAuthUserInfo,
    middlewareLeague.getLeagueInfoByParam,
    middlewareLeague.canDeleteLeague,
    leagueController.delete,
);

// submit join private challenge
router.post(
    '/user/join',
    authorizeToken,
    middlewareUser.getAuthUserInfo,
    middlewareLeague.getLeagueInfoByPayload,
    leagueController.join,
);

// accept user to join private challenge / add user to challenge
router.post(
    '/user/accept',
    authorizeToken,
    middlewareUser.getAuthUserInfo,
    middlewareLeague.getLeagueInfoByPayload,
    middlewareLeague.canUpdateLeague,
    middlewareUser.getReqUserInfo,
    leagueController.acceptUser,
);

// remove user from the private challenge
router.post(
    '/user/remove',
    authorizeToken,
    middlewareUser.getAuthUserInfo,
    middlewareLeague.getLeagueInfoByPayload,
    middlewareLeague.canUpdateLeague,
    middlewareUser.getReqUserInfo,
    leagueController.removeUser,
);

// sync study data to global board
router.post(
    '/sync/global',
    authorizeToken,
    middlewareUser.getAuthUserInfo,
    leagueController.syncGlobal,
);

// sync overall study data to private challenge
router.post(
    '/sync/private',
    authorizeToken,
    middlewareUser.getAuthUserInfo,
    middlewareLeague.getLeagueInfoByPayload,
    leagueController.syncLeague,
);

// router.post('/sync/admin',
//     authorizeToken,
//     middlewareUser.getAuthUserInfo,
//     middlewareLeague.getLeagueInfoByPayload,
//     middlewareUser.getReqUserInfo,
//     leagueController.syncAdmin
// );

module.exports = router;
