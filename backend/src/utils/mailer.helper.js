// const nodemailer = require('nodemailer');
// const { oAuth2Client } = require('../config/email.config');
// const dotenv = require('dotenv');

// dotenv.config();

// async function sendMail({ to, subject, text, html, attachments = [] }) {
//   try {
//     const accessToken = await oAuth2Client.getAccessToken();
//     const transporter = nodemailer.createTransport({
//       service: 'gmail',
//       auth: {
//         type: 'OAuth2',
//         user: 'bikestore5555@gmail.com',
//         clientId: process.env.CLIENT_ID,
//         clientSecret: process.env.CLIENT_SECRET,
//         refreshToken: process.env.REFRESH_TOKEN,
//         accessToken: accessToken.token || accessToken,
//       },
//     });
//     const mailOptions = {
//       from: 'bikestore5555@gmail.com',
//       to,
//       subject,
//       text,
//       html,
//       attachments, // permite adjuntar imágenes inline
//     };
//     return await transporter.sendMail(mailOptions);
//   } catch (error) {
//     throw error;
//   }
// }

// module.exports = { sendMail };
