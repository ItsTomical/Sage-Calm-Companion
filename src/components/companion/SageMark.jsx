import leafIcon from '../../assets/icons/leaf.png'
import './SageMark.css'

// Marks a line as Sage speaking: her leaf, the same mark as the app's logo.
// It stands in for her rather than drawing her, so the floating 3D Sage stays
// the only figure of her on screen. Decorative: the words beside it carry the
// meaning, so screen readers skip it.
//
// `px` sizes it to match the 3D figure exactly, for when it stands in for her
// (while she downloads, or if she can't be drawn), so nothing shifts when she
// arrives. `float` lets the leaf drift the way she does; the circle stays put.
export default function SageMark({ size = 'sm', px, float = false }) {
  const classes = ['sage-mark', px ? 'sage-mark-px' : `sage-mark-${size}`, float ? 'sage-mark-float' : '']
    .filter(Boolean)
    .join(' ')
  return (
    <span className={classes} style={px ? { '--mark-size': `${px}px` } : undefined} aria-hidden="true">
      <img src={leafIcon} alt="" />
    </span>
  )
}
