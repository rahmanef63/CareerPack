import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { ConvexClientProvider } from './ConvexClientProvider'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ConvexClientProvider>
      <App />
    </ConvexClientProvider>
  </StrictMode>,
)
