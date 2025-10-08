import { Client } from '@microsoft/microsoft-graph-client';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function testOutlookAPIConnection() {
  console.log('Testing Outlook/Microsoft Graph API connection...');

  if (!process.env.OUTLOOK_CLIENT_ID || !process.env.OUTLOOK_CLIENT_SECRET || !process.env.OUTLOOK_TENANT_ID || !process.env.OUTLOOK_ACCESS_TOKEN) {
    console.error('❌ Outlook API credentials not configured');
    console.log('Required: OUTLOOK_CLIENT_ID, OUTLOOK_CLIENT_SECRET, OUTLOOK_TENANT_ID, OUTLOOK_ACCESS_TOKEN');
    console.log('💡 To get these:');
    console.log('   1. Go to Azure Portal: https://portal.azure.com/');
    console.log('   2. Register an app in Azure Active Directory');
    console.log('   3. Add Microsoft Graph permissions (Mail.Send, Mail.Read)');
    console.log('   4. Get access token using client credentials flow or device code flow');
    return;
  }

  try {
    console.log('🔧 Setting up Microsoft Graph client...');

    const client = Client.init({
      authProvider: (done) => {
        done(null, process.env.OUTLOOK_ACCESS_TOKEN || null);
      },
    });

    console.log('📧 Testing Outlook API...');

    // Get user profile to verify API access
    const user = await client.api('/me').get();

    console.log('✅ Outlook API connection successful!');
    console.log(`👤 User: ${(user as any).displayName || (user as any).userPrincipalName}`);
    console.log(`📧 Email: ${(user as any).mail || (user as any).userPrincipalName}`);

    // Test mail folder access
    const mailFolders = await client.api('/me/mailFolders').get();
    console.log(`📁 Mail folders found: ${(mailFolders as any).value?.length || 0}`);

  } catch (error) {
    console.error('❌ Outlook API connection failed:', error.message);

    if (error.message.includes('401') || error.message.includes('Unauthorized')) {
      console.log('💡 Access token is invalid or expired. Get a new one.');
    } else if (error.message.includes('403') || error.message.includes('Forbidden')) {
      console.log('💡 Check your app permissions in Azure AD');
    } else if (error.message.includes('400') || error.message.includes('Bad Request')) {
      console.log('💡 Check your tenant ID and client configuration');
    }
  }
}

// Run the test
testOutlookAPIConnection().catch(console.error);