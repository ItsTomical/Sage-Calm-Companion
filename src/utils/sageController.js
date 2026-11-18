import { AnimationClip, AnimationMixer, LoopOnce, LoopRepeat } from 'three'
import { ALL_CLIPS, BREATHE_CLIP, CLIP_SECONDS, IDLE, isLoopClip } from '../data/sageClips.js'
import { setupSageProps, setPropClip, updateSageProps } from './sageProps.js'
import {
  breathingClipTime,
  getSageState,
  subscribeSageState,
} from '../hooks/useSageAnimation.js'

// Moves one 3D Sage. It doesn't decide anything: the app-wide rules in
// useSageAnimation.js say which clip she should be playing, and this
// crossfades her mixer to it and keeps her props in step. So every Sage on
// screen agrees, and one that appears part-way through (the guide card, the
// breathing card) joins the clip where it has got to rather than starting it
// over.
//
// Made as soon as the model is cloned, and idle is applied straight away,
// so the very first frame drawn is already her resting pose and the T-pose
// is never seen.
export function createSageController(scene, animations) {
  // Before any clip plays: the props read the root bone's rest position.
  const props = setupSageProps(scene)
  const mixer = new AnimationMixer(scene)

  const actions = {}
  for (const name of ALL_CLIPS) {
    const clip = AnimationClip.findByName(animations, name)
    if (!clip) {
      console.warn(`[Sage] sage.glb has no clip called ${name}`)
      continue
    }
    if (import.meta.env.DEV && Math.abs(clip.duration - CLIP_SECONDS[name]) > 0.05) {
      console.warn(`[Sage] ${name} is ${clip.duration.toFixed(2)} s in sage.glb but ${CLIP_SECONDS[name]} s in sageClips.js`)
    }
    const action = mixer.clipAction(clip)
    if (isLoopClip(name)) {
      action.setLoop(LoopRepeat, Infinity)
    } else {
      action.setLoop(LoopOnce, 1)
      action.clampWhenFinished = true
    }
    actions[name] = action
  }

  let current = null
  let currentName = null
  let currentStart = null

  function follow(state, joining) {
    if (state.clip === currentName && state.startedAt === currentStart) return
    const next = actions[state.clip]
    if (!next) return
    currentStart = state.startedAt

    if (joining) {
      // Appearing part-way through: pick the clip up where it has got to,
      // without a fade.
      if (next !== current) {
        current?.stop()
        next.reset()
        next.setEffectiveTimeScale(1)
        next.setEffectiveWeight(1)
        next.play()
      }
      const into = Math.max(0, (performance.now() - state.startedAt) / 1000)
      const d = next.getClip().duration
      next.time = isLoopClip(state.clip) ? into % d : Math.min(into, d)
      current = next
      currentName = state.clip
    } else if (next !== current) {
      next.reset()
      next.setEffectiveTimeScale(1)
      next.setEffectiveWeight(1)
      next.play()
      if (current) current.crossFadeTo(next, state.fade, false)
      current = next
      currentName = state.clip
    } else if (!isLoopClip(state.clip)) {
      // The same one-shot asked for again (only the tester does this).
      next.reset().play()
    }
    setPropClip(props, state.clip)
  }

  // Idle at once, applied before anything is drawn.
  follow({ clip: IDLE, startedAt: -1, fade: 0 }, true)
  mixer.update(0)

  return {
    props,
    mixer,
    clipName: () => currentName,

    // Every frame: animation first, then the props read the pose it left.
    // The breathing clip is held to the exercise's own clock so the two
    // never drift apart.
    tick(delta) {
      mixer.update(delta)
      if (currentName === BREATHE_CLIP) {
        const t = breathingClipTime()
        if (t !== null) {
          current.time = t
          mixer.update(0)
        }
      }
      updateSageProps(props)
    },

    // Follows the app's rules while she's on screen. Returns the undo.
    attach() {
      follow(getSageState(), true)
      const unsubscribe = subscribeSageState(state => follow(state, false))
      return () => {
        unsubscribe()
        // Forget the clip, so attaching again joins whatever is playing then.
        currentName = null
        currentStart = null
      }
    },
  }
}
