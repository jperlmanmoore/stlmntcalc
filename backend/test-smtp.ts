import * as nodemailer from 'nodemailer';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function testSMTPConnection() {
  console.log('Testing SMTP connection...');

  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.error('❌ SMTP credentials not configured');
    return;
  }

  // Determine SMTP settings based on email domain
  const emailDomain = process.env.EMAIL_USER.split('@')[1];
  let smtpConfig;

  if (emailDomain === 'gmail.com') {
    smtpConfig = {
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    };
  } else if (emailDomain === 'outlook.com' || emailDomain === 'hotmail.com') {
    smtpConfig = {
      host: 'smtp-mail.outlook.com',
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    };
  } else {
    smtpConfig = {
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    };
  }

  console.log(`Testing connection to ${smtpConfig.host}:${smtpConfig.port} for ${emailDomain}`);

  try {
    const transporter = nodemailer.createTransport(smtpConfig);

    // Test the connection
    await transporter.verify();

    console.log('✅ SMTP connection successful!');
    console.log(`📧 From: ${process.env.EMAIL_FROM || process.env.EMAIL_USER}`);
    console.log(`🔧 Provider: ${emailDomain} SMTP`);

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ SMTP connection failed:', message);

    if (error instanceof Error && error.message.includes('Authentication failed')) {
      console.log('💡 For Gmail: Make sure to use an App Password instead of your regular password');
      console.log('   1. Enable 2FA on your Google account');
      console.log('   2. Generate an App Password: https://myaccount.google.com/apppasswords');
      console.log('   3. Use the App Password in EMAIL_PASS');
    }
  }
}

// Run the test
testSMTPConnection().catch(console.error);