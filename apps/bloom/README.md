# Bloom - Practitioner Portal

## Overview

Bloom is the administrative portal for Life Psychology Australia's practitioner recruitment and management system. It provides tools for reviewing applications, managing practitioner profiles, and handling the onboarding process.

## Getting Started

### Prerequisites
- Node.js 20+
- pnpm 9+
- Access to Azure resources (AD authentication)

### Development

```bash
# From repository root
pnpm dev:bloom

# Or from this directory
pnpm dev
```

Visit: http://localhost:5174

### Build for Production

```bash
pnpm build:bloom
```

## Architecture

### Key Technologies
- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite 5
- **Styling**: Tailwind CSS + shadcn/ui components
- **Authentication**: Azure MSAL (@azure/msal-react)
- **State Management**: Redux Toolkit + React Query v4
- **Routing**: React Router v6
- **Forms**: React Hook Form + Zod validation

### Shared Packages
- `@shared/ui` - Reusable UI components (Button, Toast, etc.)
- `@shared/types` - TypeScript type definitions
- `@shared/utils` - Common utilities (cn helper)
- `@shared/azure` - MSAL authentication configuration

### Project Structure

```
src/
├── app/                    # Application setup
├── assets/                 # Images, icons
├── components/             # React components
├── config/                 # App configuration
├── contexts/               # React contexts
├── design-system/          # Design system documentation
├── features/               # Feature modules
│   └── auth/              # Authentication feature
├── hooks/                  # Custom React hooks
├── lib/                    # Third-party library configurations
├── pages/                  # Page components
│   ├── Applications.tsx   # Application review dashboard
│   ├── Dashboard.tsx      # Main dashboard
│   ├── JoinUs.tsx        # Public application page
│   └── JoinUs.structure.ts # Join Us page specification
├── services/              # API service layer
├── styles/                # Global styles and animations
├── types/                 # TypeScript type definitions
└── utils/                 # Utility functions
```

## Features

### Current Implementation
- ✅ Azure AD Authentication (MSAL)
- ✅ Join Us application page
- ✅ Qualification check flow
- ✅ Application form submission
- ✅ Design system with shadcn/ui

### In Development
- ⚠️ Application review dashboard
- ⚠️ Practitioner profile management
- ⚠️ Document upload/review system
- ⚠️ Email notification system
- ⚠️ Application status workflow

## Environment Variables

Create `.env.development` in the `apps/bloom` directory:

```env
# Azure AD Authentication
VITE_AZURE_CLIENT_ID=your-client-id
VITE_AZURE_TENANT_ID=your-tenant-id
VITE_AZURE_REDIRECT_URI=http://localhost:5174

# API Endpoints
VITE_API_BASE_URL=http://localhost:7071/api

# Feature Flags
VITE_ENABLE_ANALYTICS=false
```

## Authentication

The application uses Microsoft Azure AD for authentication via MSAL:

```typescript
import { useMsal } from '@azure/msal-react';

function MyComponent() {
  const { instance, accounts } = useMsal();
  
  // Check if user is authenticated
  const isAuthenticated = accounts.length > 0;
  
  // Get user info
  const user = accounts[0];
}
```

Protected routes automatically redirect unauthenticated users to login.

## API Integration

API calls are handled through axios with React Query for caching:

```typescript
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

// Example API call
const { data, isLoading, error } = useQuery({
  queryKey: ['applications'],
  queryFn: async () => {
    const response = await axios.get('/api/applications');
    return response.data;
  },
});
```

## Styling

### Tailwind CSS
All components use Tailwind utility classes for styling:

```tsx
<div className="flex items-center justify-between p-4 bg-white rounded-lg shadow">
  <h2 className="text-xl font-semibold">Title</h2>
</div>
```

### shadcn/ui Components
Reusable components from shadcn/ui are available via `@shared/ui`:

```tsx
import { Button } from '@shared/ui';

<Button variant="primary" size="lg">
  Click Me
</Button>
```

### Custom Animations
Located in `src/styles/`:
- `animations.css` - General animations
- `blob.css` - Organic blob animations
- `component-animations.css` - Component-specific animations
- `flower-animations.css` - Flower/growth animations
- `landing-animations.css` - Landing page animations

## Testing

### Unit Tests (Coming Soon)

```bash
pnpm test
```

### Type Checking

```bash
pnpm type-check
```

### Linting

```bash
pnpm lint
```

## Deployment

### Azure Static Web Apps

The Bloom app is deployed to Azure Static Web Apps via GitHub Actions.

**Automatic Deployment**:
- Push to `main` → Production
- Push to `staging` → Staging environment

**Manual Deployment**:

```bash
# Build the application
pnpm build:bloom

# Deploy using Azure CLI
swa deploy apps/bloom/dist --env production
```

## Common Tasks

### Adding a New Page

1. Create component in `src/pages/MyPage.tsx`
2. Add route in `src/App.tsx`
3. Add navigation link if needed

### Creating a Form

```tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

const schema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
});

type FormData = z.infer<typeof schema>;

function MyForm() {
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = (data: FormData) => {
    console.log(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('name')} />
      {errors.name && <span>{errors.name.message}</span>}
      
      <button type="submit">Submit</button>
    </form>
  );
}
```

### Using Shared Types

```typescript
import { ApplicationDTO, ApplicationEntity } from '@shared/types';

const application: ApplicationDTO = {
  id: '123',
  firstName: 'John',
  lastName: 'Doe',
  // ...
};
```

## Performance Optimization

### Current Issues
The `main.tsx` file contains extensive performance logging that should be removed in production:

```typescript
// Remove in production
console.log('[PERF] main.tsx started loading at', perfStart);
```

### Recommendations
1. Implement lazy loading for routes
2. Code split large components
3. Use Application Insights for production monitoring
4. Remove console.log statements

## Troubleshooting

### Build Errors

```bash
# Clear cache and rebuild
rm -rf node_modules dist
pnpm install
pnpm build
```

### Authentication Issues

1. Verify Azure AD app registration
2. Check redirect URIs match exactly
3. Ensure tenant ID and client ID are correct
4. Clear browser cache/cookies

### TypeScript Errors

```bash
# Regenerate TypeScript cache
rm -rf node_modules/.cache
pnpm type-check
```

## Related Documentation

- [Main README](../../README.md) - Monorepo overview
- [Monorepo Guide](../../MONOREPO.md) - Workspace management
- [Database Architecture](../../DATABASE_ARCHITECTURE.md) - Database schema
- [Migration System](../../DB_MIGRATION_SYSTEM_READY.md) - Database migrations

## Contributing

### Code Style
- Use TypeScript for all new code
- Follow existing component patterns
- Use Tailwind CSS for styling
- Add proper type definitions
- Write meaningful commit messages

### Before Committing
```bash
pnpm lint
pnpm type-check
```

## Support

For questions or issues:
1. Check existing documentation
2. Review related GitHub issues
3. Contact the development team

---

**Last Updated**: November 20, 2025
**Version**: 0.0.0
**Status**: Active Development
