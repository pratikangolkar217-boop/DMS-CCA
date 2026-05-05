import styles from './StatsCard.module.css'

export default function StatsCard({ icon, label, value, sub, color = 'blue', loading }) {
  return (
    <div className={`${styles.card} ${styles[color]}`}>
      <div className={styles.iconWrap}>
        <span className={styles.icon}>{icon}</span>
      </div>
      <div className={styles.body}>
        {loading ? (
          <div className={styles.skeleton} />
        ) : (
          <p className={styles.value}>{value}</p>
        )}
        <p className={styles.label}>{label}</p>
        {sub && <p className={styles.sub}>{sub}</p>}
      </div>
    </div>
  )
}
