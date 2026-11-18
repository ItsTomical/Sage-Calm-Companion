// Shared by every place that breaks tasks or steps down (Tasks, Dashboard),
// so a step looks and is numbered the same however it was made.

// A step as the AI returns it, in the shape the app stores. The index gives
// its number.
export function mapStepForUI(step, index) {
  return {
    id: index + 1,
    title: step.title,
    desc: step.explanation,
    detail: step.explanation,
    time: `${step.estimatedMinutes} min`,
    done: false,
    expandable: step.expandable,
  }
}

// Swap one step for the smaller steps it was broken into, then renumber.
// The first smaller step ends up with the original step's number, so if the
// original was the one being worked on, its first part now is. Any work
// notes and distractions saved on the original go with it, so nothing
// written is lost by breaking a step down.
export function replaceStep(steps, stepId, subSteps) {
  return steps
    .flatMap(s => {
      if (s.id !== stepId) return [s]
      const [first, ...rest] = subSteps
      const carried = {}
      if (s.notes) carried.notes = s.notes
      if (s.distractions?.length) carried.distractions = s.distractions
      return first ? [{ ...first, ...carried }, ...rest] : []
    })
    .map((s, i) => ({ ...s, id: i + 1 }))
}
