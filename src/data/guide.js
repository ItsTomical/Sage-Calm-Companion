// One list drives both the first-run tour and the Help panel, so an
// explanation only ever has to be written once.
//
// id         unique; also how the Help panel asks for a single step
// page       route the step lives on; null means "wherever you are"
// target     matches data-tour="…" on the element; null shows a centred card
// title      short heading, in the Help list and on the card
// body       what Sage says, in her voice: first person, two short sentences
// mobileBody optional; used instead of body on phones, where things are in
//            different places (tab bar, header, collapsed lists)
// empty      optional { body, mobileBody }: the words instead, when nothing
//            has been added yet (the first-run tour on an empty dashboard)
// also       more targets lit up together with `target`, as one spotlight
// help       set false to keep a step out of the Help panel (tour-only)
// showIf     tour only: decided when the tour starts, from what's saved, so
//            the counter only counts steps this person will actually see
// optional   the tour quietly skips it if the element never appears
// missing    shown under the body when the element isn't on screen
// placement  preferred side for the card: 'right' | 'left' | 'top' | 'bottom'
//
// The tour itself is TOUR_ORDER at the bottom: the main loop, in order.
// Everything else here is in the Help panel only.

export const GUIDE_PAGES = [
  { path: null, label: "Everywhere" },
  { path: "/dashboard", label: "Dashboard" },
  { path: "/tasks", label: "Tasks" },
  { path: "/focus", label: "Focus" },
  { path: "/reflect", label: "Reflect" },
  { path: "/progress", label: "Progress" },
];

export const GUIDE_STEPS = [
  // ── Dashboard ──
  {
    id: "welcome",
    page: "/dashboard",
    target: null,
    title: "Hello, I’m Sage",
    body: "I’ll show you around. It only takes a minute, and you can skip at any time.",
    help: false,
  },
  {
    id: "next-step",
    page: "/dashboard",
    target: "next-step",
    title: "Your next step",
    body: "This is the one thing to do next, so there’s nothing else to hold in your head. Press Start Now to begin, or “Not ready?” for a short box-breathing exercise with me or a smaller step.",
    empty: {
      body: "Once you’ve added a task, your next step will appear here, so there’s only one thing to hold in your head. If you’re feeling overwhelmed, “Take a breath first” starts a short box-breathing exercise with me, any time.",
    },
  },
  {
    id: "take-a-breath",
    page: "/dashboard",
    target: "next-step",
    title: "Take a breath",
    body: "There’s a box-breathing exercise on your next-step card: “Take a breath first” before you have a task, and under “Not ready?” once you do. Pick 1, 2 or 3 minutes, press Begin, and breathe in, hold, out and hold for 4 seconds each while I breathe with you.",
  },
  {
    id: "task-progress",
    page: "/dashboard",
    target: "task-progress",
    title: "Task progress",
    body: "Every step of your active task, and how far you’ve come. Tap a number to mark it done, or a step to work on it next.",
    missing: "This appears once you have an active task.",
  },
  {
    id: "today-tasks",
    page: "/dashboard",
    target: "today-tasks",
    // On tablets and phones "Add a task" is its own row under the Today box,
    // so it's lit up with it. On desktop it's inside the box, so the
    // spotlight is the box alone.
    also: ["add-task"],
    title: "Today",
    body: "Your tasks live here. Tap one to make it the task we work on together, or press “Add a task” at the top to start a new one.",
    mobileBody:
      "Your tasks live here. Tap Today to open the list and pick one, or tap “Add a task” just below to start a new one.",
    empty: {
      body: "Press “Add a task” to tell me about something you’ve been putting off. Your tasks will live here, and you can pick one to work on together.",
      mobileBody:
        "Tap “Add a task” just below to tell me about something you’ve been putting off. Your tasks will live here, under Today.",
    },
    placement: "right",
  },
  {
    id: "add-task",
    page: "/dashboard",
    target: "add-task",
    title: "Add a task",
    body: "The quickest way to tell me about something new. I’ll take you to Tasks to break it down.",
  },
  {
    id: "mood",
    page: "/dashboard",
    target: "mood",
    title: "How you’re feeling",
    body: "Let me know how today feels, and I’ll react to it. Now and then I’ll check in to see how you’re doing.",
    mobileBody:
      "Tap here to let me know how today feels, and I’ll react to it. Now and then I’ll check in to see how you’re doing.",
    placement: "left",
  },
  {
    id: "streak",
    page: "/dashboard",
    target: "streak",
    title: "Your streak",
    body: "Each day you finish a step adds to your streak. The dots show which of the last seven days you managed, with your personal best underneath.",
    placement: "left",
  },
  {
    id: "focus-today",
    page: "/dashboard",
    target: "focus-today",
    title: "Focus today",
    body: "The time you’ve spent in focus sessions today. The bars show the last seven days, with today in the darker green.",
    placement: "left",
  },
  {
    id: "nudge",
    page: "/dashboard",
    target: "nudge",
    title: "From Sage",
    body: "A small nudge from me, and now and then a quote. It changes with your mood and progress, and “Another” shows you a different one.",
    placement: "left",
  },

  // ── Everywhere ──
  {
    id: "streak-pill",
    page: null,
    target: "streak-pill",
    title: "Streak at a glance",
    body: "Your streak also follows you up here on every page, so you can see it without coming back.",
    placement: "bottom",
  },
  {
    id: "sage",
    page: null,
    target: "sage",
    title: "That’s me",
    body: "I’ll stay nearby and cheer you on. Drag me to any corner that suits you.",
    mobileBody:
      "I’ll sit down here and cheer you on. Drag me left or right if I’m ever in your way.",
    missing: "I’m hidden right now. Turn me back on in Profile & Settings.",
  },
  {
    id: "profile",
    page: null,
    target: "profile",
    title: "Profile & Settings",
    body: "Tell me your name, hide or show me, or clear everything saved in this browser.",
    placement: "right",
  },
  {
    id: "make-me-yours",
    page: null,
    target: "profile",
    title: "Make me yours",
    body: "Tell me your name in Profile & Settings and I’ll use it when I talk to you. You can switch me off there too, if you’d rather work on your own.",
    mobileBody:
      "Tap here to tell me your name, and I’ll use it when I talk to you. You can switch me off there too, if you’d rather work on your own.",
    help: false,
    placement: "right",
  },

  // ── Tasks ──
  {
    id: "nav-tasks",
    page: "/dashboard",
    target: "nav-tasks",
    title: "On to Tasks",
    body: "Next, let’s look at where tasks get broken down.",
    mobileBody: "Next, let’s look at Tasks, down here in the tab bar.",
    help: false,
    placement: "right",
  },
  {
    id: "task-input",
    page: "/tasks",
    target: "task-input",
    title: "Break it down",
    body: "Describe something you’ve been putting off, in your own words. I’ll turn it into small, doable steps.",
    // The box only shows on Tasks while there's no task with steps to show.
    showIf: ({ hasPlan }) => !hasPlan,
    optional: true,
    missing: "Press “Add a task” at the top of My Tasks to open this.",
  },
  {
    id: "task-list",
    page: "/tasks",
    target: "task-list",
    title: "My Tasks",
    body: "All your tasks are here, the same list as on your dashboard. Pick one to see its steps, or press “Add a task” at the top to start a new one.",
    mobileBody:
      "All your tasks are here, the same list as on your dashboard. Tap My Tasks to open it and pick one, or tap “Add a task” to start a new one.",
    placement: "right",
  },
  {
    id: "work-log",
    page: "/tasks",
    target: "work-log",
    title: "Work notes & distractions",
    body: "What you wrote and logged while working on each step, kept beside it. Tap a step’s square to read it all.",
    missing: "This appears once you’ve opened a task with steps.",
  },
  {
    id: "sage-banner",
    page: "/tasks",
    target: "sage-banner",
    title: "A word from me",
    body: "I leave a little encouragement here whenever I break something down for you.",
  },
  {
    id: "steps-card",
    page: "/tasks",
    target: "steps-card",
    title: "Steps",
    body: "Tap a step’s number when it’s done. Each step can be edited or started straight away in Focus, and bigger ones can be broken down further.",
    missing: "This appears once you’ve added a task.",
  },
  {
    id: "brief",
    page: "/tasks",
    target: "brief",
    title: "Original brief",
    body: "What you first told me. Tap it to edit, and I’ll break the task down again.",
    missing: "This appears once you’ve added a task.",
  },

  // ── Focus ──
  {
    id: "nav-focus",
    page: "/tasks",
    target: "nav-focus",
    title: "On to Focus",
    body: "When you’re ready to work on a step, Focus is where we do it together.",
    mobileBody:
      "When you’re ready to work on a step, Focus is where we do it together. It’s in the tab bar too.",
    help: false,
    placement: "right",
  },
  {
    id: "focus-context",
    page: "/focus",
    target: "focus-context",
    title: "Focusing on",
    body: "The step you’re working on right now, and the task it belongs to.",
    placement: "right",
  },
  {
    id: "step-progress",
    page: "/focus",
    target: "step-progress",
    title: "Step progress",
    body: "One dot per step: done, in progress, and still to come.",
    missing: "This appears once your active task has steps.",
    placement: "right",
  },
  {
    id: "timer-settings",
    page: "/focus",
    target: "timer-settings",
    title: "Timer length",
    body: "I size the timer to the step: one session for a short step, 25-minute rounds with breaks for a longer one. Change the length or the break here.",
    placement: "right",
  },
  {
    id: "focus-timer",
    page: "/focus",
    target: "timer",
    also: ["timer-controls"],
    title: "The timer",
    body: "I size the timer to the step, and longer steps run in 25-minute rounds with breaks between. Start, pause or reset it whenever you like, and press Done when the step is finished, even if time isn’t up.",
    help: false,
  },
  {
    id: "timer",
    page: "/focus",
    target: "timer",
    title: "The timer",
    body: "The ring shows the time left. Longer steps run in rounds, with a short break between each and a longer one after every fourth.",
  },
  {
    id: "timer-controls",
    page: "/focus",
    target: "timer-controls",
    title: "Start, reset, done",
    body: "Start whenever you’re ready, and pause or reset any time. Press Done when the step is finished, even if the timer isn’t. When time’s up, you can take a little longer.",
  },
  {
    id: "work-notes",
    page: "/focus",
    target: "work-notes",
    title: "Your work",
    body: "Once the timer starts, this is where you do the step. Everything you write is saved with it as you go.",
    missing: "This appears once you start the timer on a step.",
  },
  {
    id: "up-next",
    page: "/focus",
    target: "up-next",
    title: "Up next",
    body: "A peek at the step after this one, so you know what’s coming.",
    missing: "This appears when there’s another step after the current one.",
  },
  {
    id: "distraction-log",
    page: "/focus",
    target: "distraction-log",
    title: "Distraction log",
    body: "If something pops into your head, jot it down here. I’ll keep it with this step, so you can stay with the work and find it later on the Tasks page.",
    missing: "On a phone or tablet, this appears once you start the timer.",
    placement: "left",
  },

  // ── Reflect ──
  {
    id: "nav-reflect",
    page: "/focus",
    target: "nav-reflect",
    title: "On to Reflect",
    body: "At the end of the day, Reflect is a quiet place to check in.",
    help: false,
    placement: "right",
  },
  {
    id: "reflection-form",
    page: "/reflect",
    target: "reflection-form",
    title: "Today’s reflection",
    body: "Pick how you feel, add a thought if you like, and save. A sentence is plenty.",
  },
  {
    id: "prompts",
    page: "/reflect",
    target: "prompts",
    title: "Prompts",
    body: "Not sure what to write? Tap a prompt and it becomes the question above your note. They change with the mood you pick.",
    placement: "left",
  },
  {
    id: "reflection-streak",
    page: "/reflect",
    target: "reflection-streak",
    title: "Reflection streak",
    body: "How many days in a row you’ve reflected.",
    placement: "right",
  },
  {
    id: "week-moods",
    page: "/reflect",
    target: "week-moods",
    title: "This week’s moods",
    body: "The moods you’ve saved over the last seven days, so you can see how it’s been going.",
    placement: "right",
  },
  {
    id: "reflection-history",
    page: "/reflect",
    target: "reflection-history",
    title: "Past reflections",
    body: "Everything you’ve written. You can edit or remove any entry.",
  },
  {
    id: "sage-insight",
    page: "/reflect",
    target: "sage-insight",
    title: "Sage insight",
    body: "A few words from me about your reflection habit.",
    missing: "This appears once you’ve reflected today.",
    placement: "left",
  },

  // ── Progress ──
  {
    id: "nav-progress",
    page: "/reflect",
    target: "nav-progress",
    title: "On to Progress",
    body: "Last stop: a look at how far you’ve come.",
    help: false,
    placement: "right",
  },
  {
    id: "progress-overview",
    page: "/progress",
    target: "stat-cards",
    title: "Your progress",
    body: "Your streak, tasks finished and this week’s focus time are all here. Badges mark small milestones along the way, and there’s no rush to collect them.",
    help: false,
  },
  {
    id: "stat-cards",
    page: "/progress",
    target: "stat-cards",
    title: "Your numbers",
    body: "Your streak, tasks finished and this week’s focus time, all in one place.",
  },
  {
    id: "xp",
    page: "/progress",
    target: "xp",
    title: "Level & XP",
    body: "Finishing steps and tasks, time in focus and saved reflections all earn XP. It’s a gentle way to see effort add up.",
    placement: "right",
  },
  {
    id: "week-chart",
    page: "/progress",
    target: "week-chart",
    title: "Focus time this week",
    body: "Your focus time for each day this week, Monday to Sunday.",
  },
  {
    id: "activity-grid",
    page: "/progress",
    target: "activity-grid",
    title: "Activity",
    body: "A calendar of your activity: the darker a day, the more you got done. Use the arrows to look back at earlier months.",
  },
  {
    id: "badges",
    page: "/progress",
    target: "badges",
    title: "Badges",
    body: "Small milestones to collect along the way. No rush.",
    placement: "left",
  },
  {
    id: "milestones",
    page: "/progress",
    target: "milestones",
    title: "Milestones",
    body: "How close you are to the next few milestones.",
    placement: "left",
  },

  // ── Last tour stop ──
  {
    id: "help",
    page: null,
    target: "help",
    title: "Whenever you need me",
    body: "That’s everything. If you ever want a reminder, it’s all in here, and you can replay this tour too.",
    mobileBody:
      "That’s everything. If you ever want a reminder, tap the question mark up here, and you can replay this tour too.",
    help: false,
    placement: "right",
  },
];

// The first-run tour: the main loop, from meeting Sage to seeing progress.
const TOUR_ORDER = [
  "welcome",
  "sage",
  "mood",
  "next-step",
  "today-tasks",
  "nav-tasks",
  "task-input",
  "task-list",
  "nav-focus",
  "focus-timer",
  "distraction-log",
  "nav-reflect",
  "reflection-form",
  "nav-progress",
  "progress-overview",
  "make-me-yours",
  "help",
];

export const TOUR_STEPS = TOUR_ORDER.map((id) =>
  GUIDE_STEPS.find((s) => s.id === id),
);

// The tour as this person will see it. `ctx` is worked out from what's saved
// when the tour starts (see Guide.jsx).
// `ctx` is { hasTasks, hasPlan }.
export function tourStepsFor(ctx) {
  return TOUR_STEPS.filter((s) => !s.showIf || s.showIf(ctx));
}
