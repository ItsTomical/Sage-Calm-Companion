import { Suspense, lazy } from 'react'
import SageMark from './SageMark.jsx'
import SageErrorBoundary from './SageErrorBoundary.jsx'
import { canRender3D } from '../../utils/device.js'

// Three.js and the model are several hundred kilobytes, which would otherwise
// be downloaded before the first screen could render. Loading them separately
// keeps the app quick to start, and every Sage shares the one download.
const Sage3D = lazy(() => import('./Sage3D.jsx'))

// Sage wherever she appears: the 3D figure, with her leaf standing in while
// she loads, on devices that shouldn't download her (see canRender3D), and if
// drawing her ever fails. The leaf is the same size as she is, so nothing
// moves when she arrives.
export default function SageFigure({ size, float = false }) {
  const fallback = <SageMark px={size} float={float} />

  if (!canRender3D()) return fallback

  return (
    <SageErrorBoundary fallback={fallback}>
      <Suspense fallback={fallback}>
        <Sage3D size={size} float={float} />
      </Suspense>
    </SageErrorBoundary>
  )
}
