import { useNavigate } from 'react-router-dom'
import styles from './LandingPage.module.css'

const FEATURES = [
  {
    icon: '🗺️',
    title: 'Location-Based Pricing',
    desc: '20+ Indian cities with real-world cost-per-sq.ft data. Accurate multipliers for labor and materials.',
  },
  {
    icon: '🧮',
    title: 'Instant Cost Breakdown',
    desc: 'Foundation, structure, interior, labor — every rupee accounted for in a beautiful visual breakdown.',
  },
  {
    icon: '📄',
    title: 'Downloadable Reports',
    desc: 'Get a shareable PDF or PNG report with your full estimate, breakdown, and personalized recommendations.',
  },
]

const STATS = [
  { value: '20+', label: 'Cities Covered' },
  { value: '₹1L+', label: 'Min Budget Handled' },
  { value: '5', label: 'Cost Categories' },
  { value: '100%', label: 'Free to Use' },
]

export default function LandingPage() {
  const navigate = useNavigate()

  return (
    <div className={styles.page}>
      {/* Background orbs */}
      <div className={styles.orb1} />
      <div className={styles.orb2} />
      <div className={styles.orb3} />

      {/* Hero */}
      <section className={styles.hero}>
        <div className={`container ${styles.heroInner}`}>
          <div className={`badge badge-primary animate-fadeInUp`}>
            <span>✦</span> Smart Home Cost Estimator
          </div>

          <h1 className={`${styles.heroTitle} animate-fadeInUp delay-1`}>
            Build Your Dream Home<br />
            <span className="gradient-text">Without the Guesswork</span>
          </h1>

          <p className={`${styles.heroDesc} animate-fadeInUp delay-2`}>
            Answer a few simple questions about your home — location, size, rooms, and quality.
            Get an instant, detailed construction cost estimate with a full breakdown and expert recommendations.
          </p>

          <div className={`${styles.heroActions} animate-fadeInUp delay-3`}>
            <button
              id="start-survey-btn"
              className="btn btn-primary btn-lg"
              onClick={() => navigate('/survey')}
            >
              🚀 Start Free Estimate
            </button>
            <button
              id="manual-input-btn"
              className="btn btn-secondary btn-lg"
              onClick={() => navigate('/manual')}
            >
              ✏️ Enter Manually
            </button>
          </div>

          <p className={`${styles.heroNote} animate-fadeInUp delay-4`}>
            No signup required · Takes under 2 minutes · 100% free
          </p>
        </div>

        {/* Floating house card */}
        <div className={`${styles.heroCard} animate-fadeInUp delay-3`}>
          <div className={styles.housePrev}>
            <div className={styles.houseIcon}>🏠</div>
            <div className={styles.houseStats}>
              <div className={styles.houseStat}>
                <span className={styles.houseStatVal}>₹42,00,000</span>
                <span className={styles.houseStatLabel}>Estimated Cost</span>
              </div>
              <div className={styles.houseStatRow}>
                <div className={styles.houseTag}>2 Floors</div>
                <div className={styles.houseTag}>4 BHK</div>
                <div className={styles.houseTag}>Premium</div>
              </div>
              <div className={styles.breakdownBar}>
                <div className={styles.bPart} style={{ width: '20%', background: '#4f8ef7' }} title="Foundation 20%" />
                <div className={styles.bPart} style={{ width: '40%', background: '#7c3aed' }} title="Structure 40%" />
                <div className={styles.bPart} style={{ width: '25%', background: '#06d6a0' }} title="Interior 25%" />
                <div className={styles.bPart} style={{ width: '10%', background: '#f59e0b' }} title="Labor 10%" />
                <div className={styles.bPart} style={{ width: '5%',  background: '#ef4444' }} title="Misc 5%" />
              </div>
              <div className={styles.breakdownLegend}>
                {[['#4f8ef7','Foundation'],['#7c3aed','Structure'],['#06d6a0','Interior'],['#f59e0b','Labor'],['#ef4444','Misc']].map(([c,l]) => (
                  <span key={l} className={styles.legendItem}>
                    <span className={styles.legendDot} style={{ background: c }} />
                    {l}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className={styles.stats}>
        <div className="container">
          <div className={styles.statsGrid}>
            {STATS.map((s, i) => (
              <div key={i} className={`${styles.statCard} animate-fadeInUp`} style={{ animationDelay: `${i * 0.1}s` }}>
                <div className={styles.statValue}>{s.value}</div>
                <div className={styles.statLabel}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className={styles.features}>
        <div className="container">
          <div className={styles.sectionHead}>
            <span className="badge badge-accent">Features</span>
            <h2 className={styles.sectionTitle}>
              Everything You Need to <span className="gradient-text">Plan Smart</span>
            </h2>
            <p className={styles.sectionDesc}>
              More than a calculator — a guided home planning assistant that educates, suggests, and informs.
            </p>
          </div>

          <div className={styles.featGrid}>
            {FEATURES.map((f, i) => (
              <div key={i} className={`card ${styles.featCard} animate-fadeInUp`} style={{ animationDelay: `${i * 0.15}s` }}>
                <div className={styles.featIcon}>{f.icon}</div>
                <h3 className={styles.featTitle}>{f.title}</h3>
                <p className={styles.featDesc}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className={styles.howItWorks}>
        <div className="container">
          <div className={styles.sectionHead}>
            <span className="badge badge-primary">How It Works</span>
            <h2 className={styles.sectionTitle}>Ready in <span className="gradient-text">3 Simple Steps</span></h2>
          </div>
          <div className={styles.steps}>
            {[
              { n: '01', title: 'Answer Questions', desc: 'Tell us your location, area, floors, rooms, and quality preference.' },
              { n: '02', title: 'We Calculate',     desc: 'Our engine applies location factors, quality multipliers, and amenity costs.' },
              { n: '03', title: 'Get Your Report',  desc: 'View a detailed breakdown with charts and download your personalized PDF.' },
            ].map((s, i) => (
              <div key={i} className={`${styles.stepItem} animate-fadeInUp`} style={{ animationDelay: `${i * 0.15}s` }}>
                <div className={styles.stepNum}>{s.n}</div>
                <h4 className={styles.stepTitle}>{s.title}</h4>
                <p className={styles.stepDesc}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className={styles.cta}>
        <div className="container">
          <div className={styles.ctaBox}>
            <h2 className={styles.ctaTitle}>Ready to Estimate Your Home?</h2>
            <p className={styles.ctaDesc}>Join thousands of homeowners who planned smarter with BuildSmart.</p>
            <button className="btn btn-primary btn-lg" onClick={() => navigate('/survey')}>
              🏗️ Start Your Free Estimate
            </button>
          </div>
        </div>
      </section>

      <footer className={styles.footer}>
        <p>© 2025 BuildSmart · Estimates are approximate and for planning purposes only.</p>
      </footer>
    </div>
  )
}
