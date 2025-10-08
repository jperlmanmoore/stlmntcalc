import twilio from 'twilio';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function testTwilioFaxConnection() {
  console.log('Testing Twilio Fax connection...');

  if (!process.env.TWILIO_SID || !process.env.TWILIO_TOKEN || !process.env.TWILIO_FAX_NUMBER) {
    console.error('❌ Twilio credentials not configured');
    console.log('Required: TWILIO_SID, TWILIO_TOKEN, TWILIO_FAX_NUMBER');
    console.log('💡 To get these:');
    console.log('   1. Sign up at https://www.twilio.com/');
    console.log('   2. Get your Account SID and Auth Token from the dashboard');
    console.log('   3. Purchase a fax-enabled phone number');
    return;
  }

  try {
    console.log('🔧 Setting up Twilio client...');

    const client = twilio(process.env.TWILIO_SID, process.env.TWILIO_TOKEN);

    console.log('📠 Testing Twilio Fax API...');

    // Get account info to verify credentials
    const account = await client.api.accounts(process.env.TWILIO_SID).fetch();

    console.log('✅ Twilio connection successful!');
    console.log(`📞 Account: ${account.friendlyName}`);
    console.log(`📊 Status: ${account.status}`);
    console.log(`📠 Fax Number: ${process.env.TWILIO_FAX_NUMBER}`);

    // Note: We can't actually send a fax without a real PDF URL and recipient
    console.log('💡 To test actual fax sending, provide a valid PDF URL and fax number');

  } catch (error) {
    console.error('❌ Twilio connection failed:', error.message);

    if (error.message.includes('Authentication failed')) {
      console.log('💡 Check your Account SID and Auth Token');
    } else if (error.message.includes('403')) {
      console.log('💡 Your account may not have fax capabilities enabled');
    }
  }
}

// Run the test
testTwilioFaxConnection().catch(console.error);