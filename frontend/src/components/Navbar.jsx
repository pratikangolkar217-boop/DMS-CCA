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
        {location.pathname !== '/survey' && (
          <Link to="/survey" className="btn btn-primary btn-sm">
            Start Estimating
          </Link>
        )}
        {location.pathname !== '/manual' && (
          <Link to="/manual" className="btn btn-ghost btn-sm">
            Manual Input
          </Link>
        )}
      </div>
    </nav>
  )
}
