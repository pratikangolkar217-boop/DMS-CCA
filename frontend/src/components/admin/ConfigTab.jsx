import { useState, useEffect } from 'react'
import styles from './ConfigTab.module.css'

export default function ConfigTab() {
  const [config, setConfig] = useState({ cities: [], qualities: [], amenities: [] })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState(null)

  useEffect(() => {
    fetch('http://127.0.0.1:5000/config')
      .then(res => res.json())
      .then(data => setConfig({
        cities: data.cities || [],
        qualities: data.qualities || [],
        amenities: data.amenities || []
      }))
      .catch(err => setMsg({ type: 'error', text: 'Failed to load config' }))
      .finally(() => setLoading(false))
  }, [])

  const handleSave = async () => {
    const token = localStorage.getItem('admin_token')
    setSaving(true); setMsg(null)
    try {
      const res = await fetch('http://127.0.0.1:5000/admin/config', {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(config)
      })
      if (!res.ok) throw new Error('Save failed')
      setMsg({ type: 'success', text: 'Configuration saved successfully!' })
      setTimeout(() => setMsg(null), 3000)
    } catch (e) {
      setMsg({ type: 'error', text: e.message })
    } finally {
      setSaving(false)
    }
  }

  const updateCity = (idx, field, val) => {
    const nw = [...config.cities]; nw[idx][field] = val;
    setConfig({ ...config, cities: nw })
  }
  const addCity = () => {
    setConfig({ ...config, cities: [...config.cities, { name: 'New City', cost_per_sqft: 1800, labor_multiplier: 1.0, material_multiplier: 1.0 }] })
  }
  const delCity = (idx) => {
    setConfig({ ...config, cities: config.cities.filter((_, i) => i !== idx) })
  }

  const updateQuality = (idx, field, val) => {
    const nw = [...config.qualities]; nw[idx][field] = val;
    setConfig({ ...config, qualities: nw })
  }
  const addQuality = () => {
    setConfig({ ...config, qualities: [...config.qualities, { key: 'new_quality', label: 'New Quality', icon: '⭐', desc: '', multiplier: 1.0, color: '#4f8ef7' }] })
  }
  const delQuality = (idx) => {
    setConfig({ ...config, qualities: config.qualities.filter((_, i) => i !== idx) })
  }

  const updateBreakdown = (field, val) => {
    setConfig({ ...config, breakdown: { ...(config.breakdown || {}), [field]: val } })
  }

  const updateAmenity = (idx, field, val) => {
    const nw = [...config.amenities]; nw[idx][field] = val;
    setConfig({ ...config, amenities: nw })
  }
  const addAmenity = () => {
    setConfig({ ...config, amenities: [...config.amenities, { key: 'new_amenity', label: 'New Amenity', icon: '✨', cost: 100000 }] })
  }
  const delAmenity = (idx) => {
    setConfig({ ...config, amenities: config.amenities.filter((_, i) => i !== idx) })
  }

  if (loading) return <p style={{ color: 'white' }}>Loading config...</p>

  return (
    <div className={styles.configTab}>
      <div className={styles.headerRow}>
        <h2 className={styles.title}>System Configuration</h2>
        <button className={styles.saveBtn} onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : '💾 Save Changes'}
        </button>
      </div>

      {msg && <div className={`${styles.msg} ${styles[msg.type]}`}>{msg.text}</div>}

      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Amenities</h3>
        <div className={styles.grid}>
          {config.amenities.map((a, i) => (
            <div key={i} className={styles.card}>
              <button className={styles.delBtn} onClick={() => delAmenity(i)}>Remove</button>
              <div className={styles.field}>
                <label>Key (ID)</label>
                <input value={a.key} onChange={e => updateAmenity(i, 'key', e.target.value)} />
              </div>
              <div className={styles.field}>
                <label>Label</label>
                <input value={a.label} onChange={e => updateAmenity(i, 'label', e.target.value)} />
              </div>
              <div className={styles.field}>
                <label>Icon</label>
                <input value={a.icon} onChange={e => updateAmenity(i, 'icon', e.target.value)} />
              </div>
              <div className={styles.field}>
                <label>Cost (₹)</label>
                <input type="number" value={a.cost} onChange={e => updateAmenity(i, 'cost', Number(e.target.value))} />
              </div>
            </div>
          ))}
        </div>
        <button className={styles.addBtn} onClick={addAmenity}>+ Add Amenity</button>
      </section>

      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Quality Levels</h3>
        <div className={styles.grid}>
          {config.qualities.map((q, i) => (
            <div key={i} className={styles.card}>
              <button className={styles.delBtn} onClick={() => delQuality(i)}>Remove</button>
              <div className={styles.field}>
                <label>Key (ID)</label>
                <input value={q.key} onChange={e => updateQuality(i, 'key', e.target.value)} />
              </div>
              <div className={styles.field}>
                <label>Label</label>
                <input value={q.label} onChange={e => updateQuality(i, 'label', e.target.value)} />
              </div>
              <div className={styles.field}>
                <label>Icon</label>
                <input value={q.icon} onChange={e => updateQuality(i, 'icon', e.target.value)} />
              </div>
              <div className={styles.field}>
                <label>Cost Multiplier</label>
                <input type="number" step="0.01" value={q.multiplier} onChange={e => updateQuality(i, 'multiplier', Number(e.target.value))} />
              </div>
              <div className={styles.field}>
                <label>Description</label>
                <input value={q.desc || ''} onChange={e => updateQuality(i, 'desc', e.target.value)} />
              </div>
              <div className={styles.field}>
                <label>Theme Color (Hex)</label>
                <input value={q.color || ''} onChange={e => updateQuality(i, 'color', e.target.value)} />
              </div>
            </div>
          ))}
        </div>
        <button className={styles.addBtn} onClick={addQuality}>+ Add Quality Level</button>
      </section>

      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Cost Breakdown Ratios</h3>
        <p style={{ color: '#a0aec0', fontSize: '0.9rem', marginBottom: '20px' }}>
          Define the baseline distribution of the total cost. The sum must exactly equal <strong>1.00</strong> (100%).
        </p>
        <div className={styles.grid}>
          {['foundation', 'structure', 'interior', 'labor', 'miscellaneous'].map(key => (
            <div key={key} className={styles.card}>
              <div className={styles.field}>
                <label>{key} Ratio</label>
                <input 
                  type="number" step="0.01" 
                  value={config.breakdown?.[key] ?? 0} 
                  onChange={e => updateBreakdown(key, Number(e.target.value))} 
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Cities</h3>
        <div className={styles.grid}>
          {config.cities.map((c, i) => (
            <div key={i} className={styles.card}>
              <button className={styles.delBtn} onClick={() => delCity(i)}>Remove</button>
              <div className={styles.field}>
                <label>City Name</label>
                <input value={c.name} onChange={e => updateCity(i, 'name', e.target.value)} />
              </div>
              <div className={styles.field}>
                <label>Base Cost (₹/sq.ft)</label>
                <input type="number" value={c.cost_per_sqft} onChange={e => updateCity(i, 'cost_per_sqft', Number(e.target.value))} />
              </div>
              <div className={styles.field}>
                <label>Labor Multiplier</label>
                <input type="number" step="0.01" value={c.labor_multiplier} onChange={e => updateCity(i, 'labor_multiplier', Number(e.target.value))} />
              </div>
              <div className={styles.field}>
                <label>Material Multiplier</label>
                <input type="number" step="0.01" value={c.material_multiplier} onChange={e => updateCity(i, 'material_multiplier', Number(e.target.value))} />
              </div>
            </div>
          ))}
        </div>
        <button className={styles.addBtn} onClick={addCity}>+ Add City</button>
      </section>
      
    </div>
  )
}
