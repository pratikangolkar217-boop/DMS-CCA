import styles from './ProgressBar.module.css'

export default function ProgressBar({ current, total, labels }) {
  const pct = Math.round((current / total) * 100)

  return (
    <div className={styles.wrapper}>
      <div className={styles.info}>
        <span className={styles.step}>Step {current} of {total}</span>
        {labels && labels[current - 1] && (
          <span className={styles.label}>{labels[current - 1]}</span>
        )}
        <span className={styles.pct}>{pct}%</span>
      </div>
      <div className={styles.track}>
        <div
          className={styles.fill}
          style={{ width: `${pct}%` }}
        />
        {/* Step dots */}
        <div className={styles.dots}>
          {Array.from({ length: total }).map((_, i) => (
            <div
              key={i}
              className={`${styles.dot} ${i < current ? styles.dotDone : ''} ${i === current - 1 ? styles.dotActive : ''}`}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
