const { createTransporter } = require('../config/email.config');

class EmailService {
  constructor() {
    this.transporter = createTransporter();
  }

  // Enviar código de verificación
  async enviarCodigoVerificacion(correo, codigo, nombre) {
    const mailOptions = {
      from: {
        name: 'SimulaBank',
        address: process.env.EMAIL_USER,
      },
      to: correo,
      subject: 'Código de verificación - SimulaBank',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #01162E; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
            .code { font-size: 32px; font-weight: bold; color: #01162E; text-align: center; letter-spacing: 5px; margin: 20px 0; padding: 15px; background-color: white; border-radius: 8px; border: 2px dashed #01162E; }
            .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>SimulaBank</h1>
            </div>
            <div class="content">
              <h2>¡Hola${nombre ? ' ' + nombre : ''}!</h2>
              <p>Recibimos una solicitud para crear tu cuenta en SimulaBank.</p>
              <p>Tu código de verificación es:</p>
              <div class="code">${codigo}</div>
              <p><strong>Este código expira en 5 minutos.</strong></p>
              <p>Si no solicitaste este código, puedes ignorar este correo.</p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} SimulaBank. Todos los derechos reservados.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log('Correo enviado:', info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('Error al enviar correo:', error);
      throw new Error('Error al enviar el correo de verificación');
    }
  }

  // Enviar código de recuperación de contraseña
  async enviarCodigoRecuperacion(correo, codigo, nombre) {
    const mailOptions = {
      from: {
        name: 'SimulaBank',
        address: process.env.EMAIL_USER,
      },
      to: correo,
      subject: 'Código para recuperar tu contraseña - SimulaBank',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #01162E; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
            .code { font-size: 32px; font-weight: bold; color: #01162E; text-align: center; letter-spacing: 5px; margin: 20px 0; padding: 15px; background-color: white; border-radius: 8px; border: 2px dashed #01162E; }
            .warning { color: #d9534f; font-weight: bold; margin: 15px 0; }
            .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>SimulaBank</h1>
            </div>
            <div class="content">
              <h2>¡Hola${nombre ? ' ' + nombre : ''}!</h2>
              <p>Recibimos una solicitud para recuperar tu contraseña en SimulaBank.</p>
              <p>Tu código de verificación es:</p>
              <div class="code">${codigo}</div>
              <p><strong>Este código expira en 5 minutos.</strong></p>
              <p class="warning">⚠️ Si no solicitaste recuperar tu contraseña, ignora este correo. Tu cuenta permanece segura.</p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} SimulaBank. Todos los derechos reservados.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log('Correo de recuperación enviado:', info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('Error al enviar correo de recuperación:', error);
      throw new Error('Error al enviar el correo de recuperación');
    }
  }
}

module.exports = new EmailService();
