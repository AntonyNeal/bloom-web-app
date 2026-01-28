# Azure AD B2C Custom Branding - Bloom Design System

This directory contains custom HTML/CSS templates for Azure AD B2C login pages that match the Bloom design aesthetic (Miyazaki/Studio Ghibli inspired).

## Files

- `unified.html` - Custom login/signup page with Bloom branding

## Design Features

✅ **Botanical Color Palette**
- Sage green (#6B8E7F) - Primary
- Fern green (#8FA892) - Accents
- Warm cream (#FAF7F2) - Background
- Forest green (#3D5A4C) - Text

✅ **Miyazaki-Inspired Elements**
- Soft, organic gradients
- Gentle botanical patterns
- Rounded corners (8px, 16px)
- Soft shadows
- "Care for people, not paperwork" tagline

✅ **Accessibility**
- AAA contrast ratios
- Keyboard navigation support
- Focus visible states
- Responsive design (mobile-first)

## Setup Instructions

### Step 1: Host the Custom UI

The files need to be publicly accessible via HTTPS. **Option A (Recommended): Use Static Web Apps**

1. The files are in `apps/bloom/public/azure-b2c/`
2. When deployed, they'll be available at:
   ```
   https://your-bloom-app.azurestaticapps.net/azure-b2c/unified.html
   ```

**Option B: Use Azure Blob Storage**

```bash
# Create storage account (if needed)
az storage account create \
  --name bloomadb2cui \
  --resource-group rg-lpa-unified \
  --location australiaeast \
  --sku Standard_LRS

# Create container
az storage container create \
  --name b2c-ui \
  --account-name bloomadb2cui \
  --public-access blob

# Upload files
az storage blob upload-batch \
  --account-name bloomadb2cui \
  --destination b2c-ui \
  --source ./apps/bloom/public/azure-b2c/
```

### Step 2: Configure Azure AD B2C

1. **Go to Azure Portal** → Azure AD B2C tenant
   - Tenant: `LifePsychologyAustralia138.onmicrosoft.com`

2. **Navigate to Company Branding** (or User Flows → your flow → Page layouts)

3. **Enable Custom Page Content**
   - Sign-in page URL: `https://your-app.azurestaticapps.net/azure-b2c/unified.html`
   - Sign-up page URL: `https://your-app.azurestaticapps.net/azure-b2c/unified.html`

4. **CORS Configuration** (Critical!)
   
   In Azure AD B2C → User Flows → Properties → Page Layout:
   - Check "Use custom page content"
   - Add your domain to allowed CORS origins:
     - `https://your-bloom-app.azurestaticapps.net`
     - `http://localhost:5173` (for development)

### Step 3: Test the Custom UI

1. Trigger a login from your app
2. Verify the Bloom branding appears
3. Test all flows:
   - Sign in
   - Sign up (if enabled)
   - Password reset
   - Multi-factor authentication

## Customization

### Update Colors

Edit the CSS variables in `unified.html`:

```css
:root {
    --bloom-sage: #6B8E7F;
    --bloom-fern: #8FA892;
    --bloom-cream: #FAF7F2;
    --bloom-forest: #3D5A4C;
    /* ... */
}
```

### Update Logo

Replace the emoji with your actual logo:

```html
<span class="logo-icon">🌸</span>
<!-- Replace with: -->
<img src="https://your-cdn.com/bloom-logo.svg" alt="Bloom" width="36" height="36">
```

### Update Text

Change the welcome message:

```html
<h1 class="title">Welcome back</h1>
<p class="subtitle">Sign in to your practitioner account</p>
```

## Troubleshooting

**Problem: Custom UI not loading**
- ✅ Check HTTPS (Azure AD B2C requires HTTPS)
- ✅ Verify CORS is configured correctly
- ✅ Check browser console for errors
- ✅ Ensure URL is publicly accessible

**Problem: Styles not applying**
- ✅ Inline CSS only (Azure AD B2C doesn't support external CSS)
- ✅ Check for CSS specificity conflicts
- ✅ Test in incognito/private mode

**Problem: Form not working**
- ✅ Keep `<div id="api"></div>` intact - Azure injects the form here
- ✅ Don't modify Azure's form HTML structure

## Azure AD B2C API Container

Azure AD B2C injects the actual form into the `<div id="api"></div>` container. The injected elements include:

- Email/username input
- Password input
- "Keep me signed in" checkbox
- Sign-in button
- "Forgot password?" link
- Social identity provider buttons (if configured)

Your custom CSS will style these injected elements automatically.

## Production Checklist

- [ ] Custom UI hosted on HTTPS
- [ ] CORS configured in Azure AD B2C
- [ ] Tested on desktop browsers (Chrome, Firefox, Safari, Edge)
- [ ] Tested on mobile (iOS Safari, Chrome)
- [ ] All user flows tested (sign-in, sign-up, password reset)
- [ ] Accessibility validated (WCAG AA minimum)
- [ ] Brand logo added (replace emoji)
- [ ] Content reviewed by stakeholders

## Resources

- [Azure AD B2C Custom Page Content](https://learn.microsoft.com/en-us/azure/active-directory-b2c/customize-ui)
- [Page Layout Versions](https://learn.microsoft.com/en-us/azure/active-directory-b2c/page-layout)
- [CORS Configuration](https://learn.microsoft.com/en-us/azure/active-directory-b2c/customize-ui-with-html)

---

**Last Updated**: January 28, 2026  
**Design System**: Bloom (Miyazaki/Ghibli inspired)  
**Maintained By**: Bloom Development Team
