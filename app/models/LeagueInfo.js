const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const User = require('./User');
const LeagueData = require('./LeagueData');

const userSchema = new Schema(
    {
        user_id: {
            type: Schema.Types.ObjectId,
            ref: 'User',
        },
        status: {
            type: Number,
            enum: [0, 1, 2], // submitted, joined, creator
            default: 0, // submitted
        },
    },
    {
        _id: false,
    },
);

const leagueInfoSchema = new Schema(
    {
        name: {
            type: String,
            required: true,
        },
        season: {
            type: Number,
            required: true,
        },
        start: {
            type: Date,
            required: true,
        },
        duration: {
            type: Number,
            required: true,
        },
        constraint: {
            type: Number,
            required: true,
        },
        users: [userSchema],
    },
    {
        timestamps: true,
    },
);

leagueInfoSchema.pre('remove', async function (next) {
    try {
        await LeagueData.deleteMany({ league_id: this._id });
        for (let i = 0; i < this.users.length; i++) {
            let user = await User.findOne({ _id: this.users[i].user_id });
            index = user.leagues.indexOf(this._id);
            if (index > -1) {
                // only splice array when item is found
                user.leagues.splice(index, 1); // 2nd parameter means remove one item only
            }
            await user.save();
        }
        next();
    } catch (error) {
        next(error);
    }
});

module.exports = mongoose.model('League', leagueInfoSchema);
