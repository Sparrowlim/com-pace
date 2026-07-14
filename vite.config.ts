import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      // injectRegister !== 'auto'이면 vite-plugin-pwa가 skipWaiting/clientsClaim을 더 이상
      // 자동으로 켜주지 않는다 — script-defer로 렌더 블로킹을 없앤 대가로 명시 필요(code review
      // HIGH: 없으면 이미 열려 있는 탭은 새 SW가 waiting에 머물러 autoUpdate가 죽는다).
      injectRegister: 'script-defer',
      workbox: { skipWaiting: true, clientsClaim: true },
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
