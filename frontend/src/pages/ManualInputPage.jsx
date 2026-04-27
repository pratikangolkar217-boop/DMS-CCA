import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import styles from './ManualInputPage.module.css'

const CITIES = [
  'Ahmedabad','Bangalore','Bhopal','Chandigarh','Chennai','Coimbatore',
  'Delhi','Hyderabad','Indore','Jaipur','Kochi','Kolkata','Lucknow',
  'Mumbai','Nagpur','Patna','Pune','Surat','Visakhapatnam'
]

const AMENITIES = [
  { key: 'parking',         label: 'Parking',         icon: '🚗' },
  { key: 'garden',          label: 'Garden',           icon: '🌿' },
  { key: 'security_room',   label: 'Security Room',    icon: '🛡️' },
  { key: 'solar_panels',    label: 'Solar Panels',     icon: '☀️' },
  { key: 'swimming_pool',   label: 'Swimming Pool',    icon: '🏊' },
  { key: 'modular_kitchen', label: 'Modular Kitchen',  icon: '🍳' },
  { key: 'home_theater',    label: 'Home Theater',     icon: '🎬' },
]

function buildRooms(floors, perFloor) {
  const rooms = {}
  for (let i = 0; i < floors; i++) {
    rooms[`floor${i + 1}`] = { ...perFloor }
  }
  return rooms
}

export default function ManualInputPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [cities, setCities] = useState([])

  const [form, setForm] = useState({
    location: '', area: '', floors: 1,
    bedroom: 2, bathroom: 1, kitchen: 1, hall: 1, optional: 0,
    quality: 'standard', amenities: [],
  })

  useEffect(() => {
    fetch('/cities')
      .then(res => res.json())
      .then(data => setCities(data.cities))
      .catch(err => console.error("Failed to fetch cities", err))
  }, [])

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }))

  const toggleAmenity = (key) => setForm(f => ({
    ...f,
    amenities: f.amenities.includes(key) ? f.amenities.filter(a => a !== key) : [...f.amenities, key]
  }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.area || form.area < 100) { setError('Please enter a valid area (min 100 sq.ft).'); return }
    setLoading(true); setError('')
    const perFloor = { bedroom: Number(form.bedroom), bathroom: Number(form.bathroom), kitchen: Number(form.kitchen), hall: Number(form.hall), optional: Number(form.optional) }
    const payload = {
      location: form.location,
      area: Number(form.area),
      floors: Number(form.floors),
      rooms: buildRooms(Number(form.floors), perFloor),
      quality: form.quality,
      amenities: form.amenities,
    }
    try {
      const res = await fetch('/predict', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Estimation failed')
      navigate('/result', { state: { result: data, inputs: payload } })
    } catch (e) {
      setError(e.message); setLoading(false)
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.orb} />
      <div className={styles.container}>
        <div className={styles.header}>
          <span className="badge badge-primary">Manual Mode</span>
          <h1 className={styles.title}>Enter Your Details</h1>
          <p className={styles.subtitle}>Fill in all the details directly to get your estimate instantly.</p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>

          {/* Location */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>📍 Location</h3>
            <div className={styles.field}>
              <label className="input-label" htmlFor="location">City / Location</label>
              <input id="location" className="input-field" list="city-list" placeholder="Type or select a city"
                value={form.location} onChange={e => set('location', e.target.value)} />
              <datalist id="city-list">
                {cities.map(c => <option key={c} value={c} />)}
              </datalist>
              <p className={styles.hint}>If city not found, national average pricing will be used.</p>
            </div>
          </div>

          {/* Area & Floors */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>📐 Size</h3>
            <div className={styles.row2}>
              <div className={styles.field}>
                <label className="input-label" htmlFor="area">Plot Area (sq.ft) *</label>
                <input id="area" type="number" className="input-field" placeholder="e.g., 1200"
                  value={form.area} onChange={e => set('area', Math.max(0, Number(e.target.value)) || '')} />
              </div>
              <div className={styles.field}>
                <label className="input-label" htmlFor="gunta">Area (Guntha)</label>
                <input id="gunta" type="number" className="input-field" placeholder="e.g., 1.5"
                  value={form.area ? (form.area / 1089).toFixed(2) : ''}
                  onChange={e => set('area', Math.round(Number(e.target.value) * 1089) || '')} />
              </div>
            </div>
            <div className={styles.row2}>
              <div className={styles.field}>
                <label className="input-label" htmlFor="floors">Number of Floors</label>
                <select id="floors" className="input-field" value={form.floors} onChange={e => set('floors', Number(e.target.value))}>
                  {[1,2,3,4].map(n => <option key={n} value={n}>{n} Floor{n > 1 ? 's' : ''}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Rooms */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>🛏️ Rooms (applied per floor)</h3>
            <div className={styles.roomGrid}>
              {[
                { key:'bedroom',  label:'Bedrooms',  icon:'🛏️' },
                { key:'bathroom', label:'Bathrooms', icon:'🚿' },
                { key:'kitchen',  label:'Kitchens',  icon:'🍳' },
                { key:'hall',     label:'Halls',     icon:'🛋️' },
                { key:'optional', label:'Extra Rooms',icon:'📦' },
              ].map(r => (
                <div key={r.key} className={styles.roomField}>
                  <label className="input-label">{r.icon} {r.label}</label>
                  <div className={styles.counter}>
                    <button type="button" className={styles.cBtn} onClick={() => set(r.key, Math.max(0, form[r.key] - 1))}>−</button>
                    <span className={styles.cVal}>{form[r.key]}</span>
                    <button type="button" className={styles.cBtn} onClick={() => set(r.key, Math.min(10, form[r.key] + 1))}>+</button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quality */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>⭐ Construction Quality</h3>
            <div className={styles.qualRow}>
              {[
                { key:'basic',    label:'Basic',    desc:'Budget-friendly',    mult:'0.8×' },
                { key:'standard', label:'Standard', desc:'Most popular',       mult:'1.0×' },
                { key:'premium',  label:'Premium',  desc:'Luxury finishes',    mult:'1.35×' },
              ].map(q => (
                <button key={q.key} type="button" id={`quality-${q.key}`}
                  className={`${styles.qualBtn} ${form.quality === q.key ? styles.qualBtnActive : ''}`}
                  onClick={() => set('quality', q.key)}>
                  <strong>{q.label}</strong>
                  <span>{q.desc}</span>
                  <span className={styles.mult}>{q.mult}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Amenities */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>✨ Amenities (optional)</h3>
            <div className={styles.amenGrid}>
              {AMENITIES.map(a => (
                <label key={a.key} className={`${styles.amenItem} ${form.amenities.includes(a.key) ? styles.amenActive : ''}`}>
                  <input type="checkbox" style={{ display:'none' }} checked={form.amenities.includes(a.key)} onChange={() => toggleAmenity(a.key)} />
                  <span>{a.icon}</span>
                  <span>{a.label}</span>
                </label>
              ))}
            </div>
          </div>

          {error && <div className={styles.error}>⚠️ {error}</div>}

          <button id="manual-submit" type="submit" className="btn btn-primary btn-lg" disabled={loading} style={{ width:'100%' }}>
            {loading ? '⏳ Calculating...' : '🧮 Calculate My Estimate'}
          </button>
        </form>
      </div>
    </div>
  )
}
