const express = require('express');
const bcrypt = require('bcrypt');

app = express();

app.get('/api', (req, res) => {
    res.send('Hello World');
});

app.listen(3000, () => console.log('Listening on port 3000...'));

                const hashed_password =
    '$2b$12$J35ArGJy5qKISlpj5tzaaeMrMFZCGb/hFbsGSqUFg17ncTAHUYWtS';
const plain_password = 'Chelsea@1995';
bcrypt.compare(plain_password, hashed_password).then((res) => console.log(res));
