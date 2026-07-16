import { isNotificationOptIn } from './notification-pref'

// 알림 opt-in(PH-09)에 종속된 완료 신호 — 탭이 보이면 벨 소리, 안 보이면 OS 알림(자체 사운드
// 포함). 둘 다 쏘면 같은 순간 신호가 겹치는 볼거리 중복이라 visibility로 배타 처리한다(CLAUDE
// §6-6). 백엔드 없음(D-26) — push 서버가 없어 탭이 완전히 종료되면 알림 불가, 이는 알려진 한계.
const SESSION_COMPLETE_TITLE = '15분, 다 채웠어요'
const SESSION_COMPLETE_BODY = '돌아와서 마무리해봐요'

type AudioContextConstructor = new () => AudioContext

function getAudioContextConstructor(): AudioContextConstructor | null {
  if (typeof window === 'undefined') return null
  const globalWindow = window as typeof window & { webkitAudioContext?: AudioContextConstructor }
  return globalWindow.AudioContext ?? globalWindow.webkitAudioContext ?? null
}

let sharedAudioContext: AudioContext | null = null

function getSharedAudioContext(): AudioContext | null {
  if (sharedAudioContext) return sharedAudioContext
  const Ctor = getAudioContextConstructor()
  if (!Ctor) return null
  sharedAudioContext = new Ctor()
  return sharedAudioContext
}

/**
 * 브라우저 자동재생 정책 우회 — 실제 사용자 제스처 안에서 한 번 호출해 AudioContext를 미리
 * 생성/resume해둔다. 15분 완료 시점은 setInterval tick(비-제스처) 안에서 발생하므로, 그때 처음
 * 생성하면 재생이 막힐 수 있다.
 */
export function unlockAlarmAudio(): void {
  const ctx = getSharedAudioContext()
  if (!ctx) return
  if (ctx.state === 'suspended') {
    void ctx.resume()
  }
}

function playTone(ctx: AudioContext, frequency: number, startTime: number, duration: number): void {
  const oscillator = ctx.createOscillator()
  const gain = ctx.createGain()
  oscillator.type = 'sine'
  oscillator.frequency.value = frequency
  gain.gain.setValueAtTime(0.0001, startTime)
  gain.gain.exponentialRampToValueAtTime(0.2, startTime + 0.02)
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration)
  oscillator.connect(gain)
  gain.connect(ctx.destination)
  oscillator.start(startTime)
  oscillator.stop(startTime + duration)
}

// 부드러운 2음 차임(880Hz → 1108Hz) — 경고음이 아니라 명상 벨에 가까운 톤(CLAUDE §4 "차가운
// 기계식 문구 금지"와 같은 결). 외부 사운드 에셋 없이 합성이라 라이선스·번들 크기 부담이 없다.
function playCompletionChime(): void {
  const ctx = getSharedAudioContext()
  if (!ctx) return
  const now = ctx.currentTime
  playTone(ctx, 880, now, 0.15)
  playTone(ctx, 1108, now + 0.15, 0.2)
}

function isTabVisible(): boolean {
  return typeof document !== 'undefined' && document.visibilityState === 'visible'
}

function canShowNotification(): boolean {
  return typeof Notification !== 'undefined' && Notification.permission === 'granted'
}

/**
 * Settings 토글 ON 순간(§2 결정 피로 차단 — 타이머 중이 아니라 여기서만 프롬프트)에 호출한다.
 * 브라우저 미지원이면 즉시 false, 거부돼도 앱 내부 opt-in 값은 그대로 저장되고 이후 알림은
 * 조용히 no-op된다(실패 무처벌, 재요청 유도 없음).
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (typeof Notification === 'undefined') return false
  if (Notification.permission === 'granted') return true
  if (Notification.permission === 'denied') return false
  const result = await Notification.requestPermission()
  return result === 'granted'
}

/**
 * 15분 완료 시점(useFocusTimer.detectWrapUp)에서 블록당 1회 호출된다. opt-in이 꺼져 있으면
 * 아무 일도 하지 않는다(침묵 규칙).
 */
export function notifySessionComplete(): void {
  if (!isNotificationOptIn()) return

  if (isTabVisible()) {
    playCompletionChime()
    return
  }

  if (!canShowNotification()) return
  new Notification(SESSION_COMPLETE_TITLE, { body: SESSION_COMPLETE_BODY, silent: false })
}
