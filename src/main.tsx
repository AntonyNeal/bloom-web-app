import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

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
