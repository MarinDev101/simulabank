const { createTransporter, createMailjetClient, isProduction } = require('../config/email.config');

class EmailService {
  constructor() {
    if (isProduction) {
      this.mailjet = createMailjetClient();
      console.log('📧 Email Service: Usando Mailjet (producción)');
    } else {
      this.transporter = createTransporter();
      console.log('📧 Email Service: Usando Gmail/Nodemailer (desarrollo)');
    }
  }

  // Método interno para enviar email
  async _sendEmail(mailOptions) {
    if (isProduction) {
      // Usar Mailjet en producción
      const result = await this.mailjet
        .post('send', { version: 'v3.1' })
        .request({
          Messages: [
            {
              From: {
                Email: process.env.MAILJET_FROM_EMAIL || 'simulabank.noreply.123@gmail.com',
                Name: 'SimulaBank'
              },
              To: [
                {
                  Email: mailOptions.to
                }
              ],
              Subject: mailOptions.subject,
              HTMLPart: mailOptions.html
            }
          ]
        });

      console.log('Correo enviado con Mailjet:', result.body.Messages[0].To[0].MessageID);
      return { success: true, messageId: result.body.Messages[0].To[0].MessageID };
    } else {
      // Usar Nodemailer en desarrollo
      const info = await this.transporter.sendMail(mailOptions);
      console.log('Correo enviado con Nodemailer:', info.messageId);
      return { success: true, messageId: info.messageId };
    }
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
    body {
      font-family: 'Segoe UI', Arial, sans-serif;
      line-height: 1.6;
      color: #2c3e50;
      background-color: #f0f4f8;
      padding: 20px;
    }

    .container {
      max-width: 600px;
      margin: 0 auto;
      background: white;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 6px 20px rgba(0,0,0,0.08);
    }

    .header {
      background-color: #01162E;
      color: white;
      text-align: center;
      padding: 50px 20px 40px;
    }

    .header img {
      width: 460px;
      max-width: 100%;
      height: auto;
      filter: drop-shadow(0 4px 8px rgba(0,0,0,0.25));
    }

    .content {
      padding: 40px 30px;
      background-color: #fafbfc;
    }

    .content h2 {
      margin-top: 0;
      font-size: 24px;
      font-weight: 700;
      color: #01162E;
    }

    .content p {
      margin: 12px 0;
      font-size: 15px;
    }

    .code {
      font-size: 36px;
      font-weight: bold;
      color: #01162E;
      text-align: center;
      letter-spacing: 6px;
      margin: 30px 0;
      padding: 20px;
      background-color: white;
      border-radius: 12px;
      border: 2px dashed #01162E;
      transition: background 0.2s, transform 0.15s;
      cursor: pointer;
      user-select: none;
    }

    .warning {
      color: #d9534f;
      font-weight: bold;
      margin: 15px 0;
    }

    .footer {
      text-align: center;
      padding: 18px;
      background-color: #f5f7fa;
      font-size: 12px;
      color: #7b8a99;
      border-top: 1px solid #e1e8ef;
    }
  </style>
</head>
<body>
  <div class="container">

    <header class="header">
      <img
        src="https://res.cloudinary.com/ddpdfgxjq/image/upload/v1763673726/imagotipo_simulabank_p6c0bx.png"
        alt="SimulaBank Logo"
      >
    </header>

    <div class="content">
      <h2>¡Hola${nombre ? ' ' + nombre : ''}!</h2>

      <p>Recibimos una solicitud para crear tu cuenta en SimulaBank.</p>
      <p>Tu código de verificación es:</p>

      <div class="code" onclick="navigator.clipboard.writeText('${codigo}')">
        ${codigo}
      </div>

      <p><strong>Este código expira en 5 minutos.</strong></p>

      <p class="warning">⚠️ Si no solicitaste crear una cuenta, puedes ignorar este correo.</p>
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
      return await this._sendEmail(mailOptions);
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
    body {
      font-family: 'Segoe UI', Arial, sans-serif;
      line-height: 1.6;
      color: #2c3e50;
      background-color: #f0f4f8;
      padding: 20px;
    }

    .container {
      max-width: 600px;
      margin: 0 auto;
      background: white;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 6px 20px rgba(0,0,0,0.08);
    }

    .header {
      background-color: #01162E;
      color: white;
      text-align: center;
      padding: 50px 20px 40px;
    }

    .header img {
      width: 460px;
      max-width: 100%;
      height: auto;
      filter: drop-shadow(0 4px 8px rgba(0,0,0,0.25));
    }

    .content {
      padding: 40px 30px;
      background-color: #fafbfc;
    }

    .content h2 {
      margin-top: 0;
      font-size: 24px;
      font-weight: 700;
      color: #01162E;
    }

    .content p {
      margin: 12px 0;
      font-size: 15px;
    }

    .code {
      font-size: 36px;
      font-weight: bold;
      color: #01162E;
      text-align: center;
      letter-spacing: 6px;
      margin: 30px 0;
      padding: 20px;
      background-color: white;
      border-radius: 12px;
      border: 2px dashed #01162E;
      transition: background 0.2s, transform 0.15s;
      cursor: pointer;
      user-select: none;
    }

    .warning {
      color: #d9534f;
      font-weight: bold;
      margin: 15px 0;
    }

    .footer {
      text-align: center;
      padding: 18px;
      background-color: #f5f7fa;
      font-size: 12px;
      color: #7b8a99;
      border-top: 1px solid #e1e8ef;
    }
  </style>
</head>
<body>
  <div class="container">

    <header class="header">
      <img
        src="https://res.cloudinary.com/ddpdfgxjq/image/upload/v1763673726/imagotipo_simulabank_p6c0bx.png"
        alt="SimulaBank Logo"
      >
    </header>

    <div class="content">
      <h2>¡Hola${nombre ? ' ' + nombre : ''}!</h2>

      <p>Recibimos una solicitud para recuperar tu contraseña en SimulaBank.</p>
      <p>Tu código para restaurar tu acceso es:</p>

      <div class="code" onclick="navigator.clipboard.writeText('${codigo}')">
        ${codigo}
      </div>

      <p><strong>Este código expira en 5 minutos.</strong></p>

      <p class="warning">⚠️ Si no solicitaste recuperar tu contraseña, puedes ignorar este correo.</p>
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
      return await this._sendEmail(mailOptions);
    } catch (error) {
      console.error('Error al enviar correo de recuperación:', error);
      throw new Error('Error al enviar el correo de recuperación');
    }
  }
}

module.exports = new EmailService();
