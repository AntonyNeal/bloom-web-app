# LPA Website

Life Psychology Australia main website.

## Development

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Build for production
pnpm build

# Preview production build
pnpm preview
```

## Environment Variables

Copy `.env.example` to `.env.development`:

```bash
cp .env.example .env.development
```

## Project Structure

```
apps/website/
├── src/
│   ├── pages/         # Page components
│   ├── App.tsx        # Main app component
│   ├── main.tsx       # Entry point
│   └── index.css      # Global styles
├── functions/         # Azure Functions API
├── public/            # Static assets
├── index.html         # HTML template
└── vite.config.ts     # Vite configuration
```

## Deployment

The website is automatically deployed via the monorepo CI/CD workflow:

- **Development**: Push to `develop` branch → `lpa-website-dev`
- **Staging**: Push to `staging` branch → `lpa-website-staging`
- **Production**: Push to `main` branch → `lpa-website-prod`

## Technology Stack

- React 18
- TypeScript
- Vite
- Tailwind CSS
- React Router
- Azure Static Web Apps
- Azure Functions (API)
