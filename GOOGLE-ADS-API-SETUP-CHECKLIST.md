# Google Ads API CLI - Setup Checklist

**Customer ID:** 16846108368  
**Conversion Tracking ID:** AW-11563740075  
**Date:** November 9, 2025

---

## ✅ Automated Setup (Already Done)

These files have been created for you:

- [x] `google-ads.config.json.example` - Configuration template
- [x] `scripts/google-ads-auth.js` - OAuth token generator
- [x] `scripts/google-ads-commands.js` - API query commands
- [x] `scripts/google-ads-cli.ps1` - PowerShell wrapper
- [x] `scripts/README-GOOGLE-ADS-CLI.md` - Complete documentation
- [x] `package.json` - Added google-ads-api dependency
- [x] `.gitignore` - Protected credentials file

---

## 📋 Manual Steps Required

### Step 1: Install Node.js Dependencies

```powershell
cd "C:\Users\julia\source\repos\life-psychology-australia"
npm install
```

This will install the `google-ads-api` package (v17.1.0).

---

### Step 2: Set Up Google Cloud Project

#### 2.1 Create/Select Project

1. Go to https://console.cloud.google.com/
2. Either:
   - Create a new project: "Life Psychology Ads CLI"
   - Or select existing project if you have one

#### 2.2 Enable Google Ads API

1. In Google Cloud Console, go to **"APIs & Services"** > **"Library"**
2. Search for **"Google Ads API"**
3. Click **"Enable"**

#### 2.3 Create OAuth 2.0 Credentials

1. Go to **"APIs & Services"** > **"Credentials"**
2. Click **"Create Credentials"** > **"OAuth client ID"**
3. If prompted, configure OAuth consent screen:
   - User Type: **External**
   - App name: **"Life Psychology Ads CLI"**
   - User support email: Your email
   - Developer contact: Your email
   - Scopes: No need to add (we'll use default)
   - Save and continue

4. Create OAuth Client ID:
   - Application type: **"Desktop app"**
   - Name: **"Life Psychology Ads CLI"**
   - Click **"Create"**

5. Download or copy:
   - **Client ID** (looks like: `xxxxx.apps.googleusercontent.com`)
   - **Client Secret** (looks like: `GOCSPX-xxxxx`)

6. Edit the OAuth client:
   - Click the pencil icon to edit
   - Under "Authorized redirect URIs", add: `http://localhost`
   - Click **"Save"**

---

### Step 3: Get Google Ads Developer Token

#### 3.1 Access Google Ads API Center

1. Go to https://ads.google.com/
2. Click **Tools & Settings** (wrench icon)
3. Under "Setup", click **"API Center"**

#### 3.2 Apply for Developer Token

If you don't have a developer token yet:

1. Click **"Apply for Basic Access"** or **"Apply for Standard Access"**
2. Fill out the form:
   - What will you use the API for? **"Internal reporting and campaign analysis"**
   - Describe your use case: **"Query campaign performance, conversions, and search terms for business reporting"**
3. Submit application

**For Testing (Immediate):**

- You can use a **test account** developer token right away
- Test tokens work with test accounts only
- No approval needed

**For Production:**

- Standard access requires Google approval (1-2 weeks)
- Once approved, you'll see your token in API Center

#### 3.3 Copy Developer Token

Once approved (or using test account):

1. Go back to **API Center** in Google Ads
2. Copy your **Developer Token**
3. Save it securely

---

### Step 4: Configure API Credentials

#### 4.1 Create Config File

```powershell
cd "C:\Users\julia\source\repos\life-psychology-australia"
Copy-Item google-ads.config.json.example google-ads.config.json
```

#### 4.2 Edit Configuration

Open `google-ads.config.json` in a text editor and fill in:

```json
{
  "client_id": "YOUR_CLIENT_ID.apps.googleusercontent.com",
  "client_secret": "YOUR_CLIENT_SECRET",
  "developer_token": "YOUR_DEVELOPER_TOKEN",
  "refresh_token": "GENERATED_AFTER_AUTH",
  "login_customer_id": "16846108368"
}
```

**What to fill in:**

- `client_id`: From Step 2.3 (Google Cloud OAuth)
- `client_secret`: From Step 2.3 (Google Cloud OAuth)
- `developer_token`: From Step 3 (Google Ads API Center)
- `refresh_token`: Leave as-is (generated in next step)
- `login_customer_id`: Already set to 16846108368

---

### Step 5: Generate Refresh Token

#### 5.1 Run Authentication Script

```powershell
cd "C:\Users\julia\source\repos\life-psychology-australia"
node scripts/google-ads-auth.js
```

#### 5.2 Follow the Prompts

The script will:

1. Display an authorization URL
2. Open it in your browser (or ask you to copy/paste)
3. Google will ask you to sign in and authorize the app
4. You'll receive an authorization code
5. Copy the code and paste it into the terminal
6. Script will generate and save the refresh token

**Expected Output:**

```
╔════════════════════════════════════════════════════════════╗
║     Google Ads API - OAuth Refresh Token Generator        ║
╚════════════════════════════════════════════════════════════╝

✓ Configuration loaded successfully

Please visit this URL to authorize the application:

https://accounts.google.com/o/oauth2/v2/auth?...

Enter authorization code: [paste code here]

✓ Refresh token generated successfully!
✓ Refresh token saved to google-ads.config.json
✓ Your CLI is now ready to use!
```

**Troubleshooting:**

- If you get "redirect_uri_mismatch", make sure `http://localhost` is in your OAuth client's redirect URIs
- If browser doesn't open, copy/paste the URL manually

---

### Step 6: Test the CLI

#### 6.1 Basic Test

```powershell
.\scripts\google-ads-cli.ps1 -Command "report" -Args @{days=7}
```

**Expected Output:**

```
ℹ Executing Google Ads API command...
Command: report
Arguments:
  days = 7

✓ Command completed successfully

═══════════════════════════════════════════════════════════
SUMMARY
═══════════════════════════════════════════════════════════
  Total Campaigns: 2
  Total Impressions: 1234
  Total Clicks: 56
  Total Cost Aud: 123.45
  Total Conversions: 3
  Avg Ctr: 4.54%
  ...
```

#### 6.2 Test Other Commands

```powershell
# Conversions report
.\scripts\google-ads-cli.ps1 -Command "conversions" -Args @{days=14}

# Search terms (requires active campaigns with search data)
.\scripts\google-ads-cli.ps1 -Command "searchterms" -Args @{days=30; limit=50}
```

---

## 🎯 Usage Examples

### Daily Monitoring

```powershell
# Check yesterday's performance
.\scripts\google-ads-cli.ps1 -Command "report" -Args @{days=1}
```

### Weekly Review

```powershell
# Get last 7 days of data
.\scripts\google-ads-cli.ps1 -Command "report" -Args @{days=7}
.\scripts\google-ads-cli.ps1 -Command "conversions" -Args @{days=7}
```

### Campaign Deep Dive

```powershell
# First, get campaign IDs
$report = .\scripts\google-ads-cli.ps1 -Command "report" -Args @{days=30} | ConvertFrom-Json

# Then analyze a specific campaign
$campaignId = $report.campaigns[0].campaign_id
.\scripts\google-ads-cli.ps1 -Command "adgroups" -Args @{campaign_id=$campaignId; days=30}
```

### Search Term Analysis

```powershell
# Find top converting search terms
.\scripts\google-ads-cli.ps1 -Command "searchterms" -Args @{days=30; limit=100}
```

---

## 🔐 Security Checklist

- [x] `google-ads.config.json` is in `.gitignore` (already done)
- [ ] Never commit credentials to Git
- [ ] Keep Developer Token secure
- [ ] Limit OAuth client access (only you need access)
- [ ] Regularly review API usage in Google Cloud Console
- [ ] Set up billing alerts if using paid API features

---

## 📝 Important Notes

### Cost Data

- All cost values are **already converted to AUD**
- Google Ads API returns costs in "micros" (1 micro = 0.000001 AUD)
- The CLI automatically divides by 1,000,000 for you

### Rate Limits

- Google Ads API has rate limits
- Don't run queries in tight loops
- CLI is designed for manual/scheduled queries, not real-time

### Conversion Tracking

- **This CLI does NOT handle conversion uploads**
- Conversion uploads are handled by Azure Functions/webhooks
- This is for **reporting and analysis only**

### Test vs. Production

- Start with a **test account** if possible
- Test accounts have full API access without approval
- Production tokens require Google approval (1-2 weeks)

---

## ✅ Final Verification

After completing all steps, verify:

1. **Dependencies installed:**

   ```powershell
   npm list google-ads-api
   ```

   Should show: `google-ads-api@17.1.0`

2. **Config file exists:**

   ```powershell
   Test-Path google-ads.config.json
   ```

   Should show: `True`

3. **Refresh token generated:**

   ```powershell
   (Get-Content google-ads.config.json | ConvertFrom-Json).refresh_token
   ```

   Should NOT show: `GENERATED_AFTER_AUTH`

4. **CLI works:**
   ```powershell
   .\scripts\google-ads-cli.ps1 -Command "report" -Args @{days=1}
   ```
   Should return JSON with campaign data

---

## 🆘 Common Issues

### "Developer token is invalid"

- Token may not be approved yet
- Use test account token during testing
- Check API is enabled in Google Cloud Console

### "redirect_uri_mismatch"

- Add `http://localhost` to OAuth redirect URIs
- Go to Google Cloud Console > Credentials > Edit OAuth Client

### "Invalid grant: account not found"

- Make sure you're signed into the Google account that owns the Ads account
- Customer ID 16846108368 must be accessible by this account

### PowerShell script won't run

- Check execution policy:
  ```powershell
  Get-ExecutionPolicy
  ```
- If restricted, run:
  ```powershell
  Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
  ```

---

## 📚 Next Steps

Once setup is complete:

1. **Schedule Reports** - Set up daily/weekly PowerShell tasks
2. **Export Data** - Pipe output to CSV for analysis
3. **Integrate with Dashboards** - Use JSON output in reporting tools
4. **Monitor Performance** - Regular campaign reviews

For detailed documentation, see: `scripts/README-GOOGLE-ADS-CLI.md`

---

**Setup completed?** Check all boxes above! ✅
