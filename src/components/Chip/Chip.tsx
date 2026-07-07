import type { ButtonHTMLAttributes, ReactNode } from 'react'
import styles from './Chip.module.css'

type Props = {
  variant: 'default' | 'selected'
  children: ReactNode
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className'>

export function Chip({ variant, children, type = 'button', ...rest }: Props) {
  return (
    <button
      type={type}
      className={`${styles.chip} ${styles[variant]}`}
      data-variant={variant}
      {...rest}
    >
      {children}
    </button>
  )
}
