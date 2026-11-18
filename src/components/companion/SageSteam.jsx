import { useMemo, useRef } from 'react'
import { createPortal, useFrame } from '@react-three/fiber'
import { CanvasTexture, SRGBColorSpace, Vector3 } from 'three'

// Steam over Sage's mug during a break: three soft puffs that rise, swell
// and fade in turn.
//
// They're children of Prop_Mug, so they follow the mug as she lifts it, and
// they're hidden whenever it is (sageProps.js hides the mug outside the
// break chain, and three hides children with their parent). The mug's own
// units are metres, base at y = 0.
const BASE_HEIGHT = 0.22 // above the mug's base (it's 19 cm tall)
const OFF_CENTRE = 0.045 // to the side away from her face
const RISE = 0.035
const CYCLE = 3.67 // seconds per puff
const OPACITY = 0.22
const PUFF_SIZE = 0.03 // at its fullest

const PUFFS = [0, 1, 2]

// A soft round blob, white in the middle fading to nothing, drawn once.
function makePuffTexture() {
  const c = document.createElement('canvas')
  c.width = c.height = 64
  const g = c.getContext('2d')
  const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32)
  grad.addColorStop(0, 'rgba(255,255,255,1)')
  grad.addColorStop(0.5, 'rgba(255,255,255,0.55)')
  grad.addColorStop(1, 'rgba(255,255,255,0)')
  g.fillStyle = grad
  g.fillRect(0, 0, 64, 64)
  const texture = new CanvasTexture(c)
  texture.colorSpace = SRGBColorSpace
  return texture
}

const face = new Vector3()
const eye = new Vector3()

export default function SageSteam({ mug, eyes }) {
  const texture = useMemo(makePuffTexture, [])
  const group = useRef()
  const puffs = useRef([])

  useFrame(({ clock }) => {
    if (!mug.visible || !group.current) return

    // Off-centre on the side away from her face: where her eyes are, seen
    // from the mug, flattened onto the mug's rim and flipped.
    if (eyes.length) {
      face.set(0, 0, 0)
      for (const e of eyes) face.add(e.getWorldPosition(eye))
      face.multiplyScalar(1 / eyes.length)
      mug.worldToLocal(face)
      face.y = 0
      if (face.lengthSq() > 1e-10 && Number.isFinite(face.x)) {
        face.normalize().multiplyScalar(-OFF_CENTRE)
        group.current.position.set(face.x, BASE_HEIGHT, face.z)
      }
    }

    const t = clock.elapsedTime
    puffs.current.forEach((puff, i) => {
      if (!puff) return
      // Each a third of a cycle behind the last.
      const phase = (t / CYCLE + i / 3) % 1
      const swell = Math.sin(Math.PI * phase) // 0 → 1 → 0 over the rise
      puff.position.set(Math.sin(phase * Math.PI * 2 + i) * 0.003, phase * RISE, 0)
      puff.scale.setScalar(PUFF_SIZE * (0.45 + 0.75 * swell))
      puff.material.opacity = OPACITY * swell
    })
  })

  return createPortal(
    <group ref={group} position={[0, BASE_HEIGHT, 0]}>
      {PUFFS.map(i => (
        <sprite key={i} ref={el => (puffs.current[i] = el)} renderOrder={2}>
          <spriteMaterial
            map={texture}
            transparent
            opacity={0}
            depthWrite={false}
            toneMapped={false}
          />
        </sprite>
      ))}
    </group>,
    mug,
  )
}
