import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'
import './index.css'

// Note: react-leaflet v4 is not compatible with React.StrictMode's double-invoked
// mount/effects in dev (it tears down and recreates the Leaflet map instance,
// causing "Invalid LatLng (NaN, NaN)" crashes in MapController). StrictMode is
// intentionally omitted here.
ReactDOM.createRoot(document.getElementById('root')).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
)
