import axios from 'axios';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function testEightXEightFaxConnection() {
  console.log('Testing 8x8 Fax connection...');

  if (!process.env.EIGHT_X_EIGHT_USERNAME || !process.env.EIGHT_X_EIGHT_PASSWORD || !process.env.EIGHT_X_EIGHT_FAX_NUMBER) {
    console.error('❌ 8x8 credentials not configured');
    console.log('Required: EIGHT_X_EIGHT_USERNAME, EIGHT_X_EIGHT_PASSWORD, EIGHT_X_EIGHT_FAX_NUMBER');
    console.log('💡 To get these:');
    console.log('   1. Sign up at https://www.8x8.com/');
    console.log('   2. Get your API credentials from the developer portal');
    console.log('   3. Set up fax services');
    return;
  }

  try {
    console.log('🔧 Testing 8x8 authentication...');

    const baseUrl = process.env.EIGHT_X_EIGHT_API_BASE_URL || 'https://api.8x8.com';

    // Test authentication
    const authResponse = await axios.post(`${baseUrl}/oauth/token`, {
      grant_type: 'password',
      username: process.env.EIGHT_X_EIGHT_USERNAME,
      password: process.env.EIGHT_X_EIGHT_PASSWORD,
    });

    console.log('✅ 8x8 authentication successful!');
    console.log(`🔑 Token Type: ${authResponse.data.token_type}`);
    console.log(`📠 Fax Number: ${process.env.EIGHT_X_EIGHT_FAX_NUMBER}`);

    // Note: We can't test actual fax sending without proper API endpoints
    console.log('💡 8x8 fax API integration configured');

  } catch (error) {
    console.error('❌ 8x8 connection failed:', error.message);

    if (error.response?.status === 401) {
      console.log('💡 Check your username and password');
    } else if (error.response?.status === 404) {
      console.log('💡 Check your API base URL');
    }
  }
}

// Run the test
testEightXEightFaxConnection().catch(console.error);