const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const dataSchema = new Schema(
    {
        reviews: {
            type: Number,
            required: true,
        },
        retention: {
            type: Number,
            required: true,
        },
        minutes: {
            type: Number,
            required: true,
        },
        xp: {
            type: Number,
            default: 0,
        },
    },
    {
        _id: false,
    },
);

const leagueDataSchema = new Schema(
    {
        league_id: {
            type: Schema.Types.ObjectId,
            required: true,
            ref: 'League',
        },
        user_id: {
            type: Schema.Types.ObjectId,
            required: true,
            ref: 'User',
        },
        study_days: {
            type: Number,
            required: true,
        },
        streak: {
            type: Number,
            required: true,
        },
        data: {
            type: [dataSchema],
            default: [],
        },
    },
    {
        timestamps: true,
    },
);

module.exports = mongoose.model('LeagueData', leagueDataSchema);
