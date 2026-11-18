import { createContext, useContext, useEffect, useState } from 'react'
import {
  BREATHE_CLIP,
  BREATHE_CYCLE,
  CHAINS,
  CHAIN_FADE,
  CHECKIN_MAX_INTERVAL_MS,
  CHECKIN_MIN_IDLE_MS,
  CHECKIN_MIN_INTERVAL_MS,
  CLIP_SECONDS,
  FADE,
  IDLE,
  PRIORITY,
  STEP_COMPLETE_CLIP,
  TASK_COMPLETE_CLIP,
  TOUR_FINISH_CLIP,
  TOUR_TALK_CLIP,
  TOUR_WAVE_CLIP,
  checkinClipFor,
  checkinLineFor,
  isLoopClip,
  reactClipFor,
} from '../data/sageClips.js'
import { getTodayMood } from './useMood.js'
import { saySage } from '../components/companion/FloatingSage.jsx'
import { withName } from '../utils/userName.js'

// ─────────────────────────────────────────────────────────────────────────
// Sage's body language for the whole app: one set of rules deciding which
// clip she plays, whatever page is open. The clips themselves are listed in
// src/data/sageClips.js.
//
// The app says what is happening (a mood was picked, the Pomodoro is in a
// break, the tour moved on); this decides what she does about it. Every 3D
// Sage on screen (floating, guide card, breathing card) just follows the
// clip decided here (src/utils/sageController.js). It runs on its own
// timers, so it keeps track even while she's switched off in Settings, and
// she's in the right animation the moment she's shown again.
//
// Rules:
// • Priority, highest first: tour, breathing, activity chains (think, work,
//   break, write), completions, mood reactions, check-ins. Nothing cuts off
//   anything ranked above it.
// • No spamming: a request for the clip already playing is ignored (never
//   restarted), and while a reaction plays further reactions are ignored.
//   Only the animation is ignored; whatever the click did still happens.
// • A chain always finishes through its _out before anything else plays, so
//   a prop is put away rather than vanishing. Completions wait for that _out;
//   reactions during a chain are ignored, except while writing on Reflect.
// • Once a one-shot ends, she goes back to whatever is still going on (a
//   chain that's still wanted starts again), or to idle.
// • Check-ins only ever start from plain idle.
// • Every change is a 0.3 s crossfade, except _in → _loop at 0.1 s.
// ─────────────────────────────────────────────────────────────────────────

const now = () => performance.now()

// What is going on that Sage should reflect, apart from one-off moments.
const want = {
  tour: null, // { mode: 'tour' | 'single', wave: boolean }
  breathing: null, // { elapsed, at } — the exercise's own clock
  chain: null, // 'think' | 'work' | 'write' | 'break'
}

// What she's playing now. kind: 'idle' | 'loop' | 'chain' | 'oneshot'.
// `ended` marks a one-shot that has finished or may be cut.
let cur = { clip: IDLE, kind: 'idle', level: PRIORITY.idle, chain: null, phase: null, startedAt: now(), fade: 0, ended: false }

// A one-shot waiting for a chain's _out to finish.
let pending = null
let endTimer = null
let thinkCount = 0

// Check-ins.
let checkinLeft = CHECKIN_MIN_IDLE_MS
let checkinCountedTo = now() // the countdown has been taken down to here
let lastWasCheckin = false
let checkinStatus = 'waiting'
let helpOpen = false

const listeners = new Set()

function snapshot() {
  return {
    clip: cur.clip,
    kind: cur.kind,
    chain: cur.chain,
    phase: cur.phase,
    startedAt: cur.startedAt,
    fade: cur.fade,
    wanted: { tour: want.tour?.mode ?? null, breathing: Boolean(want.breathing), chain: want.chain },
    pending: pending?.clip ?? null,
    checkin: { leftMs: Math.max(0, checkinLeft), status: checkinStatus },
  }
}

function emit() {
  const state = snapshot()
  listeners.forEach(fn => fn(state))
}

const randomBetween = (a, b) => a + Math.random() * (b - a)

function play(clip, info, fade = FADE) {
  clearTimeout(endTimer)
  endTimer = null
  cur = { clip, chain: null, phase: null, ...info, startedAt: now(), fade, ended: false }

  // Check-in timer: any animation resets it. Back in idle, the first comes
  // after CHECKIN_MIN_IDLE_MS; straight after a check-in, after a random
  // 3–6 minutes.
  if (clip === IDLE) {
    checkinLeft = lastWasCheckin
      ? randomBetween(CHECKIN_MIN_INTERVAL_MS, CHECKIN_MAX_INTERVAL_MS)
      : CHECKIN_MIN_IDLE_MS
    checkinCountedTo = now()
  } else {
    lastWasCheckin = info.level === PRIORITY.checkin
  }

  // One-shots and a chain's in and out end by themselves.
  if (info.kind === 'oneshot' || info.phase === 'in' || info.phase === 'out') {
    endTimer = setTimeout(onEnd, (CLIP_SECONDS[clip] ?? 1) * 1000)
  }
  emit()
}

// Plays it unless it's already what she's doing (a loop carries on).
function keep(clip, info) {
  if (cur.clip === clip && !cur.ended) return
  play(clip, info)
}

function playChainOut(name) {
  play(CHAINS[name].out, { kind: 'chain', chain: name, phase: 'out', level: PRIORITY.chain })
}

const outranked = () => Boolean(pending || want.tour || want.breathing)

function onEnd() {
  endTimer = null
  if (cur.kind === 'chain' && cur.phase === 'in') {
    // Straight into the loop (the poses match), unless she's needed for
    // something else by now.
    if (want.chain === cur.chain && !outranked()) {
      play(CHAINS[cur.chain].loop, { kind: 'chain', chain: cur.chain, phase: 'loop', level: PRIORITY.chain }, CHAIN_FADE)
    } else {
      playChainOut(cur.chain)
    }
    return
  }
  // A one-shot or a chain's out has finished.
  cur = { ...cur, ended: true }
  decide()
}

// She's free: play what's waiting, or whatever is still going on.
function decide() {
  if (pending) {
    const next = pending
    pending = null
    play(next.clip, next)
    return
  }
  if (want.tour) {
    if (want.tour.wave) {
      want.tour.wave = false
      play(TOUR_WAVE_CLIP, { kind: 'oneshot', level: PRIORITY.tour })
    } else {
      keep(TOUR_TALK_CLIP, { kind: 'loop', level: PRIORITY.tour })
    }
    return
  }
  if (want.breathing) {
    keep(BREATHE_CLIP, { kind: 'loop', level: PRIORITY.breathing })
    return
  }
  if (want.chain) {
    play(CHAINS[want.chain].in, { kind: 'chain', chain: want.chain, phase: 'in', level: PRIORITY.chain })
    return
  }
  keep(IDLE, { kind: 'idle', level: PRIORITY.idle })
}

// Something changed: move on if she can.
function update() {
  if (cur.kind === 'chain') {
    // An in or out always plays to its end (onEnd takes it from there).
    if (cur.phase !== 'loop') return
    if (want.chain === cur.chain && !outranked()) return
    playChainOut(cur.chain)
    return
  }
  // A one-shot plays to its end unless a request has cut it.
  if (cur.kind === 'oneshot' && !cur.ended) return
  decide()
}

// A one-shot ranked below `level` gives way at once (a crossfade from near
// the rest pose, which every one-shot stays close to).
function cutBelow(level) {
  if (cur.kind === 'oneshot' && !cur.ended && cur.level < level) cur = { ...cur, ended: true }
}

// The chain she's in, or about to start.
const chainGoing = () => (cur.kind === 'chain' ? cur.chain : want.chain)

// ── What the app can ask for ────────────────────────────────────────────

// A mood was just picked.
function react(mood) {
  const clip = reactClipFor(mood)
  if (want.tour || want.breathing) return
  if (cur.clip === clip && !cur.ended) return
  if (pending) return
  const chain = chainGoing()
  if (chain) {
    // Ignored during a chain, except writing on Reflect: she puts the
    // notepad away, reacts, and writes again on the next keystroke.
    if (chain !== 'write') return
    want.chain = null
    pending = { clip, kind: 'oneshot', level: PRIORITY.reaction }
    update()
    return
  }
  // One reaction at a time; a check-in gives way.
  if (cur.kind === 'oneshot' && !cur.ended && cur.level !== PRIORITY.checkin) return
  play(clip, { kind: 'oneshot', level: PRIORITY.reaction })
}

// A step ('step') or a whole task ('task') was just finished.
function complete(what) {
  const clip = what === 'task' ? TASK_COMPLETE_CLIP : STEP_COMPLETE_CLIP
  const info = { clip, kind: 'oneshot', level: PRIORITY.completion }
  if (want.tour || want.breathing) return
  if ((cur.clip === clip && !cur.ended) || pending?.clip === clip) return

  if (cur.kind === 'chain') {
    // After the chain's out. A task outranks a step already waiting.
    if (pending?.clip === TASK_COMPLETE_CLIP) return
    pending = info
    update()
    return
  }
  if (cur.kind === 'oneshot' && !cur.ended) {
    if (cur.level > PRIORITY.completion) return
    // A task finishing outranks the step that's still nodding.
    if (cur.level === PRIORITY.completion && !(clip === TASK_COMPLETE_CLIP && cur.clip === STEP_COMPLETE_CLIP)) return
  }
  play(clip, info)
}

function startChain(name) {
  if (!CHAINS[name] || want.chain === name) return
  want.chain = name
  cutBelow(PRIORITY.chain)
  update()
}

function stopChain(name) {
  if (want.chain !== name) return
  want.chain = null
  update()
}

// The think chain while a promise is waiting on the AI. Several can overlap;
// she stops thinking when the last one is back.
function thinkWhile(promise) {
  thinkCount += 1
  startChain('think')
  Promise.resolve(promise).finally(() => {
    thinkCount -= 1
    if (thinkCount === 0) stopChain('think')
  })
  return promise
}

// The breathing exercise: start at the first "Breathe in", report every
// tick of its clock, stop when it ends or closes.
function startBreathing() {
  want.breathing = { elapsed: 0, at: now() }
  cutBelow(PRIORITY.breathing)
  update()
}

function syncBreathing(elapsedSeconds) {
  if (want.breathing) want.breathing = { elapsed: elapsedSeconds, at: now() }
}

function stopBreathing() {
  if (!want.breathing) return
  want.breathing = null
  update()
}

// Where the breathing clip should be right now: the exercise's own count,
// plus the moments since its last tick (never more than a tick's worth).
export function breathingClipTime() {
  if (!want.breathing) return null
  const since = Math.min((now() - want.breathing.at) / 1000, 1)
  return (want.breathing.elapsed + since) % BREATHE_CYCLE
}

// The onboarding tour ('tour') or a single step shown from Help ('single').
function tourStart(mode = 'tour') {
  want.tour = { mode, wave: mode === 'tour' }
  pending = null
  // Anything below the tour gives way, and so does the end of a previous
  // tour: starting again replaces its "here you go".
  cutBelow(PRIORITY.tour + 1)
  update()
}

// The tour moved to another step. The step introducing Sage waves again;
// if her opening wave is still going, the second follows straight after it.
function tourStep(isSageStep) {
  if (!want.tour || want.tour.mode !== 'tour' || !isSageStep) return
  want.tour.wave = true
  if (cur.clip === TOUR_WAVE_CLIP && !cur.ended) return
  if (cur.clip === TOUR_TALK_CLIP) cur = { ...cur, ended: true }
  update()
}

function tourEnd() {
  if (!want.tour) return
  const wasTour = want.tour.mode === 'tour'
  want.tour = null
  if (wasTour) {
    pending = { clip: TOUR_FINISH_CLIP, kind: 'oneshot', level: PRIORITY.tour }
    if (cur.kind !== 'chain') cur = { ...cur, ended: true }
  } else if (cur.clip === TOUR_TALK_CLIP) {
    cur = { ...cur, ended: true }
  }
  update()
}

// Dev clip tester only: play any clip now, outside the rules. Whatever is
// going on in the app takes over again when it ends.
function debugPlay(clip) {
  pending = null
  if (isLoopClip(clip)) play(clip, { kind: 'loop', level: 99 })
  else play(clip, { kind: 'oneshot', level: 99 })
}

// ── Check-ins ───────────────────────────────────────────────────────────

const modalOpen = () => helpOpen || Boolean(document.querySelector('.overlay.active'))

// Called about once a second by the provider. The countdown only runs while
// she's in plain idle, the tab is visible, nothing is open over the page, and
// a mood has been chosen today; otherwise it holds where it is. It takes off
// the real time since it was last counted, so the first check-in is never
// even a moment sooner than CHECKIN_MIN_IDLE_MS after she settled.
function tickCheckin() {
  const t = now()
  const ms = t - checkinCountedTo
  checkinCountedTo = t
  const plainIdle = cur.clip === IDLE && !want.tour && !want.breathing && !want.chain && !pending
  const mood = getTodayMood()
  const status =
    !plainIdle ? 'busy'
    : document.hidden ? 'tab hidden'
    : modalOpen() ? 'something open'
    : !mood ? 'no mood today'
    : 'counting'
  if (status === 'counting') {
    checkinLeft -= ms
    if (checkinLeft <= 0) {
      checkinStatus = status
      play(checkinClipFor(mood), { kind: 'oneshot', level: PRIORITY.checkin })
      // …and asks, in words, using their name if one is set.
      saySage(checkinLineFor(mood, withName(n => `, ${n}`, '')))
      return
    }
  }
  if (status !== checkinStatus || status === 'counting') {
    checkinStatus = status
    emit()
  }
}

// Started by SageAnimationProvider in the layout; returns the undo.
export function startSageAnimationClock() {
  checkinCountedTo = now()
  const timer = setInterval(tickCheckin, 1000)
  const onHelp = (e) => { helpOpen = Boolean(e.detail) }
  window.addEventListener('sage-help', onHelp)
  return () => {
    clearInterval(timer)
    window.removeEventListener('sage-help', onHelp)
  }
}

// ── For the 3D Sages and the clip tester ────────────────────────────────

export function getSageState() {
  return snapshot()
}

export function subscribeSageState(fn) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

// ── The API ──────────────────────────────────────────────────────────────

export const sageAnimation = {
  react,
  complete,
  startChain,
  stopChain,
  thinkWhile,
  startBreathing,
  syncBreathing,
  stopBreathing,
  tourStart,
  tourStep,
  tourEnd,
  debugPlay,
}

export const SageAnimationContext = createContext(sageAnimation)

// Any component: const sage = useSageAnimation(); sage.react('Good')
// Code outside components (useTasks' helpers) can import sageAnimation.
export function useSageAnimation() {
  return useContext(SageAnimationContext)
}

// The live state, for anything that shows it (the dev clip tester).
export function useSageAnimationState() {
  const [state, setState] = useState(getSageState)
  useEffect(() => subscribeSageState(setState), [])
  return state
}
