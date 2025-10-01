import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// 🟢 Tambahkan ini
import { registerSW } from 'virtual:pwa-register'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// 🟢 Registrasi service worker PWA
registerSW({
  immediate: true, // langsung aktif begitu selesai build
})
