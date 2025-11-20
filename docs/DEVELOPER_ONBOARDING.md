# Developer Onboarding Guide

Welcome to the Life Psychology monorepo! This guide will help you get set up and productive quickly.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js**: Version 20.19.0 or higher
- **pnpm**: Version 9.0.0 or higher
- **Git**: Latest version
- **VS Code**: Recommended IDE with extensions:
  - ESLint
  - Prettier
  - TypeScript and JavaScript Language Features
  - Tailwind CSS IntelliSense

### Optional Tools
- **Azure CLI**: For deployment operations
- **Azure Functions Core Tools**: For local function development
- **GitHub CLI**: For easier GitHub operations

## Repository Structure

```
bloom-web-app/
├── apps/
│   ├── website/          # Public-facing Life Psychology website
│   ├── bloom/            # Admin practitioner portal
│   └── bloom/api/        # Azure Functions API for Bloom
├── packages/
│   ├── shared-ui/        # Reusable UI components (shadcn/ui)
│   ├── shared-types/     # Shared TypeScript interfaces
│   ├── shared-utils/     # Common utilities
│   ├── azure-config/     # MSAL authentication config
│   └── db-migrations/    # Database migration system
├── migrations/
│   ├── sql/              # Azure SQL migrations
│   └── cosmos/           # Cosmos DB migrations
├── docs/                 # Documentation
└── .github/workflows/    # CI/CD pipelines
```

## Initial Setup

### 1. Clone the Repository

```bash
git clone https://github.com/AntonyNeal/bloom-web-app.git
cd bloom-web-app
```

### 2. Install pnpm

```bash
npm install -g pnpm@9
```

### 3. Install Dependencies

```bash
# Install all workspace dependencies
pnpm install
```

This will install dependencies for all apps and packages in the monorepo.

### 4. Configure Environment Variables

#### Website Environment Variables

Create `apps/website/.env.development`:

```env
# Analytics
VITE_GA_MEASUREMENT_ID=G-XGGBRLPBKK
VITE_GOOGLE_ADS_ID=AW-123456789

# Booking
VITE_BOOKING_URL=https://halaxy.com/book/...

# Azure Functions
VITE_AZURE_FUNCTION_URL=http://localhost:7071/api

# Feature Flags
VITE_ASSESSMENT_ENABLED=false
VITE_CHAT_ENABLED=false

# Application Insights
VITE_APP_INSIGHTS_CONNECTION_STRING=InstrumentationKey=...
```

#### Bloom Environment Variables

Create `apps/bloom/.env.development`:

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

#### Database Migration Environment Variables

Create `packages/db-migrations/.env`:

```env
# Azure SQL Database
AZURE_SQL_SERVER=lpa-applications-db.database.windows.net
AZURE_SQL_DATABASE=lpa-applications
AZURE_SQL_USER=admin-user
AZURE_SQL_PASSWORD=your-password

# Or use connection string
AZURE_SQL_CONNECTION_STRING=Server=tcp:...

# Cosmos DB
COSMOS_DB_ENDPOINT=https://your-account.documents.azure.com:443/
COSMOS_DB_KEY=your-key
COSMOS_DB_DATABASE=lpa-ab-testing
```

### 5. Build Shared Packages

```bash
# Build the migration system
pnpm --filter @life-psychology/db-migrations build
```

### 6. Run Database Migrations (Optional)

⚠️ **Only if you have database access**

```bash
# Check migration status
pnpm migrate:status

# Run pending migrations
pnpm migrate
```

## Development Workflow

### Starting Development Servers

#### Website (Port 5173)
```bash
pnpm dev:website
```

Visit: http://localhost:5173

#### Bloom Admin Portal (Port 5174)
```bash
pnpm dev:bloom
```

Visit: http://localhost:5174

#### Azure Functions (Port 7071)
```bash
cd apps/bloom/api
pnpm start
```

Visit: http://localhost:7071/api

### Common Commands

```bash
# Install a dependency to specific workspace
pnpm --filter website add axios
pnpm --filter bloom add react-query

# Run scripts in specific workspace
pnpm --filter website build
pnpm --filter bloom test

# Run command in all workspaces
pnpm -r build
pnpm -r test

# Clean all node_modules
pnpm -r clean
rm -rf node_modules
pnpm install
```

## Development Tasks

### Adding a New Feature

1. **Create a branch**:
   ```bash
   git checkout -b feature/my-new-feature
   ```

2. **Make changes** in the appropriate app/package

3. **Run tests**:
   ```bash
   pnpm test
   pnpm type-check
   pnpm lint
   ```

4. **Commit changes**:
   ```bash
   git add .
   git commit -m "feat: add new feature"
   ```

5. **Push and create PR**:
   ```bash
   git push origin feature/my-new-feature
   ```

### Adding a Shared Component

```bash
# Add to shared-ui package
cd packages/shared-ui/src/components

# Create new component
# MyComponent.tsx

# Export from index
# packages/shared-ui/src/index.ts
export { MyComponent } from './components/MyComponent';

# Use in apps
import { MyComponent } from '@shared/ui';
```

### Creating a Database Migration

```bash
# Create new SQL migration
pnpm migrate:create "add user preferences table" --type sql --author "your-name"

# Edit the generated file
# migrations/sql/TIMESTAMP_add_user_preferences_table.ts

# Run the migration
pnpm migrate

# Rollback if needed
pnpm migrate:down
```

### Adding API Endpoints

```bash
# Navigate to Azure Functions
cd apps/bloom/api

# Create new function
mkdir src/my-function
touch src/my-function/index.ts

# Add function configuration
# Add to function.json

# Test locally
pnpm start
```

## Testing

### Unit Tests

```bash
# Run all unit tests
pnpm -r test

# Run tests for specific app
pnpm --filter website test
pnpm --filter bloom test
```

### E2E Tests (Website)

```bash
# Run Playwright tests
pnpm --filter website test

# Visual regression tests
pnpm --filter website test:visual

# A/B testing visual regression
pnpm --filter website test:visual:ab

# Interactive mode
pnpm --filter website test:ui
```

### Type Checking

```bash
# Check all projects
pnpm -r type-check

# Check specific project
pnpm --filter website type-check
```

### Linting

```bash
# Lint all projects
pnpm -r lint

# Auto-fix issues
pnpm -r lint:fix

# Format code
pnpm -r format
```

## Building for Production

### Build All Projects

```bash
pnpm -r build
```

### Build Specific Projects

```bash
# Website
pnpm build:website

# Bloom
pnpm build:bloom

# Azure Functions
cd apps/bloom/api
pnpm build
```

## Deployment

### Automatic Deployment

Changes are automatically deployed via GitHub Actions:

- **Staging**: Push to `staging` branch
- **Production**: Push to `main` branch

### Manual Deployment

```bash
# Website to staging
swa deploy apps/website/dist --env staging

# Bloom to production
swa deploy apps/bloom/dist --env production

# Azure Functions
cd apps/bloom/api
func azure functionapp publish lpa-bloom-api-prod
```

## Troubleshooting

### Common Issues

#### pnpm install fails

```bash
# Clear pnpm cache
pnpm store prune

# Remove node_modules
rm -rf node_modules apps/*/node_modules packages/*/node_modules

# Reinstall
pnpm install
```

#### TypeScript errors in VS Code

1. Reload VS Code window (Cmd/Ctrl + Shift + P → "Reload Window")
2. Ensure workspace TypeScript version is selected
3. Check `tsconfig.json` extends correct base config

#### Build fails with path errors

```bash
# Ensure shared packages are built first
pnpm --filter @shared/* build
pnpm --filter @life-psychology/db-migrations build

# Then build apps
pnpm build:website
pnpm build:bloom
```

#### Azure Functions won't start

```bash
cd apps/bloom/api

# Install Azure Functions Core Tools
npm install -g azure-functions-core-tools@4

# Check local.settings.json exists
# Check host.json is valid
# Rebuild
pnpm build
pnpm start
```

#### Database migration fails

```bash
# Check connection strings
# Verify .env file exists in packages/db-migrations/
# Test connectivity
pnpm --filter @life-psychology/db-migrations migrate:status
```

### Getting Help

1. **Check documentation**: 
   - [Main README](../README.md)
   - [Monorepo Guide](../MONOREPO.md)
   - [Database Architecture](../DATABASE_ARCHITECTURE.md)
   - App-specific READMEs

2. **Review code examples**: Look at existing implementations

3. **Check GitHub issues**: Search for similar problems

4. **Ask the team**: Contact via Slack/Teams

## Project Conventions

### Code Style

- **TypeScript**: Strict mode enabled
- **Naming**: 
  - Components: PascalCase
  - Functions/variables: camelCase
  - Constants: UPPER_SNAKE_CASE
  - Types/Interfaces: PascalCase
- **Files**: PascalCase for components, camelCase for utilities

### Commit Messages

Follow conventional commits:

```
feat: add new booking feature
fix: resolve navigation bug
docs: update README
style: format code
refactor: restructure service layer
test: add unit tests for API
chore: update dependencies
```

### Branch Naming

```
feature/feature-name
bugfix/issue-description
hotfix/critical-fix
refactor/code-improvement
docs/documentation-update
```

### Component Structure

```tsx
// Imports grouped by type
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@shared/ui';
import { log } from '../utils/logger';
import type { MyType } from '../types';

// Props interface
interface MyComponentProps {
  title: string;
  onClose: () => void;
}

// Component
export function MyComponent({ title, onClose }: MyComponentProps) {
  // State
  const [isOpen, setIsOpen] = useState(false);
  
  // Effects
  useEffect(() => {
    log.info('Component mounted', 'MyComponent');
  }, []);
  
  // Render
  return (
    <div>
      <h1>{title}</h1>
      <Button onClick={onClose}>Close</Button>
    </div>
  );
}
```

### Service Layer Pattern

```typescript
// Service class
export class MyService {
  private static instance: MyService;
  
  static getInstance(): MyService {
    if (!this.instance) {
      this.instance = new MyService();
    }
    return this.instance;
  }
  
  async myMethod(): Promise<Result> {
    // Implementation
  }
}

// Export singleton instance
export const myService = MyService.getInstance();
```

## Useful Resources

### Documentation
- [React Documentation](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Vite Guide](https://vitejs.dev/guide/)
- [pnpm Workspaces](https://pnpm.io/workspaces)

### Tools
- [Azure Portal](https://portal.azure.com)
- [Azure Functions Documentation](https://docs.microsoft.com/azure/azure-functions/)
- [Playwright Documentation](https://playwright.dev)
- [shadcn/ui Components](https://ui.shadcn.com)

### Internal
- GitHub Repository: https://github.com/AntonyNeal/bloom-web-app
- Staging Website: https://red-desert-03b29ff00.1.azurestaticapps.net
- Production Website: https://life-psychology.com.au

## Next Steps

After completing setup:

1. ✅ Read app-specific READMEs
2. ✅ Explore the codebase
3. ✅ Run all development servers
4. ✅ Make a small change to verify setup
5. ✅ Review open issues/PRs
6. ✅ Ask questions!

---

**Welcome to the team! Happy coding! 🚀**

**Last Updated**: November 20, 2025
