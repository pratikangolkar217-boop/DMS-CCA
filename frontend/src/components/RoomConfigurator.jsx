import styles from './RoomConfigurator.module.css'

const ROOM_TYPES = [
  { key: 'bedroom',  label: 'Bedrooms',  icon: '🛏️', min: 0, max: 10 },
  { key: 'bathroom', label: 'Bathrooms', icon: '🚿', min: 0, max: 8 },
  { key: 'kitchen',  label: 'Kitchens',  icon: '🍳', min: 0, max: 3 },
  { key: 'hall',     label: 'Halls / Living Rooms', icon: '🛋️', min: 0, max: 4 },
  { key: 'optional', label: 'Extra Rooms (Office / Storage etc.)', icon: '📦', min: 0, max: 6 },
]

export default function RoomConfigurator({ floorIndex, values, onChange }) {
  const handleChange = (key, delta) => {
    const room = ROOM_TYPES.find(r => r.key === key)
    const current = values[key] || 0
    const next = Math.max(room.min, Math.min(room.max, current + delta))
    onChange({ ...values, [key]: next })
  }

  return (
    <div className={styles.wrapper}>
      <h4 className={styles.floorTitle}>
        <span className={styles.floorBadge}>Floor {floorIndex + 1}</span>
        Room Configuration
      </h4>
      <div className={styles.grid}>
        {ROOM_TYPES.map(room => (
          <div key={room.key} className={styles.roomRow}>
            <div className={styles.roomInfo}>
              <span className={styles.roomIcon}>{room.icon}</span>
              <span className={styles.roomLabel}>{room.label}</span>
            </div>
            <div className={styles.counter}>
              <button
                className={styles.counterBtn}
                onClick={() => handleChange(room.key, -1)}
                disabled={(values[room.key] || 0) <= room.min}
                type="button"
              >−</button>
              <span className={styles.counterVal}>{values[room.key] || 0}</span>
              <button
                className={styles.counterBtn}
                onClick={() => handleChange(room.key, 1)}
                disabled={(values[room.key] || 0) >= room.max}
                type="button"
              >+</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
