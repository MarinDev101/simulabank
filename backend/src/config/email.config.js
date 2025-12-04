const nodemailer = require('nodemailer');
const { Resend } = require('resend');

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

// Configuración de Resend para producción
const createResendClient = () => {
  return new Resend(process.env.RESEND_API_KEY);
};

module.exports = { createTransporter, createResendClient, isProduction };
