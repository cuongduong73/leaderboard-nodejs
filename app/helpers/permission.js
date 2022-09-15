function isAdmin(userInfo) {
    return userInfo.role === 2;
}

function isMod(userInfo) {
    return userInfo.role >= 1;
}

module.exports = {
    isAdmin,
    isMod,
};
