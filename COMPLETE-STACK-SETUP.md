# Complete Stack Setup Guide - DigitalOcean Edition

This document provides a comprehensive guide to replicate the Life Psychology Australia web application stack for another website using DigitalOcean cloud infrastructure. This guide is designed to be executed by GitHub Copilot or another AI assistant.

## Table of Contents

1. [Stack Overview](#stack-overview)
2. [Prerequisites](#prerequisites)
3. [Project Structure](#project-structure)
4. [Frontend Setup](#frontend-setup)
5. [Backend API Setup](#backend-api-setup)
6. [DigitalOcean Infrastructure](#digitalocean-infrastructure)
7. [Testing Configuration](#testing-configuration)
8. [Deployment Pipeline](#deployment-pipeline)
9. [Environment Variables](#environment-variables)
10. [External Integrations](#external-integrations)

---

## Stack Overview

### Frontend Stack

- **Framework**: React 18.3 with TypeScript 5.8
- **Build Tool**: Vite 7.1
- **Styling**: Tailwind CSS 3.4
- **Routing**: React Router DOM 7.8
- **State Management**: TanStack Query 5.85
- **Analytics**: React GA4 2.1
- **UI Components**: Headless UI 2.2, Heroicons 2.2, Lucide React
- **Testing**: Playwright 1.55, Vitest 3.2
- **Code Quality**: ESLint 9.33, Prettier 3.6, Husky 9.1

### Backend Stack

- **Runtime**: Node.js 20+ / Express.js
- **Serverless**: DigitalOcean Functions
- **Database**: DigitalOcean Managed PostgreSQL / MongoDB
- **Third-party APIs**: Halaxy (Healthcare booking), OpenAI
- **Monitoring**: DigitalOcean Monitoring, Logz.io / Datadog

### Infrastructure

- **Hosting**: DigitalOcean App Platform (Static Site)
- **CDN**: DigitalOcean Spaces CDN
- **Functions**: DigitalOcean Functions (Serverless)
- **Database**: Managed PostgreSQL or Managed MongoDB
- **Object Storage**: DigitalOcean Spaces (S3-compatible)
- **Secrets**: DigitalOcean App Platform Secrets / HashiCorp Vault
- **IaC**: Terraform / Pulumi

---

## Prerequisites

### Required Software

```bash
# Node.js 20.19.0 or higher
node --version

# DigitalOcean CLI (doctl)
doctl version

# Git
git --version

# Terraform (for infrastructure as code)
terraform --version

# PowerShell 7+ (Windows) or Bash (macOS/Linux)
pwsh --version
```

### Required DigitalOcean Resources

- DigitalOcean Account (with payment method configured)
- Personal Access Token (for API access)
- Domain name (optional, but recommended for production)

### Required API Keys & Services

- Google Analytics 4 Measurement ID
- Google Ads Conversion Tracking (optional)
- Google Tag Manager ID (optional)
- OpenAI API Key (if using AI features)
- Halaxy API Credentials (if using booking features)
- Datadog or Logz.io API Key (for monitoring, optional)

---

## Project Structure

Create the following folder structure:

```
your-project-name/
├── src/                           # Frontend React application
│   ├── components/               # React components
│   │   ├── BookingModal.tsx     # Example: Booking modal
│   │   ├── TimeSlotCalendar.tsx # Example: Calendar component
│   │   └── ...
│   ├── pages/                    # Page components
│   ├── services/                 # API services
│   ├── utils/                    # Utility functions
│   ├── hooks/                    # Custom React hooks
│   ├── config/                   # Configuration files
│   ├── types/                    # TypeScript type definitions
│   ├── assets/                   # Static assets
│   ├── plugins/                  # Vite plugins
│   ├── test/                     # Test utilities
│   ├── main.tsx                  # Application entry point
│   ├── App.tsx                   # Root component
│   └── index.css                 # Global styles
├── functions/                    # DigitalOcean Functions
│   ├── packages/                 # Function packages
│   │   ├── sample/
│   │   │   ├── get-data/        # Individual function
│   │   │   │   └── index.js     # Function implementation
│   │   │   └── package.json     # Package dependencies
│   │   └── ...
│   └── project.yml              # DigitalOcean Functions config
├── api/                          # Express.js API (alternative to functions)
│   ├── routes/                  # API routes
│   ├── controllers/             # Route controllers
│   ├── middleware/              # Custom middleware
│   ├── models/                  # Database models
│   ├── utils/                   # API utilities
│   ├── server.js                # Express server
│   └── package.json             # API dependencies
├── terraform/                    # Infrastructure as Code
│   ├── main.tf                  # Main Terraform configuration
│   ├── variables.tf             # Input variables
│   ├── outputs.tf               # Output values
│   └── modules/                 # Reusable modules
├── scripts/                      # Build and deployment scripts
├── tests/                        # E2E tests (Playwright)
├── public/                       # Static public assets
├── .github/workflows/           # GitHub Actions
├── .do/                         # DigitalOcean App Platform config
│   └── app.yaml                 # App Platform spec
├── .vscode/                     # VS Code settings
├── package.json                 # Frontend dependencies
├── vite.config.ts              # Vite configuration
├── tailwind.config.js          # Tailwind CSS configuration
├── tsconfig.json               # TypeScript configuration
└── playwright.config.ts        # Playwright configuration
```

---

## Frontend Setup

### 1. Initialize Project

```bash
# Create project directory
mkdir your-project-name
cd your-project-name

# Initialize package.json
npm init -y

# Install Vite and React
npm create vite@latest . -- --template react-ts
```

### 2. Install Core Dependencies

```bash
# React ecosystem
npm install react@^18.3.1 react-dom@^18.3.1 react-router-dom@^7.8.1

# State management & data fetching
npm install @tanstack/react-query@^5.85.5 axios@^1.11.0

# UI libraries
npm install @headlessui/react@^2.2.7 @heroicons/react@^2.2.0 lucide-react@^0.542.0

# Analytics & monitoring
npm install react-ga4@^2.1.0 web-vitals@^5.1.0

# SEO & utilities
npm install react-helmet-async@^2.0.5

# AI integration (optional)
npm install openai@^5.18.1
```

### 3. Install Development Dependencies

```bash
# TypeScript & build tools
npm install -D typescript@~5.8.3 @vitejs/plugin-react@^5.0.0 vite@^7.1.2

# Tailwind CSS
npm install -D tailwindcss@^3.4.17 postcss@^8.5.6 autoprefixer@^10.4.21 @tailwindcss/forms@^0.5.10

# Code quality
npm install -D eslint@^9.33.0 @typescript-eslint/eslint-plugin@^8.40.0 @typescript-eslint/parser@^8.40.0
npm install -D prettier@^3.6.2 eslint-config-prettier@^10.1.8 eslint-plugin-prettier@^5.5.4
npm install -D eslint-plugin-react-hooks@^5.2.0 eslint-plugin-react-refresh@^0.4.20

# Testing
npm install -D @playwright/test@^1.55.0 vitest@^3.2.4 jsdom@^26.1.0
npm install -D @testing-library/react@^14.3.1 @testing-library/jest-dom@^6.8.0 @testing-library/user-event@^14.6.1

# Git hooks & linting
npm install -D husky@^9.1.7 lint-staged@^16.1.5

# Build optimization
npm install -D terser@^5.44.0 vite-plugin-remove-console@^2.2.0 sharp@^0.34.3

# Type definitions
npm install -D @types/react@^18.3.18 @types/react-dom@^18.3.5 @types/node@^24.3.0
```

### 4. Configure Vite (`vite.config.ts`)

```typescript
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import removeConsole from 'vite-plugin-remove-console';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [
    react({
      include: ['**/*.tsx', '**/*.ts'],
    }),
    removeConsole(),
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  server: {
    cors: true,
    port: 5173,
    fs: {
      strict: true,
    },
  },
  envPrefix: 'VITE_',
  envDir: './',
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (
            id.includes('node_modules/react/') ||
            id.includes('node_modules/react-dom/') ||
            id.includes('node_modules/react-router-dom')
          ) {
            return 'vendor';
          }
          if (id.includes('react-ga4')) {
            return 'analytics';
          }
          if (
            id.includes('@headlessui') ||
            id.includes('@heroicons') ||
            id.includes('lucide-react')
          ) {
            return 'ui';
          }
          if (id.includes('openai')) {
            return 'openai';
          }
          if (id.includes('@tanstack/react-query')) {
            return 'query';
          }
          if (id.includes('node_modules')) {
            return 'vendor-misc';
          }
        },
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },
    sourcemap: false,
    chunkSizeWarningLimit: 1000,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: false,
        drop_debugger: false,
        passes: 3,
        dead_code: true,
        unused: true,
      },
      mangle: {
        safari10: true,
        reserved: ['gtag', 'dataLayer', 'ga', 'fbq'],
      },
      format: {
        comments: false,
      },
    },
    cssCodeSplit: true,
    cssMinify: true,
    modulePreload: {
      polyfill: false,
    },
    target: 'es2020',
    reportCompressedSize: true,
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom'],
  },
  preview: {
    port: 5174,
    strictPort: true,
  },
  esbuild: {
    logLevel: 'info',
    target: 'esnext',
    drop: [],
  },
});
```

### 5. Configure Tailwind CSS (`tailwind.config.js`)

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: '#2563eb',
          secondary: '#64748b',
          accent: '#059669',
        },
      },
    },
  },
  plugins: [require('@tailwindcss/forms')],
};
```

### 6. Configure TypeScript (`tsconfig.json`)

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
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
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

### 7. Add Package Scripts (`package.json`)

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "lint": "eslint src --max-warnings 0",
    "lint:fix": "eslint src --fix",
    "format": "prettier --write src/**/*.{ts,tsx,css,md}",
    "format:check": "prettier --check src/**/*.{ts,tsx,css,md}",
    "type-check": "tsc --noEmit",
    "test": "playwright test",
    "test:unit": "vitest",
    "test:unit:ui": "vitest --ui",
    "prepare": "husky"
  }
}
```

### 8. Configure Git Hooks with Husky

```bash
# Initialize Husky
npx husky init

# Create pre-commit hook
echo "npx lint-staged" > .husky/pre-commit
```

Add to `package.json`:

```json
{
  "lint-staged": {
    "src/**/*.{ts,tsx}": ["eslint --fix", "prettier --write"],
    "src/**/*.{css,md}": ["prettier --write"]
  }
}
```

### 9. Create Environment Files

`.env.example`:

```bash
# Google Analytics
VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX

# Google Ads
VITE_GOOGLE_ADS_ID=AW-XXXXXXXXX
VITE_GOOGLE_ADS_CONVERSION_LABEL=XXXXXXXXX

# Google Tag Manager
VITE_GTM_ID=GTM-XXXXXXX

# Backend API URLs
VITE_API_BASE_URL=https://your-app-name.ondigitalocean.app/api
VITE_FUNCTIONS_URL=https://faas-nyc1-your-namespace.doserverless.co

# Feature flags
VITE_ASSESSMENT_ENABLED=false

# OpenAI (optional)
VITE_OPENAI_API_KEY=sk-proj-XXXXXXXXXXXX

# Halaxy Integration (optional)
VITE_HALAXY_BOOKING_URL=http://localhost:3001/api/halaxy/booking
VITE_HALAXY_AVAILABILITY_URL=http://localhost:3001/api/halaxy/availability
```

---

## Backend API Setup

### Option 1: DigitalOcean Functions (Serverless)

#### 1. Install DigitalOcean CLI

```bash
# macOS/Linux
brew install doctl

# Windows (using scoop)
scoop install doctl

# Authenticate
doctl auth init
```

#### 2. Create Functions Project

```bash
# Create functions directory
mkdir functions
cd functions

# Initialize Functions project
doctl serverless init --language js

# This creates:
# - packages/sample/hello/index.js
# - project.yml
```

#### 3. Create Example Function

Create `packages/api/get-data/index.js`:

```javascript
/**
 * DigitalOcean Function: Get Data
 * URL: https://faas-region-namespace.doserverless.co/api/v1/web/sample/get-data
 */

function main(args) {
  // Handle CORS for browser requests
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  // Handle OPTIONS preflight
  if (args.__ow_method === 'options') {
    return {
      statusCode: 204,
      headers,
      body: '',
    };
  }

  try {
    const data = {
      message: 'Hello from DigitalOcean Functions',
      timestamp: new Date().toISOString(),
      params: args,
    };

    return {
      statusCode: 200,
      headers,
      body: data,
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: {
        error: 'Failed to fetch data',
        message: error.message,
      },
    };
  }
}

exports.main = main;
```

#### 4. Configure Functions (`project.yml`)

```yaml
packages:
  - name: api
    environment:
      DATABASE_URL: ${DATABASE_URL}
      OPENAI_API_KEY: ${OPENAI_API_KEY}
    functions:
      - name: get-data
        runtime: nodejs:18
        web: true
        limits:
          timeout: 60000
          memory: 256
      - name: create-booking
        runtime: nodejs:18
        web: true
        limits:
          timeout: 60000
          memory: 256
```

#### 5. Deploy Functions

```bash
# Deploy to DigitalOcean
doctl serverless deploy .

# List deployed functions
doctl serverless functions list

# Get function URL
doctl serverless functions get api/get-data --url
```

### Option 2: Express.js API on App Platform

#### 1. Create Express API

Create `api/server.js`:

```javascript
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(
  cors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
    credentials: true,
  })
);
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Example route
app.get('/api/get-data', async (req, res) => {
  try {
    const data = {
      message: 'Hello from DigitalOcean App Platform',
      timestamp: new Date().toISOString(),
    };
    res.json(data);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch data',
      message: error.message,
    });
  }
});

// Halaxy booking route (example)
app.post('/api/halaxy/booking', async (req, res) => {
  // Implement Halaxy booking logic
  res.json({ success: true });
});

// Start server
app.listen(PORT, () => {
  console.log(`API server running on port ${PORT}`);
});

module.exports = app;
```

#### 2. Install Dependencies

```bash
cd api
npm init -y

# Core dependencies
npm install express@^4.18.2 cors@^2.8.5 dotenv@^16.3.1

# Database clients
npm install pg@^8.11.3          # PostgreSQL
npm install mongodb@^6.3.0       # MongoDB

# Additional dependencies
npm install uuid@^9.0.0 node-fetch@^2.6.1

# Development
npm install -D nodemon@^3.0.1
```

#### 3. Add Scripts to `package.json`

```json
{
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js",
    "test": "jest"
  }
}
```

---

## DigitalOcean Infrastructure

### 1. Create App Platform Spec (`.do/app.yaml`)

```yaml
name: your-app-name
region: nyc

# Static site (Frontend)
static_sites:
  - name: frontend
    git:
      repo_clone_url: https://github.com/your-username/your-repo
      branch: main
    build_command: npm run build
    output_dir: dist
    environment_slug: node-js
    envs:
      - key: VITE_GA_MEASUREMENT_ID
        value: ${GA_MEASUREMENT_ID}
      - key: VITE_API_BASE_URL
        value: ${API_BASE_URL}
    routes:
      - path: /

# API Service (Backend)
services:
  - name: api
    git:
      repo_clone_url: https://github.com/your-username/your-repo
      branch: main
    source_dir: /api
    run_command: npm start
    environment_slug: node-js
    instance_count: 1
    instance_size_slug: basic-xxs
    http_port: 3001
    envs:
      - key: DATABASE_URL
        value: ${DATABASE_URL}
      - key: ALLOWED_ORIGINS
        value: https://your-domain.com,https://www.your-domain.com
    routes:
      - path: /api

# Managed Database
databases:
  - name: db
    engine: PG
    version: '15'
    size: db-s-1vcpu-1gb
    num_nodes: 1

# Domain configuration
domains:
  - domain: your-domain.com
    type: PRIMARY
  - domain: www.your-domain.com
    type: ALIAS
```

### 2. Deploy via App Platform

#### Using Web Console:

1. Go to https://cloud.digitalocean.com/apps
2. Click "Create App"
3. Connect your GitHub repository
4. Configure build settings (auto-detected from app.yaml)
5. Add environment variables
6. Deploy

#### Using CLI:

```bash
# Create app from spec
doctl apps create --spec .do/app.yaml

# Update app
doctl apps update YOUR_APP_ID --spec .do/app.yaml

# Get app info
doctl apps list
```

### 3. Infrastructure as Code with Terraform

Create `terraform/main.tf`:

```hcl
terraform {
  required_providers {
    digitalocean = {
      source  = "digitalocean/digitalocean"
      version = "~> 2.0"
    }
  }
}

provider "digitalocean" {
  token = var.do_token
}

# Database
resource "digitalocean_database_cluster" "postgres" {
  name       = "your-app-db"
  engine     = "pg"
  version    = "15"
  size       = "db-s-1vcpu-1gb"
  region     = "nyc1"
  node_count = 1
}

# Database connection pool
resource "digitalocean_database_connection_pool" "pool" {
  cluster_id = digitalocean_database_cluster.postgres.id
  name       = "app-pool"
  mode       = "transaction"
  size       = 20
  db_name    = "defaultdb"
  user       = "doadmin"
}

# Spaces (Object Storage)
resource "digitalocean_spaces_bucket" "assets" {
  name   = "your-app-assets"
  region = "nyc3"
  acl    = "public-read"

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["GET", "HEAD"]
    allowed_origins = ["*"]
    max_age_seconds = 3600
  }
}

# CDN Endpoint
resource "digitalocean_cdn" "assets_cdn" {
  origin = digitalocean_spaces_bucket.assets.bucket_domain_name
}

# Outputs
output "database_url" {
  value     = digitalocean_database_cluster.postgres.uri
  sensitive = true
}

output "cdn_endpoint" {
  value = digitalocean_cdn.assets_cdn.endpoint
}
```

Create `terraform/variables.tf`:

```hcl
variable "do_token" {
  description = "DigitalOcean API Token"
  type        = string
  sensitive   = true
}

variable "region" {
  description = "DigitalOcean region"
  type        = string
  default     = "nyc1"
}
```

#### Deploy Infrastructure:

```bash
cd terraform

# Initialize Terraform
terraform init

# Plan deployment
terraform plan -var="do_token=YOUR_DO_TOKEN"

# Apply changes
terraform apply -var="do_token=YOUR_DO_TOKEN"
```

---

## Testing Configuration

### 1. Playwright Setup (`playwright.config.ts`)

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
  },
});
```

### 2. Vitest Setup (`src/test/setup.ts`)

```typescript
import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

afterEach(() => {
  cleanup();
});
```

---

## Deployment Pipeline

### GitHub Actions (`.github/workflows/deploy.yml`)

```yaml
name: Deploy to DigitalOcean

on:
  push:
    branches: [main, staging]
  pull_request:
    branches: [main]

env:
  NODE_VERSION: '20'

jobs:
  build-and-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run linters
        run: npm run lint

      - name: Run unit tests
        run: npm run test:unit:run

      - name: Build frontend
        run: npm run build
        env:
          VITE_GA_MEASUREMENT_ID: ${{ secrets.GA_MEASUREMENT_ID }}
          VITE_API_BASE_URL: ${{ secrets.API_BASE_URL }}

      - name: Upload build artifacts
        uses: actions/upload-artifact@v3
        with:
          name: dist
          path: dist/

  deploy-app-platform:
    needs: build-and-test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4

      - name: Install doctl
        uses: digitalocean/action-doctl@v2
        with:
          token: ${{ secrets.DIGITALOCEAN_ACCESS_TOKEN }}

      - name: Deploy to App Platform
        run: |
          doctl apps update ${{ secrets.APP_ID }} --spec .do/app.yaml

  deploy-functions:
    needs: build-and-test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4

      - name: Install doctl
        uses: digitalocean/action-doctl@v2
        with:
          token: ${{ secrets.DIGITALOCEAN_ACCESS_TOKEN }}

      - name: Deploy Functions
        run: |
          cd functions
          doctl serverless deploy . --remote-build
```

### Alternative: Deploy from Local Machine

```bash
# Install DigitalOcean CLI
doctl auth init

# Deploy App Platform
doctl apps create --spec .do/app.yaml

# Deploy Functions
cd functions
doctl serverless deploy .

# Check deployment status
doctl apps list
doctl serverless functions list
```

---

## Environment Variables

### Frontend Environment Variables

| Variable                           | Description                       | Required | Example                                   |
| ---------------------------------- | --------------------------------- | -------- | ----------------------------------------- |
| `VITE_GA_MEASUREMENT_ID`           | Google Analytics 4 Measurement ID | Yes      | `G-XXXXXXXXXX`                            |
| `VITE_GOOGLE_ADS_ID`               | Google Ads Account ID             | No       | `AW-XXXXXXXXX`                            |
| `VITE_GOOGLE_ADS_CONVERSION_LABEL` | Conversion label                  | No       | `AbCdEf`                                  |
| `VITE_GTM_ID`                      | Google Tag Manager ID             | No       | `GTM-XXXXXXX`                             |
| `VITE_API_BASE_URL`                | Backend API base URL              | Yes      | `https://your-app.ondigitalocean.app/api` |
| `VITE_FUNCTIONS_URL`               | DigitalOcean Functions URL        | No       | `https://faas-nyc1-xxx.doserverless.co`   |
| `VITE_OPENAI_API_KEY`              | OpenAI API key                    | No       | `sk-proj-...`                             |

### Backend Environment Variables

| Variable               | Description                    | Required | Example                                |
| ---------------------- | ------------------------------ | -------- | -------------------------------------- |
| `DATABASE_URL`         | PostgreSQL connection string   | Yes      | `postgresql://user:pass@host:25060/db` |
| `MONGODB_URI`          | MongoDB connection string      | No       | `mongodb+srv://user:pass@cluster/db`   |
| `PORT`                 | API server port                | Yes      | `3001`                                 |
| `ALLOWED_ORIGINS`      | CORS allowed origins           | Yes      | `https://yourdomain.com`               |
| `HALAXY_CLIENT_ID`     | Halaxy API client ID           | No       | `your_client_id`                       |
| `HALAXY_CLIENT_SECRET` | Halaxy API secret              | No       | `your_secret`                          |
| `OPENAI_API_KEY`       | OpenAI API key                 | No       | `sk-...`                               |
| `DO_SPACES_KEY`        | DigitalOcean Spaces access key | No       | `DO00XXXXX`                            |
| `DO_SPACES_SECRET`     | DigitalOcean Spaces secret     | No       | `secret_key`                           |

---

## External Integrations

### 1. Google Analytics 4

1. Create GA4 property at [analytics.google.com](https://analytics.google.com)
2. Copy Measurement ID (format: `G-XXXXXXXXXX`)
3. Add to environment variables

### 2. Google Ads Conversion Tracking

1. Go to Google Ads → Tools → Conversions
2. Create conversion action
3. Copy Conversion ID and Label
4. Add to environment variables

### 3. Halaxy API (Healthcare Booking)

**Only required if implementing healthcare booking features**

1. Sign up at [developers.halaxy.com](https://developers.halaxy.com)
2. Purchase API subscription
3. Create API credentials
4. Get resource IDs (Practitioner, Service, etc.)
5. Configure in your backend API or Functions

Environment variables needed:

```bash
HALAXY_CLIENT_ID=your_client_id
HALAXY_CLIENT_SECRET=your_client_secret
HALAXY_BASE_URL=https://au-api.halaxy.com/main
HALAXY_PRACTITIONER_ROLE_ID=PR-1234567
HALAXY_HEALTHCARE_SERVICE_ID=33
```

Add to `.do/app.yaml` under the API service:

```yaml
services:
  - name: api
    envs:
      - key: HALAXY_CLIENT_ID
        value: ${HALAXY_CLIENT_ID}
      - key: HALAXY_CLIENT_SECRET
        value: ${HALAXY_CLIENT_SECRET}
        scope: RUN_TIME
        type: SECRET
```

### 4. OpenAI API (AI Features)

**Only required if implementing AI assessment or chat features**

1. Create account at [platform.openai.com](https://platform.openai.com)
2. Generate API key
3. Add to environment variables

---

## Quick Start Commands

### Development

```bash
# Install all dependencies
npm install
cd api && npm install && cd ..
cd functions && npm install && cd ..

# Start frontend dev server
npm run dev

# Start API server locally (if using Express)
cd api
npm run dev

# Test DigitalOcean Functions locally
cd functions
doctl serverless deploy . --remote-build
```

### Testing

```bash
# Run unit tests
npm run test:unit

# Run E2E tests
npm test

# Run tests with UI
npm run test:ui
```

### Production Build

```bash
# Build frontend
npm run build

# Deploy to DigitalOcean App Platform
doctl apps create --spec .do/app.yaml

# Deploy Functions
cd functions
doctl serverless deploy .
```

### Deployment

```bash
# Using GitHub Actions (automated)
git push origin main

# Manual deployment via CLI
doctl apps update YOUR_APP_ID --spec .do/app.yaml

# Check deployment status
doctl apps list
doctl apps logs YOUR_APP_ID --follow
```

### Database Management

```bash
# Connect to managed PostgreSQL
doctl databases connection YOUR_DB_ID --user doadmin

# Create database backup
doctl databases backups list YOUR_DB_ID

# Restore from backup
doctl databases backups restore YOUR_DB_ID BACKUP_ID
```

---

## Additional Notes

### Performance Optimizations Included

1. **Code Splitting**: Vendor, analytics, UI components split into separate chunks
2. **Tree Shaking**: Unused code removed during build
3. **Minification**: Terser with advanced compression
4. **Image Optimization**: Sharp for WebP conversion
5. **CSS Optimization**: Critical CSS inlining, purging unused styles
6. **Lazy Loading**: Route-based code splitting with React.lazy

### Security Features Included

1. **Environment Variables**: Secrets managed via DigitalOcean App Platform encrypted secrets
2. **CORS**: Properly configured for API and Functions
3. **HTTPS**: Automatic SSL certificates via App Platform
4. **Database Encryption**: Managed databases include encryption at rest
5. **Input Validation**: Server-side validation for all inputs
6. **Rate Limiting**: Can be configured via API middleware

### Monitoring & Analytics Included

1. **DigitalOcean Monitoring**: Built-in metrics for droplets, databases, and apps
2. **Google Analytics 4**: User behavior and conversions
3. **Web Vitals**: Core Web Vitals monitoring
4. **Custom Events**: Conversion tracking, form submissions
5. **Log Aggregation**: App Platform logs accessible via CLI or dashboard

---

## Support & Documentation

- **Vite**: https://vitejs.dev/
- **React**: https://react.dev/
- **DigitalOcean App Platform**: https://docs.digitalocean.com/products/app-platform/
- **DigitalOcean Functions**: https://docs.digitalocean.com/products/functions/
- **DigitalOcean Databases**: https://docs.digitalocean.com/products/databases/
- **Tailwind CSS**: https://tailwindcss.com/
- **Playwright**: https://playwright.dev/
- **Terraform DigitalOcean Provider**: https://registry.terraform.io/providers/digitalocean/digitalocean/

---

## Checklist for New Project

- [ ] Initialize Git repository
- [ ] Install all dependencies (frontend + backend)
- [ ] Configure environment variables
- [ ] Create DigitalOcean account and configure billing
- [ ] Generate DigitalOcean Personal Access Token
- [ ] Configure Google Analytics
- [ ] Set up CI/CD pipeline with GitHub Actions
- [ ] Create App Platform spec (.do/app.yaml)
- [ ] Deploy infrastructure with Terraform (optional)
- [ ] Configure custom domain and SSL
- [ ] Set up managed database (PostgreSQL/MongoDB)
- [ ] Configure Spaces for static assets (if needed)
- [ ] Set up monitoring and alerts
- [ ] Run security audit (`npm audit`)
- [ ] Test deployment to staging
- [ ] Deploy to production
- [ ] Verify all integrations working
- [ ] Set up automated database backups
- [ ] Configure CDN for Spaces

---

## Cost Estimation (DigitalOcean)

### Basic Setup (Small Business)

- **App Platform (Basic)**: $5-12/month
- **Managed PostgreSQL (1GB)**: $15/month
- **Functions (1M requests)**: $1.85/month
- **Spaces (250GB + CDN)**: $5/month
- **Total**: ~$27-33/month

### Production Setup (Growing Business)

- **App Platform (Professional)**: $12-24/month
- **Managed PostgreSQL (4GB)**: $60/month
- **Functions (5M requests)**: $9.25/month
- **Spaces (1TB + CDN)**: $20/month
- **Load Balancer**: $12/month
- **Total**: ~$113-125/month

### Enterprise Setup

- **App Platform (Multiple services)**: $48+/month
- **Managed PostgreSQL (16GB, HA)**: $240/month
- **Functions (20M requests)**: $37/month
- **Spaces (5TB + CDN)**: $100/month
- **Load Balancer**: $12/month
- **Monitoring (Datadog)**: $31+/month
- **Total**: ~$468+/month

---

**Last Updated**: November 5, 2025  
**Stack Version**: 2.0 (DigitalOcean Edition)  
**Minimum Node Version**: 20.19.0  
**Target Cloud Platform**: DigitalOcean
