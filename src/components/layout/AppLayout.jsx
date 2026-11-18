import { useState, useEffect, lazy, Suspense } from 'react'
import Sidebar from './Sidebar.jsx'
import Topbar from './Topbar.jsx'
import FloatingSage from '../companion/FloatingSage.jsx'
import Celebration from '../companion/Celebration.jsx'
import Guide from '../guide/Guide.jsx'
import SageAnimationProvider from '../companion/SageAnimationProvider.jsx'
import './AppLayout.css'

// The Sage clip tester, in development only. In a production build
// import.meta.env.DEV is false, so this becomes null and the tester (and its
// CSS) is left out of the bundle entirely.
const SageClipTester = import.meta.env.DEV
  ? lazy(() => import('../companion/SageClipTester.jsx'))
  : null

export default function AppLayout({ children }) {
  // Which side of the page makes room for Sage. Follows the user's "Show
  // floating Sage" setting and her corner only; the guide hiding her for a
  // moment, or the Help panel moving her across, mustn't shift every page.
  const [showSage, setShowSage] = useState(() => localStorage.getItem('sage-visible') !== 'false')
  const [corner, setCorner] = useState(() => localStorage.getItem('sage-corner') || 'br')

  useEffect(() => {
    const onVisibility = (e) => setShowSage(e.detail)
    const onCorner = (e) => setCorner(e.detail)
    window.addEventListener('sage-visibility', onVisibility)
    window.addEventListener('sage-corner', onCorner)
    return () => {
      window.removeEventListener('sage-visibility', onVisibility)
      window.removeEventListener('sage-corner', onCorner)
    }
  }, [])

  const sageSide = showSage ? (corner.includes('l') ? 'left' : 'right') : undefined

  // SageAnimationProvider wraps everything, so Sage's animation state lives
  // here at the app level and carries on across pages.
  return (
    <SageAnimationProvider>
      <div className="shell" data-sage-side={sageSide}>
        <Sidebar />
        <div className="main-area">
          <Topbar />
          <div className="pages">
            {children}
          </div>
        </div>
        <FloatingSage />
        <Celebration />
        <Guide />
        {SageClipTester && (
          <Suspense fallback={null}>
            <SageClipTester />
          </Suspense>
        )}
      </div>
    </SageAnimationProvider>
  )
}
