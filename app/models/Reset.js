const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const resetSchema = new Schema(
    {
        token: {
            type: String,
            required: true,
        },
        username: {
            type: String,
            required: true
        }
    },
    {
        timestamps: true
    }
);

resetSchema.index({updatedAt: 1},{expireAfterSeconds: 1800})

module.exports = mongoose.model('ResetToken', resetSchema);