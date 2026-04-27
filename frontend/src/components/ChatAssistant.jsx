import { useState, useRef, useEffect } from 'react'
import styles from './ChatAssistant.module.css'

export default function ChatAssistant() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hello! I am your BuildSmart AI. How can I help you with your home construction project today?' }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSend = async (e) => {
    e.preventDefault()
    if (!input.trim() || loading) return

    const userMessage = { role: 'user', content: input }
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [...messages, userMessage] })
      })
      const data = await res.json()
      if (data.response) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.response }])
      } else {
        throw new Error(data.error || 'Failed to get response')
      }
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I am having trouble connecting right now.' }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.container}>
      {/* Toggle Button */}
      <button 
        className={styles.toggle} 
        onClick={() => setIsOpen(!isOpen)}
        title="Chat with BuildSmart AI"
        style={{ display: isOpen ? 'none' : 'flex' }}
      >
        💬
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className={styles.window}>
          <div className={styles.header}>
            <div className={styles.headerTop}>
              <div className={styles.headerInfo}>
                <span className={styles.status}>●</span>
                <h3>BuildSmart AI</h3>
              </div>
              <div className={styles.headerActions}>
                <button className={styles.actionBtn} onClick={() => setMessages([{ role: 'assistant', content: 'Chat cleared. How else can I help you?' }])} title="Clear Chat">🗑️</button>
                <button className={styles.actionBtn} onClick={() => setIsOpen(false)} title="Close Chat">✕</button>
              </div>
            </div>
            <p>Expert Construction Assistant</p>
          </div>

          <div className={styles.messages}>
            {messages.map((m, i) => (
              <div key={i} className={`${styles.message} ${m.role === 'user' ? styles.user : styles.assistant}`}>
                <div className={styles.bubble}>
                  {m.content.split('\n').filter(l => l.trim()).map((line, idx) => {
                    if (line.startsWith('###')) return <strong key={idx} style={{ display: 'block', margin: '0.5rem 0' }}>{line.replace('###', '').trim()}</strong>
                    if (line.startsWith('-') || line.startsWith('*')) return <div key={idx} style={{ marginLeft: '1rem' }}>• {line.substring(1).trim()}</div>
                    return <p key={idx} style={{ margin: '0.25rem 0' }}>{line}</p>
                  })}
                </div>
              </div>
            ))}
            {loading && (
              <div className={`${styles.message} ${styles.assistant}`}>
                <div className={styles.bubble}>
                  <span className={styles.typing}>
                    <span>.</span><span>.</span><span>.</span>
                  </span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form className={styles.inputArea} onSubmit={handleSend}>
            <input 
              type="text" 
              placeholder="Ask about materials, costs, etc..." 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading}
            />
            <button type="submit" disabled={loading || !input.trim()}>
              ➤
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
