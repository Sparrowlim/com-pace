import styles from './OptionRow.module.css'

type Props = {
  label: string
  selected: boolean
  onSelect?: () => void
}

export function OptionRow({ label, selected, onSelect }: Props) {
  return (
    <button
      type="button"
      className={`${styles.row} ${selected ? styles.selected : ''}`}
      aria-pressed={selected}
      onClick={onSelect}
    >
      {label}
    </button>
  )
}
