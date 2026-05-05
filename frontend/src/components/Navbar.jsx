import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const location = useLocation()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
      <Link to="/" className="navbar-logo">
        🏗️ BuildSmart
      </Link>
      <div className="navbar-actions">
        <Link
          to="/admin"
          style={{
            fontSize: '0.78rem',
            color: 'rgba(255,255,255,0.45)',
            textDecoration: 'none',
            padding: '0.35rem 0.75rem',
            borderRadius: '8px',
            border: '1px solid rgba(255,255,255,0.1)',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={e => { e.target.style.color = '#63b3ed'; e.target.style.borderColor = 'rgba(99,179,237,0.4)' }}
          onMouseLeave={e => { e.target.style.color = 'rgba(255,255,255,0.45)'; e.target.style.borderColor = 'rgba(255,255,255,0.1)' }}
        >
          ⚙️ Admin
        </Link>
        {location.pathname !== '/survey' && (
          <Link to="/survey" className="btn btn-primary btn-sm">
            Start Estimating
          </Link>
        )}
      </div>
    </nav>
  )
}
