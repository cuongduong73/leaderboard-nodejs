const mongoose = require('mongoose');
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
    },
    {
        timestamps: true,
    },
);

publicDataSchema.index({ updatedAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 });
publicDataSchema.pre('save', async function (next) {
    if (
        !this.isModified('reviews') &&
        !this.isModified('retention') &&
        !this.isModified('minutes')
    )
        return next();
    this.xp = (this.retention * this.reviews) / 100 + 4 * this.minutes;
    next();
});

module.exports = mongoose.model('PublicData', publicDataSchema);
