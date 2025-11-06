const nodemailer = require('nodemailer');

// Configuración del transporter de nodemailer para Gmail
const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER, // Tu correo de Gmail
      pass: process.env.EMAIL_PASSWORD, // Tu contraseña de aplicación de Gmail
    },
  });
};

module.exports = { createTransporter };
