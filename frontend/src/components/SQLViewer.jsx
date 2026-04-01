import { useState } from 'react'

function highlightSQL(sql) {
  if (!sql) return ''
  const escaped = sql
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

  const KW = ['SELECT','FROM','WHERE','GROUP BY','ORDER BY','HAVING',
    'JOIN','LEFT','RIGHT','INNER','OUTER','ON','AS','AND','OR','NOT',
    'IN','LIKE','BETWEEN','LIMIT','OFFSET','DISTINCT','WITH','UNION',
    'COUNT','SUM','AVG','MAX','MIN','CASE','WHEN','THEN','ELSE','END',
    'DESC','ASC','INSERT','UPDATE','DELETE','CREATE','DROP','TABLE']

  let result = escaped

  // 1. Numbers (do this first so it doesn't match numbers inside HTML styles injected later)
  result = result.replace(/\b(\d+(\.\d+)?)\b/g, '<span style="color:#facc15">$1</span>')

  // 2. Keywords
  KW.forEach(k => {
    result = result.replace(
      new RegExp(`\\b(${k})\\b`, 'gi'),
      '<span style="color:#a855f7;font-weight:600">$1</span>'
    )
  })

  // 3. Strings
  result = result.replace(/'([^']*)'/g, "<span style=\"color:#22c55e\">'$1'</span>")
  
  // 4. Comments
  result = result.replace(/--[^\n]*/g, m => `<span style="color:rgba(255,255,255,0.2);font-style:italic">${m}</span>`)

  return result
}

function Badge({ color, children }) {
  return (
    <span style={{
      padding:'2px 9px', borderRadius:99,
      fontSize:9, fontWeight:700,
      background:`color-mix(in srgb, ${color} 10%, transparent)`,
      border:`1px solid color-mix(in srgb, ${color} 28%, transparent)`,
      color, letterSpacing:'0.04em',
      fontFamily:'JetBrains Mono, monospace',
    }}>{children}</span>
  )
}

export default function SQLViewer({ sql, attempts, fromCache }) {
  const [copied, setCopied] = useState(false)

  const copy = () => {
    if (!sql) return
    navigator.clipboard.writeText(sql)
    setCopied(true); setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div style={{
      width: 340, flexShrink: 0,
      display:'flex', flexDirection:'column', overflow:'hidden',
      background:'rgba(2,3,14,0.75)',
      backdropFilter:'blur(30px)',
      borderLeft:'1px solid rgba(255,255,255,0.06)',
      position:'relative',
    }}>
      {/* Purple top accent */}
      <div style={{
        position:'absolute',top:0,left:0,right:0,height:1,
        background:'linear-gradient(90deg,transparent,rgba(168,85,247,0.6),rgba(0,229,255,0.4),transparent)',
      }}/>

      {/* Header */}
      <div style={{
        padding:'14px 18px',
        borderBottom:'1px solid rgba(255,255,255,0.05)',
        display:'flex', alignItems:'center', justifyContent:'space-between',
        flexShrink:0,
      }}>
        <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
          <span style={{ fontSize:9, fontWeight:700, color:'var(--text3)', letterSpacing:'0.12em', textTransform:'uppercase' }}>
            Generated SQL
          </span>
          {fromCache && <Badge color="#facc15">⚡ cached</Badge>}
          {attempts > 1 && <Badge color="#fb923c">fixed ×{attempts}</Badge>}
        </div>
        <button onClick={copy} style={{
          padding:'4px 10px', borderRadius:8,
          fontSize:10, fontFamily:'JetBrains Mono,monospace',
          color: copied ? 'var(--green)' : 'var(--text3)',
          background: copied ? 'rgba(34,197,94,0.1)' : 'transparent',
          border: copied ? '1px solid rgba(34,197,94,0.25)' : '1px solid transparent',
          cursor:'pointer', transition:'all 0.2s',
        }}
        onMouseEnter={e => { if(!copied){ e.currentTarget.style.color='var(--cyan)'; e.currentTarget.style.background='rgba(0,229,255,0.08)'; e.currentTarget.style.borderColor='rgba(0,229,255,0.2)' }}}
        onMouseLeave={e => { if(!copied){ e.currentTarget.style.color='var(--text3)'; e.currentTarget.style.background='transparent'; e.currentTarget.style.borderColor='transparent' }}}>
          {copied ? '✓ copied' : 'copy'}
        </button>
      </div>

      {/* SQL content */}
      <div style={{ flex:1, overflowY:'auto', padding:'18px 20px' }}>
        {sql ? (
          <pre style={{
            fontFamily:'JetBrains Mono,monospace',
            fontSize:12, lineHeight:1.9,
            color:'rgba(148,163,184,0.65)',
            whiteSpace:'pre-wrap', wordBreak:'break-word',
          }}>
            <code dangerouslySetInnerHTML={{ __html: highlightSQL(sql) }}/>
          </pre>
        ) : (
          <div style={{
            height:'100%', display:'flex', flexDirection:'column',
            alignItems:'center', justifyContent:'center', gap:14,
            padding:'40px 20px',
          }}>
            <div style={{
              width:48, height:48, borderRadius:14,
              background:'rgba(168,85,247,0.08)',
              border:'1px solid rgba(168,85,247,0.15)',
              display:'flex', alignItems:'center', justifyContent:'center',
              fontSize:20,
            }}>{ }</div>
            <p style={{
              fontSize:11, color:'var(--text3)',
              textAlign:'center', lineHeight:1.7,
            }}>
              SQL will appear here<br/>after you run a query
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      {sql && (
        <div style={{
          padding:'10px 18px',
          borderTop:'1px solid rgba(255,255,255,0.04)',
          display:'flex', justifyContent:'space-between',
          fontSize:9, color:'var(--text3)',
          fontFamily:'JetBrains Mono,monospace', flexShrink:0,
        }}>
          <span>{sql.split('\n').length} lines · {sql.length} chars</span>
          <span>groq · llama-3.1-70b</span>
        </div>
      )}
    </div>
  )
}
