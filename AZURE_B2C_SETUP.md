# Azure AD B2C Custom Branding Configuration

## Your Custom UI URL
After deployment, your custom UI is available at:
```
https://delightfulglacier-[your-id].azurestaticapps.net/azure-b2c/unified.html
```

## Configuration Steps

### 1. Configure CORS in Azure AD B2C

```bash
# Get your Static Web Apps URL first
# Replace [your-id] with your actual deployment ID
export BLOOM_URL="https://delightfulglacier-[your-id].azurestaticapps.net"

# Note: CORS must be configured in Azure Portal UI, not via CLI
```

### 2. Azure Portal Configuration

**Navigate to Azure AD B2C:**
1. Go to https://portal.azure.com
2. Search for "Azure AD B2C" or navigate to your B2C tenant: `LifePsychologyAustralia138.onmicrosoft.com`

**Configure User Flow:**
3. Click "User flows" in the left menu
4. Select your sign-in user flow (or create one if it doesn't exist)
5. Click "Page layouts" under Customize

**Set Custom Page Content:**
6. Select "Unified sign-up or sign-in page"
7. Toggle "Use custom page content" to YES
8. Enter custom page URI:
   ```
   https://delightfulglacier-[your-id].azurestaticapps.net/azure-b2c/unified.html
   ```
9. Click "Save"

**Configure CORS:**
10. In the same User Flow settings, find "CORS configuration" or go to:
    - Azure AD B2C → Company branding → Configure
11. Add allowed origins:
    ```
    https://delightfulglacier-[your-id].azurestaticapps.net
    http://localhost:5173
    ```

### 3. Test the Configuration

**Test Login Flow:**
```bash
# Your app should now show the Bloom-branded login when you:
# 1. Navigate to your Bloom app
# 2. Click "Sign In"
# 3. Azure AD B2C should redirect to your custom branded page
```

**Verify Checklist:**
- [ ] Custom UI loads (check browser console for errors)
- [ ] Login form appears correctly
- [ ] Bloom colors and styling are visible
- [ ] Sign-in button works
- [ ] After login, redirect back to app works

## Troubleshooting

### Custom UI not loading?
1. Check CORS is configured correctly
2. Verify the URL is publicly accessible: 
   - Open `https://your-url.azurestaticapps.net/azure-b2c/unified.html` in browser
3. Check browser console for CORS errors

### Styles not applying?
1. Clear browser cache
2. Try incognito/private mode
3. Check that CSS is inline in unified.html (external CSS won't work)

### Form not submitting?
1. Ensure `<div id="api"></div>` is present in unified.html
2. Don't modify Azure's injected form elements
3. Check browser console for JavaScript errors

## Quick Commands to Get Your URL

```bash
# If using Azure CLI, get your Static Web Apps URL:
az staticwebapp show \
  --name [your-static-web-app-name] \
  --resource-group rg-lpa-unified \
  --query "defaultHostname" \
  --output tsv
```

## Alternative: Using Azure Portal GUI Only

1. **Get your Static Web App URL:**
   - Azure Portal → Static Web Apps → Your app → Overview
   - Copy the URL (looks like: `https://delightfulglacier-xxxxx.azurestaticapps.net`)

2. **Configure B2C:**
   - Azure Portal → Azure Active Directory B2C
   - User flows → B2C_1_signupsignin1 (or your flow name)
   - Page layouts → Unified sign-up or sign-in page
   - Toggle "Use custom page content" → YES
   - Custom page URI: `[your-static-web-app-url]/azure-b2c/unified.html`
   - Save

3. **Add CORS:**
   - Same page, scroll to CORS
   - Add: `[your-static-web-app-url]`
   - Add: `http://localhost:5173` (for dev)
   - Save

## Expected Result

When users click "Sign In" in your Bloom app, they'll see:
- 🌸 Bloom logo with flower icon
- "Welcome back" heading
- Sage green color scheme
- Botanical background pattern
- "Care for people, not paperwork" tagline
- Clean, Miyazaki-inspired design

---

**Status:** Custom UI deployed ✅  
**Next:** Configure Azure AD B2C in Portal  
**Time:** ~5 minutes
