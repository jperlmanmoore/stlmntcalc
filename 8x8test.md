# 8x8 Fax Integration Testing Guide

## Overview
This guide provides comprehensive testing instructions for the newly implemented 8x8 fax provider integration alongside the existing Twilio fax functionality.

## Prerequisites

### 1. Environment Setup
Ensure you have the following environment variables configured in `backend/.env`:

```env
# SendGrid Configuration
SENDGRID_API_KEY=SG.your_actual_key_here
SENDGRID_FROM_EMAIL=your_verified_email@domain.com

# Twilio Configuration
TWILIO_SID=AC.your_account_sid
TWILIO_TOKEN=your_auth_token
TWILIO_FAX_NUMBER=+1234567890

# 8x8 Configuration
EIGHT_X_EIGHT_USERNAME=your_8x8_username
EIGHT_X_EIGHT_PASSWORD=your_8x8_password
EIGHT_X_EIGHT_FAX_NUMBER=+1234567890
EIGHT_X_EIGHT_API_BASE_URL=https://api.8x8.com

# Database
MONGODB_URI=mongodb://localhost:27017/settlementcalc
```

### 2. Services Running
- MongoDB database running on localhost:27017
- Backend server running on port 3001
- Frontend development server running on port 3000

## Testing Procedures

### Backend Testing

#### 1. Start Backend Server
```bash
cd backend
npm run start:dev
```

Expected output: Server should start successfully with no errors.

#### 2. Test Twilio Fax API
```bash
curl -X POST http://localhost:3001/communication/send-fax \
  -H "Content-Type: application/json" \
  -d '{
    "to": "+1234567890",
    "pdfUrl": "https://example.com/test.pdf",
    "providerId": "test-twilio",
    "provider": "twilio"
  }'
```

Expected response: JSON object with fax details and `faxProvider: "twilio"`

#### 3. Test 8x8 Fax API
```bash
curl -X POST http://localhost:3001/communication/send-fax \
  -H "Content-Type: application/json" \
  -d '{
    "to": "+1234567890",
    "pdfUrl": "https://example.com/test.pdf",
    "providerId": "test-8x8",
    "provider": "8x8"
  }'
```

Expected response: JSON object with fax details and `faxProvider: "8x8"`

#### 4. Test Email API (for comparison)
```bash
curl -X POST http://localhost:3001/communication/send-email \
  -H "Content-Type: application/json" \
  -d '{
    "to": "test@example.com",
    "subject": "Test Email",
    "html": "<p>This is a test email</p>",
    "providerId": "test-email"
  }'
```

### Frontend Testing

#### 1. Start Frontend Server
```bash
cd frontend
npm run dev
```

#### 2. Access Application
Navigate to `http://localhost:3000` in your browser.

#### 3. Configure Fax Provider
1. In the "Law Firm Information" section, locate the "Fax Provider" dropdown
2. Test both options:
   - Select "Twilio"
   - Select "8x8"

#### 4. Test Fax Sending from UI
1. Add a medical provider with:
   - Provider name
   - Billed amount
   - Email address
   - Fax number (if available)

2. Click the "📠 Send" button in the results table

3. Verify the success message indicates the correct provider:
   - "Fax sent successfully via Twilio!"
   - "Fax sent successfully via 8x8!"

## Database Verification

### Check Fax Records
Connect to MongoDB and verify fax records:

```javascript
// In MongoDB shell or MongoDB Compass
use settlementcalc
db.communications.find({type: "fax"}).sort({sentAt: -1})
```

Expected fields in fax records:
- `providerId`: Identifier for the provider
- `type`: "fax"
- `recipient`: Fax number
- `content`: PDF URL
- `status`: "sent"
- `sentAt`: Timestamp
- `externalId`: Provider's fax ID
- `faxProvider`: "twilio" or "8x8"

## Error Testing

### 1. Missing Credentials
Test with missing environment variables:

```bash
# Remove Twilio credentials temporarily
# Try Twilio fax - should get error: "Twilio credentials not configured"

# Remove 8x8 credentials temporarily
# Try 8x8 fax - should get error: "8x8 credentials not configured"
```

### 2. Invalid Provider
```bash
curl -X POST http://localhost:3001/communication/send-fax \
  -H "Content-Type: application/json" \
  -d '{
    "to": "+1234567890",
    "pdfUrl": "https://example.com/test.pdf",
    "providerId": "test-invalid",
    "provider": "invalid_provider"
  }'
```

Expected error: "Unsupported fax provider: invalid_provider"

### 3. Invalid Fax Number
Test with invalid fax numbers to verify error handling.

## Webhook Testing

### SendGrid Email Webhooks
Configure webhook URL in SendGrid dashboard:
```
http://your-domain.com/communication/webhook/sendgrid
```

### Twilio Fax Webhooks
Configure webhook URL in Twilio dashboard:
```
http://your-domain.com/communication/webhook/twilio-fax
```

### 8x8 Webhooks
Configure webhook URL in 8x8 dashboard (if supported):
```
http://your-domain.com/communication/webhook/8x8-fax
```

## Performance Testing

### 1. Concurrent Fax Sending
Test sending multiple faxes simultaneously to verify system handles load.

### 2. Large PDF Files
Test with larger PDF files to ensure both providers handle file size limits appropriately.

## Troubleshooting

### Common Issues

1. **"axios is not defined"**
   - Ensure axios is installed: `npm install axios`

2. **"SendGrid API key not configured"**
   - Check SENDGRID_API_KEY in .env file

3. **"Twilio credentials not configured"**
   - Check TWILIO_SID, TWILIO_TOKEN, TWILIO_FAX_NUMBER in .env

4. **"8x8 credentials not configured"**
   - Check EIGHT_X_EIGHT_USERNAME, EIGHT_X_EIGHT_PASSWORD, EIGHT_X_EIGHT_FAX_NUMBER in .env

5. **Database connection errors**
   - Ensure MongoDB is running on localhost:27017
   - Check MONGODB_URI in .env

### Logs and Debugging

- Backend logs will show detailed error information
- Check browser console for frontend errors
- MongoDB logs for database connection issues

## Success Criteria

✅ Backend builds without errors
✅ Both Twilio and 8x8 fax APIs respond correctly
✅ Frontend displays fax provider selection
✅ Fax records are saved to database with correct provider
✅ Error handling works for missing credentials
✅ Webhook endpoints are accessible
✅ UI shows appropriate success/error messages

## Next Steps

After successful testing:
1. Deploy to production environment
2. Configure production webhook URLs
3. Set up monitoring and alerting
4. Document API usage and billing
5. Consider adding more fax providers if needed