const mongoose = require('mongoose');
const { isEmail } = require('validator');
const bcrypt = require('bcrypt');
// const LeagueInfo = require('./LeagueInfo');
const Schema = mongoose.Schema;

const userSchema = new Schema(
    {
        username: {
            type: String,
            unique: true,
            required: true,
            match: [
                /^(?=[a-zA-Z0-9_]{5,20}$)(?!.*[_.]{2})[^_.].*[^_.]$/,
                'Username must be [5-20] characters and does not contain special characters',
            ],
        },
        email: {
            type: String,
            unique: true,
            required: true,
            validate: [isEmail, 'Please fill a valid email address'],
        },
        password: {
            type: String,
            required: true,
        },
        role: {
            expired: {
                type: Date,
                default: null,
            },
            level: {
                type: String,
                enum: ['MEMBER', 'CONTRIBUTOR', 'MODERATOR', 'ADMIN'],
                default: 'MEMBER',
            },
        },
        leagues: {
            type: [
                {
                    type: Schema.Types.ObjectId,
                    ref: 'League',
                },
            ],
            default: [],
        },
        achievements: {
            gold: {
                type: Number,
                default: 0,
            },
            silver: {
                type: Number,
                default: 0,
            },
            bronze: {
                type: Number,
                default: 0,
            },
        },
        images: {
            type: String,
            default: '',
        },
    },
    {
        timestamps: true,
    },
);

// Hash password before save to database
userSchema.pre('save', async function save(next) {
    if (!this.isModified('password')) return next();
    try {
        const salt = await bcrypt.genSalt();
        this.password = await bcrypt.hash(this.password, salt);
        return next();
    } catch (error) {
        return next(error);
    }
});

// Check passwords are matched
userSchema.methods.validatePassword = async function validatePassword(
    password,
) {
    return bcrypt.compare(password, this.password);
};

module.exports = mongoose.model('User', userSchema);
