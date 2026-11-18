import './Button.css'

// Anything else (data-tour, aria-*) is passed straight to the <button>.
export default function Button({ children, variant = 'primary', onClick, className = '', disabled = false, style, ...rest }) {
  return (
    <button
      className={`btn btn-${variant} ${className}`}
      onClick={onClick}
      disabled={disabled}
      style={style}
      {...rest}
    >
      {children}
    </button>
  )
}
