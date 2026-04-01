import { BarChart, Bar, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'

const CustomTooltip = ({ active, payload, label }) => {
  if (!active||!payload?.length) return null
  return (
    <div style={{
      background:'rgba(8,12,26,0.97)',
      backdropFilter:'blur(20px)',
      border:'1px solid rgba(0,229,255,0.22)',
      borderRadius:12, padding:'10px 16px',
      boxShadow:'0 0 24px rgba(0,229,255,0.14)',
    }}>
      <p style={{ fontSize:10, color:'var(--text3)', marginBottom:5 }}>{label}</p>
      <p style={{ fontSize:16, fontWeight:700, color:'var(--cyan)', fontFamily:'JetBrains Mono,monospace' }}>
        {typeof payload[0].value==='number' ? payload[0].value.toLocaleString() : payload[0].value}
      </p>
    </div>
  )
}

export default function ChartPanel({ data, chart }) {
  if (!chart||chart.type==='none'||!data?.length) return null

  const barColors = [
    ['#00e5ff','rgba(0,229,255,0.15)'],
    ['#a855f7','rgba(168,85,247,0.15)'],
    ['#22c55e','rgba(34,197,94,0.15)'],
    ['#fb923c','rgba(251,146,60,0.15)'],
    ['#00e5ff','rgba(0,229,255,0.15)'],
  ]

  return (
    <div style={{
      background:'rgba(8,12,26,0.6)',
      backdropFilter:'blur(30px)',
      border:'1px solid rgba(255,255,255,0.07)',
      borderRadius:18, overflow:'hidden',
      animation: 'breathingShadow 8s ease-in-out infinite alternate'
    }}>
      <div style={{
        padding:'13px 20px',
        borderBottom:'1px solid rgba(255,255,255,0.05)',
        display:'flex', alignItems:'center', justifyContent:'space-between',
        background:'rgba(0,0,0,0.2)',
      }}>
        <span style={{ fontSize:9, fontWeight:700, color:'var(--text3)', letterSpacing:'0.12em', textTransform:'uppercase' }}>
          Visualization
        </span>
        <span style={{
          padding:'3px 12px', borderRadius:99,
          fontSize:10, fontWeight:700, textTransform:'capitalize',
          background:'rgba(168,85,247,0.08)', border:'1px solid rgba(168,85,247,0.2)',
          color:'var(--purple)',
        }}>{chart.type} chart</span>
      </div>

      <div style={{ padding:'24px 16px 16px' }}>
        <ResponsiveContainer width="100%" height={260}>
          {chart.type==='bar' ? (
            <BarChart data={data} barCategoryGap="32%">
              <defs>
                {barColors.map(([c],i) => (
                  <linearGradient key={i} id={`bg${i}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={c} stopOpacity={0.9}/>
                    <stop offset="100%" stopColor={c} stopOpacity={0.2}/>
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false}/>
              <XAxis dataKey={chart.x_axis} 
                tick={{ fill:'rgba(255,255,255,0.25)', fontSize:10, fontFamily:'JetBrains Mono' }} 
                axisLine={false} tickLine={false}
                tickFormatter={(v) => typeof v === 'string' && v.length > 15 ? v.substring(0, 15) + '…' : v}
              />
              <YAxis tick={{ fill:'rgba(255,255,255,0.25)', fontSize:10, fontFamily:'JetBrains Mono' }} axisLine={false} tickLine={false}/>
              <Tooltip content={<CustomTooltip/>} cursor={{ fill:'rgba(0,229,255,0.04)' }}/>
              <Bar dataKey={chart.y_axis} radius={[6,6,0,0]} animationDuration={1000}>
                {data.map((_,i) => (
                  <Cell key={i} fill={`url(#bg${i % barColors.length})`} style={{ transition: 'fill 0.3s ease, transform 0.3s ease' }}/>
                ))}
              </Bar>
            </BarChart>
          ) : (
            <LineChart data={data}>
              <defs>
                <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#a855f7"/>
                  <stop offset="100%" stopColor="#00e5ff"/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false}/>
              <XAxis dataKey={chart.x_axis} 
                tick={{ fill:'rgba(255,255,255,0.25)', fontSize:10, fontFamily:'JetBrains Mono' }} 
                axisLine={false} tickLine={false}
                tickFormatter={(v) => typeof v === 'string' && v.length > 15 ? v.substring(0, 15) + '…' : v}
              />
              <YAxis tick={{ fill:'rgba(255,255,255,0.25)', fontSize:10, fontFamily:'JetBrains Mono' }} axisLine={false} tickLine={false}/>
              <Tooltip content={<CustomTooltip/>}/>
              <Line type="monotone" dataKey={chart.y_axis}
                stroke="url(#lineGrad)" strokeWidth={2.5}
                dot={{ fill:'#a855f7', r:3, strokeWidth:0 }}
                activeDot={{ fill:'#00e5ff', r:5, boxShadow:'0 0 10px #00e5ff' }}/>
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  )
}
