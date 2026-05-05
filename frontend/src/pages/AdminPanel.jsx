import { useState, useEffect, useCallback } from 'react'
import StatsCard from '../components/admin/StatsCard'
import EstimatesTable from '../components/admin/EstimatesTable'
import EditModal from '../components/admin/EditModal'
import ConfigTab from '../components/admin/ConfigTab'
import AdminLogin from '../components/admin/AdminLogin'
import styles from './AdminPanel.module.css'

const API = 'http://127.0.0.1:5000'

function fmt(n) {
  if (!n && n !== 0) return '—'
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(2)} Cr`
  if (n >= 100000)   return `₹${(n / 100000).toFixed(2)} L`
  return `₹${Number(n).toLocaleString('en-IN')}`
}

function BarChart({ data, keyField, valField, color }) {
  if (!data || data.length === 0) return <p className={styles.noData}>No data yet</p>
  const max = Math.max(...data.map(d => d[valField]), 1)
  return (
    <div className={styles.barChart}>
      {data.map((d, i) => (
        <div key={i} className={styles.barRow}>
          <span className={styles.barLabel}>{d[keyField]}</span>
          <div className={styles.barTrack}>
            <div className={styles.barFill} style={{ width: `${(d[valField] / max) * 100}%`, background: color }} />
          </div>
          <span className={styles.barVal}>{d[valField]}</span>
        </div>
      ))}
    </div>
  )
}

function Sparkline({ data }) {
  if (!data || data.length < 2) return <p className={styles.noData}>Not enough data yet</p>
  const vals = data.map(d => d.count)
  const max = Math.max(...vals, 1)
  const W = 100, H = 40
  const pts = vals.map((v, i) => `${(i / (vals.length - 1)) * W},${H - (v / max) * H}`).join(' ')
  return (
    <div className={styles.sparkWrap}>
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className={styles.spark}>
        <polyline points={pts} fill="none" stroke="#63b3ed" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <div className={styles.sparkLabels}>
        <span>{data[0]?.date}</span>
        <span>{data[data.length - 1]?.date}</span>
      </div>
    </div>
  )
}

function QualityBreakdown({ qb, total }) {
  if (!qb || total === 0) return <p className={styles.noData}>No data yet</p>
  const items = [
    { key: 'standard', label: 'Standard', color: '#63b3ed' },
    { key: 'premium',  label: 'Premium',  color: '#ecc94b' },
    { key: 'luxury',   label: 'Luxury',   color: '#b794f4' },
  ]
  return (
    <div className={styles.qualityWrap}>
      {items.map(it => {
        const count = qb[it.key] || 0
        const pct = total > 0 ? Math.round((count / total) * 100) : 0
        return (
          <div key={it.key} className={styles.qRow}>
            <span className={styles.qDot} style={{ background: it.color }} />
            <span className={styles.qLabel}>{it.label}</span>
            <div className={styles.qTrack}>
              <div className={styles.qFill} style={{ width: `${pct}%`, background: it.color }} />
            </div>
            <span className={styles.qPct}>{pct}%</span>
            <span className={styles.qCount}>({count})</span>
          </div>
        )
      })}
    </div>
  )
}

export default function AdminPanel() {
  const [tab, setTab] = useState('dashboard')
  const [stats, setStats] = useState(null)
  const [statsLoading, setStatsLoading] = useState(true)
  const [statsError, setStatsError] = useState('')
  const [items, setItems] = useState([])
  const [histLoading, setHistLoading] = useState(false)
  const [histError, setHistError] = useState('')
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState('')
  const [quality, setQuality] = useState('')
  const [editTarget, setEditTarget] = useState(null)
  const [token, setToken] = useState(localStorage.getItem('admin_token'))

  const fetchStats = useCallback(async () => {
    if (!token) return
    setStatsLoading(true); setStatsError('')
    try {
      const res = await fetch(`${API}/admin/stats`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.status === 401) {
        setToken(null)
        localStorage.removeItem('admin_token')
        return
      }
      if (!res.ok) throw new Error(`Server error ${res.status}`)
      setStats(await res.json())
    } catch (e) { setStatsError(e.message) }
    finally { setStatsLoading(false) }
  }, [token])

  const fetchHistory = useCallback(async (pg = 1) => {
    if (!token) return
    setHistLoading(true); setHistError('')
    try {
      const p = new URLSearchParams({ page: pg, limit: 20 })
      if (search) p.set('search', search)
      if (quality) p.set('quality', quality)
      const res = await fetch(`${API}/admin/estimates?${p}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.status === 401) {
        setToken(null)
        localStorage.removeItem('admin_token')
        return
      }
      if (!res.ok) throw new Error(`Server error ${res.status}`)
      const data = await res.json()
      setItems(data.items); setPages(data.pages); setTotal(data.total); setPage(pg)
    } catch (e) { setHistError(e.message) }
    finally { setHistLoading(false) }
  }, [search, quality, token])

  useEffect(() => { fetchStats() }, [fetchStats])
  useEffect(() => { if (tab === 'history') fetchHistory(1) }, [tab, fetchHistory])

  const handleDelete = async (id) => {
    await fetch(`${API}/admin/estimates/${id}`, { 
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    })
    fetchHistory(page); fetchStats()
  }

  const handleLogout = () => {
    setToken(null)
    localStorage.removeItem('admin_token')
  }

  if (!token) {
    return <AdminLogin onLoginSuccess={(newToken) => setToken(newToken)} />
  }

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>⚙️ Admin Panel</h1>
          <p className={styles.pageSubtitle}>BuildSmart — Estimate Management & Analytics</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className={styles.refreshBtn} onClick={() => { fetchStats(); if (tab === 'history') fetchHistory(page) }}>🔄 Refresh</button>
          <button className={styles.refreshBtn} style={{ background: '#f56565' }} onClick={handleLogout}>🚪 Logout</button>
        </div>
      </div>

      <div className={styles.tabs}>
        <button className={`${styles.tab} ${tab === 'dashboard' ? styles.active : ''}`} onClick={() => setTab('dashboard')}>📊 Dashboard</button>
        <button className={`${styles.tab} ${tab === 'history' ? styles.active : ''}`} onClick={() => setTab('history')}>
          📋 History {total > 0 && <span className={styles.badge}>{total}</span>}
        </button>
        <button className={`${styles.tab} ${tab === 'config' ? styles.active : ''}`} onClick={() => setTab('config')}>⚙️ Configuration</button>
      </div>

      {tab === 'dashboard' && (
        <div className={styles.dashContent}>
          {statsError && <div className={styles.errorBanner}>⚠️ {statsError} — Make sure the backend is running on port 5000.</div>}
          <div className={styles.kpiGrid}>
            <StatsCard icon="📊" label="Total Estimates" color="blue" value={statsLoading ? null : (stats?.total_estimates ?? 0)} loading={statsLoading} />
            <StatsCard icon="💰" label="Average Cost" color="green" value={statsLoading ? null : fmt(stats?.cost_stats?.avg)} loading={statsLoading} />
            <StatsCard icon="⬆️" label="Highest Estimate" color="gold" value={statsLoading ? null : fmt(stats?.cost_stats?.max)} loading={statsLoading} />
            <StatsCard icon="⬇️" label="Lowest Estimate" color="purple" value={statsLoading ? null : fmt(stats?.cost_stats?.min)} loading={statsLoading} />
          </div>
          <div className={styles.chartsGrid}>
            <div className={styles.chartCard}>
              <h3 className={styles.chartTitle}>🏙️ Top Cities</h3>
              {statsLoading ? <div className={styles.chartSkel} /> : <BarChart data={stats?.top_cities} keyField="city" valField="count" color="#63b3ed" />}
            </div>
            <div className={styles.chartCard}>
              <h3 className={styles.chartTitle}>🏗️ Quality Breakdown</h3>
              {statsLoading ? <div className={styles.chartSkel} /> : <QualityBreakdown qb={stats?.quality_breakdown} total={stats?.total_estimates || 0} />}
            </div>
            <div className={`${styles.chartCard} ${styles.wide}`}>
              <h3 className={styles.chartTitle}>📈 Daily Submissions (Last 30 days)</h3>
              {statsLoading ? <div className={styles.chartSkel} /> : <Sparkline data={stats?.daily_trend} />}
            </div>
          </div>
          <div className={styles.recentSection}>
            <div className={styles.sectionHeader}>
              <h3 className={styles.chartTitle}>🕐 Recent Estimates</h3>
              <button className={styles.viewAllBtn} onClick={() => setTab('history')}>View All →</button>
            </div>
            <EstimatesTable items={stats?.recent_estimates} loading={statsLoading} onEdit={setEditTarget} onDelete={handleDelete} page={1} pages={1} onPageChange={() => {}} />
          </div>
        </div>
      )}

      {tab === 'history' && (
        <div className={styles.histContent}>
          <form className={styles.filterRow} onSubmit={(e) => { e.preventDefault(); fetchHistory(1) }}>
            <input id="admin-search" type="text" className={styles.searchInput} placeholder="🔍  Search by city…" value={search} onChange={e => setSearch(e.target.value)} />
            <select id="admin-quality-filter" className={styles.searchInput} value={quality} onChange={e => setQuality(e.target.value)}>
              <option value="">All Qualities</option>
              <option value="standard">Standard</option>
              <option value="premium">Premium</option>
              <option value="luxury">Luxury</option>
            </select>
            <button type="submit" className={styles.filterBtn}>Apply</button>
            <button type="button" className={styles.clearBtn} onClick={() => { setSearch(''); setQuality(''); setTimeout(() => fetchHistory(1), 50) }}>Clear</button>
            <span className={styles.totalBadge}>{total} records</span>
          </form>
          {histError && <div className={styles.errorBanner}>⚠️ {histError}</div>}
          <EstimatesTable items={items} loading={histLoading} onEdit={setEditTarget} onDelete={handleDelete} page={page} pages={pages} onPageChange={(pg) => fetchHistory(pg)} />
        </div>
      )}

      {tab === 'config' && (
        <div className={styles.histContent}>
           <ConfigTab />
        </div>
      )}

      <EditModal estimate={editTarget} onClose={() => setEditTarget(null)} onSaved={() => { fetchHistory(page); fetchStats() }} />
    </div>
  )
}
