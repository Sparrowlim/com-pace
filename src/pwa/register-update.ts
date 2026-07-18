import { registerSW } from 'virtual:pwa-register'
import { useAppStore } from '../store'
import { shouldReloadForUpdate } from './reload-gate'

export function registerAppUpdate(): void {
  if (!('serviceWorker' in navigator)) {
    return
  }

  let registration: ServiceWorkerRegistration | undefined

  registerSW({
    immediate: true,
    onRegisteredSW(_swUrl, reg) {
      registration = reg
    },
    // autoUpdate 모드에서 새 SW가 이미 activate+clientsClaim된 뒤 호출된다 — 여기서
    // 리로드를 미루면 브라우저 기본 알림(새로고침 요청 UI)도 없으므로 완전히 조용하다.
    onNeedReload() {
      if (shouldReloadForUpdate(useAppStore.getState().activeBlock)) {
        window.location.reload()
      }
    },
    // 사용자에게는 보이지 않는 진단 정보(§4 침묵 규칙) — 개발 빌드에서만 콘솔에 남긴다.
    onRegisterError(error: unknown) {
      if (import.meta.env.DEV) {
        console.error('[pwa] service worker registration failed', error)
      }
    },
  })

  // 설치된 PWA는 홈 화면 재실행이 실제 네비게이션이 아니라 서스펜드된 문서 재개인 경우가
  // 많아 브라우저 기본 업데이트 체크가 트리거되지 않는다 — 포그라운드 복귀마다 직접 확인한다.
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      void registration?.update()
    }
  })
}
