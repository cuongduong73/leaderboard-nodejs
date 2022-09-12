const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const leagueDataDetailSchema = new Schema(
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
        day: {
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
        },
    },
    {
        timestamps: true,
    },
);

// calculate xp before save to database
leagueDataDetailSchema.pre('save', async function (next) {
    if (
        !this.isModified('reviews') &&
        !this.isModified('retention') &&
        !this.isModified('minutes')
    )
        return next();
    this.xp = (this.retention * this.reviews) / 100 + 4 * this.minutes;
    next();
});
module.exports = mongoose.model('LeagueDataDetail', leagueDataDetailSchema);
