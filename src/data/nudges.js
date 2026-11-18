// What Sage's nudge card on the Dashboard says. Mostly nudges, with a quote
// now and then.
//
// The card leads with whatever fits the moment (mood, the size of the next
// step, progress, streak, time of day), then the general tips, with a quote
// after every second one. Everything is worked out from what's already
// saved, nothing new is stored.

// Shown when nothing in particular fits, and after the ones that do.
const TIPS = [
  {
    id: 'tiny-start',
    title: 'Tiny start, big momentum',
    text: 'Starting, even for just 2 minutes, makes it much easier to keep going. You don’t need to feel ready. You just need to begin.',
  },
  {
    id: 'just-look',
    title: 'Just open it',
    text: 'If starting feels heavy, just open the step and read it. Looking is a start too.',
  },
  {
    id: 'one-thing',
    title: 'One thing at a time',
    text: 'Only the next step matters right now. The rest of the list can wait.',
  },
  {
    id: 'park-it',
    title: 'Park the distraction',
    text: 'If something pops into your head while you focus, jot it in the distraction log and come back to it later.',
  },
  {
    id: 'breathe',
    title: 'Reset with a breath',
    text: 'Feeling stuck or scattered? “Not ready? Let Sage help” has a short breathing exercise to settle first.',
  },
]

const QUOTES = [
  'Progress is not perfection. Every small step you take today compounds into the person you’re becoming.',
  'You don’t have to see the whole staircase. Just take the first step.',
  'Small steps every day add up to big changes.',
  'Rest is part of the work, not a break from it.',
  'Done gently is still done.',
  'Be as patient with yourself as you would be with a friend.',
]

function minutesOf(time) {
  const n = parseInt(time, 10)
  return Number.isFinite(n) ? n : null
}

// The nudges that fit right now, most useful first.
function forNow({ mood, task, step, done, total, streak, focusedToday, hour, name }) {
  const out = []
  // The nudges that answer how they're feeling (or that there's nothing to
  // do yet) use their name, if one is set in Settings.
  const to = (title) => (name ? `${title}, ${name}` : title)

  if (!task) {
    out.push({
      id: 'no-task',
      title: to('Start with something small'),
      text: 'Add one task, even a tiny one, and Sage will break it into steps for you.',
    })
  }

  if (mood === 'Low') {
    out.push({
      id: 'mood-low',
      title: to('Go gently today'),
      text: 'On a low day, two minutes counts. Open the next step and just look at it. That’s enough for now.',
    })
  } else if (mood === 'Meh') {
    out.push({
      id: 'mood-meh',
      title: to('Lower the bar'),
      text: 'Aim for “started”, not “finished”. One small step keeps things moving.',
    })
  } else if (mood === 'Good' || mood === 'Great') {
    out.push({
      id: 'mood-up',
      title: to('Use the good energy'),
      text: 'Feeling good is a great time for the step you’ve been putting off.',
    })
  }

  const mins = step ? minutesOf(step.time) : null
  if (mins && mins > 25) {
    out.push({
      id: 'big-step',
      title: 'This is a big step',
      text: `It’s about ${mins} minutes. Try “Not ready? Let Sage help” to break it smaller, or work through it in 25-minute rounds on Focus.`,
    })
  }

  if (task && total > 0 && done > 0 && done < total) {
    out.push({
      id: 'on-your-way',
      title: 'You’re on your way',
      text: `${done} of ${total} steps done. It’s easier to keep going than to start, and you’ve already started.`,
    })
  }

  if (task && streak === 0) {
    out.push({
      id: 'streak-start',
      title: 'Start a streak',
      text: 'Finish one step today and your streak begins. Even a 5-minute one counts.',
    })
  } else if (streak >= 2) {
    out.push({
      id: 'streak-keep',
      title: `${streak} days in a row`,
      text: 'Keep it going with just one step today. Small still counts.',
    })
  }

  if (hour >= 21 || hour < 5) {
    out.push({
      id: 'late',
      title: 'It’s getting late',
      text: 'If you’re tired, pick a short step, or rest and come back tomorrow. Rest counts too.',
    })
  } else if (task && !focusedToday && hour >= 12) {
    out.push({
      id: 'no-focus-yet',
      title: 'A short session?',
      text: 'No focus time yet today. A 10-minute session on the next step is a gentle way in.',
    })
  }

  return out
}

// The whole sequence for the card, in the order "Another" steps through it.
// Quotes rotate by day, so the first one isn't always the same.
export function buildNudges(ctx) {
  const now = forNow(ctx)
  const seen = new Set(now.map(n => n.id))
  const tips = TIPS.filter(t => !seen.has(t.id))
  const day = Math.floor(Date.now() / 86400000)
  const quotes = QUOTES.map((_, i) => QUOTES[(i + day) % QUOTES.length])

  const deck = [...now]
  let q = 0
  tips.forEach((tip, i) => {
    deck.push(tip)
    if (i % 2 === 1 && q < quotes.length) deck.push({ id: `quote-${q}`, quote: quotes[q++] })
  })
  // At least one quote early on, even when lots of nudges fit.
  const early = now.length >= 2
  if (early) deck.splice(2, 0, { id: 'quote-early', quote: quotes[quotes.length - 1] })
  const last = early ? quotes.length - 1 : quotes.length
  while (q < last) deck.push({ id: `quote-${q}`, quote: quotes[q++] })
  return deck
}
