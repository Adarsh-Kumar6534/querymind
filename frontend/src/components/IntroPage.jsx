import { useState, useRef, useEffect, useCallback } from 'react'
import { AnimatedText } from './AnimatedLogo'

/* ══════════════════════════════════════════════════════════════════
   FLUID SMOKE CANVAS  —  living purple/teal atmospheric background
══════════════════════════════════════════════════════════════════ */
function FluidSmokeCanvas({ opacity = 1 }) {
  const canvasRef = useRef(null)
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let animId, t = 0
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight }
    resize()
    window.addEventListener('resize', resize)

    const blobs = [
      { x: 0.28, y: 0.60, rx: 0.50, ry: 0.35, color: [90, 20, 180], speed: 0.00055, phase: 0.0 },
      { x: 0.72, y: 0.38, rx: 0.42, ry: 0.30, color: [60, 10, 150], speed: 0.00042, phase: 2.1 },
      { x: 0.50, y: 0.85, rx: 0.55, ry: 0.38, color: [130, 50, 200], speed: 0.00080, phase: 1.0 },
      { x: 0.15, y: 0.25, rx: 0.32, ry: 0.28, color: [50,  8, 130], speed: 0.00060, phase: 3.5 },
      { x: 0.85, y: 0.72, rx: 0.37, ry: 0.32, color: [0, 180, 160], speed: 0.00070, phase: 4.2 },
      { x: 0.40, y: 0.15, rx: 0.30, ry: 0.22, color: [80, 20, 160], speed: 0.00048, phase: 0.8 },
    ]

    const draw = () => {
      const w = canvas.width, h = canvas.height
      ctx.clearRect(0, 0, w, h)
      ctx.fillStyle = '#050008'
      ctx.fillRect(0, 0, w, h)

      for (const b of blobs) {
        const bx = (b.x + Math.sin(t * b.speed * 1200 + b.phase) * 0.10) * w
        const by = (b.y + Math.cos(t * b.speed * 900  + b.phase) * 0.09) * h
        const brx = b.rx * Math.min(w, h)
        const bry = b.ry * Math.min(w, h)
        const angle = Math.sin(t * b.speed * 400) * 0.4
        const grad = ctx.createRadialGradient(bx, by, 0, bx, by, Math.max(brx, bry))
        const [r, g, bv] = b.color
        grad.addColorStop(0,   `rgba(${r},${g},${bv},0.24)`)
        grad.addColorStop(0.45,`rgba(${r},${g},${bv},0.11)`)
        grad.addColorStop(1,   `rgba(${r},${g},${bv},0)`)
        ctx.save()
        ctx.translate(bx, by)
        ctx.rotate(angle)
        ctx.scale(1, bry / brx)
        ctx.beginPath()
        ctx.arc(0, 0, brx, 0, Math.PI * 2)
        ctx.fillStyle = grad
        ctx.fill()
        ctx.restore()
      }
      t++
      animId = requestAnimationFrame(draw)
    }
    draw()
    return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', resize) }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute', inset: 0,
        width: '100%', height: '100%',
        pointerEvents: 'none', opacity
      }}
    />
  )
}

/* ══════════════════════════════════════════════════════════════════
   PARTICLE CANVAS  —  drifting spark particles
══════════════════════════════════════════════════════════════════ */
function ParticleCanvas() {
  const canvasRef = useRef(null)
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let animId
    let w = canvas.width = window.innerWidth
    let h = canvas.height = window.innerHeight

    const particles = Array.from({ length: 60 }, () => ({
      x: Math.random() * w,
      y: Math.random() * h + h,
      vx: (Math.random() - 0.5) * 0.3,
      vy: -(Math.random() * 0.5 + 0.2),
      size: Math.random() * 1.5 + 0.3,
      opacity: Math.random() * 0.6 + 0.2,
      color: Math.random() > 0.5 ? '0,242,204' : '124,58,237',
    }))

    const draw = () => {
      ctx.clearRect(0, 0, w, h)
      for (const p of particles) {
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(${p.color},${p.opacity})`
        ctx.shadowColor = `rgba(${p.color},0.8)`
        ctx.shadowBlur = 6
        ctx.fill()
        ctx.shadowBlur = 0
        p.x += p.vx; p.y += p.vy; p.opacity -= 0.0008
        if (p.y < -10 || p.opacity <= 0) {
          p.x = Math.random() * w; p.y = h + 10;
          p.opacity = Math.random() * 0.6 + 0.2
          p.vx = (Math.random() - 0.5) * 0.3
          p.vy = -(Math.random() * 0.5 + 0.2)
        }
      }
      animId = requestAnimationFrame(draw)
    }
    draw()
    const onResize = () => { w = canvas.width = window.innerWidth; h = canvas.height = window.innerHeight }
    window.addEventListener('resize', onResize)
    return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', onResize) }
  }, [])
  return <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.5 }} />
}

/* ══════════════════════════════════════════════════════════════════
   LOADING COUNTER  —  0 → 100% ticking progress
══════════════════════════════════════════════════════════════════ */
function LoadingCounter({ duration = 3000 }) {
  const [count, setCount] = useState(0)
  useEffect(() => {
    const steps = 100
    const interval = duration / steps
    let current = 0
    const t = setInterval(() => {
      current++
      // ease out curve
      const eased = Math.round(100 * (1 - Math.pow(1 - current / steps, 2)))
      setCount(eased)
      if (current >= steps) clearInterval(t)
    }, interval)
    return () => clearInterval(t)
  }, [duration])
  return (
    <div style={{
      fontFamily: 'JetBrains Mono, monospace',
      fontSize: 11,
      letterSpacing: '0.2em',
      color: 'rgba(0,242,204,0.5)',
    }}>
      {String(count).padStart(3, '0')}%
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════════
   LETTER STAGGER — splits word into per-character animated spans
══════════════════════════════════════════════════════════════════ */
function SplitText({ text, baseDelay = 0, stagger = 60, className = '', style = {} }) {
  return (
    <span style={{ display: 'inline-block', overflow: 'hidden', ...style }}>
      {text.split('').map((char, i) => (
        <span
          key={i}
          style={{
            display: 'inline-block',
            animation: `letterRise 0.7s cubic-bezier(0.16,1,0.3,1) ${baseDelay + i * stagger}ms both`,
          }}
        >
          {char === ' ' ? '\u00A0' : char}
        </span>
      ))}
    </span>
  )
}

/* ══════════════════════════════════════════════════════════════════
   CINEMATIC INTRO  —  full-screen pre-loader animation
══════════════════════════════════════════════════════════════════ */
function CinematicIntro({ onComplete }) {
  const [phase, setPhase] = useState('black')
  const [showContent, setShowContent] = useState(false)
  const [exiting, setExiting] = useState(false)

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('reveal'), 300)
    const t2 = setTimeout(() => setShowContent(true), 500)
    const t3 = setTimeout(() => setExiting(true), 3400)
    const t4 = setTimeout(() => onComplete(), 4100)
    return () => [t1, t2, t3, t4].forEach(clearTimeout)
  }, [onComplete])

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 300,
      background: '#030006',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      overflow: 'hidden',
      opacity: exiting ? 0 : phase === 'black' ? 0 : 1,
      transition: exiting
        ? 'opacity 0.7s cubic-bezier(0.4,0,1,1)'
        : 'opacity 0.5s cubic-bezier(0,0,0.58,1)',
    }}>

      {/* Living smoke canvas */}
      <FluidSmokeCanvas />

      {/* Vignette */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse 70% 70% at 50% 50%, transparent 20%, rgba(3,0,6,0.75) 100%)',
      }} />

      {/* Top-left corner info */}
      <div style={{
        position: 'absolute', top: 36, left: 40,
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: 9, letterSpacing: '0.2em',
        color: 'rgba(0,242,204,0.3)',
        textTransform: 'uppercase',
        opacity: showContent ? 1 : 0,
        transition: 'opacity 1s 0.8s ease',
      }}>
        QueryMind · v2.0 · AI Database Intelligence
      </div>

      {/* Top-right loading counter */}
      <div style={{
        position: 'absolute', top: 36, right: 40,
        opacity: showContent ? 1 : 0,
        transition: 'opacity 1s 0.8s ease',
      }}>
        <LoadingCounter duration={3000} />
      </div>

      {/* Main content */}
      <div style={{
        position: 'relative', zIndex: 2,
        width: '100%', padding: '0 8vw',
        display: 'flex', flexDirection: 'column',
        alignItems: 'flex-start',
      }}>

        {/* Sub-label: staggered words */}
        <div style={{
          marginBottom: 20,
          overflow: 'hidden',
          opacity: showContent ? 1 : 0,
          transition: 'opacity 0.5s ease',
        }}>
          {'Cognitive · Database · Intelligence'.split(' ').map((word, i) => (
            <span
              key={i}
              style={{
                display: 'inline-block',
                marginRight: 8,
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: 'clamp(10px, 1.2vw, 13px)',
                letterSpacing: '0.4em',
                textTransform: 'uppercase',
                color: i === 1 ? 'rgba(0,242,204,0.7)' : 'rgba(200,180,255,0.45)',
                animation: showContent ? `wordSlideUp 0.6s cubic-bezier(0.16,1,0.3,1) ${500 + i * 120}ms both` : 'none',
              }}
            >
              {word}
            </span>
          ))}
        </div>

        {/* GIANT MASKED WORD — per-character rise */}
        <div style={{ overflow: 'hidden', lineHeight: 0.88, width: '100%' }}>
          <div style={{
            fontSize: 'clamp(72px, 14.5vw, 210px)',
            fontWeight: 900,
            fontFamily: '"Inter", "Helvetica Neue", Arial, sans-serif',
            letterSpacing: '-0.04em',
            textTransform: 'uppercase',
            lineHeight: 0.9,
            display: 'flex',
          }}>
            {'Query'.split('').map((char, i) => (
              <span
                key={`q${i}`}
                style={{
                  display: 'inline-block',
                  color: 'rgba(255,255,255,0.95)',
                  animation: showContent
                    ? `letterRise 0.9s cubic-bezier(0.16,1,0.3,1) ${700 + i * 70}ms both`
                    : 'none',
                  textShadow: '0 0 60px rgba(255,255,255,0.08)',
                }}
              >
                {char}
              </span>
            ))}
            {'Mind'.split('').map((char, i) => (
              <span
                key={`m${i}`}
                style={{
                  display: 'inline-block',
                  background: 'linear-gradient(180deg, #00f2cc 0%, #00c9aa 60%, rgba(0,200,170,0.5) 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  animation: showContent
                    ? `letterRise 0.9s cubic-bezier(0.16,1,0.3,1) ${700 + (5 + i) * 70}ms both`
                    : 'none',
                  filter: 'drop-shadow(0 0 30px rgba(0,242,204,0.5))',
                }}
              >
                {char}
              </span>
            ))}
          </div>
        </div>

        {/* Thin expanding line */}
        <div style={{
          marginTop: 28,
          height: 1,
          width: '100%',
          maxWidth: 360,
          background: 'linear-gradient(90deg, rgba(0,242,204,0.7), rgba(124,58,237,0.4), transparent)',
          animation: showContent ? 'lineExpand 1.2s cubic-bezier(0.16,1,0.3,1) 1400ms both' : 'none',
          transformOrigin: 'left',
        }} />
      </div>

      {/* Bottom loading bar */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: 1,
        background: 'rgba(255,255,255,0.04)',
        opacity: showContent ? 1 : 0,
        transition: 'opacity 0.5s 1s ease',
      }}>
        <div style={{
          height: '100%',
          background: 'linear-gradient(90deg, transparent, #00f2cc, rgba(0,242,204,0.4))',
          animation: 'loadBar 3s cubic-bezier(0.4,0,0.2,1) 0.5s both',
        }} />
      </div>

      {/* Bottom-right minimal nav hint */}
      <div style={{
        position: 'absolute', bottom: 36, right: 40,
        display: 'flex', gap: 24,
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: 8, letterSpacing: '0.22em',
        color: 'rgba(255,255,255,0.18)',
        textTransform: 'uppercase',
        opacity: showContent ? 1 : 0,
        transition: 'opacity 1s 1.5s ease',
      }}>
        <span>AI · Powered</span>
        <span>SQL · Engine</span>
        <span>LLaMA · 3.1</span>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════════
   LANDING PAGE HERO  —  Alterfx-style full screen, no glass box
══════════════════════════════════════════════════════════════════ */

function StatBadge({ value, label, color = 'var(--teal)' }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      padding: '14px 20px',
      background: 'rgba(255,255,255,0.025)',
      border: '1px solid rgba(255,255,255,0.06)',
      borderRadius: 14,
      backdropFilter: 'blur(20px)',
      minWidth: 90, textAlign: 'center',
    }}>
      <div style={{
        fontSize: 22, fontWeight: 800, fontFamily: 'JetBrains Mono, monospace',
        color, lineHeight: 1,
        textShadow: `0 0 20px ${color}55`,
      }}>
        {value}
      </div>
      <div style={{
        fontSize: 8, color: 'var(--text3)', letterSpacing: '0.18em',
        marginTop: 6, textTransform: 'uppercase',
        fontFamily: 'JetBrains Mono, monospace',
      }}>
        {label}
      </div>
    </div>
  )
}

function HeroNavbar() {
  return (
    <div style={{
      position: 'absolute', top: 0, left: 0, right: 0,
      padding: '0 40px', height: 60,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      zIndex: 10,
      borderBottom: '1px solid rgba(255,255,255,0.04)',
    }}>
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 28, height: 28,
          background: 'linear-gradient(135deg, #00f2cc, #7c3aed)',
          borderRadius: 7,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 14, fontWeight: 900, color: '#000',
          boxShadow: '0 0 16px rgba(0,242,204,0.4)',
        }}>Q</div>
        <span style={{
          fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: 15,
          color: 'rgba(255,255,255,0.9)',
          letterSpacing: '-0.02em',
        }}>QueryMind</span>
      </div>

      {/* Center badges */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        {[
          ['FinSight DB', 'var(--teal)'],
          ['LLaMA 3.1 70B', 'var(--purple)'],
        ].map(([label, color]) => (
          <div key={label} style={{
            padding: '5px 14px', borderRadius: 99,
            background: `color-mix(in srgb, ${color} 9%, transparent)`,
            border: `1px solid color-mix(in srgb, ${color} 25%, transparent)`,
            fontSize: 10, fontWeight: 600, color,
            letterSpacing: '0.06em', fontFamily: 'JetBrains Mono, monospace',
          }}>{label}</div>
        ))}
      </div>

      {/* Status indicator */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{
          width: 6, height: 6, borderRadius: '50%',
          background: '#22c55e', boxShadow: '0 0 8px #22c55e',
          animation: 'statusPulse 1.8s ease-in-out infinite',
        }} />
        <span style={{
          fontSize: 9, color: 'rgba(34,197,94,0.75)',
          fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.16em',
        }}>SYSTEM ONLINE</span>
      </div>
    </div>
  )
}

function HeroCTA({ onEnter }) {
  const [hovMain, setHovMain] = useState(false)
  const [hovSec, setHovSec] = useState(false)

  return (
    <div style={{ display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap' }}>
      {/* Primary — teal fill */}
      <button
        onClick={onEnter}
        onMouseEnter={() => setHovMain(true)}
        onMouseLeave={() => setHovMain(false)}
        style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '14px 30px',
          background: hovMain
            ? 'linear-gradient(135deg, #00f2cc, #00c9aa)'
            : 'linear-gradient(135deg, #00ddb8, #00b89a)',
          border: 'none', borderRadius: 12,
          color: '#030010', fontSize: 14, fontWeight: 700,
          fontFamily: 'Inter, sans-serif', letterSpacing: '-0.01em',
          cursor: 'pointer',
          transition: 'all 0.25s cubic-bezier(0.16,1,0.3,1)',
          transform: hovMain ? 'translateY(-2px) scale(1.02)' : 'scale(1)',
          boxShadow: hovMain
            ? '0 0 40px rgba(0,242,204,0.5), 0 0 80px rgba(0,242,204,0.2), 0 8px 30px rgba(0,0,0,0.4)'
            : '0 0 20px rgba(0,242,204,0.25), 0 4px 16px rgba(0,0,0,0.3)',
        }}
      >
        Initialize System
        <span style={{ fontSize: 16 }}>→</span>
      </button>

      {/* Secondary — ghost */}
      <button
        onMouseEnter={() => setHovSec(true)}
        onMouseLeave={() => setHovSec(false)}
        style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '13px 26px',
          background: hovSec ? 'rgba(0,242,204,0.06)' : 'transparent',
          border: `1px solid ${hovSec ? 'rgba(0,242,204,0.4)' : 'rgba(255,255,255,0.12)'}`,
          borderRadius: 12,
          color: hovSec ? 'var(--teal)' : 'rgba(255,255,255,0.6)',
          fontSize: 13, fontWeight: 500,
          fontFamily: 'Inter, sans-serif',
          cursor: 'pointer',
          transition: 'all 0.22s ease',
        }}
      >
        View Demo ⧉
      </button>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════════
   SMOOTH 3D DATABASE ORB (SQL Hologram Stack)
══════════════════════════════════════════════════════════════════ */
function NeuralOrb3D({ mousePos }) {
  const canvasRef = useRef(null)
  const mousePosRef = useRef(mousePos)

  useEffect(() => {
    mousePosRef.current = mousePos
  }, [mousePos])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let animId
    const SIZE = 560
    canvas.width = SIZE
    canvas.height = SIZE

    // Parameters for Database Stack
    const segments = 40
    const platters = 3
    const R = 120
    const thickness = 22
    const spacing = 84
    
    // Build Geometry
    const geometry = [] // array of all points
    const plattersData = []

    let vIndex = 0
    for(let p = 0; p < platters; p++) {
        // center the stack around Y=0
        const centerY = (p - 1) * spacing
        const pObj = { topRing: [], botRing: [], centerY }

        // Top ring
        for(let i=0; i<segments; i++) {
            const angle = (i / segments) * Math.PI * 2
            const x = R * Math.cos(angle)
            const z = R * Math.sin(angle)
            const y = centerY - thickness/2
            geometry.push({x, y, z})
            pObj.topRing.push(vIndex++)
        }

        // Bot ring
        for(let i=0; i<segments; i++) {
            const angle = (i / segments) * Math.PI * 2
            const x = R * Math.cos(angle)
            const z = R * Math.sin(angle)
            const y = centerY + thickness/2
            geometry.push({x, y, z})
            pObj.botRing.push(vIndex++)
        }
        
        plattersData.push(pObj)
    }

    // Connective Data streams (vertical lines bouncing between disks gracefully)
    const dataStreams = Array.from({length: 12}).map(() => {
        return {
           angle: Math.random() * Math.PI * 2,
           y: -spacing * 1.5 + Math.random() * spacing * 3,
           speed: (Math.random() > 0.5 ? 1 : -1) * (0.2 + Math.random() * 0.3), // very slow
           radius: Math.random() > 0.6 ? R + 22 : R * (0.15 + Math.random() * 0.4) // outer edge or core
        }
    })

    const cx = SIZE/2
    const cy = SIZE/2
    let time = 0

    // Slow, stately rotation
    let rotY = 0
    // Fixed tilt to view the database disks from an isometric-like angle
    const baseRotX = 0.35

    const project = ({x, y, z}) => {
        const fov = 800
        const depth = fov + z + 260
        if(depth < 10) return null
        return {
            px: cx + (x * fov) / depth,
            py: cy + (y * fov) / depth,
            scale: fov / depth,
            z
        }
    }

    const draw = () => {
        ctx.clearRect(0, 0, SIZE, SIZE)
        time += 1

        // Mouse Parallax - very smooth, heavily damped
        const mx = mousePosRef.current.x * 0.1
        const my = mousePosRef.current.y * 0.1

        const rx = baseRotX + my
        const ry = rotY + mx
        
        // Gentle vertical breathing float
        const floatY = Math.sin(time * 0.015) * 8
        
        // Transform geometry
        const transformed = geometry.map(p => {
             // Rotate Y
             const x1 = p.x * Math.cos(ry) - p.z * Math.sin(ry)
             const z1 = p.x * Math.sin(ry) + p.z * Math.cos(ry)
             
             // Base Y includes float
             const y1 = p.y + floatY
             
             // Rotate X
             const y2 = y1 * Math.cos(rx) - z1 * Math.sin(rx)
             const z2 = y1 * Math.sin(rx) + z1 * Math.cos(rx)
             
             return {x: x1, y: y2, z: z2}
        })
        
        const projected = transformed.map(project)

        const drawQueue = []

        // Enqueue data streams
        dataStreams.forEach(stream => {
            stream.y += stream.speed
            // bounce/loop smoothly
            if (stream.y > spacing * 1.5 + 30) stream.y = -spacing * 1.5 - 30
            if (stream.y < -spacing * 1.5 - 30) stream.y = spacing * 1.5 + 30

            const x = stream.radius * Math.cos(stream.angle + rotY)
            const z = stream.radius * Math.sin(stream.angle + rotY)
            const y = stream.y + floatY
            
            // X-tilt for streams
            const y2 = y * Math.cos(rx) - z * Math.sin(rx)
            const z2 = y * Math.sin(rx) + z * Math.cos(rx)
            
            const p = project({x, y: y2, z: z2})
            if (!p) return
            
            drawQueue.push({
               z: z2 + 10, // slightly in front to avoid clipping inside the ring exactly
               draw: () => {
                  const isOuter = stream.radius > R
                  ctx.beginPath()
                  ctx.arc(p.px, p.py, p.scale * (isOuter ? 2.5 : 1.5), 0, Math.PI*2)
                  ctx.fillStyle = isOuter ? 'rgba(0, 242, 204, 0.95)' : 'rgba(192, 132, 252, 0.95)'
                  ctx.shadowBlur = p.scale * (isOuter ? 15 : 8)
                  ctx.shadowColor = ctx.fillStyle
                  ctx.fill()
                  ctx.shadowBlur = 0

                  // Smooth motion trail
                  const ty = y - stream.speed * 25
                  const ty2 = ty * Math.cos(rx) - z * Math.sin(rx)
                  const tz2 = ty * Math.sin(rx) + z * Math.cos(rx)
                  const pTail = project({x, y: ty2, z: tz2})
                  if (pTail) {
                    ctx.beginPath()
                    ctx.moveTo(p.px, p.py)
                    ctx.lineTo(pTail.px, pTail.py)
                    ctx.strokeStyle = isOuter ? 'rgba(0, 242, 204, 0.2)' : 'rgba(192, 132, 252, 0.2)'
                    ctx.lineWidth = p.scale * (isOuter ? 1.5 : 1)
                    ctx.stroke()
                  }
               }
            })
        })

        // Enqueue database platters (disks)
        plattersData.forEach((p, pIdx) => {
            const isPurple = pIdx % 2 !== 0 // center is purple, top/bot deal
            const colorRGB = isPurple ? '192, 132, 252' : '0, 242, 204'

            for(let i=0; i<segments; i++) {
                const nextI = (i + 1) % segments
                
                const t1 = projected[p.topRing[i]]
                const t2 = projected[p.topRing[nextI]]
                const b1 = projected[p.botRing[i]]
                const b2 = projected[p.botRing[nextI]]

                if(!t1 || !t2 || !b1 || !b2) continue

                // Top wireframe rim
                drawQueue.push({
                    z: (t1.z + t2.z)/2,
                    draw: () => {
                       const depthFade = Math.max(0.1, (t1.z + R*1.5) / (R * 3))
                       ctx.beginPath()
                       ctx.moveTo(t1.px, t1.py)
                       ctx.lineTo(t2.px, t2.py)
                       ctx.strokeStyle = `rgba(${colorRGB}, ${depthFade * 0.95})`
                       ctx.lineWidth = t1.scale * 1.8
                       ctx.stroke()
                    }
                })

                // Bottom wireframe rim
                drawQueue.push({
                    z: (b1.z + b2.z)/2,
                    draw: () => {
                       const depthFade = Math.max(0.1, (b1.z + R*1.5) / (R * 3))
                       ctx.beginPath()
                       ctx.moveTo(b1.px, b1.py)
                       ctx.lineTo(b2.px, b2.py)
                       ctx.strokeStyle = `rgba(${colorRGB}, ${depthFade * 0.4})`
                       ctx.lineWidth = b1.scale * 1.2
                       ctx.stroke()
                    }
                })

                // Structural side panels and connection bars
                drawQueue.push({
                    z: (t1.z + b1.z)/2,
                    draw: () => {
                       const depthFade = Math.max(0.1, (t1.z + R*1.5) / (R * 3))
                       
                       // Solid transparent glass paneling
                       ctx.beginPath()
                       ctx.moveTo(t1.px, t1.py)
                       ctx.lineTo(t2.px, t2.py)
                       ctx.lineTo(b2.px, b2.py)
                       ctx.lineTo(b1.px, b1.py)
                       ctx.closePath()
                       ctx.fillStyle = `rgba(${colorRGB}, ${depthFade * 0.04})`
                       ctx.fill()

                       // Vertical side struts (render periodically)
                       if (i % 5 === 0) {
                           ctx.beginPath()
                           ctx.moveTo(t1.px, t1.py)
                           ctx.lineTo(b1.px, b1.py)
                           ctx.strokeStyle = `rgba(${colorRGB}, ${depthFade * 0.8})`
                           ctx.lineWidth = t1.scale * 1.5
                           ctx.stroke()
                       }
                    }
                })
            }

            // Central connecting column
            if (pIdx < platters - 1) {
                const yTop = p.centerY + thickness/2 + floatY
                const yBot = plattersData[pIdx+1].centerY - thickness/2 + floatY
                
                const ty1 = yTop * Math.cos(rx)
                const tz1 = yTop * Math.sin(rx)
                const ty2 = yBot * Math.cos(rx)
                const tz2 = yBot * Math.sin(rx)
                
                const ptTop = project({x:0, y: ty1, z: tz1})
                const ptBot = project({x:0, y: ty2, z: tz2})

                if (ptTop && ptBot) {
                  drawQueue.push({
                      z: (tz1 + tz2) / 2,
                      draw: () => {
                         // Thick translucent cylinder core
                         ctx.beginPath()
                         ctx.moveTo(ptTop.px, ptTop.py)
                         ctx.lineTo(ptBot.px, ptBot.py)
                         ctx.strokeStyle = `rgba(${colorRGB}, 0.15)`
                         ctx.lineWidth = ptTop.scale * 24
                         ctx.stroke()

                         // Bright hot inner wire
                         ctx.beginPath()
                         ctx.moveTo(ptTop.px, ptTop.py)
                         ctx.lineTo(ptBot.px, ptBot.py)
                         ctx.strokeStyle = `rgba(255, 255, 255, 0.8)`
                         ctx.shadowBlur = 12
                         ctx.shadowColor = `rgba(${colorRGB}, 1)`
                         ctx.lineWidth = ptTop.scale * 2
                         ctx.stroke()
                         ctx.shadowBlur = 0
                      }
                  })
                }
            }
        })

        // Render everything sorted by z-depth backwards (painter's algorithm)
        drawQueue.sort((a,b) => b.z - a.z).forEach(item => item.draw())

        rotY -= 0.0035 // Exceptionally smooth, slow rotation

        animId = requestAnimationFrame(draw)
    }

    draw()
    return () => cancelAnimationFrame(animId)
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{
        width: 560, height: 560,
        filter: 'drop-shadow(0 0 30px rgba(0,242,204,0.1)) drop-shadow(0 0 60px rgba(124,58,237,0.08))',
        pointerEvents: 'none',
        flexShrink: 0,
        mixBlendMode: 'screen',
      }}
    />
  )
}

/* ══════════════════════════════════════════════════════════════════
   HERO LANDING  —  full-screen, Alterfx-inspired layout
══════════════════════════════════════════════════════════════════ */
function HeroLanding({ onEnter, visible }) {
  const containerRef = useRef(null)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })

  const handleMouseMove = useCallback((e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    setMousePos({
      x: ((e.clientX - rect.left) / rect.width - 0.5) * 2,
      y: ((e.clientY - rect.top) / rect.height - 0.5) * 2,
    })
  }, [])

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        background: '#050505', overflow: 'hidden',
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.9s cubic-bezier(0.16,1,0.3,1)',
      }}
    >
      {/* Living background smoke */}
      <FluidSmokeCanvas opacity={0.65} />

      {/* Particle layer */}
      <ParticleCanvas />

      {/* Deep radial halos */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: `
          radial-gradient(ellipse 60% 50% at 15% 20%, rgba(124,58,237,0.09) 0%, transparent 65%),
          radial-gradient(ellipse 50% 45% at 88% 80%, rgba(0,242,204,0.07) 0%, transparent 65%),
          radial-gradient(ellipse 40% 40% at 80% 15%, rgba(0,80,255,0.05) 0%, transparent 65%)
        `,
        // subtle mouse parallax
        transform: `translate(${mousePos.x * -8}px, ${mousePos.y * -6}px)`,
        transition: 'transform 0.4s ease-out',
      }} />

      {/* Scan line */}
      <div style={{
        position: 'absolute', left: 0, right: 0, height: 1, zIndex: 1, pointerEvents: 'none',
        background: 'linear-gradient(90deg, transparent 5%, rgba(0,242,204,0.4) 40%, rgba(124,58,237,0.25) 60%, transparent 95%)',
        animation: 'introScanLine 7s ease-in-out infinite',
        boxShadow: '0 0 10px rgba(0,242,204,0.2)',
      }} />

      {/* Navbar */}
      <HeroNavbar />

      {/* ── Main Hero Content — two-column layout ── */}
      <div style={{
        position: 'relative', zIndex: 5,
        height: '100%',
        display: 'flex', flexDirection: 'row',
        alignItems: 'center', justifyContent: 'space-between',
        padding: '60px 5vw 0 8vw',
        gap: '4vw',
      }}>

        {/* LEFT — text content */}
        <div style={{
          flex: '0 0 auto',
          display: 'flex', flexDirection: 'column',
          alignItems: 'flex-start',
          maxWidth: 560,
        }}>
          {/* Eyebrow badge */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '6px 14px', borderRadius: 99,
            background: 'rgba(0,242,204,0.06)',
            border: '1px solid rgba(0,242,204,0.2)',
            marginBottom: 26,
            animation: visible ? 'wordSlideUp 0.7s cubic-bezier(0.16,1,0.3,1) 0.1s both' : 'none',
          }}>
            <span style={{
              width: 5, height: 5, borderRadius: '50%',
              background: 'var(--teal)', display: 'inline-block',
              boxShadow: '0 0 8px var(--teal)',
            }} />
            <span style={{
              fontSize: 10, fontWeight: 600, color: 'var(--teal)',
              fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.14em',
            }}>✦ Powered by LLaMA 3.1 · 70B Parameters</span>
          </div>

          {/* Hero Headline */}
          <h1 style={{
            margin: 0, lineHeight: 1.05,
            fontFamily: '"Inter", "Helvetica Neue", Arial, sans-serif',
            fontWeight: 800,
            fontSize: 'clamp(44px, 5.5vw, 84px)',
            letterSpacing: '-0.02em',
          }}>
            {/* Line 1 */}
            <div style={{ overflow: 'hidden' }}>
              <div style={{
                color: 'rgba(255,255,255,0.95)',
                animation: visible ? 'letterRise 0.9s cubic-bezier(0.16,1,0.3,1) 0.2s both' : 'none',
              }}>
                Your personal
              </div>
            </div>
            {/* Line 2 — with teal keyword */}
            <div style={{ overflow: 'hidden', paddingBottom: 10 }}>
              <div style={{
                animation: visible ? 'letterRise 0.9s cubic-bezier(0.16,1,0.3,1) 0.4s both' : 'none',
              }}>
                <span style={{ color: 'rgba(255,255,255,0.95)', whiteSpace: 'nowrap' }}>AI database </span>
                <span style={{
                  background: 'linear-gradient(135deg, #00f2cc, #00c9aa)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  filter: 'drop-shadow(0 0 20px rgba(0,242,204,0.5))',
                }}>
                  coach.
                </span>
              </div>
            </div>
          </h1>

          {/* Subtitle */}
          <p style={{
            marginTop: 20, marginBottom: 32,
            fontSize: 'clamp(13px, 1.3vw, 16px)', color: 'var(--text2)',
            fontFamily: 'Inter, sans-serif', fontWeight: 400, lineHeight: 1.65, maxWidth: 430,
            animation: visible ? 'wordSlideUp 0.8s cubic-bezier(0.16,1,0.3,1) 0.55s both' : 'none',
          }}>
            Ask questions in plain English — QueryMind translates them to SQL,
            executes queries, and delivers insights. Powered by AI.
          </p>

          {/* CTAs */}
          <div style={{ animation: visible ? 'wordSlideUp 0.8s cubic-bezier(0.16,1,0.3,1) 0.7s both' : 'none' }}>
            <HeroCTA onEnter={onEnter} />
          </div>

          {/* Stats */}
          <div style={{
            display: 'flex', gap: 10, marginTop: 38, flexWrap: 'wrap',
            animation: visible ? 'wordSlideUp 0.8s cubic-bezier(0.16,1,0.3,1) 0.85s both' : 'none',
          }}>
            <StatBadge value="98%" label="Accuracy" color="var(--teal)" />
            <StatBadge value="70B" label="Parameters" color="#a78bfa" />
            <StatBadge value="12ms" label="Avg Latency" color="var(--teal)" />
            <StatBadge value="1.2k" label="Queries/Day" color="#e040fb" />
          </div>

          {/* Feature chips */}
          <div style={{
            display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 18,
            animation: visible ? 'wordSlideUp 0.8s cubic-bezier(0.16,1,0.3,1) 1s both' : 'none',
          }}>
            {[
              { label: 'Natural Language → SQL', color: '#00f2cc' },
              { label: 'Auto Charts', color: '#a78bfa' },
              { label: 'CSV Import', color: '#22c55e' },
              { label: 'Query History', color: '#e040fb' },
            ].map(chip => (
              <div key={chip.label} style={{
                padding: '5px 12px', borderRadius: 99,
                background: `${chip.color}0f`, border: `1px solid ${chip.color}28`,
                color: chip.color, fontSize: 10, fontWeight: 500,
                fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.04em',
              }}>{chip.label}</div>
            ))}
          </div>
        </div>

        {/* RIGHT — 3D Neural Orb */}
        <div style={{
          flex: '1 1 auto',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          position: 'relative',
          minWidth: 300, maxWidth: 540,
          animation: visible ? 'wordSlideUp 1s cubic-bezier(0.16,1,0.3,1) 0.3s both' : 'none',
        }}>
          {/* Outer CSS orbit rings */}
          <div style={{
            position: 'absolute', width: 500, height: 500, borderRadius: '50%',
            border: '1px solid rgba(0,242,204,0.06)',
            animation: 'auroraRing1 22s linear infinite',
            pointerEvents: 'none',
          }} />
          <div style={{
            position: 'absolute', width: 560, height: 560, borderRadius: '50%',
            border: '1px solid rgba(124,58,237,0.04)',
            animation: 'auroraRing2 30s linear infinite',
            pointerEvents: 'none',
          }} />
          {/* Background glow behind orb */}
          <div style={{
            position: 'absolute', width: 300, height: 300, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(0,242,204,0.055) 0%, rgba(124,58,237,0.035) 45%, transparent 72%)',
            pointerEvents: 'none',
          }} />
          <NeuralOrb3D mousePos={mousePos} />
        </div>
      </div>

      {/* Bottom center hint */}
      <div style={{
        position: 'absolute', bottom: 22, left: '50%', transform: 'translateX(-50%)',
        fontSize: 8, color: 'var(--text3)',
        fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.22em',
        textTransform: 'uppercase', zIndex: 5, whiteSpace: 'nowrap',
        animation: visible ? 'fadeIn 1s 1.8s both' : 'none',
      }}>
        · · · press to initialize system · · ·
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════════
   MAIN EXPORT
══════════════════════════════════════════════════════════════════ */
export default function IntroPage({ onEnter }) {
  const [showCinematic, setShowCinematic] = useState(true)
  const [heroVisible, setHeroVisible] = useState(false)
  const [exiting, setExiting] = useState(false)

  const handleCinematicDone = useCallback(() => {
    setShowCinematic(false)
    requestAnimationFrame(() => setHeroVisible(true))
  }, [])

  const handleEnter = () => {
    setExiting(true)
    setTimeout(onEnter, 750)
  }

  return (
    <>
      {showCinematic && <CinematicIntro onComplete={handleCinematicDone} />}
      <div className={exiting ? 'intro-fade-out' : ''}>
        <HeroLanding onEnter={handleEnter} visible={heroVisible} />
      </div>
    </>
  )
}
