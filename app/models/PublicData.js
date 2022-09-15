const mongoose = require('mongoose');
const { getTomorrow } = require('../helpers/calculate');
const Schema = mongoose.Schema;

const publicDataSchema = new Schema(
    {
        user_id: {
            type: Schema.Types.ObjectId,
            required: true,
            ref: 'User',
        },
        streak: {
            type: Number,
            required: true,
        },
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
        expireAt: {
            type: Date,
            default: getTomorrow(),
            expires: 1, // expire after 1 seconds
        },
    },
    {
        timestamps: true,
    },
);

module.exports = mongoose.model('PublicData', publicDataSchema);
