## 🎨 Azure AD B2C Custom Branding - Quick Setup

### ✅ Step 1: Get Your Static Web App URL

Go to: https://portal.azure.com
- Search: "Static Web Apps"
- Select your Bloom app
- Copy the URL from Overview (e.g., `https://delightfulglacier-xxxxx.azurestaticapps.net`)

### ✅ Step 2: Configure Azure AD B2C

**URL to configure:**
```
https://portal.azure.com/#view/Microsoft_AAD_B2CAdmin/TenantManagementMenuBlade/~/Overview/tenantId/21f0abde-bd22-47bb-861a-64428079d129
```

**Navigation:**
1. Azure AD B2C → **User flows**
2. Click your flow (likely `B2C_1_signupsignin1`)
3. Click **Page layouts** (left menu under "Customize")

**Configuration:**
4. Select **"Unified sign-up or sign-in page"**
5. Toggle **"Use custom page content"** → **YES**
6. **Custom page URI:**
   ```
   https://[your-static-web-app-url]/azure-b2c/unified.html
   ```
   Replace `[your-static-web-app-url]` with your actual URL

7. Click **Save**

### ✅ Step 3: Enable CORS

**In the same User Flow:**
8. Scroll down or find **"CORS configuration"** section
9. Add allowed origins:
   ```
   https://[your-static-web-app-url]
   http://localhost:5173
   ```

10. Click **Save**

### ✅ Step 4: Test

1. Open your Bloom app
2. Click "Sign In" or navigate to login
3. You should see:
   - 🌸 Bloom flower logo
   - Sage green colors
   - "Welcome back" heading
   - Botanical design

### 🐛 If it doesn't work:

**Check 1:** Visit directly:
```
https://[your-url]/azure-b2c/unified.html
```
Should show the Bloom-styled page.

**Check 2:** Browser console (F12)
- Look for CORS errors
- Look for 404 errors

**Check 3:** Clear cache
- Hard refresh: Ctrl+Shift+R (or Cmd+Shift+R on Mac)
- Or use incognito mode

---

**Expected time:** 5 minutes  
**Difficulty:** Easy (just copy/paste URLs in Azure Portal)
