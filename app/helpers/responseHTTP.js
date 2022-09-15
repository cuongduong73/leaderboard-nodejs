const { HTTP_STATUS } = require('./constants');

function responseHTTP(res, code, data) {
    let success = false;
    if (code >= 200 && code < 300) success = true;

    return res.status(code).json({
        success,
        message: HTTP_STATUS[code],
        data,
    });
}

module.exports = responseHTTP;
