// Monte l'app dans #root. AuthProvider au-dessus pour que la session soit partout.

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
// Avant App : i18next doit être initialisé quand les composants appellent useTranslation.
import './lib/i18n'
import App from './App.jsx'
import { AuthProvider } from './lib/AuthContext'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </StrictMode>,
)