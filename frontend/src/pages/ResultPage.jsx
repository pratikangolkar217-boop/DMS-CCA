import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  Chart as ChartJS, ArcElement, Tooltip, Legend,
  CategoryScale, LinearScale, BarElement, Title
} from 'chart.js'
import { Pie, Bar } from 'react-chartjs-2'
import { downloadAsPDF, downloadAsPNG, formatINR } from '../components/ReportGenerator'
import styles from './ResultPage.module.css'

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title)

const BREAKDOWN_META = {
  foundation:   { label: 'Foundation',   icon: '🪨', color: '#4f8ef7' },
  structure:    { label: 'Structure',     icon: '🏗️', color: '#7c3aed' },
  interior:     { label: 'Interior',      icon: '🛋️', color: '#06d6a0' },
  labor:        { label: 'Labor',         icon: '👷', color: '#f59e0b' },
  miscellaneous:{ label: 'Miscellaneous', icon: '📦', color: '#ef4444' },
}

function EMICalculator({ totalCost }) {
  const [rate, setRate] = useState(8.5)
  const [tenure, setTenure] = useState(20)
  const [loanPct, setLoanPct] = useState(80)

  const loanAmount = (totalCost * loanPct) / 100
  const monthlyRate = rate / (12 * 100)
  const months = tenure * 12
  const emi = Math.round(
    (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, months)) /
    (Math.pow(1 + monthlyRate, months) - 1)
  )

  return (
    <div className={styles.emiBox}>
      <h3 className={styles.sectionTitle}>💰 Home Loan EMI Estimator</h3>
      <div className={styles.emiGrid}>
        <div className={styles.emiInput}>
          <label>Loan Amount (% of Cost)</label>
          <input type="range" min="50" max="90" step="5" value={loanPct} onChange={e => setLoanPct(e.target.value)} />
          <span>{loanPct}% (₹{(loanAmount/100000).toFixed(1)}L)</span>
        </div>
        <div className={styles.emiInput}>
          <label>Interest Rate (%)</label>
          <input type="range" min="7" max="12" step="0.1" value={rate} onChange={e => setRate(e.target.value)} />
          <span>{rate}%</span>
        </div>
        <div className={styles.emiInput}>
          <label>Tenure (Years)</label>
          <input type="range" min="5" max="30" step="5" value={tenure} onChange={e => setTenure(e.target.value)} />
          <span>{tenure} yrs</span>
        </div>
        <div className={styles.emiResult}>
          <span className={styles.emiLabel}>Estimated Monthly EMI</span>
          <span className={styles.emiValue}>₹{emi.toLocaleString()} /mo</span>
        </div>
      </div>
    </div>
  )
}

function AnimatedCounter({ target }) {
  const [val, setVal] = useState(0)
  useEffect(() => {
    const duration = 1800
    const start = Date.now()
    const tick = () => {
      const elapsed = Date.now() - start
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setVal(Math.round(eased * target))
      if (progress < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }, [target])
  return <span>{formatINR(val)}</span>
}

export default function ResultPage() {
  const navigate = useNavigate()
  const { state } = useLocation()
  const [downloading, setDownloading] = useState('')

  if (!state?.result) {
    return (
      <div className={styles.noResult}>
        <div className={styles.noResultInner}>
          <div style={{ fontSize: '4rem' }}>🏚️</div>
          <h2>No Estimate Found</h2>
          <p>Please complete the survey first to get your estimate.</p>
          <button className="btn btn-primary" onClick={() => navigate('/survey')}>Start Survey</button>
        </div>
      </div>
    )
  }

  const { result, inputs } = state
  const { total_cost, breakdown, location_info, recommendations, room_summary, amenity_costs, inputs: calcInputs } = result

  const breakdownKeys = Object.keys(BREAKDOWN_META)
  const breakdownValues = breakdownKeys.map(k => breakdown[k] || 0)
  const breakdownColors = breakdownKeys.map(k => BREAKDOWN_META[k].color)

  const pieData = {
    labels: breakdownKeys.map(k => BREAKDOWN_META[k].label),
    datasets: [{
      data: breakdownValues,
      backgroundColor: breakdownColors.map(c => c + 'cc'),
      borderColor: breakdownColors,
      borderWidth: 2,
      hoverOffset: 8,
    }],
  }

  const barData = {
    labels: breakdownKeys.map(k => BREAKDOWN_META[k].label),
    datasets: [{
      label: 'Cost (₹)',
      data: breakdownValues,
      backgroundColor: breakdownColors.map(c => c + 'aa'),
      borderColor: breakdownColors,
      borderWidth: 2,
      borderRadius: 8,
    }],
  }

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { labels: { color: '#8892b0', font: { family: 'Inter', size: 12 } } },
      tooltip: {
        callbacks: {
          label: ctx => ` ${formatINR(ctx.parsed || ctx.parsed.y || 0)}`
        }
      }
    },
  }

  const barOptions = {
    ...chartOptions,
    scales: {
      y: {
        ticks: { color: '#8892b0', callback: v => '₹' + (v/100000).toFixed(0) + 'L' },
        grid:  { color: 'rgba(255,255,255,0.05)' },
      },
      x: { ticks: { color: '#8892b0' }, grid: { display: false } },
    },
  }

  const handleDownload = async (format) => {
    setDownloading(format)
    const timestamp = new Date().toISOString().split('T')[0]
    const cityName = result?.location_info?.city?.replace(/\s+/g, '_') || 'Estimate'
    const filename = `BuildSmart_${cityName}_${timestamp}`

    try {
      if (format === 'pdf') {
        await downloadAsPDF('report-content', filename)
      } else {
        await downloadAsPNG('report-content', filename)
      }
    } finally {
      setDownloading(null)
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.orb1} />
      <div className={styles.orb2} />

      <div className="container" style={{ paddingTop: '1rem', paddingBottom: '4rem' }}>

        {/* Action bar */}
        <div className={styles.actionBar}>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/survey')}>
            ← New Estimate
          </button>
          <div className={styles.downloadBtns}>
            <button id="download-png" className="btn btn-secondary btn-sm" onClick={() => handleDownload('png')} disabled={!!downloading}>
              {downloading === 'png' ? '⏳' : '🖼️'} Download PNG
            </button>
            <button id="download-pdf" className="btn btn-primary btn-sm" onClick={() => handleDownload('pdf')} disabled={!!downloading}>
              {downloading === 'pdf' ? '⏳' : '📄'} Download PDF
            </button>
          </div>
        </div>

        {/* Report Content (captured for PDF/PNG) */}
        <div id="report-content" className={styles.report}>
          
          {/* Branded Header (Visible in PDF) */}
          <div className={styles.brandedHeader}>
            <div className="navbar-logo">🏗️ BuildSmart</div>
            <div className={styles.dateInfo}>Generated on {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
          </div>

          {/* Report Header */}
          <div className={styles.reportHeader}>
            <div>
              <div className="badge badge-primary" style={{ marginBottom: '0.75rem' }}>BuildSmart Estimate Report</div>
              <h1 className={styles.reportTitle}>Construction Cost Estimate</h1>
              <p className={styles.reportSub}>
                {location_info.city} · {calcInputs.total_area?.toLocaleString()} sq.ft built-up area · {inputs.floors} floor{inputs.floors > 1 ? 's' : ''}
                {location_info.is_fallback && <span className={styles.fallbackBadge}>⚠️ National avg pricing</span>}
                {location_info.is_ai_estimated && <span className={styles.aiBadge}>🤖 AI-estimated pricing</span>}
              </p>
            </div>
          </div>

          {/* Total Cost Hero */}
          <div className={styles.totalCost}>
            <p className={styles.totalLabel}>Total Estimated Cost</p>
            <div className={styles.totalAmount}>
              <AnimatedCounter target={total_cost} />
            </div>
            <p className={styles.totalNote}>
              ₹{Math.round(total_cost / calcInputs.total_area).toLocaleString()} per sq.ft · {inputs.quality} quality
            </p>
          </div>

          {/* Breakdown Cards */}
          <div className={styles.breakdownGrid}>
            {breakdownKeys.map((k, i) => (
              <div key={k} className={styles.breakdownCard} style={{ '--card-color': BREAKDOWN_META[k].color }}>
                <div className={styles.breakdownIcon}>{BREAKDOWN_META[k].icon}</div>
                <div className={styles.breakdownLabel}>{BREAKDOWN_META[k].label}</div>
                <div className={styles.breakdownAmt}>{formatINR(breakdown[k] || 0)}</div>
                <div className={styles.breakdownPct}>{Math.round((breakdown[k] / total_cost) * 100)}%</div>
              </div>
            ))}
          </div>

          {/* Charts */}
          <div className={styles.charts}>
            <div className={styles.chartCard}>
              <h3 className={styles.chartTitle}>Cost Distribution</h3>
              <div className={styles.pieWrap}>
                <Pie data={pieData} options={chartOptions} />
              </div>
            </div>
            <div className={styles.chartCard}>
              <h3 className={styles.chartTitle}>Breakdown by Category</h3>
              <Bar data={barData} options={barOptions} />
            </div>
          </div>

          {/* Input Summary */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>📋 Your Inputs</h3>
            <div className={styles.inputGrid}>
              {[
                { label: 'Location', value: location_info.city },
                { label: 'Plot Area', value: `${calcInputs.area?.toLocaleString()} sq.ft (${(calcInputs.area/1089).toFixed(2)} Guntha)` },
                { label: 'Floors', value: inputs.floors },
                { label: 'Total Built-up', value: `${calcInputs.total_area?.toLocaleString()} sq.ft (${(calcInputs.total_area/1089).toFixed(2)} Guntha)` },
                { label: 'Quality', value: (inputs.quality||'').charAt(0).toUpperCase() + (inputs.quality||'').slice(1) },
                { label: 'Base Rate', value: `₹${location_info.cost_per_sqft}/sq.ft` },
                { label: 'Bedrooms (total)', value: room_summary?.bedrooms?.toLocaleString() },
                { label: 'Bathrooms (total)', value: room_summary?.bathrooms?.toLocaleString() },
              ].map((r, i) => (
                <div key={i} className={styles.inputRow}>
                  <span className={styles.inputLabel}>{r.label}</span>
                  <span className={styles.inputValue}>{r.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Amenities */}
          {amenity_costs && Object.keys(amenity_costs).length > 0 && (
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>✨ Amenity Add-ons</h3>
              <div className={styles.amenityList}>
                {Object.entries(amenity_costs).map(([a, c]) => (
                  <div key={a} className={styles.amenityRow}>
                    <span>{a.replace(/_/g, ' ')}</span>
                    <span className={styles.amenityPrice}>{formatINR(c)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recommendations */}
          {recommendations && recommendations.length > 0 && (
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>💡 Recommendations</h3>
              <div className={styles.recList}>
                {recommendations.map((r, i) => (
                  <div key={i} className={styles.recItem}>
                    <span className={styles.recDot} />
                    <p>{r}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Material Estimation */}
          {result.material_estimate && (
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>🧱 Material Requirement Estimates (Approx)</h3>
              <div className={styles.materialGrid}>
                {[
                  { label: 'Cement',    val: `${result.material_estimate.cement} Bags`, icon: '🛒' },
                  { label: 'Steel',     val: `${result.material_estimate.steel?.toLocaleString()} kg`, icon: '🏗️' },
                  { label: 'Bricks',    val: `${result.material_estimate.bricks?.toLocaleString()} Nos`, icon: '🧱' },
                  { label: 'Sand',      val: `${result.material_estimate.sand?.toLocaleString()} cu.ft`, icon: '🏜️' },
                  { label: 'Aggregate', val: `${result.material_estimate.aggregate?.toLocaleString()} cu.ft`, icon: '🪨' },
                ].map((m, i) => (
                  <div key={i} className={styles.materialCard}>
                    <span className={styles.materialIcon}>{m.icon}</span>
                    <div className={styles.materialInfo}>
                      <span className={styles.materialLabel}>{m.label}</span>
                      <span className={styles.materialVal}>{m.val}</span>
                    </div>
                  </div>
                ))}
              </div>
              <p className={styles.materialNote}>* These are approximate volumetric estimates based on standard civil engineering benchmarks.</p>
            </div>
          )}

          {/* EMI Calculator */}
          <EMICalculator totalCost={total_cost} />

          {result.ai_analysis && (
            <div className={`${styles.section} ${styles.aiSection}`}>
              <div className={styles.aiHeader}>
                <span className={styles.aiIcon}>🤖</span>
                <div className={styles.aiTitleWrap}>
                  <h3 className={styles.sectionTitle}>AI Market Analysis & Refinement</h3>
                  <span className="badge badge-accent">Live from Groq</span>
                </div>
              </div>
              <div className={styles.aiContent}>
                {result.ai_analysis.split('\n').filter(l => l.trim()).map((line, i) => {
                  // Basic markdown-like detection for headers or lists
                  if (line.startsWith('###')) return <h4 key={i} className={styles.aiSubhead}>{line.replace('###', '').trim()}</h4>
                  if (line.startsWith('-') || line.startsWith('*')) return <li key={i} className={styles.aiListItem}>{line.substring(1).trim()}</li>
                  return <p key={i} className={styles.aiPara}>{line}</p>
                })}
              </div>
            </div>
          )}

          <div className={styles.reportFooter}>
            <p>Generated by BuildSmart · Estimates are approximate and for planning purposes only.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
