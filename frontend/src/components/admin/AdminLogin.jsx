import { useState } from 'react'
import styles from './AdminLogin.module.css'

export default function AdminLogin({ onLoginSuccess }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('http://127.0.0.1:5000/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Login failed')
      }

      // Store token in localStorage
      localStorage.setItem('admin_token', data.token)
      onLoginSuccess(data.token)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.loginPage}>
      <div className={styles.loginCard}>
        <h1 className={styles.title}>Admin Access</h1>
        <p className={styles.subtitle}>Please enter your credentials to continue</p>
        
        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.field}>
            <label>Username</label>
            <input 
              type="text" 
              value={username} 
              onChange={(e) => setUsername(e.target.value)} 
              placeholder="Enter username"
              required 
            />
          </div>
          <div className={styles.field}>
            <label>Password</label>
            <input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              placeholder="Enter password"
              required 
            />
          </div>
          
          <button type="submit" className={styles.loginBtn} disabled={loading}>
            {loading ? 'Authenticating...' : 'Secure Login'}
          </button>
        </form>

        {error && <div className={styles.errorMsg}>⚠️ {error}</div>}
      </div>
    </div>
  )
}
