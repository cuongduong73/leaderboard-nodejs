const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
require('dotenv').config();

const db = require('./app/helpers/database');
const userRoute = require('./app/routes/user');
const authRoute = require('./app/routes/auth');
const leagueRoute = require('./app/routes/league');

const DATABASE_URL =
    process.env.DATABASE_URL || 'mongodb://localhost:27017/ankivn';
const PORT = process.env.PORT || 3000;

// connect to database
db.connect(DATABASE_URL);

app = express();
app.use(express.json()); // for json
app.use(express.urlencoded({ extended: true })); // for form data
app.use(cors());
app.use(morgan('common'));

// routes
app.use('/api/v1/user', userRoute);
app.use('/api/v1/auth', authRoute);
app.use('/api/v1/league', leagueRoute);

app.get('/api/v1', (req, res) => {
    res.status(200).send('Hello World');
});

app.listen(PORT, () => console.log(`Listening on port ${PORT}...`));
