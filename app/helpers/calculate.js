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

function calcXP(reviews, retention, minutes, study_day, curr_day) {
    let xp = 0;
    xp = (retention * reviews) / 100 + 4 * minutes;
    if (curr_day !== undefined) {
        xp = xp * study_day / curr_day;
    }
    return Math.round((xp + Number.EPSILON) * 100) / 100;
}

module.exports = { addDays, getTomorrow, calcXP };
