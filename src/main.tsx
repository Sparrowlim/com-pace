import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import '@fontsource/gowun-batang/korean-400.css'
import '@fontsource/gowun-batang/korean-700.css'
import '@fontsource/gowun-dodum/korean-400.css'
import './index.css'
import { router } from './app/router'
import { persistStorage } from './storage/persist'
import { registerAppUpdate } from './pwa/register-update'

void persistStorage()
registerAppUpdate()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)
