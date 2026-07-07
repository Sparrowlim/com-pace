import type { ReactNode } from 'react'
import styles from './TaskCard.module.css'

type Props = {
  title: string
  children?: ReactNode
}

export function TaskCard({ title, children }: Props) {
  return (
    <section className={styles.card}>
      <h2 className={styles.title}>{title}</h2>
      {children}
    </section>
  )
}
