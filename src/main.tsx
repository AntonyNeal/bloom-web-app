import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

// Import fonts
import '@fontsource/inter/400.css'
import '@fontsource/inter/500.css'
import '@fontsource/inter/600.css'
import '@fontsource/poppins/600.css'

// Import styles
import './index.css'
import './styles/typography.css'
import './styles/blob.css'

import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
