import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: '컴페이스',
        short_name: '컴페이스',
        description: '오늘 15분, 나도 해냈다는 증거를 만드는 실행 훈련기',
        start_url: '/',
        display: 'standalone',
        background_color: '#E7DECF',
        theme_color: '#E79155',
        icons: [
          { src: '/icon.svg', sizes: '192x192', type: 'image/svg+xml' },
          { src: '/icon.svg', sizes: '512x512', type: 'image/svg+xml' },
        ],
      },
    }),
  ],
})
