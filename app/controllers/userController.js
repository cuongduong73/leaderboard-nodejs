const User = require('../models/User');
const LeagueData = require('../models/LeagueData');
const LeagueInfo = require('../models/LeagueInfo');
const ResetToken = require('../models/Reset')
const { isAdmin, isMod } = require('../helpers/permission');
const responseHTTP = require('../helpers/responseHTTP');
// const emailSender = require('../helpers/email')
// const randtoken = require('rand-token');

const userController = {
    // GET /api/user
    gets: async (req, res) => {
        try {
            let users = await User.find()
                .populate('leagues', '-users -createdAt -updatedAt -__v')
                .select('-password -createdAt -updatedAt -_id -__v');

            if (!isAdmin(req.authUserDB)) {
                users = users.filter((u) => u.username === req.authUser);
            }
            return responseHTTP(res, 200, users);
        } catch (error) {
            return responseHTTP(res, 500, error.message);
        }
    },

    // GET /api/user/:name
    get: async (req, res) => {
        try {
            // only moderator or user itself able to get user information
            if (
                req.authUserDB.username !== req.paramUserDB.username &&
                !isMod(req.authUserDB)
            ) {
                return responseHTTP(res, 403, 'Permission denied');
            } else {
                return responseHTTP(res, 200, req.paramUserDB);
            }
        } catch (error) {
            return responseHTTP(res, 500, error.message);
        }
    },

    // POST /api/user/create
    create: async (req, res) => {
        try {
            const user = await User.create(req.body);
            return responseHTTP(res, 201, {
                username: user.username,
                email: user.email,
            });
        } catch (error) {
            return responseHTTP(res, 500, error.message);
        }
    },

    // PUT /api/user/password
    changePassword: async (req, res) => {
        try {
            isValidate = await req.authUserDB.validatePassword(req.body.old);
            if (!isValidate) {
                return responseHTTP(res, 401, 'Wrong password');
            }

            req.authUserDB.password = req.body.new;
            await req.authUserDB.save();
            return responseHTTP(
                res,
                204,
                `User ${req.authUserDB.username}'s password updated`,
            );
        } catch (error) {
            return responseHTTP(res, 500, error.message);
        }
    },

    // PUT /api/user/role
    setRole: async (req, res) => {
        try {
            if (req.authUserDB.role < req.body.role) {
                return responseHTTP(res, 403, 'Permission denied');
            }
            req.reqUserDB.role = req.body.role;
            await req.reqUserDB.save();
            return responseHTTP(
                res,
                204,
                `User ${req.reqUserDB.username}'s role updated`,
            );
        } catch (error) {
            return responseHTTP(res, 500, error.message);
        }
    },

    // PUT /api/user/award
    award: async (req, res) => {
        try {
            req.reqUserDB.achievements = {
                ...req.reqUserDB.achievements,
                ...req.body.data,
            };

            await req.reqUserDB.save();
            return responseHTTP(
                res,
                204,
                `Award user ${req.reqUserDB.username} successfully`,
            );
        } catch (error) {
            return responseHTTP(res, 500, error.message);
        }
    },

    // DELETE /api/user/:name
    delete: async (req, res) => {
        try {
            // only admin or user itself able to get user information
            if (
                req.authUserDB.username !== req.paramUserDB.username &&
                !isAdmin(req.authUserDB)
            ) {
                return responseHTTP(res, 403, 'Permission denied');
            }

            // remove all related data
            await LeagueData.deleteMany({ user_id: req.paramUserDB._id });
            for (let i = 0; i < req.paramUserDB.leagues.length; i++) {
                let leagueInfo = await LeagueInfo.findOne({
                    _id: req.paramUserDB.leagues[i],
                });
                let index = leagueInfo.users
                    .map((u) => u.user_id.toString())
                    .indexOf(req.paramUserDB._id.toString());
                if (index > -1) {
                    // only splice array when item is found
                    leagueInfo.users.splice(index, 1); // 2nd parameter means remove one item only
                }
                await leagueInfo.save();
            }
            await req.paramUserDB.remove();
            return responseHTTP(
                res,
                204,
                `Deleted user ${req.paramUserDB.username} succesfully`,
            );
        } catch (error) {
            return responseHTTP(res, 500, error.message);
        }
    },

    // resetPassword: async (req, res) => {
    //     try {
    //         const user = await User.findOne({ email: req.body.email});
    //         if (!user) {
    //             return responseHTTP(res, 404, `Your email ${req.body.email} isn't in our database`);
    //         }
    //         const token = randtoken.generate(20);
    //         const tokenDB = await ResetToken.findOne({username: user.username});
    //         if (!tokenDB) {
    //             await ResetToken.create({
    //                 token: token,
    //                 username: user.username
    //             });
    //         }
    //         else {
    //             tokenDB.token = token;
    //             await tokenDB.save();
    //         }
    //         emailSender.sendEmail(user.username, user.email, token)
    //         return responseHTTP(res, 200, `Please check your email`);
    //     } catch (error) {
    //         return responseHTTP(res, 500, error.message);
    //     }
    // },
};

module.exports = userController;
