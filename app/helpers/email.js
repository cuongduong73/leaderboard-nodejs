// const Mailjet = require('node-mailjet')

// const mailjet = new Mailjet({
//     apiKey: process.env.MJ_APIKEY_PUBLIC,
//     apiSecret: process.env.MJ_APIKEY_PRIVATE
// });



// function sendEmail(username, email, token) {
//     const msg = {
//         Messages: [
//             {
//                 From: {
//                     Email: "ankivn@ankivn.com",
//                     Name: "Anki Vietnam Group"
//                 },
//                 To: [
//                     {
//                         Email: email,
//                         Name: username
//                     }
//                 ],
//                 Subject: "Reset Password Link - AnkiVN Leaderboard",
//                 TextPart: `Dear ${username}, You requested for reset password, kindly use this link to reset your password`,
//                 HTMLPart: `<p>Dear ${username},<br>You requested for reset password, kindly use this <a href="http://leaderboard.ankivn.com/update-password?token=${token}">link</a> to reset your password</p>`
//             }
//         ]
//     };
    // const msg = {
    //     "Messages":[
    //       {
    //         "From": {
    //           "Email": "ankivn@ankivn.com",
    //           "Name": "Anki"
    //         },
    //         "To": [
    //           {
    //             "Email": "dhc1995@gmail.com",
    //             "Name": "Anki"
    //           }
    //         ],
    //         "Subject": "Greetings from Mailjet.",
    //         "TextPart": "My first Mailjet email",
    //         "HTMLPart": "<h3>Dear passenger 1, welcome to <a href='https://www.mailjet.com/'>Mailjet</a>!</h3><br />May the delivery force be with you!",
    //       }
    //     ]
    //   }
//     const request = mailjet.post("send", { 'version': 'v3.1' }).request(msg);
//     request
//         .then(() => {
//             return;
//         })
//         .catch((err) => {
//             console.log('error', err.statusCode)
//         })
// }

// module.exports = { sendEmail }