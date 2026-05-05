import { useState, useEffect } from 'react'
import styles from './FloorPlanVisualizer.module.css'

const VASTU_ZONES = {
  NW: { r: 1, c: 1, name: 'North-West', outer: ['top', 'left'],  door: 'bottom' },
  N:  { r: 1, c: 2, name: 'North',      outer: ['top'],          door: 'bottom' },
  NE: { r: 1, c: 3, name: 'North-East', outer: ['top', 'right'], door: 'bottom' },
  W:  { r: 2, c: 1, name: 'West',       outer: ['left'],         door: 'right' },
  C:  { r: 2, c: 2, name: 'Brahmasthan',outer: [],               door: '' },
  E:  { r: 2, c: 3, name: 'East',       outer: ['right'],        door: 'left' },
  SW: { r: 3, c: 1, name: 'South-West', outer: ['bottom','left'],door: 'top' },
  S:  { r: 3, c: 2, name: 'South',      outer: ['bottom'],       door: 'top' },
  SE: { r: 3, c: 3, name: 'South-East', outer: ['bottom','right'],door:'top' },
}

const ROOM_PREFS = {
  bedroom:  ['SW', 'S', 'W', 'NW', 'NE', 'E'],
  kitchen:  ['SE', 'NW', 'E', 'S'],
  bathroom: ['NW', 'W', 'S', 'E', 'N'],
  optional: ['NE', 'N', 'E', 'NW', 'W', 'S'],
  hall:     ['C', 'N', 'E', 'NE'],
  parking:  ['NW', 'N', 'E', 'SE', 'W', 'SW', 'S'],
  garden:   ['N', 'NE', 'E', 'NW'],
  swimming_pool: ['NE', 'N', 'E'],
  security_room: ['NW', 'N', 'W', 'SW'],
}

const ROOM_LABELS = {
  hall: 'Living / Dining',
  bedroom: 'Bedroom',
  kitchen: 'Kitchen',
  optional: 'Pooja/Study',
  bathroom: 'Bathroom',
}

export default function FloorPlanVisualizer({ roomsByFloor, areaPerFloor, amenities = [] }) {
  const [activeFloor, setActiveFloor] = useState(1)
  const [layoutCache, setLayoutCache] = useState({})
  const [loading, setLoading] = useState(false)
  const numFloors = Object.keys(roomsByFloor || {}).length

  useEffect(() => {
    if (!roomsByFloor) return
    const currentRooms = roomsByFloor[`floor${activeFloor}`] || {}
    
    if (layoutCache[activeFloor]) return // Already cached

    let unassignedRooms = []
    if (currentRooms.hall) unassignedRooms.push({ id: 'hall-1', type: 'hall', label: 'Living Room' })
    for (let i = 0; i < (currentRooms.bedroom || 0); i++) unassignedRooms.push({ id: `bedroom-${i+1}`, type: 'bedroom', label: i === 0 ? 'Master Bedroom' : `Bedroom ${i+1}` })
    for (let i = 0; i < (currentRooms.kitchen || 0); i++) unassignedRooms.push({ id: `kitchen-${i+1}`, type: 'kitchen', label: 'Kitchen' })
    for (let i = 0; i < (currentRooms.bathroom || 0); i++) unassignedRooms.push({ id: `bath-${i+1}`, type: 'bathroom', label: `Bath ${i+1}` })
    for (let i = 0; i < (currentRooms.optional || 0); i++) unassignedRooms.push({ id: `opt-${i+1}`, type: 'optional', label: 'Pooja/Study' })

    // Inject ground floor amenities
    if (activeFloor === 1 && amenities.length > 0) {
      amenities.forEach(am => {
        if (['parking', 'garden', 'swimming_pool', 'security_room'].includes(am)) {
          const label = am.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
          unassignedRooms.push({ id: `amenity-${am}`, type: am, label })
        }
      })
    }

    const fetchAILayout = async () => {
      setLoading(true)
      try {
        const res = await fetch('/vastu-layout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            rooms: currentRooms, 
            amenities: activeFloor === 1 ? amenities : [] 
          })
        })
        const data = await res.json()
        
        let assigned = []
        const occupiedZones = new Set()

        // 1. Apply AI mapping if available
        if (data.mapping && Array.isArray(data.mapping)) {
          data.mapping.forEach(m => {
            const room = unassignedRooms.find(r => r.id === m.id)
            if (room && VASTU_ZONES[m.zoneKey] && !occupiedZones.has(m.zoneKey)) {
              occupiedZones.add(m.zoneKey)
              assigned.push({ ...room, zoneKey: m.zoneKey, zone: VASTU_ZONES[m.zoneKey] })
            }
          })
        }

        // 2. Fallback logic for any unmapped rooms (if AI failed or hallucinated)
        unassignedRooms.forEach(room => {
          if (!assigned.find(a => a.id === room.id)) {
            const prefs = ROOM_PREFS[room.type] || ['C', 'N', 'E', 'S', 'W', 'NE', 'NW', 'SE', 'SW']
            let placed = false
            for (let z of prefs) {
              if (!occupiedZones.has(z)) {
                occupiedZones.add(z)
                assigned.push({ ...room, zoneKey: z, zone: VASTU_ZONES[z] })
                placed = true
                break
              }
            }
            if (!placed) {
              for (let z of Object.keys(VASTU_ZONES)) {
                if (!occupiedZones.has(z)) {
                  occupiedZones.add(z)
                  assigned.push({ ...room, zoneKey: z, zone: VASTU_ZONES[z] })
                  break
                }
              }
            }
          }
        })

        // 3. Fill remaining empty zones
        Object.keys(VASTU_ZONES).forEach(z => {
          if (!occupiedZones.has(z)) {
            let label = 'Corridor'
            if (z === 'C') label = 'Brahmasthan (Open)'
            if (['NE','NW','SE','SW'].includes(z)) label = 'Balcony / Open'
            assigned.push({ id: `empty-${z}`, type: 'empty', label, zoneKey: z, zone: VASTU_ZONES[z] })
          }
        })

        setLayoutCache(prev => ({ ...prev, [activeFloor]: assigned }))
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    
    fetchAILayout()
  }, [roomsByFloor, activeFloor, layoutCache])

  if (numFloors === 0) return null

  const layout = layoutCache[activeFloor] || []

  return (
    <div className={styles.container}>
      {numFloors > 1 && (
        <div className={styles.tabs}>
          {Array.from({ length: numFloors }).map((_, i) => (
            <button
              key={i}
              className={`${styles.tab} ${activeFloor === i + 1 ? styles.tabActive : ''}`}
              onClick={() => setActiveFloor(i + 1)}
            >
              Floor {i + 1}
            </button>
          ))}
        </div>
      )}

      <div className={styles.blueprintWrap}>
        {loading && (
          <div className={styles.loadingOverlay}>
            <div className={styles.spinner}></div>
            <p>Architectural AI mapping Vastu Layout...</p>
          </div>
        )}

        <div className={styles.compass}>
          <span>N</span>
          <div className={styles.compassLines}>
            <div className={styles.vLine}></div>
            <div className={styles.hLine}></div>
          </div>
          <span>S</span>
        </div>

        <div className={styles.gridCanvas} style={{ opacity: loading ? 0.3 : 1 }}>
          {layout.map(room => {
            const { r, c, outer, door } = room.zone

            const windows = outer.map(side => (
              <div key={side} className={`${styles.window} ${styles[`window-${side}`]}`} />
            ))

            const doorElement = (room.type !== 'empty' && door) ? (
              <div className={`${styles.door} ${styles[`door-${door}`]}`} />
            ) : null

            return (
              <div
                key={room.id}
                className={`${styles.room} ${styles[room.type] || ''}`}
                style={{ gridRow: r, gridColumn: c }}
              >
                {windows}
                {doorElement}
                <div className={styles.roomLabel}>{room.label}</div>
                <div className={styles.vastuTag}>{room.zone.name}</div>
                {room.type === 'kitchen' && room.zoneKey === 'SE' && <div className={styles.vastuBonus}>⭐ Vastu Perfect</div>}
                {room.type === 'bedroom' && room.zoneKey === 'SW' && <div className={styles.vastuBonus}>⭐ Vastu Perfect</div>}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
