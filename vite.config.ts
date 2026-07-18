import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      // null: 자동 주입 스크립트 대신 virtual:pwa-register를 직접 써서 포그라운드 복귀 시
      // registration.update()를 강제 호출한다 — 설치된 PWA는 재실행이 실제 네비게이션이 아니라
      // 서스펜드된 문서 재개인 경우가 많아, 브라우저 기본 업데이트 체크가 트리거되지 않는다.
      // (injectRegister가 'auto'/null + registerType 'autoUpdate' 조합이면 skipWaiting/
      // clientsClaim은 플러그인이 이미 자동으로 켜준다 — 아래는 그 동작을 명시적으로 고정해
      // 향후 injectRegister 값이 바뀌어도 조용히 꺼지지 않게 하는 안전장치.)
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
