jwt = require('jsonwebtoken');

function authorizeToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const accessToken = authHeader && authHeader.split(' ')[1];
    if (accessToken == null) return res.sendStatus(401);

    jwt.verify(accessToken, process.env.JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
}

module.exports = authorizeToken;
