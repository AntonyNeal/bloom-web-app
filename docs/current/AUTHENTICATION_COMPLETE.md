# Authentication Setup - Phase 1 Complete ✅

## Overview
Azure AD B2C authentication is fully implemented and deployed for the Bloom web application.

## Components

### 1. ProtectedRoute Component
**Location**: `src/components/common/ProtectedRoute.tsx`

**Features**:
- ✅ Checks authentication status via MSAL `useIsAuthenticated()`
- ✅ Shows loading spinner while auth initializes
- ✅ Redirects to landing page if not authenticated
- ✅ Preserves attempted URL in location state for post-login redirect
- ✅ Logs access attempts for debugging

**Usage**:
```tsx
<Route path="/admin/dashboard" element={
  <ProtectedRoute>
    <AdminDashboard />
  </ProtectedRoute>
} />
```

### 2. useAuth Hook
**Location**: `src/hooks/useAuth.ts`

**API**:
```typescript
const {
  isAuthenticated,  // boolean - user logged in
  user,            // AccountInfo | null - user profile
  login,           // () => Promise<void> - redirect to login
  logout,          // () => Promise<void> - sign out
  getAccessToken,  // () => Promise<string | null> - get token
  isLoading,       // boolean - auth initializing
} = useAuth();
```

### 3. AuthProvider
**Location**: `src/features/auth/AuthProvider.tsx`

Wraps the entire app in MSAL context. Already configured in `main.tsx`.

### 4. Auth Config
**Location**: `src/config/authConfig.ts`

**Azure AD B2C Configuration**:
- **Tenant ID**: `21f0abde-bd22-47bb-861a-64428079d129`
- **Client ID**: `fcf9e695-e0a4-4e4f-aa2d-a7c0a6e3eaba`
- **Domain**: `LifePsychologyAustralia138.onmicrosoft.com`
- **Authority**: `https://login.microsoftonline.com/21f0abde-bd22-47bb-861a-64428079d129`

**Redirect URIs** (configured in Azure Portal):
- `http://localhost:5173/auth/callback` (development)
- `https://yellow-cliff-0eb1c4000.3.azurestaticapps.net/auth/callback` (staging)
- `https://bloom.life-psychology.com.au/auth/callback` (production)

**API Permissions** (Microsoft Graph):
- `openid` - User sign-in
- `profile` - User profile
- `email` - Email address
- `User.Read` - Read user data
- `offline_access` - Refresh tokens

**Implicit Grant**:
- ✅ ID tokens enabled
- ✅ Access tokens enabled

## Protected Routes

All admin routes are secured with `ProtectedRoute` wrapper:

### Current Protected Routes:
1. `/admin` - Admin dashboard (temporary)
2. `/admin/dashboard` - Main admin dashboard
3. `/admin/applications` - Application management
4. `/admin/applications/:id` - Individual application detail
5. `/bloom` - Practitioner portal

### Public Routes:
- `/` - Landing page (shows login prompt if redirected from protected route)
- `/join-us` - Application form
- `/auth/callback` - Azure AD redirect handler
- `/design-test` - Design system testing

## Authentication Flow

### Successful Login:
1. User clicks "Bloom" button on landing page
2. `BloomLoginButton` calls `login()` from `useAuth()`
3. User redirects to Microsoft login page
4. User authenticates with Azure AD
5. Microsoft redirects to `/auth/callback`
6. `AuthCallback` component processes the response
7. User navigates to `/admin/dashboard`
8. `ProtectedRoute` verifies authentication
9. Dashboard renders successfully

### Blocked Access (Not Authenticated):
1. User navigates directly to `/admin/dashboard`
2. `ProtectedRoute` checks `isAuthenticated` (false)
3. Shows loading spinner while `isLoading` is true
4. Redirects to `/` with state `{ authRequired: true, from: '/admin/dashboard' }`
5. Landing page shows toast: "Authentication Required - Please log in to access that page"
6. User clicks "Bloom" button to log in
7. After successful auth, can navigate back to attempted URL

### Already Authenticated:
1. User clicks "Bloom" button
2. `BloomLoginButton` detects `isAuthenticated === true`
3. Immediately navigates to `/admin/dashboard`
4. No redirect to Microsoft login

## Azure CLI Configuration

**Location**: `azure-cli-config.sh`

Complete script to configure Azure AD app registration:

```bash
# Login
az login --tenant 21f0abde-bd22-47bb-861a-64428079d129

# Enable implicit grant
az ad app update --id fcf9e695-e0a4-4e4f-aa2d-a7c0a6e3eaba \
  --enable-id-token-issuance true \
  --enable-access-token-issuance true

# Add API permissions
az ad app permission add --id fcf9e695-e0a4-4e4f-aa2d-a7c0a6e3eaba \
  --api 00000003-0000-0000-c000-000000000000 \
  --api-permissions \
    37f7f235-527c-4136-accd-4a02d197296e=Scope \
    14dad69e-099b-42c9-810b-d002981feec1=Scope \
    64a6cdd6-aab1-4aaf-94b8-3cc8405e90d0=Scope \
    e1fe6dd8-ba31-4d61-89e7-88639da4683d=Scope \
    7427e0e9-2fba-42fe-b0c0-848c9e6a8182=Scope

# Grant admin consent
az ad app permission admin-consent --id fcf9e695-e0a4-4e4f-aa2d-a7c0a6e3eaba
```

**Status**: ✅ All commands executed successfully on October 21, 2025

## Testing

### Local Testing:
```bash
npm run dev
# Opens http://localhost:5174
```

1. Navigate to landing page
2. Click "Bloom" button
3. Should redirect to Microsoft login (if not logged in)
4. Authenticate with Azure AD credentials
5. Should redirect to `/admin/dashboard`
6. Dashboard should render

### Production Testing:
1. Navigate to `https://bloom.life-psychology.com.au`
2. Click "Bloom" button
3. Complete authentication flow
4. Verify dashboard loads

### Cache Issues:
If users see infinite spinner or 404 errors:
- **iPhone Safari**: Settings → Safari → Clear History and Website Data
- **iPhone Chrome**: Chrome menu → History → Clear Browsing Data
- **Desktop**: Hard refresh with Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)

## Security Features

✅ **Route Protection**: All admin routes require authentication
✅ **Token Validation**: MSAL validates tokens automatically
✅ **Silent Refresh**: Tokens refresh automatically via `acquireTokenSilent()`
✅ **Secure Storage**: Tokens stored in browser sessionStorage
✅ **HTTPS Only**: Production enforces HTTPS
✅ **Admin Consent**: All API permissions have admin consent granted

## Environment Variables

**Development** (`.env.local`):
```env
VITE_AZURE_CLIENT_ID=fcf9e695-e0a4-4e4f-aa2d-a7c0a6e3eaba
VITE_AZURE_TENANT_ID=21f0abde-bd22-47bb-861a-64428079d129
VITE_REDIRECT_URI=http://localhost:5173/auth/callback
```

**Production** (Azure Static Web Apps Configuration):
```env
VITE_AZURE_CLIENT_ID=fcf9e695-e0a4-4e4f-aa2d-a7c0a6e3eaba
VITE_AZURE_TENANT_ID=21f0abde-bd22-47bb-861a-64428079d129
VITE_REDIRECT_URI=https://bloom.life-psychology.com.au/auth/callback
```

## Bundle Impact

**Before Authentication**: ~315 KB
**After Authentication**: ~435 KB (+120 KB)
**Gzipped**: ~120 KB

**Dependencies Added**:
- `@azure/msal-browser`: 3.30.0 (~80 KB)
- `@azure/msal-react`: 2.2.0 (~40 KB)

## Deployment Status

✅ **Azure AD App Registration**: Fully configured
✅ **Code Deployed**: October 21, 2025
✅ **Routes Protected**: All admin routes secured
✅ **Production Tested**: Authentication flow working
✅ **Documentation**: Complete

## Next Steps (Future Enhancements)

### Phase 2 - Role-Based Access:
- Add role claims to Azure AD tokens
- Implement role checking in ProtectedRoute
- Different dashboards for different user types

### Phase 3 - Profile Management:
- User profile page showing Azure AD info
- Update profile settings
- Manage notification preferences

### Phase 4 - API Integration:
- Use access tokens to call backend APIs
- Secure API endpoints with token validation
- Implement refresh token flow

## Troubleshooting

### "No routes matched location /admin/dashboard"
**Solution**: Route was missing, now added. Clear cache and refresh.

### Infinite spinner on landing page
**Solution**: Old broken version cached. Clear browser cache.

### "Authentication Required" toast doesn't show
**Solution**: Check that useToast is imported in App.tsx and Toaster is rendered.

### User redirected to login but no prompt
**Solution**: Toast notification shows on landing page. User should click "Bloom" button.

## Support

For Azure AD configuration issues:
- Azure Portal: https://portal.azure.com
- App Registration: "Bloom Web App" (ID: fcf9e695-e0a4-4e4f-aa2d-a7c0a6e3eaba)
- Admin: admin@life-psychology.com.au

For code issues:
- GitHub: https://github.com/AntonyNeal/bloom-web-app
- Branch: main
- Documentation: This file

---

**Last Updated**: October 21, 2025
**Status**: ✅ Production Ready
**Phase**: 1 - Complete
