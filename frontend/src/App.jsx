import { useState, useEffect } from 'react'
import QueryInput from './components/QueryInput'
import ResultTable from './components/ResultTable'
import SQLViewer from './components/SQLViewer'
import ChartPanel from './components/ChartPanel'
import HistorySidebar from './components/HistorySidebar'
import IntroPage from './components/IntroPage'
import AnimatedLogo, { AnimatedText } from './components/AnimatedLogo'
import { fetchHistory, sendQuery } from './api/client'

export default function App() {
  const [question, setQuestion] = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [history, setHistory] = useState([])
  const [showIntro, setShowIntro] = useState(true)

  const refreshHistory = async () => {
    try {
      const hist = await fetchHistory()
      setHistory(hist)
      console.log('[App] History loaded:', hist.length, 'items')
    } catch (err) {
      console.error('[App] Failed to load history:', err.message)
      // Don't set error state - history failure shouldn't block UI
    }
  }

  useEffect(() => { refreshHistory() }, [])

  const runQuery = async (qText) => {
    if (!qText.trim() || loading) return
    setQuestion(qText)
    setLoading(true)
    setError(null)
    try {
      const res = await sendQuery(qText)
      setResult(res)
      refreshHistory()
    } catch (e) {
      setError(e.response?.data?.detail?.message || e.message || 'Query failed')
    } finally {
      setLoading(false)
    }
  }

  const handleResult = (res) => { setResult(res); refreshHistory() }

  if (showIntro) {
    return <IntroPage onEnter={() => setShowIntro(false)} />
  }

  return (
    <div style={{
      position: 'relative', zIndex: 1,
      display: 'flex', height: '100vh', overflow: 'hidden',
    }}>
      <HistorySidebar history={history} onSelect={runQuery} />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
        <Topbar />
        <div style={{
          flex: 1, overflowY: 'auto',
          padding: '28px 32px',
          display: 'flex', flexDirection: 'column', gap: 20,
        }}>
          <QueryInput
            question={question} setQuestion={setQuestion}
            onQuerySubmit={() => runQuery(question)}
            setError={setError} loading={loading}
          />
          {error && <ErrorBanner message={error} />}
          {result ? (
            <div className="slide-up" style={{
              display: 'flex', flexDirection: 'column', gap: 20,
            }}>
              <ResultTable data={result.data} success={result.success} />
              <ChartPanel data={result.data} chart={result.chart} />
            </div>
          ) : !loading && <EmptyState />}
        </div>
      </div>

      <SQLViewer sql={result?.sql} attempts={result?.attempts} fromCache={result?.from_cache} />
    </div>
  )
}

/* ─── Topbar ───────────────────────────────────────────────────── */
function Topbar() {
  return (
    <div style={{
      padding: '0 28px',
      height: 54,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      borderBottom: '1px solid rgba(255,255,255,0.05)',
      background: 'rgba(5,5,5,0.85)',
      backdropFilter: 'blur(28px)',
      flexShrink: 0,
      position: 'relative',
    }}>
      {/* Bottom gradient divider */}
      <div style={{
        position: 'absolute', bottom: 0, left: '3%', right: '3%', height: 1,
        background: 'linear-gradient(90deg, transparent 0%, rgba(0,242,204,0.2) 30%, rgba(124,58,237,0.2) 70%, transparent 100%)',
      }} />

      {/* Logo mark */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 26, height: 26,
          background: 'linear-gradient(135deg, #00f2cc, #7c3aed)',
          borderRadius: 7,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 13, fontWeight: 900, color: '#000',
          boxShadow: '0 0 14px rgba(0,242,204,0.35)',
          flexShrink: 0,
        }}>Q</div>
        <span style={{
          fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: 14,
          color: 'rgba(255,255,255,0.85)', letterSpacing: '-0.02em',
        }}>QueryMind</span>
        <span style={{
          fontSize: 9, color: 'var(--text3)', fontFamily: 'JetBrains Mono, monospace',
          letterSpacing: '0.1em', paddingLeft: 4,
        }}>· v2.0</span>
      </div>

      {/* Center — breadcrumb hint */}
      <span style={{
        fontSize: 11, color: 'var(--text3)',
        fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.08em',
        position: 'absolute', left: '50%', transform: 'translateX(-50%)',
      }}>
        Natural Language <span style={{ color: 'var(--teal)', opacity: 0.6 }}>→</span> SQL <span style={{ color: 'var(--teal)', opacity: 0.6 }}>→</span> Insights
      </span>

      {/* Right badges */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{
            width: 5, height: 5, borderRadius: '50%',
            background: '#22c55e', boxShadow: '0 0 7px #22c55e',
            animation: 'statusPulse 1.8s ease-in-out infinite',
          }} />
          <span style={{ fontSize: 8, color: 'rgba(34,197,94,0.6)', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.14em' }}>ONLINE</span>
        </div>
        {[['FinSight DB', 'var(--teal)'], ['LLaMA 3.1 70B', 'var(--purple)']].map(([label, color]) => (
          <div key={label} style={{
            padding: '4px 12px', borderRadius: 99,
            background: `color-mix(in srgb, ${color} 8%, transparent)`,
            border: `1px solid color-mix(in srgb, ${color} 22%, transparent)`,
            fontSize: 10, fontWeight: 600, color,
            letterSpacing: '0.04em', fontFamily: 'JetBrains Mono, monospace',
          }}>{label}</div>
        ))}
      </div>
    </div>
  )
}

/* ─── Error Banner ─────────────────────────────────────────────── */
function ErrorBanner({ message }) {
  return (
    <div className="fade-in" style={{
      padding: '13px 18px',
      background: 'rgba(248,113,113,0.06)',
      border: '1px solid rgba(248,113,113,0.2)',
      borderRadius: 12,
      color: 'var(--red)',
      fontSize: 13,
      display: 'flex', alignItems: 'center', gap: 10,
      fontFamily: 'Inter, sans-serif',
    }}>
      <span style={{ fontSize: 15 }}>⚠</span>
      {message}
    </div>
  )
}

/* ─── Empty State ──────────────────────────────────────────────── */
function EmptyState() {
  const examples = [
    'Show top 5 accounts by total transaction amount',
    'What is the average transaction amount per category?',
    'Which accounts have more than 100 transactions?',
    'Show monthly transaction trends for the last year',
  ]
  return (
    <div style={{
      flex: 1, display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      gap: 36, padding: '40px 0',
    }}>
      <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>

        {/* Animated logo orb */}
        <div style={{
          marginBottom: 24,
          animation: 'floatOrb 3.5s ease-in-out infinite',
          display: 'flex', justifyContent: 'center',
        }}>
          <div style={{
            width: 72, height: 72, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(0,242,204,0.15) 0%, rgba(124,58,237,0.1) 50%, transparent 75%)',
            border: '1px solid rgba(0,242,204,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 30px rgba(0,242,204,0.12)',
          }}>
            <div style={{
              width: 36, height: 36,
              background: 'linear-gradient(135deg, #00f2cc, #7c3aed)',
              borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 18, fontWeight: 900, color: '#000',
              boxShadow: '0 0 20px rgba(0,242,204,0.4)',
            }}>Q</div>
          </div>
        </div>

        <h2 style={{ marginBottom: 10, fontSize: 22 }}>
          <AnimatedText text="Ask your database anything" size={22} />
        </h2>
        <p style={{ fontSize: 13, color: 'var(--text3)', fontFamily: 'Inter, sans-serif' }}>
          Type a plain English question in the box above
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%', maxWidth: 520 }}>
        <p style={{
          fontSize: 9, color: 'var(--text3)', fontWeight: 700,
          letterSpacing: '0.14em', textTransform: 'uppercase',
          marginBottom: 6, fontFamily: 'JetBrains Mono, monospace',
        }}>
          Try these examples
        </p>
        {examples.map((ex, i) => (
          <ExamplePill key={i} text={ex} delay={i * 0.08} />
        ))}
      </div>
    </div>
  )
}

/* ─── Example Pill ─────────────────────────────────────────────── */
function ExamplePill({ text, delay }) {
  const [hovered, setHovered] = useState(false)
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding: '11px 18px', borderRadius: 12,
        background: hovered ? 'rgba(0,242,204,0.05)' : 'rgba(255,255,255,0.02)',
        border: hovered ? '1px solid rgba(0,242,204,0.22)' : '1px solid rgba(255,255,255,0.05)',
        fontSize: 12, color: hovered ? 'var(--teal)' : 'var(--text3)',
        cursor: 'pointer',
        transition: 'all 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
        transform: hovered ? 'translateX(8px)' : 'translateX(0)',
        fontFamily: 'JetBrains Mono, monospace',
        display: 'flex', alignItems: 'center', gap: 10,
        animation: `slideUp 0.5s ${delay}s cubic-bezier(0.16, 1, 0.3, 1) both`,
        boxShadow: hovered ? '0 0 18px rgba(0,242,204,0.07), inset 0 0 18px rgba(0,242,204,0.02)' : 'none',
      }}
    >
      <span style={{ color: hovered ? 'var(--teal)' : 'var(--text3)', transition: 'color 0.2s' }}>→</span>
      {text}
    </div>
  )
}
