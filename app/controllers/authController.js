const User = require('../models/User');
const jwt = require('jsonwebtoken');

const authController = {
    login: async (req, res) => {
        const user = await User.findOne({ username: req.body.username });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: `User ${req.body.username} not found`,
            });
        }

        isValidate = await user.validatePassword(req.body.password);
        if (!isValidate) {
            return res.status(401).json({
                success: false,
                message: 'Wrong password',
            });
        }

        const accessToken = jwt.sign(user.username, process.env.JWT_SECRET);
        res.status(200).json({
            success: true,
            message: {
                accessToken,
            },
        });
    },
};

module.exports = authController;
