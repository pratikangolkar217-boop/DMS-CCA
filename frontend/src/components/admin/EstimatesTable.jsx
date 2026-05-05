import { useState } from 'react'
import styles from './EstimatesTable.module.css'

const QUALITY_COLOR = { standard: 'blue', premium: 'gold', luxury: 'purple' }

function fmt(n) {
  if (!n && n !== 0) return '—'
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(2)} Cr`
  if (n >= 100000)   return `₹${(n / 100000).toFixed(2)} L`
  return `₹${Number(n).toLocaleString('en-IN')}`
}

function fmtDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric'
  })
}

export default function EstimatesTable({ items, loading, onEdit, onDelete, page, pages, onPageChange }) {
  const [confirmId, setConfirmId] = useState(null)

  const handleDelete = (id) => {
    if (confirmId === id) {
      onDelete(id)
      setConfirmId(null)
    } else {
      setConfirmId(id)
      setTimeout(() => setConfirmId(null), 3000)
    }
  }

  if (loading) {
    return (
      <div className={styles.tableWrap}>
        <div className={styles.loadingRows}>
          {[...Array(6)].map((_, i) => (
            <div key={i} className={styles.skeletonRow} style={{ animationDelay: `${i * 0.07}s` }} />
          ))}
        </div>
      </div>
    )
  }

  if (!items || items.length === 0) {
    return (
      <div className={styles.empty}>
        <span className={styles.emptyIcon}>📋</span>
        <p>No estimates found</p>
        <small>Submit a survey from the main app to see data here.</small>
      </div>
    )
  }

  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>#</th>
            <th>City</th>
            <th>Area (sq.ft)</th>
            <th>Quality</th>
            <th>Floors</th>
            <th>Total Cost</th>
            <th>Date</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, idx) => (
            <tr key={item.id} className={styles.row}>
              <td className={styles.num}>{(page - 1) * 20 + idx + 1}</td>
              <td className={styles.city}>
                <span className={styles.cityDot} />
                {item.location_info?.city || item.raw_input?.location || '—'}
              </td>
              <td>{item.inputs?.total_area || item.raw_input?.area || '—'}</td>
              <td>
                <span className={`${styles.badge} ${styles[QUALITY_COLOR[item.inputs?.quality] || 'blue']}`}>
                  {item.inputs?.quality || '—'}
                </span>
              </td>
              <td>{item.inputs?.floors || item.raw_input?.floors || '—'}</td>
              <td className={styles.cost}>{fmt(item.total_cost)}</td>
              <td className={styles.date}>{fmtDate(item.created_at)}</td>
              <td className={styles.actions}>
                <button
                  className={styles.editBtn}
                  onClick={() => onEdit(item)}
                  title="Edit estimate"
                >✏️</button>
                <button
                  className={`${styles.delBtn} ${confirmId === item.id ? styles.confirm : ''}`}
                  onClick={() => handleDelete(item.id)}
                  title={confirmId === item.id ? 'Click again to confirm delete' : 'Delete'}
                >
                  {confirmId === item.id ? '⚠️' : '🗑️'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {pages > 1 && (
        <div className={styles.pagination}>
          <button disabled={page <= 1} onClick={() => onPageChange(page - 1)} className={styles.pageBtn}>← Prev</button>
          <span className={styles.pageInfo}>Page {page} of {pages}</span>
          <button disabled={page >= pages} onClick={() => onPageChange(page + 1)} className={styles.pageBtn}>Next →</button>
        </div>
      )}
    </div>
  )
}
