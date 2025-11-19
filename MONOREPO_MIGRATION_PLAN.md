# Monorepo Migration Plan: Bloom + Life Psychology Frontend

**Date:** November 20, 2025  
**Objective:** Integrate bloom-web-app into life-psychology-frontend repository as a monorepo

---

## Overview

This plan merges two related React applications into a single monorepo:

- **Life Psychology Frontend** - Patient-facing website with booking system
- **Bloom Web App** - Practitioner application management system (Proto-Bloom MVP)

Both applications share significant technology overlap and will benefit from code sharing and unified deployment.

---

## Current State Analysis

### bloom-web-app (Source)
```
bloom-web-app/
├── src/
│   ├── components/ui/          # shadcn/ui components
│   ├── components/common/      # Reusable components
│   ├── components/flowers/     # Bloom-specific visuals
│   ├── features/               # Feature modules
│   ├── pages/                  # Page components
│   ├── lib/                    # Utilities (cn helper)
│   └── types/                  # TypeScript types
├── api/                        # Azure Functions
├── package.json                # Vite + React + TypeScript
└── tailwind.config.js          # Bloom design system
```

**Key Dependencies:**
- React 18 + TypeScript
- Vite build tool
- shadcn/ui + Tailwind CSS
- Azure MSAL authentication
- Redux Toolkit + React Query
- Framer Motion
- Azure Functions backend

### life-psychology-frontend (Target)
```
life-psychology-frontend/
├── src/
│   ├── components/             # React components
│   ├── pages/                  # Page components
│   ├── services/               # API services
│   ├── utils/                  # Utilities
│   └── types/                  # TypeScript types
├── functions/                  # Azure Functions
├── package.json                # Vite + React + TypeScript
└── vite.config.ts              # Build configuration
```

**Key Dependencies:**
- React 18 + TypeScript
- Vite build tool
- Tailwind CSS
- React Router
- Axios for API calls
- Azure Functions backend

---

## Proposed Monorepo Structure

```
life-psychology-frontend/
├── apps/
│   ├── website/                    # Life Psychology patient-facing site
│   │   ├── src/
│   │   │   ├── components/
│   │   │   ├── pages/
│   │   │   ├── utils/
│   │   │   └── main.tsx
│   │   ├── public/
│   │   ├── index.html
│   │   ├── package.json
│   │   ├── vite.config.ts
│   │   ├── tailwind.config.js
│   │   └── tsconfig.json
│   │
│   └── bloom/                      # Bloom practitioner portal
│       ├── src/
│       │   ├── components/
│       │   ├── features/
│       │   ├── pages/
│       │   ├── design-system/
│       │   └── main.tsx
│       ├── public/
│       ├── index.html
│       ├── package.json
│       ├── vite.config.ts
│       ├── tailwind.config.js
│       └── tsconfig.json
│
├── packages/
│   ├── shared-ui/                  # Shared UI components
│   │   ├── src/
│   │   │   ├── components/
│   │   │   │   ├── Button.tsx
│   │   │   │   ├── Card.tsx
│   │   │   │   ├── Input.tsx
│   │   │   │   └── index.ts
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── shared-types/               # Shared TypeScript types
│   │   ├── src/
│   │   │   ├── api.ts
│   │   │   ├── user.ts
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── shared-utils/               # Shared utilities
│   │   ├── src/
│   │   │   ├── cn.ts             # Class name utility
│   │   │   ├── validators.ts
│   │   │   ├── formatters.ts
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── azure-config/               # Shared Azure configuration
│       ├── src/
│       │   ├── msal.ts
│       │   └── index.ts
│       ├── package.json
│       └── tsconfig.json
│
├── functions/
│   ├── website/                    # Life Psychology Azure Functions
│   │   ├── applications/
│   │   ├── src/
│   │   ├── host.json
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── bloom/                      # Bloom Azure Functions
│       ├── src/
│       ├── host.json
│       ├── package.json
│       └── tsconfig.json
│
├── .github/
│   └── workflows/
│       ├── website-deploy.yml      # Website CI/CD
│       ├── bloom-deploy.yml        # Bloom CI/CD
│       └── shared-packages.yml     # Shared package tests
│
├── docs/
│   ├── monorepo/
│   │   ├── README.md
│   │   ├── setup.md
│   │   └── development.md
│   ├── website/
│   └── bloom/
│
├── package.json                    # Root workspace config
├── pnpm-workspace.yaml            # pnpm workspace definition
├── turbo.json                     # Turborepo configuration (optional)
├── tsconfig.base.json             # Base TypeScript config
├── .eslintrc.js                   # Shared ESLint config
├── .prettierrc                    # Shared Prettier config
└── README.md                      # Monorepo documentation
```

---

## Shared Dependencies Analysis

### Can Be Shared Between Projects

#### UI Components (shadcn/ui based)
- ✅ Button, Card, Input, Label, Badge
- ✅ Toast/Toaster components
- ✅ Form components
- ⚠️ Note: May need theme customization per app

#### Utilities
- ✅ `cn()` - Class name merge utility
- ✅ Date formatters (date-fns)
- ✅ Validation utilities (zod)
- ✅ API client base configuration

#### TypeScript Types
- ✅ User/authentication types
- ✅ API response types
- ✅ Form validation types

#### Azure Configuration
- ✅ MSAL authentication setup
- ✅ Azure Functions shared helpers
- ✅ Storage/Blob utilities

### Must Remain Separate

#### Bloom-Specific
- ❌ Flower components (unique to Bloom)
- ❌ Admin dashboard features
- ❌ Application review system
- ❌ Bloom design tokens/theme

#### Website-Specific
- ❌ Patient booking system
- ❌ Landing page components
- ❌ Analytics tracking utilities
- ❌ Life Psychology branding/theme

---

## Migration Steps

### Phase 1: Repository Setup (Day 1)

#### 1.1 Clone and Backup
```bash
# Backup current bloom-web-app
cd c:\Repos
git clone https://github.com/AntonyNeal/bloom-web-app.git bloom-web-app-backup

# Clone target repository (staging branch)
git clone https://github.com/AntonyNeal/life-psychology-frontend.git
cd life-psychology-frontend
git checkout -b monorepo-migration
```

#### 1.2 Create Monorepo Structure
```bash
# Create apps directory
mkdir apps
mkdir apps\website
mkdir apps\bloom

# Create packages directory
mkdir packages
mkdir packages\shared-ui
mkdir packages\shared-types
mkdir packages\shared-utils
mkdir packages\azure-config

# Create functions structure
mkdir functions\bloom
```

#### 1.3 Initialize Workspace Configuration

Create `pnpm-workspace.yaml`:
```yaml
packages:
  - 'apps/*'
  - 'packages/*'
  - 'functions/*'
```

Create root `package.json`:
```json
{
  "name": "life-psychology-monorepo",
  "version": "1.0.0",
  "private": true,
  "workspaces": [
    "apps/*",
    "packages/*",
    "functions/*"
  ],
  "scripts": {
    "dev": "pnpm --filter './apps/**' dev",
    "dev:website": "pnpm --filter website dev",
    "dev:bloom": "pnpm --filter bloom dev",
    "build": "pnpm --filter './apps/**' build",
    "build:website": "pnpm --filter website build",
    "build:bloom": "pnpm --filter bloom build",
    "lint": "pnpm --filter './apps/**' --filter './packages/**' lint",
    "test": "pnpm --filter './apps/**' --filter './packages/**' test",
    "type-check": "pnpm --filter './apps/**' --filter './packages/**' type-check"
  },
  "devDependencies": {
    "@types/node": "^20.11.30",
    "prettier": "^3.2.5",
    "typescript": "^5.3.0"
  },
  "engines": {
    "node": ">=18.0.0",
    "pnpm": ">=8.0.0"
  }
}
```

Create `tsconfig.base.json`:
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    
    "paths": {
      "@shared/ui": ["./packages/shared-ui/src"],
      "@shared/types": ["./packages/shared-types/src"],
      "@shared/utils": ["./packages/shared-utils/src"],
      "@shared/azure": ["./packages/azure-config/src"]
    }
  }
}
```

### Phase 2: Move Website to apps/website (Day 1-2)

#### 2.1 Move Current Website Code
```bash
cd life-psychology-frontend

# Move current src to apps/website
Move-Item src apps\website\src
Move-Item public apps\website\public
Move-Item index.html apps\website\index.html
Move-Item vite.config.ts apps\website\vite.config.ts
Move-Item tailwind.config.js apps\website\tailwind.config.js
Move-Item postcss.config.js apps\website\postcss.config.js

# Move functions to functions/website
Move-Item functions functions\website
```

#### 2.2 Create Website Package.json
```json
{
  "name": "website",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "lint": "eslint . --ext ts,tsx",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "react": "^18.3.24",
    "react-dom": "^18.3.7",
    "react-router-dom": "^6.23.0",
    "axios": "^1.6.7",
    "@shared/ui": "workspace:*",
    "@shared/types": "workspace:*",
    "@shared/utils": "workspace:*"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^5.0.2",
    "typescript": "^5.3.0",
    "vite": "^5.0.2"
  }
}
```

#### 2.3 Update Website Vite Config
```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@shared/ui': resolve(__dirname, '../../packages/shared-ui/src'),
      '@shared/types': resolve(__dirname, '../../packages/shared-types/src'),
      '@shared/utils': resolve(__dirname, '../../packages/shared-utils/src'),
    },
  },
});
```

### Phase 3: Migrate Bloom to apps/bloom (Day 2-3)

#### 3.1 Copy Bloom Source Files
```bash
# From bloom-web-app repository
cd c:\Repos\bloom-web-app

# Copy to life-psychology-frontend/apps/bloom
Copy-Item -Recurse src c:\Repos\life-psychology-frontend\apps\bloom\src
Copy-Item -Recurse public c:\Repos\life-psychology-frontend\apps\bloom\public
Copy-Item index.html c:\Repos\life-psychology-frontend\apps\bloom\
Copy-Item vite.config.ts c:\Repos\life-psychology-frontend\apps\bloom\
Copy-Item tailwind.config.js c:\Repos\life-psychology-frontend\apps\bloom\
Copy-Item postcss.config.js c:\Repos\life-psychology-frontend\apps\bloom\
Copy-Item components.json c:\Repos\life-psychology-frontend\apps\bloom\
Copy-Item tsconfig.json c:\Repos\life-psychology-frontend\apps\bloom\
Copy-Item tsconfig.app.json c:\Repos\life-psychology-frontend\apps\bloom\
Copy-Item tsconfig.node.json c:\Repos\life-psychology-frontend\apps\bloom\
```

#### 3.2 Copy Bloom Azure Functions
```bash
# Copy API functions
Copy-Item -Recurse c:\Repos\bloom-web-app\api c:\Repos\life-psychology-frontend\functions\bloom
```

#### 3.3 Create Bloom Package.json
```json
{
  "name": "bloom",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "node scripts/dev-cors-port.cjs",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "lint": "eslint .",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "@azure/msal-react": "^2.0.0",
    "@headlessui/react": "^1.7.18",
    "@heroicons/react": "^2.0.18",
    "@radix-ui/react-label": "^2.1.7",
    "@radix-ui/react-select": "^2.2.6",
    "@radix-ui/react-slot": "^1.2.3",
    "@radix-ui/react-toast": "^1.2.15",
    "@reduxjs/toolkit": "^1.9.5",
    "@tanstack/react-query": "^4.29.10",
    "axios": "^1.6.7",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "date-fns": "^3.6.0",
    "framer-motion": "^12.23.24",
    "lucide-react": "^0.545.0",
    "react": "^18.3.24",
    "react-dom": "^18.3.7",
    "react-hook-form": "^7.51.2",
    "react-redux": "^8.1.2",
    "react-router-dom": "^6.23.0",
    "recharts": "^2.7.2",
    "socket.io-client": "^4.7.5",
    "tailwind-merge": "^3.3.1",
    "tailwindcss-animate": "^1.0.7",
    "zod": "^3.22.4",
    "@shared/ui": "workspace:*",
    "@shared/types": "workspace:*",
    "@shared/utils": "workspace:*",
    "@shared/azure": "workspace:*"
  },
  "devDependencies": {
    "@eslint/js": "^9.37.0",
    "@types/node": "^20.11.30",
    "@types/react": "^18.3.24",
    "@types/react-dom": "^18.3.7",
    "@vitejs/plugin-react": "^5.0.2",
    "autoprefixer": "^10.4.21",
    "eslint": "^8.57.1",
    "postcss": "^8.5.6",
    "tailwindcss": "^3.4.18",
    "typescript": "^5.3.0",
    "vite": "^5.0.2"
  }
}
```

#### 3.4 Update Bloom Vite Config
```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@shared/ui': resolve(__dirname, '../../packages/shared-ui/src'),
      '@shared/types': resolve(__dirname, '../../packages/shared-types/src'),
      '@shared/utils': resolve(__dirname, '../../packages/shared-utils/src'),
      '@shared/azure': resolve(__dirname, '../../packages/azure-config/src'),
    },
  },
  server: {
    port: 5174, // Different port from website
  },
});
```

### Phase 4: Create Shared Packages (Day 3-4)

#### 4.1 packages/shared-ui

Create `packages/shared-ui/package.json`:
```json
{
  "name": "@shared/ui",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "exports": {
    ".": "./src/index.ts",
    "./*": "./src/*.tsx"
  },
  "dependencies": {
    "@radix-ui/react-label": "^2.1.7",
    "@radix-ui/react-slot": "^1.2.3",
    "@radix-ui/react-toast": "^1.2.15",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "lucide-react": "^0.545.0",
    "react": "^18.3.24",
    "tailwind-merge": "^3.3.1"
  },
  "devDependencies": {
    "@types/react": "^18.3.24",
    "typescript": "^5.3.0"
  }
}
```

Extract shared UI components:
- Button, Card, Input, Label, Badge
- Toast/Toaster
- Form components

#### 4.2 packages/shared-types

Create `packages/shared-types/package.json`:
```json
{
  "name": "@shared/types",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "exports": {
    ".": "./src/index.ts"
  },
  "devDependencies": {
    "typescript": "^5.3.0"
  }
}
```

Create shared types:
- User/authentication types
- API response types
- Common form types

#### 4.3 packages/shared-utils

Create `packages/shared-utils/package.json`:
```json
{
  "name": "@shared/utils",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "exports": {
    ".": "./src/index.ts"
  },
  "dependencies": {
    "clsx": "^2.1.1",
    "tailwind-merge": "^3.3.1"
  },
  "devDependencies": {
    "typescript": "^5.3.0"
  }
}
```

Extract utilities:
- `cn()` function
- Validators
- Formatters

#### 4.4 packages/azure-config

Create `packages/azure-config/package.json`:
```json
{
  "name": "@shared/azure",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "exports": {
    ".": "./src/index.ts"
  },
  "dependencies": {
    "@azure/msal-react": "^2.0.0",
    "@azure/storage-blob": "^12.17.0"
  },
  "devDependencies": {
    "typescript": "^5.3.0"
  }
}
```

### Phase 5: Update Imports and Dependencies (Day 4-5)

#### 5.1 Update Bloom Imports
Replace local imports with shared package imports:

```typescript
// Before
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

// After
import { cn } from '@shared/utils';
import { Button } from '@shared/ui';
```

#### 5.2 Update Website Imports
Add shared package imports where applicable.

#### 5.3 Install Dependencies
```bash
cd c:\Repos\life-psychology-frontend

# Install pnpm if not already installed
npm install -g pnpm

# Install all workspace dependencies
pnpm install
```

### Phase 6: Update CI/CD Pipelines (Day 5)

#### 6.1 Create Website Deployment Workflow

`.github/workflows/website-deploy.yml`:
```yaml
name: Deploy Website

on:
  push:
    branches: [main, staging]
    paths:
      - 'apps/website/**'
      - 'functions/website/**'
      - 'packages/**'
      - '.github/workflows/website-deploy.yml'
  workflow_dispatch:

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
      
      - name: Setup pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 8
      
      - name: Install dependencies
        run: pnpm install
      
      - name: Build website
        run: pnpm --filter website build
      
      - name: Deploy to Azure Static Web Apps
        uses: Azure/static-web-apps-deploy@v1
        with:
          azure_static_web_apps_api_token: ${{ secrets.AZURE_STATIC_WEB_APPS_API_TOKEN }}
          repo_token: ${{ secrets.GITHUB_TOKEN }}
          action: 'upload'
          app_location: 'apps/website'
          api_location: 'functions/website'
          output_location: 'dist'
```

#### 6.2 Create Bloom Deployment Workflow

`.github/workflows/bloom-deploy.yml`:
```yaml
name: Deploy Bloom

on:
  push:
    branches: [main, staging]
    paths:
      - 'apps/bloom/**'
      - 'functions/bloom/**'
      - 'packages/**'
      - '.github/workflows/bloom-deploy.yml'
  workflow_dispatch:

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
      
      - name: Setup pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 8
      
      - name: Install dependencies
        run: pnpm install
      
      - name: Build Bloom
        run: pnpm --filter bloom build
      
      - name: Deploy to Azure Static Web Apps
        uses: Azure/static-web-apps-deploy@v1
        with:
          azure_static_web_apps_api_token: ${{ secrets.BLOOM_AZURE_STATIC_WEB_APPS_API_TOKEN }}
          repo_token: ${{ secrets.GITHUB_TOKEN }}
          action: 'upload'
          app_location: 'apps/bloom'
          api_location: 'functions/bloom'
          output_location: 'dist'
```

### Phase 7: Testing and Validation (Day 6-7)

#### 7.1 Local Development Testing
```bash
# Test website
pnpm dev:website

# Test bloom
pnpm dev:bloom

# Test both simultaneously
pnpm dev
```

#### 7.2 Build Testing
```bash
# Build all
pnpm build

# Build individually
pnpm build:website
pnpm build:bloom
```

#### 7.3 Type Checking
```bash
pnpm type-check
```

#### 7.4 Linting
```bash
pnpm lint
```

### Phase 8: Documentation and Cleanup (Day 7)

#### 8.1 Update README Files
- Root README with monorepo structure
- Individual app READMEs
- Package READMEs

#### 8.2 Migrate Documentation
```bash
# Move bloom docs
mkdir docs\bloom
Copy-Item c:\Repos\bloom-web-app\*.md docs\bloom\

# Organize website docs
mkdir docs\website
Move existing docs to appropriate locations
```

#### 8.3 Clean Up Old Files
- Remove duplicate configurations
- Archive old deployment scripts
- Update .gitignore for monorepo structure

---

## Migration Checklist

### Pre-Migration
- [ ] Backup both repositories
- [ ] Review and document current deployment processes
- [ ] Identify all environment variables and secrets
- [ ] Document Azure resource dependencies

### Phase 1: Setup
- [ ] Create monorepo branch
- [ ] Create directory structure
- [ ] Initialize workspace configuration
- [ ] Create base configs (tsconfig, eslint, prettier)

### Phase 2: Website Migration
- [ ] Move website code to apps/website
- [ ] Update website package.json
- [ ] Update website vite.config.ts
- [ ] Test website locally

### Phase 3: Bloom Migration
- [ ] Copy Bloom source to apps/bloom
- [ ] Copy Bloom functions to functions/bloom
- [ ] Create Bloom package.json
- [ ] Update Bloom vite.config.ts
- [ ] Test Bloom locally

### Phase 4: Shared Packages
- [ ] Create shared-ui package
- [ ] Create shared-types package
- [ ] Create shared-utils package
- [ ] Create azure-config package
- [ ] Extract common components
- [ ] Extract common utilities
- [ ] Extract common types

### Phase 5: Import Updates
- [ ] Update Bloom imports to use shared packages
- [ ] Update Website imports to use shared packages
- [ ] Test all builds after import changes
- [ ] Run type checking

### Phase 6: CI/CD
- [ ] Create website deployment workflow
- [ ] Create Bloom deployment workflow
- [ ] Add GitHub secrets for deployments
- [ ] Test CI/CD pipelines

### Phase 7: Testing
- [ ] Test website development mode
- [ ] Test Bloom development mode
- [ ] Test website production build
- [ ] Test Bloom production build
- [ ] Test Azure Functions locally
- [ ] Integration testing

### Phase 8: Documentation
- [ ] Update root README
- [ ] Create monorepo development guide
- [ ] Document shared package usage
- [ ] Update deployment documentation
- [ ] Archive old documentation

### Deployment
- [ ] Deploy to staging environment
- [ ] Verify website staging deployment
- [ ] Verify Bloom staging deployment
- [ ] Run smoke tests
- [ ] Deploy to production
- [ ] Monitor for issues

---

## Benefits of Monorepo Approach

### Code Sharing
- ✅ Reuse UI components across apps
- ✅ Share TypeScript types
- ✅ Common utilities and helpers
- ✅ Unified authentication configuration

### Development Efficiency
- ✅ Single git repository to manage
- ✅ Consistent tooling and configuration
- ✅ Easier refactoring across projects
- ✅ Shared dependency management

### Deployment
- ✅ Atomic changes across apps
- ✅ Coordinated releases
- ✅ Single CI/CD configuration
- ✅ Easier dependency updates

### Maintenance
- ✅ Unified documentation
- ✅ Consistent code style
- ✅ Easier onboarding for developers
- ✅ Centralized issue tracking

---

## Potential Challenges and Solutions

### Challenge 1: Port Conflicts
**Problem:** Both apps run on same port locally  
**Solution:** Configure different ports in vite.config.ts (website: 5173, bloom: 5174)

### Challenge 2: Build Times
**Problem:** Building entire monorepo takes longer  
**Solution:** Use workspace filters to build only changed apps

### Challenge 3: Dependency Conflicts
**Problem:** Different versions of same dependencies  
**Solution:** Hoist common dependencies to root, use workspace protocol

### Challenge 4: Deployment Complexity
**Problem:** Need to deploy apps independently  
**Solution:** Use path filters in GitHub Actions to deploy only changed apps

### Challenge 5: Azure Function Routing
**Problem:** Function routes may conflict  
**Solution:** Keep functions in separate directories with different route prefixes

---

## Rollback Plan

If issues arise during migration:

1. **Immediate Rollback:**
   - Revert to previous commit on staging branch
   - Keep original repositories active during migration

2. **Partial Rollback:**
   - Move apps back to root
   - Remove workspace configuration
   - Revert to separate repositories

3. **Data Preservation:**
   - No database changes required
   - Azure resources remain unchanged
   - Environment variables stay the same

---

## Timeline Estimate

- **Day 1:** Repository setup and website migration (4-6 hours)
- **Day 2-3:** Bloom migration and integration (8-12 hours)
- **Day 4-5:** Create shared packages and update imports (8-12 hours)
- **Day 5:** Update CI/CD pipelines (4-6 hours)
- **Day 6-7:** Testing and validation (6-8 hours)
- **Day 7:** Documentation and cleanup (2-4 hours)

**Total: 32-48 hours** (4-6 working days)

---

## Success Criteria

### Technical
- ✅ Both apps build successfully
- ✅ Both apps run locally without conflicts
- ✅ All tests pass
- ✅ Type checking passes
- ✅ CI/CD pipelines work correctly

### Functional
- ✅ Website functions as before
- ✅ Bloom app functions as before
- ✅ Azure Functions work correctly
- ✅ Authentication works in both apps
- ✅ No regressions in functionality

### Performance
- ✅ Build times acceptable
- ✅ Development experience smooth
- ✅ No performance degradation in apps

---

## Next Steps

1. **Review this plan** with team
2. **Schedule migration** for low-traffic period
3. **Create staging branch** for migration work
4. **Begin Phase 1** with repository setup
5. **Test thoroughly** at each phase
6. **Deploy to staging** for validation
7. **Deploy to production** after approval

---

## Resources

### Tools
- **pnpm:** https://pnpm.io/
- **Turborepo:** https://turbo.build/repo (optional)
- **Vite:** https://vitejs.dev/
- **TypeScript:** https://www.typescriptlang.org/

### References
- Monorepo best practices
- pnpm workspace documentation
- Azure Static Web Apps multi-app deployment
- GitHub Actions workflow optimization

---

**Document Created:** November 20, 2025  
**Status:** Ready for Review  
**Estimated Effort:** 4-6 days  
**Risk Level:** Medium (can rollback if needed)
