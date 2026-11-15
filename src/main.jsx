import { createRoot } from 'react-dom/client'
import App from './App'
import './styles/index.css'

// Wallpaper custom: ids and accents come from state, applied at Shell level.

createRoot(document.getElementById('root')).render(<App />)
