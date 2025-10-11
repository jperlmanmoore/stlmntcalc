import Mailgun from 'mailgun.js';
import FormData from 'form-data';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function testMailgunConnection() {
  console.log('Testing Mailgun API connection...');

  if (!process.env.MAILGUN_API_KEY || !process.env.MAILGUN_DOMAIN) {
    console.error('❌ Mailgun credentials not configured');
    console.log('Required: MAILGUN_API_KEY and MAILGUN_DOMAIN');
    return;
  }

  try {
    const mailgun = new Mailgun(FormData);
    const mg = mailgun.client({
      username: 'api',
      key: process.env.MAILGUN_API_KEY,
    });

    console.log(`🔧 Testing Mailgun domain: ${process.env.MAILGUN_DOMAIN}`);

    // Test domain verification by getting domain info
    const domainInfo = await mg.domains.get(process.env.MAILGUN_DOMAIN);

    console.log('✅ Mailgun API connection successful!');
    console.log(`📧 Domain: ${(domainInfo as any).name || (domainInfo as any).domain?.name || process.env.MAILGUN_DOMAIN}`);
    console.log(`📊 State: ${(domainInfo as any).state || (domainInfo as any).domain?.state || 'unknown'}`);
    console.log(`📧 From Email: ${process.env.MAILGUN_FROM_EMAIL || `noreply@${process.env.MAILGUN_DOMAIN}`}`);

    const state = (domainInfo as any).state || (domainInfo as any).domain?.state;
    if (state && state !== 'active') {
      console.log('⚠️  Warning: Domain is not active. Please verify your domain in Mailgun dashboard.');
    }

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Mailgun API connection failed:', message);

    if (error instanceof Error) {
      if (error.message.includes('Forbidden')) {
        console.log('💡 Check your API key permissions and domain ownership');
      } else if (error.message.includes('Not Found')) {
        console.log('💡 Domain not found. Make sure the domain is added to your Mailgun account');
      }
    }
  }
}

// Run the test
testMailgunConnection().catch(console.error);