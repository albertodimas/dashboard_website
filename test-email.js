const nodemailer = require('nodemailer');

async function testEmail() {
  const transporter = nodemailer.createTransporter({
    host: 'localhost',
    port: 1025,
    ignoreTLS: true,
  });

  try {
    const info = await transporter.sendMail({
      from: '"Test" <test@example.com>',
      to: 'walny.mc@gmail.com',
      subject: 'Test Email',
      text: 'This is a test email',
      html: '<b>This is a test email</b>'
    });

    console.log('Email sent successfully!');
    console.log('Message ID:', info.messageId);
    console.log('Check MailHog at http://localhost:8025');
  } catch (error) {
    console.error('Error sending email:', error);
  }
}

testEmail();