const User = require('../models/User');
const LeagueData = require('../models/LeagueData');
const LeagueDataDetail = require('../models/LeagueDataDetail');
const LeagueInfo = require('../models/LeagueInfo');
const { compareRole, addDays } = require('../helpers/calculate');

const userController = {
    // GET /api/user
    gets: async (req, res) => {
        try {
            const users = await User.find()
                .populate(
                    'leagues',
                    '-start -duration -constraint -users -createdAt -updatedAt -__v',
                )
                .select('-password -createdAt -updatedAt -_id -__v');
            res.status(200).send(users);
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message,
            });
        }
    },

    // GET /api/user/:name
    get: async (req, res) => {
        try {
            const user = await User.findOne(
                { username: req.params['name'] },
                { password: 0 },
            )
                .populate(
                    'leagues',
                    '-start -duration -constraint -users -createdAt -updatedAt -__v',
                )
                .select('-createdAt -updatedAt -_id -__v');
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: `User ${req.params['name']} not found`,
                });
            }
            res.status(200).send(user);
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message,
            });
        }
    },

    // POST /api/user/create
    create: async (req, res) => {
        try {
            const user = await User.create(req.body);
            res.status(201).json({
                success: true,
                message: {
                    username: user.username,
                    email: user.email,
                },
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message,
            });
        }
    },

    // PUT /api/user/update
    changePassword: async (req, res) => {
        try {
            const user = await User.findOne({ username: req.user });
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: `User ${req.user} not found`,
                });
            }
            isValidate = await user.validatePassword(req.body.old);
            if (!isValidate) {
                return res.status(401).json({
                    success: false,
                    message: 'Wrong password',
                });
            }

            user.password = req.body.new;
            await user.save();
            res.sendStatus(204);
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message,
            });
        }
    },

    // PUT /api/user/role
    setRole: async (req, res) => {
        try {
            const reqUser = await User.findOne({ username: req.user });
            if (!reqUser) {
                return res.status(404).json({
                    success: false,
                    message: `Request user ${req.user} not found`,
                });
            }

            const targetUser = await User.findOne({
                username: req.body.username,
            });
            if (!targetUser) {
                return res.status(404).json({
                    success: false,
                    message: `Target user ${req.body.username} not found`,
                });
            }

            if (
                !compareRole(reqUser.role.level, targetUser.role.level) ||
                !compareRole(reqUser.role.level, req.body.role)
            ) {
                return res.status(403).json({
                    success: false,
                    message: `Permission denied`,
                });
            }

            targetUser.role.level = req.body.role;
            if (req.body.role === 'CONTRIBUTOR') {
                targetUser.role.expired = addDays(
                    Date.now(),
                    req.body.duration,
                );
            }
            await targetUser.save();
            res.sendStatus(204);
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message,
            });
        }
    },

    // PUT /api/user/award
    award: async (req, res) => {
        try {
            const reqUser = await User.findOne({ username: req.user });
            if (!reqUser) {
                return res.status(404).json({
                    success: false,
                    message: `Request user ${req.user} not found`,
                });
            }

            const targetUser = await User.findOne({
                username: req.body.username,
            });
            if (!targetUser) {
                return res.status(404).json({
                    success: false,
                    message: `Target user ${req.body.username} not found`,
                });
            }

            if (!compareRole(reqUser.role.level, 'CONTRIBUTOR')) {
                return res.status(403).json({
                    success: false,
                    message: `Permission denied`,
                });
            }

            targetUser.achievements = {
                ...targetUser.achievements,
                ...req.body.data,
            };

            await targetUser.save();
            res.sendStatus(204);
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message,
            });
        }
    },

    // DELETE /api/user/:name
    delete: async (req, res) => {
        try {
            const user = await User.findOne({ username: req.params['name'] });
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: `User ${req.params['name']} not found`,
                });
            }
            if (req.user !== req.params['name']) {
                const reqUser = await User.findOne({ username: req.user });
                if (!reqUser) {
                    return res.status(404).json({
                        success: false,
                        message: `Request user ${req.user} not found`,
                    });
                }
                if (reqUser.role.level !== 'ADMIN') {
                    return res.status(403).json({
                        success: false,
                        message: `Request user ${req.user} permission denied`,
                    });
                }
            }

            // remove all related data
            await LeagueData.deleteMany({ user_id: user._id });
            await LeagueDataDetail.deleteMany({ user_id: user._id });
            for (let i = 0; i < user.leagues.length; i++) {
                let leagueInfo = await LeagueInfo.findOne({
                    _id: user.leagues[i],
                });
                let index = leagueInfo.users
                    .map((u) => u.user_id.toString())
                    .indexOf(user._id.toString());
                if (index > -1) {
                    // only splice array when item is found
                    console.log(`Deleted ${user.leagues[i]}`);
                    leagueInfo.users.splice(index, 1); // 2nd parameter means remove one item only
                }
                await leagueInfo.save();
            }
            await user.remove();
            res.sendStatus(204);
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message,
            });
        }
    },
};

module.exports = userController;
