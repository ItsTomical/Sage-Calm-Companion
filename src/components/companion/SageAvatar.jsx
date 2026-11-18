import './SageAvatar.css'

export default function SageAvatar({ size = 'md', mood = 'normal', float = false }) {
  const sizeMap = { sm: 36, md: 64, lg: 88 }
  const px = sizeMap[size] || 64

  const classes = ['companion-fig', float ? 'sage-float' : ''].filter(Boolean).join(' ')

  const bgMap = {
    normal:  'linear-gradient(135deg, #8aab8a, #6A9B6E)',
    happy:   'linear-gradient(135deg, #a0c4a0, #8aab8a)',
    worried: 'linear-gradient(135deg, #7a9a8a, #5a8a7a)',
  }

  return (
    <div className={classes}>
      <div
        className="sage-placeholder"
        style={{
          width: px,
          height: px,
          borderRadius: '50%',
          background: bgMap[mood] || bgMap.normal,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: px * 0.38,
          color: 'rgba(255,255,255,0.92)',
          fontFamily: 'Lora, serif',
          fontWeight: 500,
          boxShadow: '0 4px 18px rgba(90,122,90,0.22)',
          flexShrink: 0,
        }}
      >
        S
      </div>
    </div>
  )
}
