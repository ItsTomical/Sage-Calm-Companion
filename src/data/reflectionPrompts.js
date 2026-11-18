// The questions offered on the Reflect page. Someone who has just said they
// feel low shouldn't be met with "What are you proud of?", and someone having
// a great day shouldn't be asked what felt heavy, so each mood gets the same
// kind of list in an order that suits it. Five each, as the column has room for.
const PROMPTS_BY_MOOD = {
  Low: [
    'What felt heavy today?',
    'What’s one small thing that helped?',
    'What do you need right now?',
    'What drained your energy?',
    'What’s one kind thing you could do for yourself?',
  ],
  Meh: [
    'What’s one small thing that helped?',
    'What drained your energy?',
    'What do you need right now?',
    'What went well today?',
    'One thing you’re grateful for?',
  ],
  Ok: [
    'What went well today?',
    'What made you feel proud?',
    'What drained your energy?',
    'What would you do differently?',
    'One thing you’re grateful for?',
  ],
  Good: [
    'What made today good?',
    'What made you feel proud?',
    'What would you like to do again?',
    'What went well today?',
    'One thing you’re grateful for?',
  ],
  Great: [
    'What are you proud of today?',
    'What made today good?',
    'What would you like to do again?',
    'Who or what made you smile today?',
    'One thing you’re grateful for?',
  ],
}

// Before a mood is chosen the general list is shown, the same as for Ok.
export function promptsForMood(moodLabel) {
  return PROMPTS_BY_MOOD[moodLabel] || PROMPTS_BY_MOOD.Ok
}
