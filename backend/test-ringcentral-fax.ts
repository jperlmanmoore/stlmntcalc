import axios from 'axios';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function testRingCentralFaxConnection() {
  console.log('Testing RingCentral Fax connection...');

  if (!process.env.RINGCENTRAL_CLIENT_ID || !process.env.RINGCENTRAL_CLIENT_SECRET ||
      !process.env.RINGCENTRAL_USERNAME || !process.env.RINGCENTRAL_PASSWORD ||
      !process.env.RINGCENTRAL_FAX_NUMBER) {
    console.error('❌ RingCentral credentials not configured');
    console.log('Required: RINGCENTRAL_CLIENT_ID, RINGCENTRAL_CLIENT_SECRET, RINGCENTRAL_USERNAME, RINGCENTRAL_PASSWORD, RINGCENTRAL_FAX_NUMBER');
    console.log('💡 To get these:');
    console.log('   1. Sign up at https://developers.ringcentral.com/');
    console.log('   2. Create an app and get client credentials');
    console.log('   3. Set up fax permissions');
    return;
  }

  try {
    console.log('🔧 Testing RingCentral authentication...');

    const baseUrl = process.env.RINGCENTRAL_SERVER_URL || 'https://platform.ringcentral.com';

    // Step 1: Get access token
    const authResponse = await axios.post(
      `${baseUrl}/restapi/oauth/token`,
      {
        grant_type: 'password',
        username: process.env.RINGCENTRAL_USERNAME,
        password: process.env.RINGCENTRAL_PASSWORD,
        extension: process.env.RINGCENTRAL_EXTENSION || '',
      },
      {
        headers: {
          Authorization: `Basic ${Buffer.from(
            `${process.env.RINGCENTRAL_CLIENT_ID}:${process.env.RINGCENTRAL_CLIENT_SECRET}`,
          ).toString('base64')}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      },
    );

    console.log('✅ RingCentral authentication successful!');
    console.log(`🔑 Token Type: ${authResponse.data.token_type}`);
    console.log(`⏰ Expires In: ${authResponse.data.expires_in} seconds`);
    console.log(`📠 Fax Number: ${process.env.RINGCENTRAL_FAX_NUMBER}`);

    // Note: We can't test actual fax sending without proper API endpoints
    console.log('💡 RingCentral fax API integration configured');

  } catch (error) {
    console.error('❌ RingCentral connection failed:', error.message);

    if (error.response?.status === 400) {
      console.log('💡 Check your client credentials and user details');
    } else if (error.response?.status === 401) {
      console.log('💡 Authentication failed - check username/password');
    }
  }
}

// Run the test
testRingCentralFaxConnection().catch(console.error);