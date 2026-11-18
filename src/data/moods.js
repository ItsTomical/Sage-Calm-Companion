import lowIcon from '../assets/icons/moods/low.png'
import mehIcon from '../assets/icons/moods/meh.png'
import okIcon from '../assets/icons/moods/ok.png'
import goodIcon from '../assets/icons/moods/good.png'
import greatIcon from '../assets/icons/moods/great.png'

// Single shared source for the mood picker used on the Dashboard and Reflect pages.
export const moodOptions = [
  { label: 'Low', icon: lowIcon },
  { label: 'Meh', icon: mehIcon },
  { label: 'Ok', icon: okIcon },
  { label: 'Good', icon: goodIcon },
  { label: 'Great', icon: greatIcon },
]

export function moodIcon(label) {
  return moodOptions.find(m => m.label === label)?.icon
}
