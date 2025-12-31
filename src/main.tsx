// import { createRoot } from 'react-dom/client'
// import App from './App.tsx'
// import { AuthProvider } from "./AuthContext";

// createRoot(document.getElementById('root')!).render(
//   <AuthProvider>
//     <App />
//   </AuthProvider>
// );

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)