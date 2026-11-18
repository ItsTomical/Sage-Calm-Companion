import { PHONE } from './breakpoints.js'

let answer = null

// Whether this device should get the 3D Sage. The model and three.js are
// about 1.8 MB, which matters on a slow phone or a capped data plan, so
// devices that are asking to save data, are short on memory, or can't draw
// WebGL at all keep her leaf (SageMark) instead. Worked out once.
export function canRender3D() {
  if (answer !== null) return answer

  const nav = window.navigator
  const lowEndPhone =
    window.matchMedia(PHONE).matches &&
    nav.hardwareConcurrency !== undefined &&
    nav.hardwareConcurrency <= 4

  answer =
    !nav.connection?.saveData &&
    !(nav.deviceMemory !== undefined && nav.deviceMemory <= 2) &&
    !lowEndPhone &&
    hasWebGL()
  return answer
}

function hasWebGL() {
  try {
    const canvas = document.createElement('canvas')
    return Boolean(canvas.getContext('webgl2') || canvas.getContext('webgl'))
  } catch {
    return false
  }
}
