// Props that make a non-button element work like a button from the keyboard:
// reachable with Tab, and Enter or Space does the same as a click. For places
// a real <button> can't go, such as a task row with its own buttons inside.
//
//   <div className="task-item" {...clickable(() => onSelect(task))}>
export function clickable(onActivate) {
  return {
    role: 'button',
    tabIndex: 0,
    onClick: onActivate,
    onKeyDown: (e) => {
      // Keys pressed on something inside the row belong to that thing.
      if (e.target !== e.currentTarget) return
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault() // Space would otherwise scroll the column
        onActivate(e)
      }
    },
  }
}
