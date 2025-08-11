import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './assets/css/style.css' // make sure style.css is in the same folder as main.jsx

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
