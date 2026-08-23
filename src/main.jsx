import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import "./global.css"
import SidebarContext from './context/sidebar.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <SidebarContext>
      <App />
    </SidebarContext>
  </StrictMode>,
)
