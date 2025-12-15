# SMS Verification Setup Guide

## Azure Communication Services Configuration

This application uses Azure Communication Services for SMS verification during the booking process.

### Prerequisites

1. **Azure Communication Services Resource**
   - Create an Azure Communication Services resource in the Azure Portal
   - Navigate to: Azure Portal → Create Resource → Azure Communication Services

2. **Phone Number**
   - Acquire a phone number from the Azure Communication Services resource
   - Go to your resource → Phone Numbers → Get a number
   - Select a toll-free or local number (Australia recommended)
   - Enable SMS capabilities

### Environment Variables

Add the following environment variables to your Azure Function App settings:

#### Required Variables

```bash
# Azure Communication Services Connection String
# Found in: Azure Portal → Your Communication Services Resource → Keys
AZURE_COMMUNICATION_SERVICES_CONNECTION_STRING=endpoint=https://your-resource.communication.azure.com/;accesskey=your-access-key

# Your acquired phone number (E.164 format with +)
AZURE_COMMUNICATION_SERVICES_PHONE_NUMBER=+61400000000
```

### Local Development Setup

1. **Add to `local.settings.json`** (api folder):

```json
{
  "IsEncrypted": false,
  "Values": {
    "AzureWebJobsStorage": "UseDevelopmentStorage=true",
    "FUNCTIONS_WORKER_RUNTIME": "node",
    "AZURE_COMMUNICATION_SERVICES_CONNECTION_STRING": "endpoint=https://your-resource.communication.azure.com/;accesskey=your-access-key",
    "AZURE_COMMUNICATION_SERVICES_PHONE_NUMBER": "+61400000000"
  }
}
```

2. **Add to `.env`** (website folder):

```bash
# API URL for verification endpoints
VITE_API_URL=http://localhost:7071
```

### Production Deployment

1. **Azure Function App Settings**:
   ```bash
   az functionapp config appsettings set \
     --name your-function-app \
     --resource-group your-resource-group \
     --settings \
     AZURE_COMMUNICATION_SERVICES_CONNECTION_STRING="your-connection-string" \
     AZURE_COMMUNICATION_SERVICES_PHONE_NUMBER="+61400000000"
   ```

2. **Static Web App Settings**:
   ```bash
   az staticwebapp appsettings set \
     --name your-static-web-app \
     --setting-names VITE_API_URL="https://your-function-app.azurewebsites.net"
   ```

### Install Required Dependencies

```bash
cd api
npm install @azure/communication-sms
```

### API Endpoints

#### Send Verification Code
```
POST /api/send-verification-code
Content-Type: application/json

{
  "phoneNumber": "0400000000"
}

Response:
{
  "success": true,
  "verificationId": "unique-id",
  "expiresIn": 600
}
```

#### Verify Code
```
POST /api/verify-code
Content-Type: application/json

{
  "verificationId": "unique-id",
  "code": "123456"
}

Response:
{
  "success": true,
  "verified": true
}
```

### Testing

1. **Test SMS sending locally**:
   - Ensure your local.settings.json has valid credentials
   - Start the Functions: `cd api && npm start`
   - Send a test request using curl or Postman

2. **Test with the booking form**:
   - Start the website: `cd apps/website && npm run dev`
   - Fill out the booking form
   - Enter your real phone number
   - Check that you receive the SMS

### Costs

- **Azure Communication Services SMS (Australia)**:
  - Outbound SMS: ~$0.06 AUD per message
  - Inbound SMS: ~$0.01 AUD per message
  - Phone number rental: ~$1.50 AUD/month for toll-free

- **Estimated monthly cost** (100 bookings/month):
  - 100 verifications × $0.06 = $6 AUD
  - Phone number rental = $1.50 AUD
  - **Total: ~$7.50 AUD/month**

### Security Considerations

1. **Rate Limiting**: Consider adding rate limiting to prevent abuse
2. **Max Attempts**: Current limit is 5 attempts per verification
3. **Expiration**: Codes expire after 10 minutes
4. **Storage**: Currently uses in-memory storage (use Redis for production scale)

### Troubleshooting

**SMS not sending?**
- Check connection string is correct
- Verify phone number is in E.164 format (+61...)
- Ensure your Azure subscription has SMS credits
- Check Azure Communication Services logs in portal

**Invalid phone number errors?**
- Phone numbers must be Australian format (starting with 04 or +614)
- The system automatically converts 04... to +614...

**Verification always fails?**
- Check that verificationId matches between send and verify calls
- Ensure code hasn't expired (10 minute window)
- Check Function logs for errors

### Migration Notes

This replaces the previous Halaxy public API verification which required:
- Session hash initialization through their booking widget
- Was not designed for custom booking forms

The new Azure Communication Services implementation:
- ✅ Works with custom booking forms
- ✅ Full control over messaging and UX
- ✅ Professional and secure
- ✅ Minimal cost (~$7.50/month for 100 bookings)
