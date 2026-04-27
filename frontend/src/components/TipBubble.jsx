import styles from './TipBubble.module.css'

export default function TipBubble({ tips }) {
  if (!tips || tips.length === 0) return null

  return (
    <div className={styles.container}>
      {tips.map((tip, i) => (
        <div key={i} className={`${styles.bubble} animate-fadeInUp`} style={{ animationDelay: `${i * 0.1}s` }}>
          <span className={styles.icon}>💡</span>
          <p className={styles.text}>{tip}</p>
        </div>
      ))}
    </div>
  )
}
