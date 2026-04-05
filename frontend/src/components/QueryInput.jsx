import { useState, useRef } from 'react'
import { uploadCSV } from '../api/client'
import AnimatedLogo from './AnimatedLogo'

export default function QueryInput({ question, setQuestion, onQuerySubmit, loading, setError }) {
  const [focused, setFocused] = useState(false)
  const [csvLoading, setCsvLoading] = useState(false)
  const [csvSuccess, setCsvSuccess] = useState(null)
  const fileRef = useRef()

  const handleQuery = () => {
    if (!question.trim() || loading || csvLoading) return
    onQuerySubmit()
  }

  const active = !loading && !csvLoading && question.trim()

  return (
    <div style={{
      position: 'relative',
      borderRadius: 20,
      padding: 1,
      backgroundImage: focused
        ? 'linear-gradient(135deg, rgba(0,242,204,0.35), rgba(124,58,237,0.35), rgba(0,242,204,0.35))'
        : 'none',
      backgroundColor: focused ? 'transparent' : 'rgba(255,255,255,0.05)',
      backgroundSize: '200% 200%',
      animation: focused ? 'borderSweep 3s ease infinite' : 'none',
      transition: 'background-color 0.4s ease, background-image 0.4s ease',
    }}>
      <div style={{
        borderRadius: 19,
        padding: '20px 22px',
        background: focused ? 'rgba(8,12,26,0.9)' : 'rgba(8,12,26,0.75)',
        backdropFilter: 'blur(40px)',
        transition: 'background 0.3s ease',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {focused && (
          <div style={{
            position: 'absolute', left: 22, right: 22, height: 1,
            background: 'linear-gradient(90deg, transparent 0%, rgba(0,229,255,0.5) 40%, rgba(168,85,247,0.5) 60%, transparent 100%)',
            pointerEvents: 'none',
            animation: 'scanPulse 3.5s ease-in-out infinite',
          }} />
        )}

        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:14 }}>
          <div style={{
            width:7, height:7, borderRadius:'50%',
            background:'var(--teal)',
            boxShadow: focused ? '0 0 10px var(--teal), 0 0 20px rgba(0,242,204,0.5)' : '0 0 6px var(--teal)',
          }} />
          <span style={{ fontSize:10, fontWeight:700, color:focused?'rgba(0,242,204,0.7)':'rgba(255,255,255,0.2)', letterSpacing:'0.12em', textTransform:'uppercase' }}>
            Natural Language Query
          </span>
        </div>

        <textarea
          value={question}
          onChange={e => setQuestion(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onKeyDown={e => { if (e.key==='Enter'&&(e.ctrlKey||e.metaKey)) handleQuery() }}
          placeholder="e.g. Show me the top 5 accounts by total transaction amount..."
          rows={3}
          style={{
            width:'100%', background:'rgba(0,0,0,0.4)',
            border:'1px solid rgba(255,255,255,0.06)', borderRadius:12,
            padding:'14px 16px', color:'var(--text1)', fontSize:14,
            fontFamily:'Outfit, sans-serif', resize:'none', outline:'none', lineHeight:1.65,
          }}
        />

        <div style={{ display:'flex', alignItems:'center', gap:10, marginTop:16 }}>
          <RunButton onClick={handleQuery} loading={loading} active={!!active} />
          <CsvButton onClick={() => fileRef.current.click()} loading={csvLoading} />
          
          <input ref={fileRef} type="file" accept=".csv" onChange={async e => {
            const f = e.target.files[0]; if(!f) return
            setCsvLoading(true)
            setCsvSuccess(null)
            try {
              const r = await uploadCSV(f)
              setCsvSuccess(`Table "${r.table_name}" ready (${r.row_count} rows)`)
              e.target.value = ''
            } catch (err) {
              setError(err.response?.data?.detail || 'CSV upload failed')
            } finally {
              setCsvLoading(false)
            }
          }} style={{display:'none'}} />

          {csvSuccess && (
            <span style={{ fontSize: 11, color: '#22c55e', fontFamily: 'JetBrains Mono, monospace', marginLeft: 8 }}>
              ✓ {csvSuccess}
            </span>
          )}

          <span style={{ marginLeft:'auto', fontSize:10, color:'var(--text3)', fontFamily:'JetBrains Mono, monospace' }}>
            Ctrl + Enter
          </span>
        </div>
      </div>
    </div>
  )
}

function RunButton({ onClick, loading, active }) {
  const [hov, setHov] = useState(false)
  return (
    <button onClick={onClick} disabled={!active || loading}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        display:'flex', alignItems:'center', gap:8,
        padding:'11px 28px',
        background: active
          ? (hov ? 'linear-gradient(135deg,#00f2cc,#00c9aa)' : 'linear-gradient(135deg,#00ddb8,#00b89a)')
          : 'rgba(255,255,255,0.04)',
        border: active ? 'none' : '1px solid rgba(255,255,255,0.07)',
        borderRadius:12, color: active ? '#030010' : 'rgba(255,255,255,0.18)',
        fontSize:13, fontWeight:700, cursor: active ? 'pointer' : 'not-allowed',
        transition:'all 0.25s',
        boxShadow: active && hov ? '0 0 28px rgba(0,242,204,0.7)' : 'none',
      }}>
      {loading ? 'Generating...' : <><AnimatedLogo size={16} /> Run Query</>}
    </button>
  )
}

function CsvButton({ onClick, loading }) {
  const [hov, setHov] = useState(false)
  return (
    <button onClick={onClick} disabled={loading}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        display:'flex', alignItems:'center', gap:8, padding:'11px 20px',
        background: hov ? 'rgba(124,58,237,0.1)' : 'rgba(124,58,237,0.05)',
        border: hov ? '1px solid rgba(124,58,237,0.42)' : '1px solid rgba(124,58,237,0.16)',
        borderRadius:12, color:'#a78bfa', fontSize:13, fontWeight:600,
        cursor: loading ? 'not-allowed' : 'pointer', transition:'all 0.22s',
      }}>
      {loading ? 'Uploading...' : '↑ Upload CSV'}
    </button>
  )
}
