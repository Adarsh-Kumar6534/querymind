import { useState, useRef } from 'react'
import { sendQuery, uploadCSV } from '../api/client'
import AnimatedLogo from './AnimatedLogo'

export default function QueryInput({ question, setQuestion, onQuerySubmit, setResult, setLoading, setError, loading }) {
  const [focused, setFocused] = useState(false)
  const fileRef = useRef()

  const handleQuery = () => {
    if (!question.trim() || loading) return
    onQuerySubmit()
  }

  const active = !loading && question.trim()

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
      {/* Inner glass surface */}
      <div style={{
        borderRadius: 19,
        padding: '20px 22px',
        background: focused
          ? 'rgba(0,10,30,0.85)'
          : 'rgba(8,12,26,0.75)',
        backdropFilter: 'blur(40px)',
        transition: 'background 0.3s ease',
        position: 'relative',
        overflow: 'hidden',
        animation: !focused ? 'breathingShadow 6s ease-in-out infinite' : 'none',
      }}>

        {/* Scanline when focused */}
        {focused && (
          <div style={{
            position: 'absolute', left: 22, right: 22, height: 1,
            background: 'linear-gradient(90deg, transparent 0%, rgba(0,229,255,0.5) 40%, rgba(168,85,247,0.5) 60%, transparent 100%)',
            pointerEvents: 'none',
            animation: 'scanPulse 3.5s ease-in-out infinite',
          }} />
        )}

        {/* Corner accents */}
        {focused && <>
          <div style={{ position:'absolute',top:0,left:0,width:20,height:20,borderTop:'2px solid var(--teal)',borderLeft:'2px solid var(--teal)',borderRadius:'19px 0 0 0' }} />
          <div style={{ position:'absolute',top:0,right:0,width:20,height:20,borderTop:'2px solid var(--purple)',borderRight:'2px solid var(--purple)',borderRadius:'0 19px 0 0' }} />
          <div style={{ position:'absolute',bottom:0,left:0,width:20,height:20,borderBottom:'2px solid var(--purple)',borderLeft:'2px solid var(--purple)',borderRadius:'0 0 0 19px' }} />
          <div style={{ position:'absolute',bottom:0,right:0,width:20,height:20,borderBottom:'2px solid var(--teal)',borderRight:'2px solid var(--teal)',borderRadius:'0 0 19px 0' }} />
        </>}

        {/* Label */}
        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:14 }}>
          <div style={{
            width:7, height:7, borderRadius:'50%',
            background:'var(--teal)',
            boxShadow: focused ? '0 0 10px var(--teal), 0 0 20px rgba(0,242,204,0.5)' : '0 0 6px var(--teal)',
            transition:'box-shadow 0.3s ease',
          }} />
          <span style={{ fontSize:10, fontWeight:700, color:focused?'rgba(0,242,204,0.7)':'rgba(255,255,255,0.2)', letterSpacing:'0.12em', textTransform:'uppercase', transition:'color 0.3s' }}>
            Natural Language Query
          </span>
        </div>

        {/* Textarea */}
        <textarea
          value={question}
          onChange={e => setQuestion(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onKeyDown={e => { if (e.key==='Enter'&&(e.ctrlKey||e.metaKey)) handleQuery() }}
          placeholder="e.g. Show me the top 5 accounts by total transaction amount this month..."
          rows={3}
          style={{
            width:'100%',
            background:'rgba(0,0,0,0.4)',
            border:'1px solid rgba(255,255,255,0.06)',
            borderRadius:12,
            padding:'14px 16px',
            color:'var(--text1)',
            fontSize:14, fontFamily:'Outfit, sans-serif',
            resize:'none', outline:'none', lineHeight:1.65,
            transition:'border-color 0.25s, box-shadow 0.25s',
            boxShadow: focused ? 'inset 0 0 0 1px rgba(0,229,255,0.1)' : 'none',
          }}
        />

        {/* Actions */}
        <div style={{ display:'flex', alignItems:'center', gap:10, marginTop:16 }}>
          <RunButton onClick={handleQuery} loading={loading} active={!!active} />
          <CsvButton onClick={() => fileRef.current.click()} />
          <input ref={fileRef} type="file" accept=".csv" onChange={async e => {
            const f = e.target.files[0]; if(!f) return
            setLoading(true)
            try { const r=await uploadCSV(f); alert(`Table "${r.table_name}" created — ${r.row_count} rows`) }
            catch { setError('CSV upload failed') }
            finally { setLoading(false) }
          }} style={{display:'none'}} />
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
    <button onClick={onClick} disabled={!active}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        display:'flex', alignItems:'center', gap:8,
        padding:'11px 28px',
        background: active
          ? (hov
            ? 'linear-gradient(135deg,#00f2cc,#00c9aa)'
            : 'linear-gradient(135deg,#00ddb8,#00b89a)')
          : 'rgba(255,255,255,0.04)',
        border: active ? 'none' : '1px solid rgba(255,255,255,0.07)',
        borderRadius:12,
        color: active ? '#030010' : 'rgba(255,255,255,0.18)',
        fontSize:13, fontWeight:700, fontFamily:'Inter, sans-serif',
        cursor: active ? 'pointer' : 'not-allowed',
        transition:'all 0.25s cubic-bezier(0.16,1,0.3,1)',
        boxShadow: active
          ? (hov
            ? '0 0 0 1px #00f2cc, 0 0 28px rgba(0,242,204,0.7), 0 0 60px rgba(0,242,204,0.3)'
            : '0 0 0 1px rgba(0,242,204,0.5), 0 0 18px rgba(0,242,204,0.4), 0 0 40px rgba(0,242,204,0.15)')
          : 'none',
        transform: hov && active ? 'translateY(-2px)' : 'translateY(0)',
        letterSpacing:'0.02em',
      }}>
      {loading
        ? <><div style={{width:13,height:13,border:'2px solid rgba(0,0,0,0.2)',borderTop:'2px solid #000',borderRadius:'50%',animation:'spin 0.75s linear infinite'}}/> Generating...</>
        : <><AnimatedLogo size={16} /> Run Query</>
      }
    </button>
  )
}

function CsvButton({ onClick }) {
  const [hov, setHov] = useState(false)
  return (
    <button onClick={onClick}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        display:'flex', alignItems:'center', gap:8,
        padding:'11px 20px',
        background: hov ? 'rgba(124,58,237,0.1)' : 'rgba(124,58,237,0.05)',
        border: hov ? '1px solid rgba(124,58,237,0.42)' : '1px solid rgba(124,58,237,0.16)',
        borderRadius:12, color:'#a78bfa',
        fontSize:13, fontWeight:600, fontFamily:'Inter, sans-serif',
        cursor:'pointer',
        transition:'all 0.22s cubic-bezier(0.16,1,0.3,1)',
        boxShadow: hov ? '0 0 22px rgba(124,58,237,0.25), 0 4px 14px rgba(0,0,0,0.3)' : 'none',
        transform: hov ? 'translateY(-2px)' : 'translateY(0)',
      }}>
      ↑ Upload CSV
    </button>
  )
}
