function addDays(date, days) {
    var result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
}

function compareRole(reqRole, targetRole) {
    const roleMap = {
        MEMBER: 0,
        CONTRIBUTOR: 1,
        MODERATOR: 2,
        ADMIN: 3,
    };
    return roleMap[reqRole] > roleMap[targetRole];
}

module.exports = { addDays, compareRole };
