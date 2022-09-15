const jwt = require('jsonwebtoken');
const responseHTTP = require('../helpers/responseHTTP');

const authController = {
    login: async (req, res) => {
        try {
            isValidate = await req.reqUserDB.validatePassword(
                req.body.password,
            );
            if (!isValidate) {
                return responseHTTP(res, 401, 'Wrong password');
            }

            // const accessToken = jwt.sign(
            //     {username: req.body.username},
            //     process.env.JWT_SECRET,
            //     {expiresIn: process.env.JWT_EXPIRE}
            // );
            const accessToken = jwt.sign(
                { username: req.body.username },
                process.env.JWT_SECRET,
            );

            return responseHTTP(res, 200, { accessToken });
        } catch (error) {
            return responseHTTP(res, 200, error.message);
        }
    },
};

module.exports = authController;
