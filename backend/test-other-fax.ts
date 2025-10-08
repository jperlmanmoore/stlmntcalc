import axios from 'axios';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function testEFaxConnection() {
  console.log('Testing eFax connection...');

  if (!process.env.EFAX_USERNAME || !process.env.EFAX_PASSWORD ||
      !process.env.EFAX_ACCOUNT_ID || !process.env.EFAX_FAX_NUMBER) {
    console.error('❌ eFax credentials not configured');
    return false;
  }

  try {
    const baseUrl = process.env.EFAX_API_BASE_URL || 'https://api.efax.com';

    // Test authentication with a simple request
    const response = await axios.get(`${baseUrl}/status`, {
      auth: {
        username: process.env.EFAX_USERNAME,
        password: process.env.EFAX_PASSWORD,
      },
    });

    console.log('✅ eFax connection successful!');
    return true;
  } catch (error) {
    console.error('❌ eFax connection failed:', error.message);
    return false;
  }
}

async function testHelloFaxConnection() {
  console.log('Testing HelloFax connection...');

  if (!process.env.HELLOFAX_API_KEY || !process.env.HELLOFAX_API_SECRET ||
      !process.env.HELLOFAX_FAX_NUMBER) {
    console.error('❌ HelloFax credentials not configured');
    return false;
  }

  try {
    const baseUrl = process.env.HELLOFAX_API_BASE_URL || 'https://api.hellofax.com';

    // Test API access
    const response = await axios.get(`${baseUrl}/account`, {
      headers: {
        Authorization: `Bearer ${process.env.HELLOFAX_API_KEY}`,
        'X-API-Key': process.env.HELLOFAX_API_SECRET,
      },
    });

    console.log('✅ HelloFax connection successful!');
    return true;
  } catch (error) {
    console.error('❌ HelloFax connection failed:', error.message);
    return false;
  }
}

async function testFaxBurnerConnection() {
  console.log('Testing FaxBurner connection...');

  if (!process.env.FAXBURNER_API_KEY || !process.env.FAXBURNER_API_SECRET ||
      !process.env.FAXBURNER_FAX_NUMBER) {
    console.error('❌ FaxBurner credentials not configured');
    return false;
  }

  try {
    const baseUrl = process.env.FAXBURNER_API_BASE_URL || 'https://api.faxburner.com';

    // Test API access
    const authString = Buffer.from(
      `${process.env.FAXBURNER_API_KEY}:${process.env.FAXBURNER_API_SECRET}`,
    ).toString('base64');

    const response = await axios.get(`${baseUrl}/account`, {
      headers: {
        Authorization: `Basic ${authString}`,
      },
    });

    console.log('✅ FaxBurner connection successful!');
    return true;
  } catch (error) {
    console.error('❌ FaxBurner connection failed:', error.message);
    return false;
  }
}

async function testAllFaxProviders() {
  console.log('🧪 Testing all fax providers...\n');

  const results = {
    eFax: await testEFaxConnection(),
    helloFax: await testHelloFaxConnection(),
    faxBurner: await testFaxBurnerConnection(),
  };

  console.log('\n📊 Test Results Summary:');
  console.log(`eFax: ${results.eFax ? '✅' : '❌'}`);
  console.log(`HelloFax: ${results.helloFax ? '✅' : '❌'}`);
  console.log(`FaxBurner: ${results.faxBurner ? '✅' : '❌'}`);

  const successful = Object.values(results).filter(Boolean).length;
  console.log(`\n🎯 ${successful}/3 fax providers configured correctly`);
}

// Run the test
testAllFaxProviders().catch(console.error);