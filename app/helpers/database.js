const mongoose = require('mongoose');

async function connect(databaseUrl) {
    try {
        await mongoose.connect(databaseUrl, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('Connected to database ' + databaseUrl);
    } catch (error) {
        console.error('Error connecting to database', error);
    }
}

module.exports = { connect };
