# Bloom Project - Azure AD Authentication Setup Instructions

**Tenant ID:** `21f0abde-bd22-47bb-861a-64428079d129`  
**Client ID:** `fcf9e695-e0a4-4e4f-aa2d-a7c0a6e3eaba`  
**App Name:** Bloom PlatformAccounts

---

## 📋 Instructions for Bloom Project Setup

Execute these steps **in the Bloom project directory** (NOT in life-psychology-frontend).

---

## Step 1: Create Environment Files

Create or update these three files in the **Bloom project root**:

### `.env.production`

```env
# Azure AD B2C Configuration - Production
VITE_B2C_CLIENT_ID=fcf9e695-e0a4-4e4f-aa2d-a7c0a6e3eaba
VITE_B2C_TENANT_ID=21f0abde-bd22-47bb-861a-64428079d129
VITE_B2C_TENANT_NAME=LifePsychologyAustralia138
VITE_B2C_TENANT_DOMAIN=LifePsychologyAustralia138.onmicrosoft.com
VITE_B2C_AUTHORITY=https://login.microsoftonline.com/21f0abde-bd22-47bb-861a-64428079d129
VITE_B2C_REDIRECT_URI=https://bloom.life-psychology.com.au/auth/callback
VITE_B2C_POST_LOGOUT_REDIRECT_URI=https://bloom.life-psychology.com.au
VITE_B2C_SCOPES=openid profile email User.Read
VITE_B2C_ENABLED=true
```

### `.env.staging`

```env
# Azure AD B2C Configuration - Staging
VITE_B2C_CLIENT_ID=fcf9e695-e0a4-4e4f-aa2d-a7c0a6e3eaba
VITE_B2C_TENANT_ID=21f0abde-bd22-47bb-861a-64428079d129
VITE_B2C_TENANT_NAME=LifePsychologyAustralia138
VITE_B2C_TENANT_DOMAIN=LifePsychologyAustralia138.onmicrosoft.com
VITE_B2C_AUTHORITY=https://login.microsoftonline.com/21f0abde-bd22-47bb-861a-64428079d129
VITE_B2C_REDIRECT_URI=https://red-desert-03b29ff00.1.azurestaticapps.net/auth/callback
VITE_B2C_POST_LOGOUT_REDIRECT_URI=https://red-desert-03b29ff00.1.azurestaticapps.net
VITE_B2C_SCOPES=openid profile email User.Read
VITE_B2C_ENABLED=true
```

### `.env.development`

```env
# Azure AD B2C Configuration - Development
VITE_B2C_CLIENT_ID=fcf9e695-e0a4-4e4f-aa2d-a7c0a6e3eaba
VITE_B2C_TENANT_ID=21f0abde-bd22-47bb-861a-64428079d129
VITE_B2C_TENANT_NAME=LifePsychologyAustralia138
VITE_B2C_TENANT_DOMAIN=LifePsychologyAustralia138.onmicrosoft.com
VITE_B2C_AUTHORITY=https://login.microsoftonline.com/21f0abde-bd22-47bb-861a-64428079d129
VITE_B2C_REDIRECT_URI=http://localhost:5173/auth/callback
VITE_B2C_POST_LOGOUT_REDIRECT_URI=http://localhost:5173
VITE_B2C_SCOPES=openid profile email User.Read
VITE_B2C_ENABLED=true
```

---

## Step 2: Install MSAL Packages

Run in the **Bloom project directory**:

```bash
npm install @azure/msal-browser @azure/msal-react
```

Or if using yarn:

```bash
yarn add @azure/msal-browser @azure/msal-react
```

---

## Step 3: Add Missing Redirect URIs in Azure Portal

⚠️ **IMPORTANT:** Currently only one redirect URI is configured. You need to add the others.

### Instructions:

1. Open **Azure Portal:** https://portal.azure.com

2. Navigate to: **Azure Active Directory** → **App registrations**

3. Click on **"Bloom PlatformAccounts"**

4. Click **"Authentication"** in the left menu

5. Under **"Single-page application"** section, click **"+ Add URI"**

6. Add these two additional URIs:
   - `https://red-desert-03b29ff00.1.azurestaticapps.net/auth/callback` (for staging)
   - `http://localhost:5173/auth/callback` (for local development)

7. Click **"Save"** at the bottom

### Current Configuration:

- ✅ `https://bloom.life-psychology.com.au/auth/callback` (already configured)
- ⚠️ `https://red-desert-03b29ff00.1.azurestaticapps.net/auth/callback` (needs to be added)
- ⚠️ `http://localhost:5173/auth/callback` (needs to be added)

---

## Step 4: Verify API Permissions

In the same Azure Portal app registration:

1. Click **"API permissions"** in the left menu

2. Verify these permissions are granted:
   - ✅ Microsoft Graph → **openid**
   - ✅ Microsoft Graph → **email**
   - ✅ Microsoft Graph → **profile**
   - ✅ Microsoft Graph → **User.Read**
   - ✅ Microsoft Graph → **offline_access**

3. If any are missing:
   - Click **"+ Add a permission"**
   - Select **"Microsoft Graph"**
   - Select **"Delegated permissions"**
   - Search for and check the missing permissions
   - Click **"Add permissions"**
   - Click **"✓ Grant admin consent for [tenant]"**

---

## Step 5: Send Me the Bloom Project Information

Once you've completed Steps 1-4, I need to see your Bloom project structure to create the authentication code.

### Option A: Send Project Structure (Windows)

In the Bloom project directory, run:

```powershell
tree /F /A > bloom-project-structure.txt
```

Then send me the `bloom-project-structure.txt` file.

### Option B: Send Key Files

Send me these files from the Bloom project:

1. `package.json` - So I can see what frameworks/libraries you're using
2. Main app file - Usually one of these:
   - `src/App.tsx` or `src/App.jsx`
   - `src/main.tsx` or `src/main.jsx`
   - `src/index.tsx` or `src/index.jsx`
3. Routing setup - If you have a router file (e.g., `src/router.tsx`, `src/routes.tsx`)
4. `.gitignore` - To ensure we don't commit sensitive files

### Option C: Quick Info

Just tell me:

1. What framework? (React, Next.js, Vue, etc.)
2. What language? (TypeScript or JavaScript)
3. What router? (React Router, Next.js router, none)
4. Project structure convention? (e.g., `src/components/`, `src/pages/`, etc.)

---

## Step 6: What I'll Create For You

Once I see your Bloom project information, I'll provide complete code files for:

### Authentication Setup:

1. **`src/config/authConfig.ts`** - MSAL configuration
2. **`src/contexts/AuthContext.tsx`** - Authentication context provider
3. **`src/components/auth/LoginButton.tsx`** - Login button component
4. **`src/components/auth/LogoutButton.tsx`** - Logout button component
5. **`src/components/auth/ProtectedRoute.tsx`** - Protected route wrapper
6. **`src/hooks/useAuth.ts`** - Custom authentication hook

### Integration Files:

7. Updated **main App file** with MSAL provider
8. Updated **router** with protected routes (if applicable)
9. Example **protected page** component

### Documentation:

10. **Integration guide** - Step-by-step how to integrate into your app
11. **Testing guide** - How to test authentication locally
12. **Deployment notes** - What to check before deploying

---

## Step 7: Testing Checklist

After integration, you'll test:

- [ ] Local development login works (`http://localhost:5173`)
- [ ] Login redirects to Microsoft login page
- [ ] After login, redirects back to your app
- [ ] User information displays correctly
- [ ] Logout works and clears session
- [ ] Protected routes block unauthenticated users
- [ ] Refresh token works (stay logged in after page refresh)

---

## Summary Checklist

**Your Tasks:**

- [ ] Step 1: Create 3 `.env` files in Bloom project ✅
- [ ] Step 2: Install MSAL packages (`npm install @azure/msal-browser @azure/msal-react`) ✅
- [ ] Step 3: Add 2 missing redirect URIs in Azure Portal ✅
- [ ] Step 4: Verify API permissions in Azure Portal ✅
- [ ] Step 5: Send me Bloom project structure/info ✅

**My Tasks (after you complete above):**

- [ ] Step 6: Create all authentication code files
- [ ] Step 6: Provide integration instructions
- [ ] Step 7: Help you test authentication

---

## Important Notes

### Security:

- ✅ `.env` files should be in `.gitignore`
- ✅ Never commit Client ID or Tenant ID to public repos (okay for private repos)
- ✅ Use environment variables for all sensitive data

### Support:

- This uses **Azure AD** (not Azure AD B2C), which is simpler but less customizable
- Good for internal apps or simple login requirements
- For customer-facing apps with custom branding, you may want proper B2C later

### Next Steps:

- After authentication works, we can add user profile features
- Can integrate with your backend API for authorization
- Can add role-based access control if needed

---

## Questions?

If you get stuck on any step, let me know and I'll help troubleshoot!

Once you've completed Steps 1-4 and sent me the Bloom project info, I'll create all the code you need. 🚀
