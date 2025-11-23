# Halaxy Credentials Setup Guide

## What You Need

To enable real-time availability and direct booking, you need these credentials from Halaxy:

1. **Client ID** - OAuth application identifier
2. **Client Secret** - OAuth application secret key
3. **Organization ID** - Your practice organization ID
4. **Practitioner ID** - Zoe's practitioner ID (already set: `1304541`)

## Where to Find Them

### 1. Get OAuth Credentials (Client ID & Secret)

#### Option A: Developer Portal (Recommended)

1. Go to [Halaxy Developer Portal](https://developers.halaxy.com)
2. Log in with your Halaxy account
3. Navigate to **Add-ons** → **API Subscription**
4. If you haven't already, purchase an API subscription
5. Go to **API Keys** or **OAuth Applications**
6. Create a new OAuth application:
   - **Name**: "Life Psychology Website Booking"
   - **Redirect URI**: `http://localhost:7071/callback` (for local testing)
   - **Scopes**: Select all required scopes (Patient, Appointment, Slot)
7. Copy the **Client ID** and **Client Secret**

#### Option B: Contact Halaxy Support

If you can't access the developer portal:

1. Email: [developers@halaxy.com](mailto:developers@halaxy.com)
2. Request: API access for direct booking integration
3. Provide: Your practice name and account details

### 2. Get Organization ID

You can find this through the Halaxy API once you have OAuth credentials:

**Using curl** (after you have Client ID and Secret):

```bash
# Step 1: Get access token
curl -X POST https://au-api.halaxy.com/oauth2/token \
  -H "Authorization: Basic $(echo -n 'CLIENT_ID:CLIENT_SECRET' | base64)" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=client_credentials"

# Step 2: Use the access token to get your organization
curl https://au-api.halaxy.com/main/Organization \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Accept: application/fhir+json"
```

The response will include your organization ID in the `id` field.

**Or from Halaxy Dashboard**:

1. Log into Halaxy
2. Go to **Settings** → **Practice Settings** → **Organization**
3. Look for Organization ID in the URL or settings page

### 3. Verify Practitioner ID

We already have Zoe's practitioner ID: `1304541`

You can verify this is correct:

```bash
curl https://au-api.halaxy.com/main/Practitioner/1304541 \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Accept: application/fhir+json"
```

This should return Zoe's practitioner details.

## Configuration Steps

### Step 1: Update Azure Functions Configuration

Edit `azure-functions-project/local.settings.json`:

```json
{
  "Values": {
    "HALAXY_CLIENT_ID": "paste_your_client_id_here",
    "HALAXY_CLIENT_SECRET": "paste_your_client_secret_here",
    "HALAXY_ORGANIZATION_ID": "paste_your_organization_id_here",
    "HALAXY_PRACTITIONER_ID": "1304541"
  }
}
```

### Step 2: Environment Variables Are Already Set

The frontend `.env.local` is already configured to point to:

- `http://localhost:7071/api/halaxy/booking` (for booking)
- `http://localhost:7071/api/halaxy/availability` (for availability)

## Testing the Configuration

### 1. Start Azure Functions

```bash
cd azure-functions-project
npm install
npm start
```

You should see:

```
Functions:
  create-halaxy-booking: [POST] http://localhost:7071/api/halaxy/booking
  get-halaxy-availability: [GET] http://localhost:7071/api/halaxy/availability
```

### 2. Test OAuth Authentication

```bash
# Test getting an access token
curl http://localhost:7071/api/halaxy/availability?start=2025-11-04T00:00:00Z&end=2025-11-11T00:00:00Z&duration=60
```

**Expected result**: JSON with available appointment slots

**If you see an error**: Check the Azure Functions terminal for error messages about authentication

### 3. Test in the Browser

1. Start the frontend: `npm run dev`
2. Open http://localhost:5173
3. Click **"Book Now"** in the header
4. Fill in Step 1 (patient details)
5. Go to Step 2 (date/time)
6. **Watch the calendar load**

**Success**: Calendar shows available time slots (blue boxes)  
**Failure**: Calendar shows "Unavailable" or error message

Check browser console (F12) for any error messages.

## Troubleshooting

### "Unauthorized" or "Invalid client credentials"

- Double-check Client ID and Secret are correct
- Make sure there are no extra spaces or quotes
- Verify API subscription is active in Halaxy

### "Organization not found"

- Verify Organization ID is correct
- Try getting it fresh from the API (see above)

### "No available slots"

- Check Zoe's calendar in Halaxy has available times
- Verify Online Booking Preferences aren't too restrictive:
  - Go to Halaxy → Settings → Online Booking Preferences
  - Check Lead Time, Buffer Time, Advance Booking Limit

### Calendar stays in "Loading" state

- Check Azure Functions terminal for errors
- Verify Functions are running on port 7071
- Check network tab in browser DevTools

## Security Notes

⚠️ **IMPORTANT**:

- `local.settings.json` should **NEVER** be committed to git
- It's already in `.gitignore`
- For production, use Azure Key Vault or environment variables
- Rotate credentials periodically for security

## Next Steps

Once configured:

1. ✅ Test OAuth authentication works
2. ✅ Verify availability API returns real slots
3. ✅ Test booking creation
4. 🎨 Style the booking form to match your site
5. 🚀 Deploy to production Azure Functions

## Support Resources

- **Halaxy API Docs**: https://developers.halaxy.com/docs
- **Halaxy Support**: developers@halaxy.com
- **FHIR Specification**: https://www.hl7.org/fhir/

---

**Need Help?** If you get stuck, share the error messages and I can help troubleshoot!
