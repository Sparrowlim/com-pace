import type { ChangeEvent } from 'react'
import styles from './TextInput.module.css'

// PH-04.4 1-1 — required/error/maxLength는 타입에 없다(있으면 언젠가 누군가 쓴다).
// 처벌색·결정 피로 원천 차단(CLAUDE §2·§4).
type Props = {
  value: string
  onChange: (value: string) => void
  multiline?: boolean
  id?: string
  label?: string
  // code review 발견 — placeholder를 완전히 없앤 화면(1-1 기각 대안 (c))은 라벨도 없으면
  // 접근 가능한 이름이 아예 사라진다(axe critical). 화면 카피는 이미 눈에 보이는 프롬프트로
  // 맥락을 주므로, 시각적으로는 숨기되 스크린리더에는 라벨을 남긴다.
  hideLabel?: boolean
}

export function TextInput({ value, onChange, multiline, id, label, hideLabel }: Props) {
  const handleChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    onChange(event.target.value)
  }

  const field = multiline ? (
    <textarea id={id} className={styles.input} value={value} onChange={handleChange} />
  ) : (
    <input id={id} type="text" className={styles.input} value={value} onChange={handleChange} />
  )

  if (!label) return field

  return (
    <label className={styles.field}>
      <span className={hideLabel ? styles.labelHidden : styles.label}>{label}</span>
      {field}
    </label>
  )
}
