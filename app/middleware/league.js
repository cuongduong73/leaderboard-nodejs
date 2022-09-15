const LeagueInfo = require('../models/LeagueInfo');
const responseHTTP = require('../helpers/responseHTTP');

const middlewareLeague = {
    getLeagueInfoByParam: async (req, res, next) => {
        try {
            const leagueInfo = await LeagueInfo.findById(req.params['id']);
            if (!leagueInfo) {
                return responseHTTP(
                    res,
                    404,
                    `ID ${req.params['id']} not found`,
                );
            }
            req.leagueInfo = leagueInfo;
            next();
        } catch (error) {
            return responseHTTP(res, 500, error.message);
        }
    },
    getLeagueInfoByPayload: async (req, res, next) => {
        try {
            const leagueInfo = await LeagueInfo.findById(req.body.id);
            if (!leagueInfo) {
                return responseHTTP(res, 404, `ID ${req.body.id} not found`);
            }
            req.leagueInfo = leagueInfo;
            next();
        } catch (error) {
            return responseHTTP(res, 500, error.message);
        }
    },

    canUpdateLeague: async (req, res, next) => {
        const leagueUser = req.leagueInfo.users.find(
            (u) => u.user_id.toString() === req.authUserDB._id.toString(),
        );
        // not creator
        if (!leagueUser || leagueUser.status < 2) {
            return responseHTTP(res, 403, `Permission denied`);
        }
        next();
    },
    canDeleteLeague: async (req, res, next) => {
        const leagueUser = req.leagueInfo.users.find(
            (u) => u.user_id.toString() === req.authUserDB._id.toString(),
        );
        // admin
        if (req.authUserDB.role === 2) return next();

        // not creator
        if (!leagueUser || leagueUser.status < 2) {
            return responseHTTP(res, 403, `Permission denied`);
        }
        next();
    },
};

module.exports = middlewareLeague;
