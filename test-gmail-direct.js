const nodemailer = require('nodemailer');

async function testGmail() {
  try {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('TESTING GMAIL DIRECTLY');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    // Create transporter with your Gmail credentials
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: 'appointmentlab@gmail.com',
        pass: 'apnx cwmj yujw xkeh'
      }
    });
    
    console.log('Verifying connection...');
    
    // Verify connection
    await transporter.verify();
    console.log('✅ Connection verified!');
    
    // Send test email
    console.log('Sending test email...');
    const info = await transporter.sendMail({
      from: '"Dashboard Test" <appointmentlab@gmail.com>',
      to: 'appointmentlab@gmail.com', // Sending to yourself for testing
      subject: 'Test Email - Dashboard Review System',
      text: 'This is a test email to verify the email system is working.',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>Test Email</h2>
          <p>This is a test email from your Dashboard Review System.</p>
          <p>If you receive this, the email system is working correctly!</p>
          <hr>
          <p style="color: #666; font-size: 12px;">
            Sent from Dashboard Website at ${new Date().toLocaleString()}
          </p>
        </div>
      `
    });
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ EMAIL SENT SUCCESSFULLY!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Message ID:', info.messageId);
    console.log('Check your inbox at: appointmentlab@gmail.com');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
  } catch (error) {
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error('❌ ERROR');
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error('Error:', error.message);
    if (error.code) console.error('Code:', error.code);
    if (error.response) console.error('Response:', error.response);
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  }
}

testGmail();