// Every animation clip in src/assets/sage.glb, and how each one is played.
// When the app uses each clip is decided in src/hooks/useSageAnimation.js.
// sage_rest_pose is a still frame for Blender only and is left out on
// purpose.

export const IDLE = 'sage_idle'

// Crossfade lengths, in seconds.
export const FADE = 0.3
// _in into _loop: the poses already match, so barely a blend.
export const CHAIN_FADE = 0.1

// Clips that repeat until something else is played (LoopRepeat).
export const LOOP_CLIPS = [
  'sage_idle',
  'sage_breathe_loop',
  'sage_tour_talk_loop',
  'sage_think_loop',
  'sage_work_loop',
  'sage_write_loop',
  'sage_break_loop',
]

// Clips that play once and then hand back to idle (LoopOnce, clamped).
export const ONE_SHOT_CLIPS = [
  'sage_react_low',
  'sage_react_meh',
  'sage_react_ok',
  'sage_react_good',
  'sage_react_great',
  'sage_checkin_low',
  'sage_checkin_meh',
  'sage_checkin_ok',
  'sage_checkin_good',
  'sage_checkin_great',
  'sage_step_complete',
  'sage_task_complete',
  'sage_tour_wave',
  'sage_tour_finish',
  'sage_think_in',
  'sage_think_out',
  'sage_work_in',
  'sage_work_out',
  'sage_write_in',
  'sage_write_out',
  'sage_break_in',
  'sage_break_out',
]

export const ALL_CLIPS = [...LOOP_CLIPS, ...ONE_SHOT_CLIPS]

export const isLoopClip = (name) => LOOP_CLIPS.includes(name)

// The four activities that come as in → loop → out. Work, write and break
// bring a prop into her hands (src/utils/sageProps.js shows and hides it).
export const CHAINS = {
  think: { in: 'sage_think_in', loop: 'sage_think_loop', out: 'sage_think_out' },
  work:  { in: 'sage_work_in',  loop: 'sage_work_loop',  out: 'sage_work_out' },
  write: { in: 'sage_write_in', loop: 'sage_write_loop', out: 'sage_write_out' },
  break: { in: 'sage_break_in', loop: 'sage_break_loop', out: 'sage_break_out' },
}

// The app's moods (src/data/moods.js labels) → the clip suffix, lowest to
// highest. Unknown or no mood counts as 'ok', so a check-in with no mood
// logged yet is a neutral one.
export const MOOD_LEVEL = {
  Low: 'low',
  Meh: 'meh',
  Ok: 'ok',
  Good: 'good',
  Great: 'great',
}

const levelOf = (mood) => MOOD_LEVEL[mood] || 'ok'

// Her answer straight after the user logs a mood.
export const reactClipFor = (mood) => `sage_react_${levelOf(mood)}`

// Sage asking how it's going, matched to the last mood logged.
export const checkinClipFor = (mood) => `sage_checkin_${levelOf(mood)}`

// What Sage says as she checks in, matched to the mood (the same feeling as
// the check-in clip she plays with it). `n` is ', Alex' or ''.
export const CHECKIN_LINES = {
  low: (n) => `How are you holding up${n}?`,
  meh: (n) => `Anything I can do${n}?`,
  ok: (n) => `All good${n}?`,
  good: (n) => `Still going well${n}?`,
  great: (n) => `Still feeling great${n}?`,
}

export const checkinLineFor = (mood, n = '') => CHECKIN_LINES[levelOf(mood)](n)

// Length of the box-breathing clip; the breathing exercise keeps her in step
// with elapsedSeconds % BREATHE_CYCLE.
export const BREATHE_CYCLE = 16

export const BREATHE_CLIP = 'sage_breathe_loop'
export const STEP_COMPLETE_CLIP = 'sage_step_complete'
export const TASK_COMPLETE_CLIP = 'sage_task_complete'
export const TOUR_WAVE_CLIP = 'sage_tour_wave'
export const TOUR_TALK_CLIP = 'sage_tour_talk_loop'
export const TOUR_FINISH_CLIP = 'sage_tour_finish'

// How long each clip lasts, in seconds, as exported from Blender. The app's
// animation rules run on these even when no 3D Sage is on screen (she's
// switched off in Settings), so they're written down here rather than read
// from the model. sageController.js warns in development if the model ever
// disagrees.
export const CLIP_SECONDS = {
  sage_idle: 4,
  sage_breathe_loop: 16,
  sage_tour_talk_loop: 6,
  sage_react_low: 5,
  sage_react_meh: 3.5,
  sage_react_ok: 3,
  sage_react_good: 4,
  sage_react_great: 4,
  sage_checkin_low: 3.5,
  sage_checkin_meh: 3,
  sage_checkin_ok: 3,
  sage_checkin_good: 3.5,
  sage_checkin_great: 3,
  sage_step_complete: 1,
  sage_task_complete: 2.75,
  sage_tour_wave: 3,
  sage_tour_finish: 3,
  sage_think_in: 1.167,
  sage_think_loop: 4,
  sage_think_out: 1.5,
  sage_work_in: 1.5,
  sage_work_loop: 8,
  sage_work_out: 1.5,
  sage_write_in: 1.5,
  sage_write_loop: 6,
  sage_write_out: 1.5,
  sage_break_in: 1.5,
  sage_break_loop: 11,
  sage_break_out: 1.5,
}

// Who wins when two things want Sage at once, highest first. A request
// never cuts off anything ranked above it.
export const PRIORITY = {
  tour: 6,
  breathing: 5,
  chain: 4,
  completion: 3,
  reaction: 2,
  checkin: 1,
  idle: 0,
}

// ── Timings ──────────────────────────────────────────────────────────────

// Automatic check-ins (Sage asking how it's going, matched to today's mood).
// The first comes this long after she settles back into idle…
export const CHECKIN_MIN_IDLE_MS = 2 * 60 * 1000
// …and after a check-in, the next comes at a random point in this range.
export const CHECKIN_MIN_INTERVAL_MS = 3 * 60 * 1000
export const CHECKIN_MAX_INTERVAL_MS = 6 * 60 * 1000

// Reflect page: stop "writing" after this long without a keystroke.
export const WRITE_IDLE_TIMEOUT_MS = 30 * 1000

// Breathing exercise: the calm "Starting in 4… 3… 2… 1" after Begin.
export const BREATHING_COUNTDOWN_SECONDS = 4

// Framing while a prop is in her hands (work, write and break chains): the
// camera eases back by this much (1 = unchanged; bigger shows more) and down
// by this many units, so the laptop, notepad and mug stay inside her circle.
export const PROP_FRAMING_ZOOM = 1.18
export const PROP_FRAMING_DROP = 0.12
// Roughly how long the camera takes to ease there and back, in seconds.
export const PROP_FRAMING_EASE_SECONDS = 0.6
