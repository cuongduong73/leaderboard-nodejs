const User = require('../models/User');
const LeagueInfo = require('../models/LeagueInfo');
const LeagueData = require('../models/LeagueData');
const PublicData = require('../models/PublicData');
const responseHTTP = require('../helpers/responseHTTP');
const { calcXP } = require('../helpers/calculate');

async function add_user_to_league(userInfo, leagueInfo) {
    // add user to league data with default study value
    const leagueData = await LeagueData.create({
        league_id: leagueInfo._id,
        user_id: userInfo._id,
        streak: 0,
        study_days: 0,
    });

    for (let i = 0; i <= leagueInfo.duration; i++) {
        leagueData.data.push({
            reviews: 0,
            retention: 0,
            minutes: 0,
        });
    }
    leagueData.save();

    // add league to user info
    userInfo.leagues.push(leagueInfo._id);
    await userInfo.save();
}

const leagueController = {
    // GET /api/v1/league
    gets: async (req, res) => {
        try {
            const leagueInfo = await LeagueInfo.find()
                .populate('users.user_id', 'username -_id')
                .select('-__v -createdAt -updatedAt');
            return responseHTTP(res, 200, leagueInfo);
        } catch (error) {
            return responseHTTP(res, 500, error.message);
        }
    },

    // GET /api/v1/league/:id
    get: async (req, res) => {
        try {
            const leagueData = await LeagueData.find({
                league_id: req.params['id'],
            })
                .populate('user_id', 'username -_id')
                .select('-__v -createdAt -_id -league_id');
            if (!leagueData || leagueData.length === 0) {
                return responseHTTP(res, 404, `${req.params['id']} not found`);
            }

            leagueData.sort((a, b) => (a.data[0].xp < b.data[0].xp ? 1 : -1));
            return responseHTTP(res, 200, leagueData);
        } catch (error) {
            return responseHTTP(res, 500, error.message);
        }
    },

    // GET /api/v1/league/:id/detail?d=10&u=goctoi
    getDetail: async (req, res) => {
        try {
            let queryObj = { league_id: req.params['id'] };
            let user;

            // check user existence
            if ('u' in req.query) {
                user = await User.findOne({ username: req.query.u });
                if (!user) {
                    return responseHTTP(
                        res,
                        404,
                        `User ${req.query.u} not found`,
                    );
                }
                queryObj.user_id = user._id;
            }

            const leagueData = await LeagueData.find(queryObj)
                .populate('user_id', 'username -_id')
                .populate('league_id', 'name season')
                .select('-_id -__v -createdAt');

            console.log(leagueData);

            if (!leagueData || leagueData.length === 0) {
                return responseHTTP(res, 404, 'Resource not found');
            }

            let data = [];
            for (let i = 0; i < leagueData.length; i++) {
                let tmp = {
                    league_id: leagueData[i].league_id._id,
                    name: leagueData[i].league_id.name,
                    season: leagueData[i].league_id.season,
                    username: leagueData[i].user_id.username,
                };
                if ('d' in req.query) {
                    tmp.data = [leagueData[i].data[req.query.d]];
                } else {
                    tmp.data = leagueData[i].data;
                }
                data.push(tmp);
            }
            return responseHTTP(res, 200, data);
        } catch (error) {
            return responseHTTP(res, 500, error.message);
        }
    },

    // GET /api/v1/league/global
    getGlobal: async (req, res) => {
        try {
            const data = await PublicData.find()
                .populate('user_id', 'username -_id')
                .select('-_id -expireAt -createdAt -__v')
                .sort({ xp: 'desc' });
            return responseHTTP(res, 200, data);
        } catch (error) {
            return responseHTTP(res, 500, error.message);
        }
    },
    // POST /api/v1/league/create
    create: async (req, res) => {
        try {
            // check existence
            const isExist = await LeagueInfo.findOne({
                name: req.body.name,
                season: req.body.season,
            });
            if (isExist) {
                return responseHTTP(
                    res,
                    409,
                    `${req.body.name} - season ${req.body.season} has already existed`,
                );
            }

            const leagueInfo = await LeagueInfo.create({
                name: req.body.name,
                season: req.body.season,
                start: new Date(req.body.start * 1000),
                duration: req.body.duration,
                constraint: req.body.constraint,
                users: [
                    {
                        user_id: req.authUserDB._id,
                        status: 2,
                    },
                ],
            });

            await add_user_to_league(req.authUserDB, leagueInfo);
            return responseHTTP(res, 201, leagueInfo);
        } catch (error) {
            return responseHTTP(res, 500, error.message);
        }
    },

    // PUT /api/v1/league/:id/update
    update: async (req, res) => {
        try {
            req.body.start = new Date(req.body.start * 1000);
            await req.leagueInfo.updateOne(req.body);
            return responseHTTP(
                res,
                204,
                `Update challenge ${req.leagueInfo.name} - season ${req.leagueInfo.season} successfully`,
            );
        } catch (error) {
            return responseHTTP(res, 500, error.message);
        }
    },

    // DELETE /api/v1/league/:id
    delete: async (req, res) => {
        try {
            // remove all related data
            await LeagueData.deleteMany({ league_id: req.leagueInfo._id });
            for (let i = 0; i < req.leagueInfo.users.length; i++) {
                let user = await User.findById(req.leagueInfo.users[i].user_id);
                let index = user.leagues.indexOf(req.leagueInfo._id);
                if (index > -1) {
                    // only splice array when item is found
                    user.leagues.splice(index, 1); // 2nd parameter means remove one item only
                }
                await user.save();
            }
            await req.leagueInfo.remove();
            return responseHTTP(
                res,
                204,
                `Delete challenge ${req.leagueInfo.name} - season ${req.leagueInfo.season} successfully`,
            );
        } catch (error) {
            return responseHTTP(res, 500, error.message);
        }
    },

    // POST /api/v1/league/user/join
    join: async (req, res) => {
        try {
            const leagueUser = req.leagueInfo.users.find(
                (u) => u.user_id.toString() === req.authUserDB._id.toString(),
            );
            if (leagueUser) {
                return responseHTTP(
                    res,
                    409,
                    `User ${req.authUserDB.username} has submitted to join ${req.leagueInfo.name} - season ${req.leagueInfo.season}`,
                );
            }
            req.leagueInfo.users.push({ user_id: req.authUserDB._id });
            await req.leagueInfo.save();
            return responseHTTP(
                res,
                204,
                `Submited to join ${req.leagueInfo.name} - season ${req.leagueInfo.season}`,
            );
        } catch (error) {
            return responseHTTP(res, 500, error.message);
        }
    },

    // POST /api/v1/league/user/accept
    acceptUser: async (req, res) => {
        try {
            const leagueUser = req.leagueInfo.users.find(
                (u) => u.user_id.toString() === req.reqUserDB._id.toString(),
            );
            if (leagueUser && leagueUser.status > 0) {
                return responseHTTP(
                    res,
                    409,
                    `User ${req.reqUserDB.username} has joined ${req.leagueInfo.name} - season ${req.leagueInfo.season}`,
                );
            }

            // save
            if (!leagueUser) {
                req.leagueInfo.users.push({
                    user_id: req.reqUserDB._id,
                    status: 1,
                });
            } else {
                leagueUser.status = 1;
            }
            await req.leagueInfo.save();

            await add_user_to_league(req.reqUserDB, req.leagueInfo);

            return responseHTTP(
                res,
                204,
                `Accepted user ${req.reqUserDB.username} to join ${req.leagueInfo.name} - season ${req.leagueInfo.season}`,
            );
        } catch (error) {
            return responseHTTP(res, 500, error.message);
        }
    },

    // POST /api/v1/league/user/remove
    removeUser: async (req, res) => {
        try {
            const leagueUser = req.leagueInfo.users.find(
                (u) => u.user_id.toString() === req.reqUserDB._id.toString(),
            );
            if (!leagueUser) {
                return responseHTTP(
                    res,
                    404,
                    `User ${req.body.username} hasn't joined ${req.leagueInfo.name} - season ${req.leagueInfo.season} yet`,
                );
            }

            let index = req.leagueInfo.users
                .map((u) => u.user_id.toString())
                .indexOf(req.reqUserDB._id.toString());
            if (index > -1) {
                // only splice array when item is found
                req.leagueInfo.users.splice(index, 1); // 2nd parameter means remove one item only
            }
            await req.leagueInfo.save();

            index = req.reqUserDB.leagues.indexOf(req.leagueInfo._id);
            if (index > -1) {
                // only splice array when item is found
                req.reqUserDB.leagues.splice(index, 1); // 2nd parameter means remove one item only
            }
            await req.reqUserDB.save();

            // remove all related data
            await LeagueData.deleteMany({
                league_id: req.leagueInfo._id,
                user_id: req.reqUserDB._id,
            });

            return responseHTTP(
                res,
                204,
                `Removed user ${req.reqUserDB.username} from ${req.leagueInfo.name} - season ${req.leagueInfo.season}`,
            );
        } catch (error) {
            return responseHTTP(res, 500, error.message);
        }
    },

    // POST /api/v1/league/sync/global
    syncGlobal: async (req, res) => {
        try {
            let userData = await PublicData.findOne({
                user_id: req.authUserDB._id,
            });
            const xp = calcXP(
                req.body.reviews,
                req.body.retention,
                req.body.minutes,
            );
            if (!userData) {
                await PublicData.create({
                    user_id: req.authUserDB._id,
                    streak: req.body.streak,
                    reviews: req.body.reviews,
                    retention: req.body.retention,
                    minutes: req.body.minutes,
                    xp: xp,
                });
            } else {
                userData.streak = req.body.streak;
                userData.reviews = req.body.reviews;
                userData.retention = req.body.retention;
                userData.minutes = req.body.minutes;
                userData.xp = xp;
                await userData.save();
            }
            return responseHTTP(res, 204, 'Sync global successfully !');
        } catch (error) {
            return responseHTTP(res, 500, error.message);
        }
    },

    // POST /api/v1/league/sync/private
    syncLeague: async (req, res) => {
        try {
            const leagueUser = req.leagueInfo.users.find(
                (u) => u.user_id.toString() === req.authUserDB._id.toString(),
            );
            if (!leagueUser || leagueUser.status === 0) {
                return responseHTTP(
                    res,
                    403,
                    `User ${req.authUserDB.username} hasn't joined ${req.leagueInfo.name} - seasson ${req.leagueInfo.season}`,
                );
            }

            // check date
            const startDate = req.leagueInfo.start;
            const today = Math.ceil(
                (Date.now() - startDate) / (1000 * 60 * 60 * 24),
            );
            if (today <= 0) {
                return responseHTTP(
                    res,
                    406,
                    `${req.leagueInfo.name} - seasson ${req.leagueInfo.season} hasn't started`,
                );
            }

            if (today > req.leagueInfo.duration) {
                return responseHTTP(
                    res,
                    406,
                    `${req.leagueInfo.name} - seasson ${req.leagueInfo.season} ended`,
                );
            }

            const leagueData = await LeagueData.findOne({
                league_id: req.leagueInfo._id,
                user_id: req.authUserDB._id,
            });

            leagueData.study_days = req.body.study_days;
            leagueData.streak = req.body.streak;
            leagueData.data[0].reviews = req.body.reviews;
            leagueData.data[0].retention = req.body.retention;
            leagueData.data[0].minutes = req.body.minutes;
            leagueData.data[0].xp = calcXP(
                leagueData.data[0].reviews,
                leagueData.data[0].retention,
                leagueData.data[0].minutes,
            );

            for (let i = 0; i < req.body.details.length; i++) {
                let index = req.body.details[i].day;
                leagueData.data[index].reviews = req.body.details[i].reviews;
                leagueData.data[index].retention =
                    req.body.details[i].retention;
                leagueData.data[index].minutes = req.body.details[i].minutes;
                leagueData.data[index].xp = calcXP(
                    leagueData.data[index].reviews,
                    leagueData.data[index].retention,
                    leagueData.data[index].minutes,
                );
            }

            await leagueData.save();
            return responseHTTP(
                res,
                204,
                `Sync ${req.leagueInfo.name} - seasson ${req.leagueInfo.season} successfully !`,
            );
        } catch (error) {
            return responseHTTP(res, 500, error.message);
        }
    },
    // syncAdmin: async (req, res) => {
    //     try {
    //         const leagueUser = req.leagueInfo.users.find(
    //             (u) => u.user_id.toString() === req.reqUserDB._id.toString(),
    //         );
    //         if (!leagueUser || leagueUser.status === 0) {
    //             return responseHTTP(res, 403, `User ${req.reqUserDB.username} hasn't joined ${req.leagueInfo.name} - seasson ${req.leagueInfo.season}`);
    //         }

    //         // check date
    //         const startDate = req.leagueInfo.start;
    //         const today = Math.ceil(
    //             (Date.now() - startDate) / (1000 * 60 * 60 * 24),
    //         );
    //         if (today <= 0) {
    //             return responseHTTP(res, 406, `${req.leagueInfo.name} - seasson ${req.leagueInfo.season} hasn't started`);
    //         }

    //         if (today > req.leagueInfo.duration) {
    //             return responseHTTP(res, 406, `${req.leagueInfo.name} - seasson ${req.leagueInfo.season} ended`);
    //         }

    //         const leagueData = await LeagueData.findOne({
    //             league_id: req.leagueInfo._id,
    //             user_id: req.reqUserDB._id,
    //         });

    //         leagueData.study_days = req.body.study_days;
    //         leagueData.streak = req.body.streak;
    //         leagueData.data[0].reviews = req.body.reviews;
    //         leagueData.data[0].retention = req.body.retention;
    //         leagueData.data[0].minutes = req.body.minutes;
    //         leagueData.data[0].xp = calcXP(leagueData.data[0].reviews, leagueData.data[0].retention, leagueData.data[0].minutes);

    //         for (let i = 0; i < req.body.details.length; i++) {
    //             let index = req.body.details[i].day;
    //             leagueData.data[index].reviews = req.body.details[i].reviews;
    //             leagueData.data[index].retention = req.body.details[i].retention;
    //             leagueData.data[index].minutes = req.body.details[i].minutes;
    //             leagueData.data[index].xp = calcXP(leagueData.data[index].reviews, leagueData.data[index].retention, leagueData.data[index].minutes);
    //         }

    //         await leagueData.save();
    //         return responseHTTP(res, 204, `Sync ${req.leagueInfo.name} - seasson ${req.leagueInfo.season} successfully !`);
    //     } catch (error) {
    //         return responseHTTP(res, 500, error.message);
    //     }
    // },
};

module.exports = leagueController;
