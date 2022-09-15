jwt = require('jsonwebtoken');
const responseHTTP = require('../helpers/responseHTTP');

function authorizeToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const accessToken = authHeader && authHeader.split(' ')[1];
    if (accessToken == null)
        return responseHTTP(res, 401, 'You need to login first');

    jwt.verify(accessToken, process.env.JWT_SECRET, (error, data) => {
        if (error) return responseHTTP(res, 403, error.message);
        req.authUser = data.username;
        next();
    });
}

module.exports = authorizeToken;
