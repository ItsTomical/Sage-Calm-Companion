import { useState, useEffect, useRef, useCallback } from 'react'
import { saySage } from '../components/companion/FloatingSage.jsx'
import { addFocusSeconds } from './useFocusStats.js'
import { withName } from '../utils/userName.js'

const LONG_BREAK_EVERY = 4

// A focus session for one step, Pomodoro-style.
//
//   rounds  How many focus blocks the step needs (Focus works it out from the
//           step's estimate). One round is a single session with no break;
//           more run focus → break → focus…, with a long break after every
//           fourth round.
//
// Phases: 'focus' | 'break' | 'longBreak' | 'finished'. A break starts by
// itself when a focus round ends; the next focus round waits for Start, so
// nothing rushes anyone back to work. After the last round the session is
// 'finished' until they press Done or ask for a little longer (extend).
export function useTimer({ workSeconds = 25 * 60, breakSeconds = 5 * 60, longBreakSeconds = 15 * 60, rounds = 1 } = {}) {
  const [phase, setPhase] = useState('focus')
  const [round, setRound] = useState(1)
  const [block, setBlock] = useState(workSeconds) // length of the current focus block
  const [extended, setExtended] = useState(false) // working past the planned rounds
  const [timeLeft, setTimeLeft] = useState(workSeconds)
  const [running, setRunning] = useState(false)
  const [sessions, setSessions] = useState(0)
  const intervalRef = useRef(null)

  // The interval and the end-of-phase handling read these without
  // re-subscribing every second.
  const live = useRef({})
  live.current = { phase, round, rounds, extended, workSeconds, breakSeconds, longBreakSeconds }

  const stopTicking = useCallback(() => clearInterval(intervalRef.current), [])

  const startTicking = useCallback(() => {
    clearInterval(intervalRef.current)
    intervalRef.current = setInterval(() => {
      if (live.current.phase === 'focus') addFocusSeconds(1)
      setTimeLeft(prev => (prev <= 1 ? 0 : prev - 1))
    }, 1000)
  }, [])

  const start = useCallback(() => { startTicking(); setRunning(true) }, [startTicking])
  const pause = useCallback(() => { stopTicking(); setRunning(false) }, [stopTicking])

  const toggle = useCallback(() => {
    if (live.current.phase === 'finished') return
    if (running) pause()
    else start()
  }, [running, start, pause])

  const reset = useCallback(() => {
    stopTicking()
    setRunning(false)
    setPhase('focus')
    setRound(1)
    setExtended(false)
    setBlock(live.current.workSeconds)
    setTimeLeft(live.current.workSeconds)
  }, [stopTicking])

  // "A little longer" once the planned rounds are done: one more focus block.
  const extend = useCallback((seconds) => {
    setPhase('focus')
    setExtended(true)
    setBlock(seconds)
    setTimeLeft(seconds)
    start()
  }, [start])

  // When the countdown hits zero, move to whatever comes next.
  useEffect(() => {
    if (timeLeft !== 0 || !running) return
    const now = live.current

    if (now.phase === 'focus') {
      setSessions(s => s + 1)
      if (now.extended || now.round >= now.rounds) {
        stopTicking()
        setRunning(false)
        setPhase('finished')
        saySage('That’s the time for this step. Done, or a little longer?')
        return
      }
      const long = now.round % LONG_BREAK_EVERY === 0
      setPhase(long ? 'longBreak' : 'break')
      setTimeLeft(long ? now.longBreakSeconds : now.breakSeconds)
      saySage(long
        ? 'Four rounds done. Take a proper break, you’ve earned it.'
        : 'Nice focus. Take a short break.')
      return
    }

    // A break has ended: set up the next round and wait for Start.
    stopTicking()
    setRunning(false)
    setPhase('focus')
    setRound(now.round + 1)
    setBlock(now.workSeconds)
    setTimeLeft(now.workSeconds)
    saySage(withName(
      n => `Break’s over, ${n}. Ready for round ${now.round + 1} when you are.`,
      `Break’s over. Ready for round ${now.round + 1} when you are.`,
    ))
  }, [timeLeft, running, stopTicking])

  // A new focus length (the setting, or a different step): start that
  // session over from it.
  useEffect(() => {
    if (live.current.phase !== 'focus' && live.current.phase !== 'finished') return
    stopTicking()
    setRunning(false)
    setPhase('focus')
    setRound(1)
    setExtended(false)
    setBlock(workSeconds)
    setTimeLeft(workSeconds)
  }, [workSeconds, stopTicking])

  // A new break length during a break restarts that break from it.
  useEffect(() => {
    if (live.current.phase !== 'break') return
    stopTicking()
    setRunning(false)
    setTimeLeft(breakSeconds)
  }, [breakSeconds, stopTicking])

  useEffect(() => () => clearInterval(intervalRef.current), [])

  const total =
    phase === 'break' ? breakSeconds
    : phase === 'longBreak' ? longBreakSeconds
    : block
  const progress = total > 0 ? timeLeft / total : 0

  return { timeLeft, running, phase, round, extended, sessions, toggle, reset, extend, progress, total }
}
