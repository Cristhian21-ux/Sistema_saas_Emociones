import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { AccesibilidadProvider } from './context/AccesibilidadContext';
import PanelAccesibilidad from './components/PanelAccesibilidad';
import './styles.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AccesibilidadProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
        <PanelAccesibilidad />
      </AccesibilidadProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
