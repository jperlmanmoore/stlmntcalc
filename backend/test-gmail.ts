import { google } from 'googleapis';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function testGmailAPIConnection() {
  console.log('Testing Gmail API connection...');

  if (!process.env.GMAIL_CLIENT_ID || !process.env.GMAIL_CLIENT_SECRET || !process.env.GMAIL_REFRESH_TOKEN) {
    console.error('❌ Gmail API credentials not configured');
    console.log('Required: GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, GMAIL_REFRESH_TOKEN');
    console.log('💡 To get these:');
    console.log('   1. Go to Google Cloud Console: https://console.cloud.google.com/');
    console.log('   2. Create a project and enable Gmail API');
    console.log('   3. Create OAuth 2.0 credentials');
    console.log('   4. Set up OAuth consent screen');
    console.log('   5. Get refresh token using OAuth flow');
    return;
  }

  try {
    console.log('🔧 Setting up OAuth2 client...');

    const oauth2Client = new google.auth.OAuth2(
      process.env.GMAIL_CLIENT_ID,
      process.env.GMAIL_CLIENT_SECRET,
      'urn:ietf:wg:oauth:2.0:oob', // For desktop apps
    );

    oauth2Client.setCredentials({
      refresh_token: process.env.GMAIL_REFRESH_TOKEN,
    });

    console.log('🔄 Refreshing access token...');

    // Test token refresh
    const { credentials } = await oauth2Client.refreshAccessToken();
    const accessToken = credentials.access_token;

    if (!accessToken) {
      throw new Error('Failed to obtain access token');
    }

    console.log('✅ Access token obtained successfully');

    // Test Gmail API connection
    console.log('📧 Testing Gmail API...');
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    // Get user profile to verify API access
    const profile = await gmail.users.getProfile({ userId: 'me' });

    console.log('✅ Gmail API connection successful!');
    console.log(`📧 Email: ${(profile.data as any).emailAddress}`);
    console.log(`📊 Messages Total: ${(profile.data as any).messagesTotal}`);
    console.log(`📬 Threads Total: ${(profile.data as any).threadsTotal}`);

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Gmail API connection failed:', message);

    if (error instanceof Error) {
      if (error.message.includes('invalid_client')) {
        console.log('💡 Check your Client ID and Client Secret');
      } else if (error.message.includes('invalid_grant')) {
        console.log('💡 Refresh token is invalid or expired. Get a new one.');
      } else if (error.message.includes('access_denied')) {
        console.log('💡 Check your OAuth consent screen and scopes');
      }
    }
  }
}

// Run the test
testGmailAPIConnection().catch(console.error);