import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { useMobileKeyboard } from './hooks/useMobileKeyboard'
import AppRoutes from './routes/AppRoutes'
import './App.css'

function App() {
  useMobileKeyboard()

  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
