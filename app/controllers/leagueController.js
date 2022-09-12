const User = require('../models/User');
const LeagueInfo = require('../models/LeagueInfo');
const LeagueData = require('../models/LeagueData');
const LeagueDataDetail = require('../models/LeagueDataDetail');
const PublicData = require('../models/PublicData');

const leagueController = {
    // GET /api/v1/league
    gets: async (req, res) => {
        try {
            // TODO: if have params, query based on params
            const leagueInfo = await LeagueInfo.find()
                .populate('users.user_id', 'username -_id')
                .select('-__v -createdAt -updatedAt');
            res.status(200).send(leagueInfo);
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message,
            });
        }
    },

    // GET /api/v1/league/:id
    get: async (req, res) => {
        try {
            const leagueData = await LeagueData.find({
                league_id: req.params['id'],
            })
                .populate('user_id', 'username -_id')
                .sort({ xp: 'desc' });
            if (!leagueData) {
                res.status(404).json({
                    success: false,
                    message: `${req.params['id']} not found`,
                });
            }
            res.status(200).send(leagueData);
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message,
            });
        }
    },

    // GET /api/v1/league/:id/detail
    getDetail: async (req, res) => {
        try {
            let queryObj = {};
            if ('d' in req.query && 'u' in req.query) {
                const user = await User.findOne({ username: req.query.u });
                if (!user) {
                    return res.status(404).json({
                        success: false,
                        message: `User ${req.query.u} not found`,
                    });
                }
                queryObj = {
                    league_id: req.params['id'],
                    day: req.query.d,
                    user_id: user._id,
                };
            } else if ('d' in req.query) {
                queryObj = {
                    league_id: req.params['id'],
                    day: req.query.d,
                };
            } else if ('u' in req.query) {
                const user = await User.findOne({ username: req.query.u });
                if (!user) {
                    return res.status(404).json({
                        success: false,
                        message: `User ${req.query.u} not found`,
                    });
                }
                queryObj = {
                    league_id: req.params['id'],
                    user_id: user._id,
                };
            } else {
                queryObj = {
                    league_id: req.params['id'],
                };
            }
            const leagueDetail = await LeagueDataDetail.find(queryObj)
                .populate('user_id', 'username -_id')
                .select('-_id -__v -createdAt');

            if (!leagueDetail) {
                res.status(404).json({
                    success: false,
                    message: `Resource not found`,
                });
            }
            res.status(200).send(leagueDetail);
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message,
            });
        }
    },

    // GET /api/v1/league/global
    getGlobal: async (req, res) => {
        try {
            const data = await PublicData.find()
                .populate('user_id', 'username -_id')
                .sort({ xp: 'desc' });
            res.status(200).send(data);
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message,
            });
        }
    },
    // POST /api/v1/league/create
    create: async (req, res) => {
        try {
            // check permission
            const user = await User.findOne({ username: req.user });
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: `User ${req.user} not found`,
                });
            }
            if (
                user.role.level === 'MEMBER' ||
                (user.role.level === 'CONTRIBUTOR' &&
                    user.role.expired &&
                    user.role.expired <= Date.now())
            ) {
                return res.status(403).json({
                    success: false,
                    message: `User ${req.user} permission denied`,
                });
            }

            // check existence
            const isExist = await LeagueInfo.findOne({
                name: req.body.name,
                season: req.body.season,
            });
            if (isExist) {
                return res.status(409).json({
                    success: false,
                    message: `${req.body.name} - season ${req.body.season} has already existed`,
                });
            }

            const leagueInfo = await LeagueInfo.create({
                name: req.body.name,
                season: req.body.season,
                start: Date(req.body.start * 1000),
                duration: req.body.duration,
                constraint: req.body.constraint,
                users: [
                    {
                        user_id: user._id,
                        role: 'CREATOR',
                    },
                ],
            });

            // add user to league data with default study value
            await LeagueData.create({
                league_id: leagueInfo._id,
                user_id: user._id,
                streak: 0,
                reviews: 0,
                retention: 0,
                minutes: 0,
                study_days: 0,
            });

            for (let i = 0; i < req.body.duration; i++) {
                await LeagueDataDetail.create({
                    league_id: leagueInfo._id,
                    user_id: user._id,
                    day: i + 1,
                    reviews: 0,
                    retention: 0,
                    minutes: 0,
                });
            }

            // add league to user info
            user.leagues.push(leagueInfo._id);
            await user.save();

            res.status(201).json({
                success: true,
                leagueInfo,
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message,
            });
        }
    },

    // PUT /api/v1/league/:id/update
    update: async (req, res) => {
        try {
            const user = await User.findOne({ username: req.user });
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: `Request user ${req.user} not found`,
                });
            }
            const leagueInfo = await LeagueInfo.findOne({
                _id: req.params['id'],
            });
            if (!leagueInfo) {
                return res.status(404).json({
                    success: false,
                    message: `ID ${req.params['id']} not found`,
                });
            }
            const reqLeagueUser = leagueInfo.users.find(
                (u) => u.user_id.toString() === user._id.toString(),
            );
            if (
                !reqLeagueUser ||
                ['SUBMITTED', 'JOINED'].includes(reqLeagueUser.role)
            ) {
                return res.status(403).json({
                    success: false,
                    message: `Permission denied`,
                });
            }
            await leagueInfo.update(req.body);
            res.sendStatus(204);
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message,
            });
        }
    },

    // DELETE /api/v1/league/:id
    delete: async (req, res) => {
        try {
            // check permission
            const user = await User.findOne({ username: req.user });
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: `User ${req.user} not found`,
                });
            }

            const leagueInfo = await LeagueInfo.findOne({
                _id: req.params['id'],
            });
            if (!leagueInfo) {
                return res.status(404).json({
                    success: false,
                    message: `${req.params['id']} not found`,
                });
            }
            const leagueUser = leagueInfo.users.find(
                (u) => u.user_id === user._id,
            );
            if (
                !['MODERATOR', 'ADMIN'].includes(user.role.level) &&
                !['MODERATOR', 'CREATOR'].includes(leagueUser.role)
            ) {
                return res.status(403).json({
                    success: false,
                    message: `User ${req.user} permission denied`,
                });
            }

            // remove all related data
            await LeagueData.deleteMany({ league_id: leagueInfo._id });
            await LeagueDataDetail.deleteMany({ league_id: leagueInfo._id });
            for (let i = 0; i < leagueInfo.users.length; i++) {
                let user = await User.findOne({
                    _id: leagueInfo.users[i].user_id,
                });
                let index = user.leagues.indexOf(leagueInfo._id);
                if (index > -1) {
                    // only splice array when item is found
                    user.leagues.splice(index, 1); // 2nd parameter means remove one item only
                }
                await user.save();
            }
            await leagueInfo.remove();
            res.sendStatus(204);
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message,
            });
        }
    },

    // POST /api/v1/league/user/join
    join: async (req, res) => {
        try {
            const user = await User.findOne({ username: req.user });
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: `User ${req.user} not found`,
                });
            }
            const leagueInfo = await LeagueInfo.findOne({ _id: req.body.id });
            if (!leagueInfo) {
                return res.status(404).json({
                    success: false,
                    message: `ID ${req.body.id} not found`,
                });
            }
            const leagueUser = leagueInfo.users.find(
                (u) => u.user_id === reqUser._id,
            );
            if (leagueUser) {
                return res.status(404).json({
                    success: false,
                    message: `User ${req.user} has submitted to join ${leagueInfo.name} - season ${leagueInfo.season}`,
                });
            }
            leagueInfo.users.push({ user_id: user._id });
            await leagueInfo.save();
            res.sendStatus(204);
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message,
            });
        }
    },

    // POST /api/v1/league/user/accept
    acceptUser: async (req, res) => {
        try {
            const reqUser = await User.findOne({ username: req.user });
            if (!reqUser) {
                return res.status(404).json({
                    success: false,
                    message: `Request user ${req.user} not found`,
                });
            }
            const leagueInfo = await LeagueInfo.findOne({ _id: req.body.id });
            if (!leagueInfo) {
                return res.status(404).json({
                    success: false,
                    message: `ID ${req.body.id} not found`,
                });
            }
            const reqLeagueUser = leagueInfo.users.find(
                (u) => u.user_id === reqUser._id,
            );
            if (
                !reqLeagueUser ||
                ['SUBMITTED', 'JOINED'].includes(reqLeagueUser.role)
            ) {
                return res.status(403).json({
                    success: false,
                    message: `Permission denied`,
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
            const targetLeagueUser = leagueInfo.users.find(
                (u) => u.user_id.toString() === targetUser._id.toString(),
            );
            if (
                targetLeagueUser &&
                ['JOINED', 'MODERATOR', 'CREATOR'].includes(
                    targetLeagueUser.role,
                )
            ) {
                return res.status(409).json({
                    success: false,
                    message: `User ${req.body.username} has joined ${leagueInfo.name} - season ${leagueInfo.season}`,
                });
            }
            if (!targetLeagueUser) {
                leagueInfo.users.push({
                    user_id: targetUser._id,
                    role: 'JOINED',
                });
            } else {
                targetLeagueUser.role = 'JOINED';
            }
            await leagueInfo.save();

            // add user to league data with default study value
            await LeagueData.create({
                league_id: leagueInfo._id,
                user_id: targetUser._id,
                streak: 0,
                reviews: 0,
                retention: 0,
                minutes: 0,
                study_days: 0,
            });

            for (let i = 0; i < leagueInfo.duration; i++) {
                await LeagueDataDetail.create({
                    league_id: leagueInfo._id,
                    user_id: targetUser._id,
                    day: i + 1,
                    reviews: 0,
                    retention: 0,
                    minutes: 0,
                });
            }

            // add league to user info
            targetUser.leagues.push(leagueInfo._id);
            await targetUser.save();
            res.sendStatus(204);
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message,
            });
        }
    },

    // POST /api/v1/league/user/remove
    removeUser: async (req, res) => {
        try {
            const reqUser = await User.findOne({ username: req.user });
            if (!reqUser) {
                return res.status(404).json({
                    success: false,
                    message: `Request user ${req.user} not found`,
                });
            }
            const leagueInfo = await LeagueInfo.findOne({ _id: req.body.id });
            if (!leagueInfo) {
                return res.status(404).json({
                    success: false,
                    message: `ID ${req.body.id} not found`,
                });
            }
            const reqLeagueUser = leagueInfo.users.find(
                (u) => u.user_id === reqUser._id,
            );
            if (
                !reqLeagueUser ||
                ['SUBMITTED', 'JOINED'].includes(reqLeagueUser.role)
            ) {
                return res.status(403).json({
                    success: false,
                    message: `Permission denied`,
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
            const targetLeagueUser = leagueInfo.users.find(
                (u) => u.user_id === targetUser._id,
            );
            if (!targetLeagueUser) {
                return res.status(404).json({
                    success: false,
                    message: `Target user ${req.body.username} hasn't joined ${leagueInfo.name} - season ${leagueInfo.season}`,
                });
            }

            let index = leagueInfo.users
                .map((u) => u.user_id.toString())
                .indexOf(targetUser._id);
            if (index > -1) {
                // only splice array when item is found
                leagueInfo.users.splice(index, 1); // 2nd parameter means remove one item only
            }
            await leagueInfo.save();

            index = targetUser.leagues.indexOf(leagueInfo._id);
            if (index > -1) {
                // only splice array when item is found
                targetUser.leagues.splice(index, 1); // 2nd parameter means remove one item only
            }
            await targetUser.save();

            // remove all related data
            await LeagueData.deleteMany({
                league_id: leagueInfo._id,
                user_id: targetUser._id,
            });
            await LeagueDataDetail.deleteMany({
                league_id: leagueInfo._id,
                user_id: targetUser._id,
            });

            res.sendStatus(204);
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message,
            });
        }
    },

    // POST /api/v1/league/sync/global
    syncGlobal: async (req, res) => {
        try {
            const user = await User.findOne({ username: req.user });
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: `User ${req.user} not found`,
                });
            }

            let userData = await PublicData.findOne({ user_id: user._id });
            if (!userData) {
                await PublicData.create({
                    user_id: user._id,
                    streak: req.body.streak,
                    reviews: req.body.reviews,
                    retention: req.body.retention,
                    minutes: req.body.minutes,
                });
            } else {
                userData.streak = req.body.streak;
                userData.reviews = req.body.reviews;
                userData.retention = req.body.retention;
                userData.minutes = req.body.minutes;
                await userData.save();
            }
            res.sendStatus(204);
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message,
            });
        }
    },

    // POST /api/v1/league/sync/private
    syncLeague: async (req, res) => {
        try {
            // check permission
            const user = await User.findOne({ username: req.user });
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: `User ${req.user} not found`,
                });
            }

            const leagueInfo = await LeagueInfo.findOne({ _id: req.body.id });
            if (!leagueInfo) {
                return res.status(404).json({
                    success: false,
                    message: `${req.body.id} not found`,
                });
            }

            leagueUser = leagueInfo.users.find(
                (u) => u.user_id.toString() === user._id.toString(),
            );
            if (!leagueUser || leagueUser.role === 'SUBMITTED') {
                return res.status(403).json({
                    success: false,
                    message: `User ${req.user} hasn't joined ${leagueInfo.name} - seasson ${leagueInfo.season}`,
                });
            }

            // check date
            const startDate = leagueInfo.start;
            const today = Math.ceil(
                (Date.now() - startDate) / (1000 * 60 * 60 * 24),
            );
            if (today <= 0) {
                return res.status(406).json({
                    success: false,
                    message: `${leagueInfo.name} - seasson ${leagueInfo.season} hasn't started`,
                });
            }

            if (today > leagueInfo.duration) {
                return res.status(406).json({
                    success: false,
                    message: `${leagueInfo.name} - seasson ${leagueInfo.season} ended`,
                });
            }

            const leagueData = await LeagueData.findOne({
                league_id: leagueInfo._id,
                user_id: user._id,
            });

            leagueData.study_days = req.body.study_days;
            leagueData.streak = req.body.streak;
            leagueData.reviews = req.body.reviews;
            leagueData.retention = req.body.retention;
            leagueData.minutes = req.body.minutes;

            await leagueData.save();

            for (let i = 0; i < req.body.details.length; i++) {
                let leagueDataDetail = await LeagueDataDetail.findOne({
                    league_id: leagueInfo._id,
                    user_id: user._id,
                    day: req.body.details[i].day,
                });
                leagueDataDetail.reviews = req.body.details[i].reviews;
                leagueDataDetail.retention = req.body.details[i].retention;
                leagueDataDetail.minutes = req.body.details[i].minutes;
                await leagueDataDetail.save();
            }
            res.sendStatus(204);
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message,
            });
        }
    },
};

module.exports = leagueController;
