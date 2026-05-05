import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import ProgressBar from '../components/ProgressBar'
import RoomConfigurator from '../components/RoomConfigurator'
import TipBubble from '../components/TipBubble'
import styles from './SurveyPage.module.css'

const STEP_LABELS = ['Location','Plot Area','Floors','Rooms','Quality','Amenities','Review']

const STEP_TIPS = {
  1: ['Location affects labor rates and material availability — city pricing can vary by up to 80%.'],
  2: ['For a 4-member family, 1200–1800 sq.ft per floor is typical.'],
  3: ['Each additional floor multiplies your total built-up area.'],
  4: ['Recommended: 1 bathroom per 2 bedrooms.'],
  5: ['Premium materials increase cost by ~35% but raise property value by 20–25%.'],
  6: ['These are optional add-ons. You can skip all if not needed.','Solar panels offer 60-80% reduction in electricity bills.'],
  7: ['Review your inputs. Click Back to make any changes before submitting.'],
}

function buildInitialRooms(floors) {
  const rooms = {}
  for (let i = 0; i < floors; i++) {
    rooms[`floor${i + 1}`] = { bedroom: 2, bathroom: 1, kitchen: i === 0 ? 1 : 0, hall: i === 0 ? 1 : 0, optional: 0 }
  }
  return rooms
}

export default function SurveyPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [direction, setDirection] = useState('forward')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [citySearch, setCitySearch] = useState('')
  
  // Dynamic configuration state
  const [config, setConfig] = useState({ cities: [], qualities: [], amenities: [] })
  const [configLoading, setConfigLoading] = useState(true)
  
  const TOTAL_STEPS = 7

  const [form, setForm] = useState({
    location: '', area: '', floors: 1,
    rooms: buildInitialRooms(1), quality: 'standard', amenities: [],
  })

  useEffect(() => {
    fetch('http://127.0.0.1:5000/config')
      .then(res => res.json())
      .then(data => {
        if (!data.error) {
          setConfig({
            cities: data.cities.map(c => c.name).sort(),
            qualities: data.qualities,
            amenities: data.amenities
          })
          // Update default quality if needed
          if (data.qualities.length > 0 && !data.qualities.find(q => q.key === form.quality)) {
             setForm(f => ({ ...f, quality: data.qualities[0].key }))
          }
        }
      })
      .catch(err => console.error("Failed to load config:", err))
      .finally(() => setConfigLoading(false))
  }, [])

  const filteredCities = config.cities.filter(c => c.toLowerCase().includes(citySearch.toLowerCase()))

  const validateStep = () => {
    if (step === 1 && !form.location) { setError('Please select or enter a location.'); return false }
    if (step === 2 && (!form.area || form.area < 100)) { setError('Please enter a valid area (min 100 sq.ft).'); return false }
    return true
  }

  const goNext = () => {
    if (!validateStep()) return
    setDirection('forward'); setStep(s => s + 1); setError('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
  const goBack = () => {
    setDirection('back'); setStep(s => s - 1); setError('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleFloorsChange = (floors) => setForm(f => ({ ...f, floors, rooms: buildInitialRooms(floors) }))
  const handleRoomChange = (floorKey, val) => setForm(f => ({ ...f, rooms: { ...f.rooms, [floorKey]: val } }))
  const toggleAmenity = (key) => setForm(f => ({
    ...f, amenities: f.amenities.includes(key) ? f.amenities.filter(a => a !== key) : [...f.amenities, key]
  }))

  const handleSubmit = async () => {
    setLoading(true); setError('')
    try {
      const res = await fetch('http://127.0.0.1:5000/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Estimation failed')
      navigate('/result', { state: { result: data, inputs: form } })
    } catch (e) {
      setError(e.message); setLoading(false)
    }
  }

  if (configLoading) {
    return <div className={styles.page} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <h2 style={{ color: 'white' }}>Loading Survey...</h2>
    </div>
  }

  return (
    <div className={styles.page}>
      <div className={styles.orb} />
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>Home Cost Estimator</h1>
          <p className={styles.subtitle}>Answer a few questions to get your personalized estimate</p>
        </div>

        <ProgressBar current={step} total={TOTAL_STEPS} labels={STEP_LABELS} />

        <div className={`${styles.card} ${direction === 'forward' ? styles.slideRight : styles.slideLeft}`} key={step}>

          {step === 1 && (
            <div className={styles.stepContent}>
              <div className={styles.stepIcon}>🗺️</div>
              <h2 className={styles.stepTitle}>Where are you building?</h2>
              <p className={styles.stepDesc}>Choose your city to get location-specific pricing.</p>
              <input id="location-search" className="input-field" placeholder="Search city (e.g., Mumbai, Pune...)"
                value={citySearch || form.location}
                onChange={e => { setCitySearch(e.target.value); setForm(f => ({ ...f, location: e.target.value })) }} />
              <div className={styles.cityGrid}>
                {filteredCities.map(city => (
                  <button key={city} id={`city-${city.toLowerCase()}`}
                    className={`${styles.cityChip} ${form.location === city ? styles.cityChipActive : ''}`}
                    onClick={() => { setForm(f => ({ ...f, location: city })); setCitySearch('') }} type="button">
                    {city}
                  </button>
                ))}
                {filteredCities.length === 0 && <p className={styles.notFound}>City not in list — we'll use national average pricing.</p>}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className={styles.stepContent}>
              <div className={styles.stepIcon}>📐</div>
              <h2 className={styles.stepTitle}>What is your plot area?</h2>
              <p className={styles.stepDesc}>Enter area in Sq.Ft or Guntha (1 Guntha = 1,089 Sq.Ft).</p>
              
              <div className={styles.dualArea}>
                <div className={styles.areaWrap}>
                  <input id="area-input" type="number" className={`input-field ${styles.areaInput}`}
                    placeholder="e.g., 1200" value={form.area} min={0} max={50000}
                    onChange={e => setForm(f => ({ ...f, area: Math.max(0, Number(e.target.value)) || '' }))} />
                  <span className={styles.areaUnit}>sq.ft</span>
                </div>
                <div className={styles.areaDivider}>OR</div>
                <div className={styles.areaWrap}>
                  <input id="gunta-input" type="number" className={`input-field ${styles.areaInput}`}
                    placeholder="e.g., 1.5" 
                    value={form.area ? (form.area / 1089).toFixed(2) : ''} 
                    min={0}
                    onChange={e => setForm(f => ({ ...f, area: Math.round(Number(e.target.value) * 1089) || '' }))} />
                  <span className={styles.areaUnit}>Guntha</span>
                </div>
              </div>

              <div className={styles.presets}>
                {[600,900,1200,1500,2000,2400].map(v => (
                  <button key={v} id={`area-preset-${v}`}
                    className={`${styles.preset} ${form.area == v ? styles.presetActive : ''}`}
                    onClick={() => setForm(f => ({ ...f, area: v }))} type="button">{v} sq.ft</button>
                ))}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className={styles.stepContent}>
              <div className={styles.stepIcon}>🏢</div>
              <h2 className={styles.stepTitle}>How many floors?</h2>
              <p className={styles.stepDesc}>Select the number of floors in your home.</p>
              <div className={styles.floorGrid}>
                {[1,2,3,4].map(n => (
                  <button key={n} id={`floor-${n}`}
                    className={`${styles.floorCard} ${form.floors === n ? styles.floorCardActive : ''}`}
                    onClick={() => handleFloorsChange(n)} type="button">
                    <span className={styles.floorIcon}>{['🏠','🏡','🏘️','🏗️'][n-1]}</span>
                    <span className={styles.floorNum}>{n}</span>
                    <span className={styles.floorLabel}>{['Single','Double','Triple','Four'][n-1]} Floor</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 4 && (
            <div className={styles.stepContent}>
              <div className={styles.stepIcon}>🛏️</div>
              <h2 className={styles.stepTitle}>Configure your rooms</h2>
              <p className={styles.stepDesc}>Set room details for each floor.</p>
              <div className={styles.roomsWrap}>
                {Array.from({ length: form.floors }).map((_, i) => (
                  <RoomConfigurator key={i} floorIndex={i}
                    values={form.rooms[`floor${i + 1}`] || {}}
                    onChange={val => handleRoomChange(`floor${i + 1}`, val)} />
                ))}
              </div>
            </div>
          )}

          {step === 5 && (
            <div className={styles.stepContent}>
              <div className={styles.stepIcon}>⭐</div>
              <h2 className={styles.stepTitle}>Construction quality level</h2>
              <p className={styles.stepDesc}>Choose the quality of materials and finishes.</p>
              <div className={styles.qualityGrid}>
                {config.qualities.map(q => (
                  <button key={q.key} id={`quality-${q.key}`}
                    className={`${styles.qualityCard} ${form.quality === q.key ? styles.qualityActive : ''}`}
                    style={{ '--q-color': q.color }}
                    onClick={() => setForm(f => ({ ...f, quality: q.key }))} type="button">
                    {q.recommended && <div className={styles.recommended}>⭐ Recommended</div>}
                    <span className={styles.qualityIcon}>{q.icon}</span>
                    <span className={styles.qualityLabel}>{q.label}</span>
                    <span className={styles.qualityMult}>{q.multiplier}x cost</span>
                    <span className={styles.qualityDesc}>{q.desc}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 6 && (
            <div className={styles.stepContent}>
              <div className={styles.stepIcon}>✨</div>
              <h2 className={styles.stepTitle}>Add amenities</h2>
              <p className={styles.stepDesc}>Select any optional extras you'd like included.</p>
              <div className={styles.amenityGrid}>
                {config.amenities.map(a => (
                  <button key={a.key} id={`amenity-${a.key}`}
                    className={`${styles.amenityCard} ${form.amenities.includes(a.key) ? styles.amenityActive : ''}`}
                    onClick={() => toggleAmenity(a.key)} type="button">
                    <span className={styles.amenityIcon}>{a.icon}</span>
                    <span className={styles.amenityLabel}>{a.label}</span>
                    <span className={styles.amenityCost}>₹{(a.cost / 100000).toFixed(1)}L</span>
                    {form.amenities.includes(a.key) && <span className={styles.amenityCheck}>✓</span>}
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 7 && (
            <div className={styles.stepContent}>
              <div className={styles.stepIcon}>📋</div>
              <h2 className={styles.stepTitle}>Review your inputs</h2>
              <p className={styles.stepDesc}>Everything look good? Hit Calculate to get your estimate.</p>
              <div className={styles.review}>
                {[
                  { label: 'Location', value: form.location || 'Not specified (national avg)' },
                  { label: 'Plot Area', value: `${form.area} sq.ft` },
                  { label: 'Floors', value: form.floors },
                  { label: 'Quality', value: form.quality.charAt(0).toUpperCase() + form.quality.slice(1) },
                  { label: 'Amenities', value: form.amenities.length > 0 ? form.amenities.map(a => config.amenities.find(x => x.key === a)?.label || a).join(', ') : 'None' },
                ].map((row, i) => (
                  <div key={i} className={styles.reviewRow}>
                    <span className={styles.reviewLabel}>{row.label}</span>
                    <span className={styles.reviewValue}>{String(row.value)}</span>
                  </div>
                ))}
                <div className={styles.reviewSection}>Rooms per Floor</div>
                {Array.from({ length: form.floors }).map((_, i) => {
                  const r = form.rooms[`floor${i + 1}`] || {}
                  return (
                    <div key={i} className={styles.reviewRow}>
                      <span className={styles.reviewLabel}>Floor {i + 1}</span>
                      <span className={styles.reviewValue}>
                        {r.bedroom||0} bed · {r.bathroom||0} bath · {r.kitchen||0} kitchen · {r.hall||0} hall{r.optional ? ` · ${r.optional} extra` : ''}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {error && <div className={styles.error}>⚠️ {error}</div>}
          <TipBubble tips={STEP_TIPS[step]} />
        </div>

        <div className={styles.navRow}>
          {step > 1 && <button className="btn btn-ghost" onClick={goBack} type="button">← Back</button>}
          <div style={{ flex: 1 }} />
          {step < TOTAL_STEPS
            ? <button id="next-btn" className="btn btn-primary" onClick={goNext} type="button">Continue →</button>
            : <button id="calculate-btn" className="btn btn-primary btn-lg" onClick={handleSubmit} disabled={loading} type="button">
                {loading ? '⏳ Calculating...' : '🧮 Calculate My Estimate'}
              </button>
          }
        </div>
      </div>
    </div>
  )
}
