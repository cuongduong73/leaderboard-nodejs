const User = require('../models/User');
const responseHTTP = require('../helpers/responseHTTP');

const middlewareUser = {
    getReqUserInfo: async (req, res, next) => {
        try {
            const user = await User.findOne({ username: req.body.username });
            if (!user) {
                return responseHTTP(
                    res,
                    404,
                    `User ${req.body.username} not found`,
                );
            }
            req.reqUserDB = user;
            next();
        } catch (error) {
            return responseHTTP(res, 500, error.message);
        }
    },
    getAuthUserInfo: async (req, res, next) => {
        try {
            const user = await User.findOne({ username: req.authUser });
            if (!user) {
                return responseHTTP(res, 404, `User ${req.authUser} not found`);
            }
            req.authUserDB = user;
            next();
        } catch (error) {
            return responseHTTP(res, 500, error.message);
        }
    },
    getParamUserInfo: async (req, res, next) => {
        try {
            const user = await User.findOne({ username: req.params['name'] })
                .populate('leagues', '-users -createdAt -updatedAt -__v')
                .select('-password -createdAt -updatedAt -__v');
            if (!user) {
                return responseHTTP(
                    res,
                    404,
                    `User ${req.params['name']} not found`,
                );
            }
            req.paramUserDB = user;
            next();
        } catch (error) {
            return responseHTTP(res, 500, error.message);
        }
    },
    authRole: (role) => {
        return (req, res, next) => {
            if (req.authUserDB.role < role) {
                return responseHTTP(res, 403, 'Permission denied');
            }
            next();
        };
    },

    // compare
    compareRole: async (req, res, next) => {
        if (req.authUserDB.role <= req.reqUserDB.role) {
            return responseHTTP(res, 403, 'Permission denied');
        }
        next();
    },
};

module.exports = middlewareUser;
