import styles from './EnergyCell.module.css'

type Props = {
  filled: boolean
  justFilled?: boolean
}

export function EnergyCell({ filled, justFilled = false }: Props) {
  const classNames = [
    styles.cell,
    filled && styles.filled,
    filled && justFilled && styles.justFilled,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div
      className={classNames}
      aria-hidden="true"
      data-filled={filled}
      data-just-filled={filled && justFilled}
    />
  )
}
