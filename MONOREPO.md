# Life Psychology Monorepo

This repository uses **pnpm workspaces** to manage multiple applications and shared packages in a single repository.

## 📁 Repository Structure

```
life-psychology-frontend/
├── apps/
│   ├── website/          # Life Psychology patient-facing website
│   └── bloom/            # Bloom practitioner portal
├── packages/
│   ├── shared-ui/        # Reusable UI components (shadcn/ui)
│   ├── shared-types/     # Shared TypeScript interfaces
│   ├── shared-utils/     # Common utilities (cn helper, etc.)
│   └── azure-config/     # MSAL authentication configuration
└── pnpm-workspace.yaml   # Workspace configuration
```

## 🚀 Getting Started

### Prerequisites
- Node.js >= 20.19.0
- pnpm >= 9.0.0

### Installation

```bash
# Install pnpm globally if you haven't
npm install -g pnpm

# Install all dependencies for all workspaces
pnpm install
```

## 🛠️ Development

### Run Applications

```bash
# Run website in development mode (port 5173)
pnpm dev:website

# Run bloom in development mode (port 5174)
pnpm dev:bloom
```

### Build Applications

```bash
# Build website for production
pnpm build:website

# Build bloom for production
pnpm build:bloom

# Build all workspaces
pnpm -r build
```

### Working with Specific Packages

```bash
# Run command in specific workspace
pnpm --filter website <command>
pnpm --filter bloom <command>
pnpm --filter @shared/ui <command>

# Add dependency to specific workspace
pnpm --filter website add react-query
pnpm --filter bloom add @azure/msal-browser

# Add shared package to an app
pnpm --filter website add @shared/utils
```

## 📦 Shared Packages

### @shared/ui
Reusable UI components built with shadcn/ui and Tailwind CSS.

```typescript
import { Button } from '@shared/ui';
```

### @shared/types
Shared TypeScript interfaces and types.

```typescript
import type { User, ApiResponse } from '@shared/types';
```

### @shared/utils
Common utility functions.

```typescript
import { cn } from '@shared/utils';
```

### @shared/azure
Azure MSAL authentication configuration.

```typescript
import { createMsalConfig } from '@shared/azure';
```

## 🔧 Configuration

### TypeScript
- `tsconfig.base.json` - Base configuration with path mappings
- Each app/package has its own `tsconfig.json` extending the base

### Path Mappings
All shared packages are accessible via `@shared/*` paths:
```json
{
  "@shared/ui": ["packages/shared-ui/src"],
  "@shared/types": ["packages/shared-types/src"],
  "@shared/utils": ["packages/shared-utils/src"],
  "@shared/azure": ["packages/azure-config/src"]
}
```

## 🚢 Deployment

### Website (Azure Static Web Apps)
```bash
pnpm build:website
# Deploy from apps/website/dist/
```

### Bloom (Azure Static Web Apps)
```bash
pnpm build:bloom
# Deploy from apps/bloom/dist/
```

## 📝 Scripts Overview

| Script | Description |
|--------|-------------|
| `pnpm dev:website` | Start website dev server |
| `pnpm dev:bloom` | Start bloom dev server |
| `pnpm build:website` | Build website for production |
| `pnpm build:bloom` | Build bloom for production |
| `pnpm -r build` | Build all workspaces |
| `pnpm -r test` | Run tests in all workspaces |
| `pnpm install` | Install all dependencies |

## 🔍 Troubleshooting

### Dependency Issues
```bash
# Clear all node_modules and reinstall
pnpm -r clean
pnpm install
```

### Build Issues
```bash
# Clean build artifacts
rm -rf apps/*/dist
pnpm -r build
```

### TypeScript Path Resolution
Ensure your IDE is using the workspace TypeScript version and has loaded `tsconfig.base.json`.

## 📚 Resources

- [pnpm Workspaces Documentation](https://pnpm.io/workspaces)
- [TypeScript Project References](https://www.typescriptlang.org/docs/handbook/project-references.html)
- [Monorepo Best Practices](https://monorepo.tools/)
