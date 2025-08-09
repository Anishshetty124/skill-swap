import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { SocketContextProvider } from './context/SocketContext.jsx'; 
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <SocketContextProvider> 
          <ThemeProvider>
            <App />
          </ThemeProvider>
        </SocketContextProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
