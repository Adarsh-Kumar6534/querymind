import { useState } from 'react'

export default function ResultTable({ data, success }) {
  const [sortCol, setSortCol] = useState(null)
  const [sortDir, setSortDir] = useState('asc')
  const [hovRow, setHovRow] = useState(null)

  if (!data?.length) return (
    <div style={{
      padding:'40px 20px', textAlign:'center',
      background:'rgba(255,255,255,0.02)',
      border:'1px solid rgba(255,255,255,0.06)',
      borderRadius:18, color:'var(--text3)', fontSize:13,
    }}>
      {success===false ? '⚠  Query failed — see SQL panel for details' : 'No rows returned for this query'}
    </div>
  )

  const cols = Object.keys(data[0])
  const sorted = sortCol ? [...data].sort((a,b) => {
    const [av,bv]=[a[sortCol],b[sortCol]]
    return (av>bv?1:-1)*(sortDir==='asc'?1:-1)
  }) : data
  const handleSort = c => {
    if(sortCol===c) setSortDir(d=>d==='asc'?'desc':'asc')
    else { setSortCol(c); setSortDir('asc') }
  }

  return (
    <div style={{
      background:'rgba(8,12,26,0.6)',
      backdropFilter:'blur(30px)',
      border:'1px solid rgba(255,255,255,0.07)',
      borderRadius:18, overflow:'hidden',
      animation: 'breathingShadow 8s ease-in-out infinite alternate-reverse'
    }}>
      {/* Card header */}
      <div style={{
        padding:'13px 20px',
        borderBottom:'1px solid rgba(255,255,255,0.05)',
        display:'flex', alignItems:'center', justifyContent:'space-between',
        background:'rgba(0,0,0,0.2)',
      }}>
        <span style={{ fontSize:9, fontWeight:700, color:'var(--text3)', letterSpacing:'0.12em', textTransform:'uppercase' }}>
          Query Results
        </span>
        <span style={{
          padding:'3px 12px', borderRadius:99,
          fontSize:10, fontWeight:700,
          background:'rgba(0,229,255,0.08)', border:'1px solid rgba(0,229,255,0.2)',
          color:'var(--cyan)', fontFamily:'JetBrains Mono,monospace',
        }}>{data.length} rows</span>
      </div>

      <div style={{ overflowX:'auto', maxHeight:360, overflowY:'auto' }}>
        <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
          <thead>
            <tr style={{ background:'rgba(0,0,0,0.3)', position:'sticky', top:0, zIndex:2 }}>
              {cols.map(col => (
                <th key={col} onClick={() => handleSort(col)} style={{
                  padding:'10px 18px', textAlign:'left',
                  fontSize:9, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.1em',
                  color: sortCol===col ? 'var(--cyan)' : 'rgba(0,229,255,0.35)',
                  borderBottom:'1px solid rgba(255,255,255,0.05)',
                  cursor:'pointer', userSelect:'none', whiteSpace:'nowrap',
                  transition:'color 0.2s',
                }}
                onMouseEnter={e=>e.currentTarget.style.color='var(--cyan)'}
                onMouseLeave={e=>e.currentTarget.style.color=sortCol===col?'var(--cyan)':'rgba(0,229,255,0.35)'}>
                  {col}{sortCol===col?(sortDir==='asc'?' ↑':' ↓'):''}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((row,i) => (
              <tr key={i}
                onMouseEnter={()=>setHovRow(i)} onMouseLeave={()=>setHovRow(null)}
                style={{
                  borderBottom:'1px solid rgba(255,255,255,0.03)',
                  background: hovRow===i
                    ? 'rgba(0,229,255,0.045)'
                    : i%2===0 ? 'rgba(255,255,255,0.012)' : 'transparent',
                  transition:'background 0.15s ease', cursor:'pointer',
                }}>
                {cols.map((col,ci) => (
                  <td key={col} style={{
                    padding:'11px 18px',
                    color: hovRow===i
                      ? 'var(--text1)'
                      : ci===0 ? 'rgba(0,229,255,0.75)' : 'rgba(255,255,255,0.45)',
                    fontFamily:'JetBrains Mono,monospace', fontSize:11,
                    whiteSpace:'nowrap', transition:'color 0.15s',
                  }}>{String(row[col]??'—')}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
