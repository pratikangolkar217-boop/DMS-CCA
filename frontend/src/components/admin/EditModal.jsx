import { useState, useEffect } from 'react'
import styles from './EditModal.module.css'

const API = 'http://127.0.0.1:5000'

const QUALITY_OPTIONS = ['standard', 'premium', 'luxury']

export default function EditModal({ estimate, onClose, onSaved }) {
  const [form, setForm] = useState({
    'location_info.city': '',
    'inputs.total_area': '',
    'inputs.quality': '',
    'inputs.floors': '',
    total_cost: '',
    admin_notes: '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!estimate) return
    setForm({
      'location_info.city': estimate.location_info?.city || '',
      'inputs.total_area': estimate.inputs?.total_area || '',
      'inputs.quality': estimate.inputs?.quality || 'standard',
      'inputs.floors': estimate.inputs?.floors || '',
      total_cost: estimate.total_cost || '',
      admin_notes: estimate.admin_notes || '',
    })
    setError('')
  }, [estimate])

  if (!estimate) return null

  const handleChange = (key, value) => {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  const handleSave = async () => {
    setSaving(true)
    setError('')
    try {
      const payload = { ...form }
      // Convert numeric fields
      if (payload.total_cost) payload.total_cost = Number(payload.total_cost)
      if (payload['inputs.total_area']) payload['inputs.total_area'] = Number(payload['inputs.total_area'])
      if (payload['inputs.floors']) payload['inputs.floors'] = Number(payload['inputs.floors'])

      const token = localStorage.getItem('admin_token')
      const res = await fetch(`${API}/admin/estimates/${estimate.id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error || 'Save failed')
      }
      onSaved()
      onClose()
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  const fmt = (n) => {
    if (!n) return '—'
    return `₹${Number(n).toLocaleString('en-IN')}`
  }

  return (
    <div className={styles.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal}>
        {/* Header */}
        <div className={styles.header}>
          <div>
            <h2 className={styles.title}>✏️ Edit Estimate</h2>
            <p className={styles.subtitle}>ID: <code>{estimate.id}</code></p>
          </div>
          <button className={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        {/* Original values strip */}
        <div className={styles.origStrip}>
          <span>Original cost: <strong>{fmt(estimate.total_cost)}</strong></span>
          <span>Date: <strong>{estimate.created_at ? new Date(estimate.created_at).toLocaleDateString('en-IN') : '—'}</strong></span>
        </div>

        {/* Form */}
        <div className={styles.grid}>
          <Field label="City" id="edit-city">
            <input
              id="edit-city"
              type="text"
              className={styles.input}
              value={form['location_info.city']}
              onChange={e => handleChange('location_info.city', e.target.value)}
              placeholder="e.g. Mumbai"
            />
          </Field>

          <Field label="Area (sq.ft)" id="edit-area">
            <input
              id="edit-area"
              type="number"
              className={styles.input}
              value={form['inputs.total_area']}
              onChange={e => handleChange('inputs.total_area', e.target.value)}
              placeholder="e.g. 1200"
            />
          </Field>

          <Field label="Quality" id="edit-quality">
            <select
              id="edit-quality"
              className={styles.input}
              value={form['inputs.quality']}
              onChange={e => handleChange('inputs.quality', e.target.value)}
            >
              {QUALITY_OPTIONS.map(q => (
                <option key={q} value={q}>{q.charAt(0).toUpperCase() + q.slice(1)}</option>
              ))}
            </select>
          </Field>

          <Field label="Floors" id="edit-floors">
            <input
              id="edit-floors"
              type="number"
              className={styles.input}
              value={form['inputs.floors']}
              onChange={e => handleChange('inputs.floors', e.target.value)}
              placeholder="e.g. 2"
            />
          </Field>

          <Field label="Total Cost Override (₹)" id="edit-cost" fullWidth>
            <input
              id="edit-cost"
              type="number"
              className={`${styles.input} ${styles.costInput}`}
              value={form.total_cost}
              onChange={e => handleChange('total_cost', e.target.value)}
              placeholder="e.g. 3500000"
            />
          </Field>

          <Field label="Admin Notes" id="edit-notes" fullWidth>
            <textarea
              id="edit-notes"
              className={`${styles.input} ${styles.textarea}`}
              value={form.admin_notes}
              onChange={e => handleChange('admin_notes', e.target.value)}
              placeholder="Internal notes (not shown to user)…"
              rows={3}
            />
          </Field>
        </div>

        {error && <p className={styles.error}>⚠️ {error}</p>}

        {/* Footer */}
        <div className={styles.footer}>
          <button className={styles.cancelBtn} onClick={onClose} disabled={saving}>Cancel</button>
          <button className={styles.saveBtn} onClick={handleSave} disabled={saving}>
            {saving ? <span className={styles.spinner} /> : null}
            {saving ? 'Saving…' : '💾 Save Changes'}
          </button>
        </div>
      </div>
    </div>
  )
}

function Field({ label, id, children, fullWidth }) {
  return (
    <div className={`${styles.field} ${fullWidth ? styles.fullWidth : ''}`}>
      <label className={styles.fieldLabel} htmlFor={id}>{label}</label>
      {children}
    </div>
  )
}
