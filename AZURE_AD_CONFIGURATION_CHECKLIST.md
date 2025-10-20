# Azure AD Configuration Status Report - Bloom Platform

**Date:** October 21, 2025  
**App Registration:** Bloom PlatformAccounts  
**Client ID:** `fcf9e695-e0a4-4e4f-aa2d-a7c0a6e3eaba`  
**Tenant ID:** `21f0abde-bd22-47bb-861a-64428079d129`  
**Tenant Domain:** `LifePsychologyAustralia138.onmicrosoft.com`

---

## 📋 Configuration Checklist

### 1. ✅ App Registration Basic Info (VERIFIED IN CODE)

- [x] **Client ID:** `fcf9e695-e0a4-4e4f-aa2d-a7c0a6e3eaba`
- [x] **Tenant ID:** `21f0abde-bd22-47bb-861a-64428079d129`
- [x] **Authority URL:** `https://login.microsoftonline.com/21f0abde-bd22-47bb-861a-64428079d129`

### 2. ⚠️ REDIRECT URIs (REQUIRES AZURE PORTAL VERIFICATION)

**Platform Type:** Should be **Single Page Application (SPA)**

Navigate to: **Azure Portal → App Registrations → Bloom PlatformAccounts → Authentication**

#### Required Redirect URIs:

**Production:**
- [ ] `https://bloom.life-psychology.com.au/auth/callback`
- [ ] `https://www.bloom.life-psychology.com.au/auth/callback`

**Staging (if applicable):**
- [ ] `https://red-desert-03b29ff00.1.azurestaticapps.net/auth/callback`
- [ ] `https://yellow-cliff-0eb1c4000.3.azurestaticapps.net/auth/callback`

**Development:**
- [ ] `http://localhost:5173/auth/callback`
- [ ] `http://localhost:5173` (optional, for local testing)

#### Post Logout Redirect URIs:
- [ ] `https://bloom.life-psychology.com.au`
- [ ] `https://www.bloom.life-psychology.com.au`
- [ ] `http://localhost:5173`

**⚠️ CRITICAL:** These MUST be configured as **Single Page Application (SPA)** platform, NOT Web platform!

**How to Add:**
1. Go to **Authentication** blade
2. Click **Add a platform** → Select **Single-page application**
3. Add all redirect URIs above
4. Click **Configure**

---

### 3. ⚠️ IMPLICIT GRANT SETTINGS (REQUIRED FOR SPA)

Navigate to: **Authentication → Implicit grant and hybrid flows**

- [ ] **Access tokens** (used for implicit flows) - Should be CHECKED
- [ ] **ID tokens** (used for implicit and hybrid flows) - Should be CHECKED

**Why needed:** MSAL.js for SPAs uses implicit flow as fallback. Even though we're using auth code flow with PKCE, enabling these provides compatibility.

---

### 4. ⚠️ API PERMISSIONS (REQUIRES VERIFICATION)

Navigate to: **API permissions**

#### Required Permissions:

| API | Permission | Type | Admin Consent | Status |
|-----|-----------|------|---------------|--------|
| Microsoft Graph | `openid` | Delegated | Not Required | ❓ Check |
| Microsoft Graph | `profile` | Delegated | Not Required | ❓ Check |
| Microsoft Graph | `email` | Delegated | Not Required | ❓ Check |
| Microsoft Graph | `User.Read` | Delegated | Not Required | ❓ Check |
| Microsoft Graph | `offline_access` | Delegated | Not Required | ❓ Check |

**How to Add:**
1. Go to **API permissions**
2. Click **Add a permission**
3. Select **Microsoft Graph**
4. Select **Delegated permissions**
5. Search and add each permission above
6. Click **Add permissions**
7. Click **Grant admin consent for [Your Org]** button

**⚠️ CRITICAL:** Click the **"Grant admin consent"** button after adding permissions!

---

### 5. ⚠️ TOKEN CONFIGURATION (OPTIONAL CLAIMS)

Navigate to: **Token configuration**

#### Recommended Optional Claims:

**ID Token:**
- [ ] `email` - User's email address
- [ ] `preferred_username` - User's preferred username
- [ ] `family_name` - User's last name
- [ ] `given_name` - User's first name

**Access Token:**
- [ ] `email`
- [ ] `preferred_username`

**How to Add:**
1. Go to **Token configuration**
2. Click **Add optional claim**
3. Select **ID** token type
4. Check the claims above
5. Click **Add**
6. Repeat for **Access** token type

---

### 6. ⚠️ SUPPORTED ACCOUNT TYPES

Navigate to: **Authentication → Supported account types**

**Recommended Setting:**
- [ ] **Accounts in this organizational directory only (LifePsychologyAustralia138 only - Single tenant)**

**Why:** Your therapists/staff will have accounts in your organization's directory.

**Alternative (if needed):**
- [ ] **Accounts in any organizational directory (Any Azure AD directory - Multitenant)** - Only if therapists are from different organizations

**❌ NOT Recommended:**
- Personal Microsoft accounts (e.g., @outlook.com, @hotmail.com) - Unless you specifically need this

---

### 7. ✅ CODEBASE CONFIGURATION (VERIFIED)

Current configuration in `.env.production`:

```bash
VITE_B2C_CLIENT_ID=fcf9e695-e0a4-4e4f-aa2d-a7c0a6e3eaba ✅
VITE_B2C_TENANT_ID=21f0abde-bd22-47bb-861a-64428079d129 ✅
VITE_B2C_AUTHORITY=https://login.microsoftonline.com/21f0abde-bd22-47bb-861a-64428079d129 ✅
VITE_B2C_REDIRECT_URI=https://bloom.life-psychology.com.au/auth/callback ✅
VITE_B2C_SCOPES=openid profile email User.Read ✅
VITE_B2C_ENABLED=true ✅
```

**Status:** ✅ All environment variables correctly configured

---

### 8. ⚠️ ADVANCED SETTINGS (OPTIONAL BUT RECOMMENDED)

#### Enable ID Token for Implicit Flow
Navigate to: **Authentication → Implicit grant and hybrid flows**
- [ ] Enable **ID tokens**

#### Access Token Acceptance
Navigate to: **Expose an API**
- [ ] Set **Application ID URI** (e.g., `api://fcf9e695-e0a4-4e4f-aa2d-a7c0a6e3eaba`)

#### Token Lifetimes (Optional)
Default settings are usually fine:
- Access tokens: 1 hour
- ID tokens: 1 hour
- Refresh tokens: 90 days

---

## 🔧 QUICK SETUP GUIDE

### Step-by-Step Azure Portal Configuration

1. **Navigate to App Registration**
   ```
   Azure Portal → Azure Active Directory → App registrations → Bloom PlatformAccounts
   ```

2. **Configure Authentication Platform (CRITICAL)**
   - Click **Authentication** in left menu
   - If no SPA platform exists, click **Add a platform** → **Single-page application**
   - Add redirect URIs:
     ```
     https://bloom.life-psychology.com.au/auth/callback
     https://www.bloom.life-psychology.com.au/auth/callback
     http://localhost:5173/auth/callback
     ```
   - Under **Implicit grant and hybrid flows**:
     - ✅ Check **Access tokens**
     - ✅ Check **ID tokens**
   - Click **Save**

3. **Add API Permissions**
   - Click **API permissions** in left menu
   - Click **Add a permission**
   - Select **Microsoft Graph**
   - Select **Delegated permissions**
   - Add these permissions:
     - `openid`
     - `profile`
     - `email`
     - `User.Read`
     - `offline_access`
   - Click **Add permissions**
   - **IMPORTANT:** Click **Grant admin consent for [Your Organization]**

4. **Configure Token Claims (Optional)**
   - Click **Token configuration** in left menu
   - Click **Add optional claim**
   - Select **ID** token
   - Add: `email`, `preferred_username`, `given_name`, `family_name`
   - Click **Add**

5. **Verify Supported Account Types**
   - Click **Authentication**
   - Under **Supported account types**, ensure:
     - "Accounts in this organizational directory only" is selected

---

## 🧪 TESTING CHECKLIST

Once Azure configuration is complete:

### Local Testing (http://localhost:5173)

1. **Start Development Server**
   ```bash
   npm run dev
   ```

2. **Test Login Flow**
   - [ ] Click "Bloom" button on landing page
   - [ ] Should redirect to Microsoft login page
   - [ ] Login with Azure AD credentials
   - [ ] Should redirect back to `http://localhost:5173/auth/callback`
   - [ ] Should then navigate to admin dashboard
   - [ ] Check browser console for any errors

3. **Debug Commands** (run in browser console)
   ```javascript
   // Check auth state
   console.log('[DEBUG] Auth enabled:', import.meta.env.VITE_B2C_ENABLED)
   console.log('[DEBUG] Client ID:', import.meta.env.VITE_B2C_CLIENT_ID)
   console.log('[DEBUG] Authority:', import.meta.env.VITE_B2C_AUTHORITY)
   
   // Check if user is authenticated
   console.log('[DEBUG] Authenticated:', window.sessionStorage.getItem('msal.account.keys'))
   ```

### Production Testing (https://bloom.life-psychology.com.au)

1. **Deploy to Production**
   ```bash
   npm run build
   git add .
   git commit -m "Azure AD authentication configured"
   git push origin main
   ```

2. **Test Production Login**
   - [ ] Navigate to https://bloom.life-psychology.com.au
   - [ ] Click "Bloom" button
   - [ ] Should redirect to Microsoft login
   - [ ] Login with credentials
   - [ ] Should redirect to `/auth/callback`
   - [ ] Should navigate to dashboard

3. **Check Console Logs**
   - [ ] No CORS errors
   - [ ] No "Redirect URI mismatch" errors
   - [ ] No "AADSTS" error codes

---

## 🚨 COMMON ERRORS & SOLUTIONS

### Error: AADSTS50011 - Redirect URI Mismatch
**Cause:** Redirect URI in code doesn't match Azure configuration

**Solution:**
1. Go to Azure Portal → App Registration → Authentication
2. Ensure `https://bloom.life-psychology.com.au/auth/callback` is listed under SPA platform
3. Ensure it's EXACTLY the same (no trailing slash, https not http)

### Error: AADSTS65001 - User Consent Required
**Cause:** API permissions not granted admin consent

**Solution:**
1. Go to Azure Portal → App Registration → API permissions
2. Click **Grant admin consent for [Your Organization]**

### Error: AADSTS7000215 - Invalid Client Secret
**Cause:** This error shouldn't occur for SPA (we don't use client secrets)

**Solution:**
- Verify you're using **SPA platform**, not **Web** platform
- SPAs don't need client secrets

### Error: Login button does nothing
**Cause:** Auth redirect failing silently

**Solution:**
1. Check browser console for errors
2. Verify redirect URIs are configured as SPA platform
3. Check if popup blocker is preventing redirect

---

## 📊 VERIFICATION SCRIPT

Run this in your browser console on the Bloom site to verify configuration:

```javascript
// Azure AD Configuration Verification
console.group('🔍 Azure AD Configuration Check');

const config = {
  clientId: import.meta.env.VITE_B2C_CLIENT_ID,
  tenantId: import.meta.env.VITE_B2C_TENANT_ID,
  authority: import.meta.env.VITE_B2C_AUTHORITY,
  redirectUri: import.meta.env.VITE_B2C_REDIRECT_URI,
  scopes: import.meta.env.VITE_B2C_SCOPES,
  enabled: import.meta.env.VITE_B2C_ENABLED,
};

console.table(config);

// Validation
const issues = [];
if (!config.clientId || config.clientId.length < 30) issues.push('❌ Client ID invalid');
if (!config.tenantId || config.tenantId.length < 30) issues.push('❌ Tenant ID invalid');
if (!config.authority?.includes('login.microsoftonline.com')) issues.push('❌ Authority URL invalid');
if (!config.redirectUri?.includes('/auth/callback')) issues.push('❌ Redirect URI invalid');
if (config.enabled !== 'true') issues.push('⚠️ Auth not enabled');

if (issues.length === 0) {
  console.log('✅ Configuration looks good!');
} else {
  console.warn('⚠️ Issues found:');
  issues.forEach(issue => console.log(issue));
}

console.groupEnd();
```

---

## 📝 AZURE PORTAL LINKS (Quick Access)

1. **App Registration Overview**
   ```
   https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps/ApplicationMenuBlade/~/Overview/appId/fcf9e695-e0a4-4e4f-aa2d-a7c0a6e3eaba
   ```

2. **Authentication Settings**
   ```
   https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps/ApplicationMenuBlade/~/Authentication/appId/fcf9e695-e0a4-4e4f-aa2d-a7c0a6e3eaba
   ```

3. **API Permissions**
   ```
   https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps/ApplicationMenuBlade/~/CallAnAPI/appId/fcf9e695-e0a4-4e4f-aa2d-a7c0a6e3eaba
   ```

4. **Token Configuration**
   ```
   https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps/ApplicationMenuBlade/~/TokenConfiguration/appId/fcf9e695-e0a4-4e4f-aa2d-a7c0a6e3eaba
   ```

---

## 🎯 PRIORITY ACTION ITEMS

### Must Do (Blocker for Auth to Work):
1. ⚠️ **Add all redirect URIs under SPA platform** in Azure Portal
2. ⚠️ **Add required API permissions** and grant admin consent
3. ⚠️ **Enable implicit grant tokens** (ID tokens + Access tokens)

### Should Do (Improves UX):
4. ⚠️ **Configure optional claims** (email, preferred_username)
5. ⚠️ **Verify supported account types** matches your use case

### Nice to Have (Future):
6. 📋 Set up custom branding (logo, colors on Microsoft login page)
7. 📋 Configure conditional access policies for security
8. 📋 Enable MFA requirements

---

## 📞 SUPPORT

If you encounter issues:

1. **Check Browser Console** - Look for `[Auth]` prefixed logs
2. **Check Azure Portal** - Look for sign-in logs under "Monitoring"
3. **MSAL Documentation** - https://learn.microsoft.com/en-us/azure/active-directory/develop/msal-overview
4. **Common Errors** - https://learn.microsoft.com/en-us/azure/active-directory/develop/reference-aadsts-error-codes

---

**Last Updated:** October 21, 2025  
**Configuration Owner:** Life Psychology Australia  
**Technical Contact:** GitHub @AntonyNeal
