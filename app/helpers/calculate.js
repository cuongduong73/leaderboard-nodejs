function addDays(date, days) {
    var result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
}

function getTomorrow() {
    let tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    return tomorrow;
}

function calcXP(reviews, retention, minutes) {
    let xp = (retention * reviews) / 100 + 4 * minutes;
    return Math.round((xp + Number.EPSILON) * 100) / 100;
}

module.exports = { addDays, getTomorrow, calcXP };
