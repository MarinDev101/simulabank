const nodemailer = require('nodemailer');
const Mailjet = require('node-mailjet');

// Determinar si estamos en producción
const isProduction = process.env.NODE_ENV === 'production';

// Configuración del transporter de nodemailer para Gmail (desarrollo)
const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });
};

// Configuración de Mailjet para producción
const createMailjetClient = () => {
  return Mailjet.apiConnect(
    process.env.MAILJET_API_KEY,
    process.env.MAILJET_SECRET_KEY
  );
};

module.exports = { createTransporter, createMailjetClient, isProduction };
