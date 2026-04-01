import { useState } from 'react'
import AnimatedLogo, { AnimatedText } from './AnimatedLogo'
export default function HistorySidebar({ history, onSelect }) {
  const [hov, setHov] = useState(null)

  return (
    <div style={{
      width: 270, flexShrink: 0,
      display: 'flex', flexDirection: 'column',
      overflow: 'hidden',
      background: 'rgba(4,6,18,0.7)',
      backdropFilter: 'blur(30px)',
      borderRight: '1px solid rgba(255,255,255,0.06)',
      position: 'relative',
      animation: 'breathingShadow 6s ease-in-out infinite'
    }}>

      {/* Top accent line */}
      <div style={{
        position:'absolute',top:0,left:0,right:0,height:1,
        background:'linear-gradient(90deg,transparent,rgba(0,229,255,0.5),rgba(168,85,247,0.5),transparent)',
      }}/>

      {/* Brand */}
      <div style={{
        padding:'20px 20px 16px',
        borderBottom:'1px solid rgba(255,255,255,0.05)',
        flexShrink:0,
      }}>
        <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:10 }}>
          {/* Animated custom logo */}
          <div style={{ flexShrink: 0, marginTop: 4 }}>
            <AnimatedLogo size={36} />
          </div>
          <div>
            <AnimatedText text="QueryMind" size={17} style={{ marginBottom: 1 }} />
            <div style={{ fontSize:10, color:'var(--text3)', fontWeight:400, marginTop:0 }}>
              AI Database Interface
            </div>
          </div>
        </div>

        {/* Status */}
        <div style={{
          display:'inline-flex', alignItems:'center', gap:6,
          padding:'4px 12px', borderRadius:99,
          background:'rgba(34,197,94,0.08)',
          border:'1px solid rgba(34,197,94,0.2)',
          fontSize:10, fontWeight:700, color:'var(--green)',
          letterSpacing:'0.08em',
        }}>
          <div style={{
            width:6,height:6,borderRadius:'50%',
            background:'var(--green)',
            boxShadow:'0 0 8px var(--green)',
            animation:'statusPulse 2s ease-in-out infinite',
          }}/>
          CONNECTED · PostgreSQL
        </div>
      </div>

      {/* History header */}
      <div style={{
        padding:'14px 20px 8px',
        display:'flex', alignItems:'center', justifyContent:'space-between',
        flexShrink:0,
      }}>
        <span style={{ fontSize:9, fontWeight:700, color:'var(--text3)', letterSpacing:'0.12em', textTransform:'uppercase' }}>
          Query History
        </span>
        {history.length>0 && (
          <span style={{
            fontSize:10, fontWeight:700,
            padding:'1px 8px', borderRadius:99,
            background:'rgba(255,255,255,0.06)', color:'rgba(255,255,255,0.3)',
          }}>{history.length}</span>
        )}
      </div>

      {/* List */}
      <div style={{ flex:1, overflowY:'auto', padding:'0 10px 10px' }}>
        {history.length===0 ? (
          <div style={{
            margin:'20px 10px',
            padding:'24px 16px', borderRadius:14,
            background:'rgba(255,255,255,0.02)',
            border:'1px dashed rgba(255,255,255,0.06)',
            textAlign:'center',
          }}>
            <div style={{ fontSize:22, marginBottom:8, opacity:0.3 }}>🕐</div>
            <p style={{ fontSize:11, color:'var(--text3)', lineHeight:1.6 }}>
              No queries yet.<br/>Run your first query above.
            </p>
          </div>
        ) : history.map((item, i) => (
          <button key={i}
            onClick={() => onSelect(item.question)}
            onMouseEnter={() => setHov(i)}
            onMouseLeave={() => setHov(null)}
            style={{
              width:'100%', textAlign:'left', display:'block',
              padding:'11px 12px', borderRadius:12, marginBottom:4,
              background: hov===i ? 'rgba(0,229,255,0.05)' : 'rgba(255,255,255,0.02)',
              border: hov===i ? '1px solid rgba(0,229,255,0.18)' : '1px solid rgba(255,255,255,0.04)',
              cursor:'pointer',
              transition:'all 0.2s cubic-bezier(0.16,1,0.3,1)',
              transform: hov===i ? 'translateX(3px)' : 'translateX(0)',
              boxShadow: hov===i ? '0 0 16px rgba(0,229,255,0.06)' : 'none',
            }}>
            <div style={{ display:'flex', gap:8, alignItems:'flex-start' }}>
              <div style={{
                width:6, height:6, borderRadius:'50%', flexShrink:0, marginTop:5,
                background: item.success ? 'var(--green)' : 'var(--red)',
                boxShadow: item.success ? '0 0 7px var(--green)' : '0 0 7px var(--red)',
              }}/>
              <p style={{
                fontSize:11, lineHeight:1.55, margin:0,
                color: hov===i ? 'var(--text1)' : 'rgba(255,255,255,0.4)',
                transition:'color 0.18s',
                display:'-webkit-box', WebkitLineClamp:2,
                WebkitBoxOrient:'vertical', overflow:'hidden',
              }}>{item.question}</p>
            </div>
            <div style={{ display:'flex', gap:10, marginTop:6, paddingLeft:14 }}>
              <span style={{ fontSize:9, color:'var(--text3)', fontFamily:'JetBrains Mono,monospace' }}>
                {item.row_count??0} rows
              </span>
              {item.attempts>1 && (
                <span style={{ fontSize:9, color:'rgba(251,146,60,0.7)', fontFamily:'JetBrains Mono,monospace' }}>
                  retry ×{item.attempts}
                </span>
              )}
              {!item.success && (
                <span style={{ fontSize:9, color:'rgba(248,113,113,0.7)' }}>failed</span>
              )}
            </div>
          </button>
        ))}
      </div>

      {/* Footer */}
      <div style={{
        padding:'10px 20px',
        borderTop:'1px solid rgba(255,255,255,0.04)',
        fontSize:9, color:'var(--text3)',
        fontFamily:'JetBrains Mono,monospace', flexShrink:0,
        display:'flex', justifyContent:'space-between',
      }}>
        <span>QueryMind v1.0</span>
        <span>Groq · LLaMA 3.1</span>
      </div>
    </div>
  )
}
