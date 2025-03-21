import React from 'react'
import ReactDOM from 'react-dom/client'
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material'
import App from './App'
import './style.css'

const theme = createTheme({
  palette: {
    background: {
      default: '#e3f2fd',
      paper: '#ffffff',
    },
  },
})

const root = document.getElementById('root')

if (root) {
  ReactDOM.createRoot(root).render(
    <React.StrictMode>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <App />
      </ThemeProvider>
    </React.StrictMode>
  )
} else {
  console.error('Root element not found')
}
