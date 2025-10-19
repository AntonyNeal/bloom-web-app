import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

// Import fonts - Latin subset only with font-display: swap for performance
import '@fontsource/inter/latin-400.css'
import '@fontsource/inter/latin-500.css'
import '@fontsource/inter/latin-600.css'
import '@fontsource/poppins/latin-600.css'

// Import styles
import './index.css'
import './styles/typography.css'
import './styles/blob.css'
import './styles/landing-animations.css'

import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
