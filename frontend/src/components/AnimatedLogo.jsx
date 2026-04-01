export default function AnimatedLogo({ size = 40 }) {
  return (
    <div style={{
      width: size, height: size,
      position: 'relative',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      filter: 'drop-shadow(0 0 8px rgba(0,242,204,0.6)) drop-shadow(0 0 20px rgba(124,58,237,0.4))'
    }}>
      <svg
        width={size} height={size} viewBox="0 0 100 100"
        style={{ animation: 'spinGeo 8s linear infinite' }}
      >
        <defs>
          <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%"   stopColor="#00f2cc" />
            <stop offset="50%"  stopColor="#7c3aed" />
            <stop offset="100%" stopColor="#e040fb" />
          </linearGradient>
          <linearGradient id="logoGradInvert" x1="100%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%"   stopColor="#00f2cc" />
            <stop offset="100%" stopColor="#7c3aed" />
          </linearGradient>
        </defs>
        {/* Outer Hexagon */}
        <polygon
          points="50 5, 90 27.5, 90 72.5, 50 95, 10 72.5, 10 27.5"
          fill="none"
          stroke="url(#logoGrad)"
          strokeWidth="3"
          style={{ animation: 'pulseStroke 2s ease-in-out infinite alternate' }}
        />
        {/* Inner Lines */}
        <polyline points="50 5, 50 50, 90 72.5"  fill="none" stroke="url(#logoGradInvert)" strokeWidth="2" />
        <polyline points="50 50, 10 72.5"          fill="none" stroke="url(#logoGradInvert)" strokeWidth="2" />
        {/* Core orb */}
        <circle cx="50" cy="50" r="8" fill="#fff"
          style={{ animation: 'corePulse 1.5s ease-in-out infinite alternate' }}
        />
      </svg>
    </div>
  )
}

export function AnimatedText({ text, size = 24, style = {} }) {
  return (
    <span className="animated-text" style={{ fontSize: size, ...style }}>
      {text}
    </span>
  )
}
