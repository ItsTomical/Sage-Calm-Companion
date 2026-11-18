// The name set in Profile & Settings, for Sage to use at warm moments
// (a mood picked, a step or task finished, a check-in). It stays in this
// browser: it's only ever added to Sage's own lines, never sent to the AI.
const KEY = 'sage-username'

export function getUserName() {
  try {
    return (localStorage.getItem(KEY) || '').trim()
  } catch {
    return ''
  }
}

// The line with their name when there is one, otherwise the plain line.
// Read each time she speaks, so a new name applies at once.
//   withName(n => `Well done, ${n}.`, 'Well done.')
export function withName(named, plain) {
  const name = getUserName()
  return name ? named(name) : plain
}
