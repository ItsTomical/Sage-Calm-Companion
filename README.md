# Sage: Calm Companion

An AI web app that helps people stop avoiding tasks and start them.

The user describes a task they have been putting off, whether a single line or a full assignment brief. Sage (the AI) breaks it into a small number of clear, ordered steps with realistic time estimates, shows one step at a time, and supports the user while they work through it. If a step still feels too big, Sage can break that single step down further.

Built for DIGA4004A Creative Practice, Module 4 (Final Iteration), by Thomas Yardley.

## How to run

Requires [Node.js](https://nodejs.org) (v18 or later).

```
npm install
npm run dev
```

Then open http://localhost:5173

**To try it on a phone or tablet:** run `npm run dev -- --host`, then open the "Network" address Vite prints on a device connected to the same Wi-Fi.

## The AI and the API key

The AI runs through [OpenRouter](https://openrouter.ai) on free models, called directly from the browser (this project is deliberately frontend-only, with no backend).

- **The included `.env` file contains a working API key** on OpenRouter's free tier, so the AI works out of the box.
- **Free models share capacity.** If one is busy, the app falls back through a chain of four: three named free models, then OpenRouter's own free router. If all of them fail, Sage shows a calm "try again in a minute" message.
- **Time limits.** Each AI request times out after 20 seconds and moves on to the next model, with a 60-second limit overall. After that, Sage shows a calm "taking longer than usual" message instead of waiting indefinitely.
- **Unreadable replies.** If a model answers but the plan cannot be read, Sage asks once more for a clean reply before giving up gracefully.
- **Where a plan came from is shown.** Plans written by a model are labelled "Planned by Sage (AI)" on the Tasks page.
- **No key? The app still works.** If the key is removed (or set to `placeholder`), breaking down a task or a step returns a built-in sample plan, which is announced as a sample on the Tasks page rather than passed off as Sage's own. Everything else works the same.

To use your own key: create one at openrouter.ai, then set it in `.env`:

```
VITE_OPENROUTER_API_KEY=sk-or-your-key-here
```

## What to try (the primary flow)

1. **Dashboard → "Add a task":** opens the Tasks page ready to type. Describe something you've been avoiding, or paste in a whole brief. (The "Add a task" button on the Tasks page does the same.)
2. **"Break it down":** Sage returns a short title, an encouraging note, and 3–7 steps with time estimates.
3. **Refine the plan:** split a larger step into smaller ones ("Break down"), edit, delete or add steps by hand, or open the Original brief tile to revise your description and "Break it down again".
4. **Start a step:** "Start" on a step, or "Start Now" on the Dashboard, opens the Focus page. The timer is sized to the step: a step of 25 minutes or less is one session of its own length; a longer step runs as 25-minute Pomodoro rounds with short breaks between (and a longer break after every fourth). Focus and break lengths can be adjusted with the sliders. When the time is up you can finish or take a little longer.
5. **Work and notes:** once the timer starts, the Focus page becomes a writing space ("Your work") that saves as you type. Passing thoughts go in the **Distraction log**, saved against the step you are on.
6. **Done:** completes the step, moves to the next one, and counts towards your streak, focus time and progress. Finishing the last step completes the task.
7. **Not ready?** On the Dashboard, "Not ready? Let Sage help" offers **Take a breath first** and **Break it down smaller** (Sage splits the current step without leaving the Dashboard). The breathing exercise is also on the empty next-step card ("Take a breath first") before you have added a task. Choose 1, 2 or 3 minutes and press **Begin**; a short four-second countdown follows, then box breathing (four seconds in, hold, out, hold) with Sage breathing along. "I feel ready" closes it whenever you like.
8. **Review your work:** the Tasks page has a "Work notes & distractions" column. Each step with notes or logged distractions gets a tile that opens a pop-up where the notes can be edited and copied (**Copy**) and distractions removed.
9. **Reflect:** pick a mood, write a note and save it. Past reflections can be edited or deleted.
10. **Progress:** see your XP, level, badges, milestones, this week's focus time and a month-by-month activity calendar. Each badge has its own icon, shown in colour once earned and faded with a lock until then.

Bad input is handled: harmful, nonsensical, or too-vague requests get a gentle clarifying message instead of an invented plan.

## Sage, the companion

- **A 3D figure** that sits beside the page rather than over it: in her own rail down one side of the content on desktop, and in a band along the bottom of the screen on phones and tablets. She speaks in short messages as you work.
- **Fully animated.** She reacts to the mood you pick, thinks while the AI is working, works on a laptop during a focus session and rests during breaks, writes while you reflect, celebrates finished steps and tasks, breathes in time with the breathing exercise, and waves and talks during the tour. If you've been idle for a while, she checks in with a short line that suits today's mood.
- **Uses your name.** Set a display name in Profile & Settings and Sage uses it at warm moments (a finished step or task, a saved reflection, a check-in, the tour's welcome). The name stays on this device and is never sent to the AI. With no name set, her lines read the same without it.
- **Moving her:** drag her to another corner (desktop) or to the left, centre or right of the band (phones and tablets). With the keyboard, focus her and use the arrow keys.
- **Hiding her:** switch off "Show floating Sage" in Profile & Settings.
- **Lighter devices:** on devices that cannot draw 3D, are low on memory, or ask to save data, a lighter, flat version of Sage is shown instead.
- **Animation tester (dev only):** press Ctrl+Shift+S to open a panel that plays each of Sage's 30 clips.

## Guided tour and Help

- **First-run tour:** on the first visit Sage walks through the app, page by page, highlighting each part and explaining it in her own words, with a step counter so you know how far along you are. It only shows the steps that apply to you, and if you have no tasks yet, it ends on the Tasks page ready for your first one. It can be skipped at any time.
- **Help panel:** the "?" button (bottom of the left nav, or the top header on phones) lists explanations for the page you are on, then the rest of the app. Picking one shows just that explanation.
- **Replay tour:** at the top of the Help panel.

## What is saved

Everything is real and stored in this browser's localStorage: tasks, steps and AI breakdowns, step and task completion, the active task and step, work notes and distractions per step, the day streak and personal best, focus time per day, reflections, display name and settings.

The Progress page (XP, level, badges, milestones, weekly focus chart, activity calendar) and the Reflect page (reflection streak, personal best, this week's moods) are calculated from that saved activity each time they open, so they always match what you have actually done. Nothing on either page is sample data.

## Phones, tablets and keyboard

- **Three layouts:** phone (below 640px) with a bottom tab bar, and Help and Profile in the top header; tablet (640–1023px) with an icon sidebar and a single column; desktop (1024px and up) with the full multi-column layout.
- **Keyboard:** everything can be reached with Tab and used with Enter or Space. Esc closes dialogs and the Help panel, and focus returns to whatever opened them.
- **Visible focus ring** whenever you are moving around by keyboard.
- **Reduced motion:** if your device asks for reduced motion, the celebration, the tour's scrolling and other movement are turned off or simplified.

## Resetting the app

Profile & Settings (person icon at the bottom of the left nav, or in the top header on phones) → **Clear all data** permanently deletes everything Sage has saved in this browser (tasks, reflections, streaks, focus time and settings) after a confirmation, and the first-run tour plays again.

## Project structure

- `src/pages/`: one file per page (Dashboard, Tasks, Focus, Reflect, Progress).
- `src/components/<area>/`: parts used by each area: `companion`, `dashboard`, `focus`, `guide`, `layout`, `progress`, `reflect`, `tasks`, and shared `ui` pieces.
- `src/hooks/`: saved state and calculations (tasks, timer, streak, focus time, reflections, progress stats).
- `src/services/aiService.js`: the prompts, the model fallback chain and the sample plan.
- `src/utils/`: small helpers (breakpoints, keyboard support, storage, time formatting, step mapping).
- `src/data/`: fixed content, including the tour and Help text (`guide.js`) and the mood options.
- `src/styles/`: shared colours, spacing and global styles.

Pages and most components have their own CSS file beside them. Any CSS file that changes on smaller screens keeps those rules in a "Small screens" section at the end of the file.

## Known limitations

- **No accounts.** There is no sign-in and no backend.
- **Everything is stored in localStorage.** It does not sync between devices and is lost if the browser's data is cleared.
- **The API key is visible in the browser.** The app is frontend-only, so the OpenRouter key is built into the page and can be read by anyone who opens the browser's developer tools. A real release would call the AI through a small server that keeps the key hidden.
- **Free AI models can be slow or rate-limited**, so a breakdown sometimes takes a while or has to be tried again.

## Credits

Icons from Flaticon (flaticon.com).

- First Step badge (`first-step.png`): Icon by [Magnific](https://www.flaticon.com/authors/magnific) from [Flaticon](https://www.flaticon.com)
- Flow State badge (`flow-state.png`): Icon by [nangicon](https://www.flaticon.com/authors/nangicon) from [Flaticon](https://www.flaticon.com)
- Calm Mind badge (`calm-mind.png`): Icon by [Eucalyp](https://www.flaticon.com/authors/eucalyp) from [Flaticon](https://www.flaticon.com)
- Milestone badge (`milestone.png`): Icon by [Smashicons](https://www.flaticon.com/authors/smashicons) from [Flaticon](https://www.flaticon.com)
- Consistent badge (`consistent.png`): Icon by [Magnific](https://www.flaticon.com/authors/magnific) from [Flaticon](https://www.flaticon.com)
- Flame, streak (`flame.png`): Icon by [C-mo Box](https://www.flaticon.com/authors/c-mo-box) from [Flaticon](https://www.flaticon.com)
- Check (`check.png`): Icon by [Roundicons](https://www.flaticon.com/authors/roundicons) from [Flaticon](https://www.flaticon.com)
- Clock (`clock.png`): Icon by [Magnific](https://www.flaticon.com/authors/magnific) from [Flaticon](https://www.flaticon.com)
- Clipboard (`clipboard.png`): Icon by [Dimitry Miroliubov](https://www.flaticon.com/authors/dimitry-miroliubov) from [Flaticon](https://www.flaticon.com)
- Heart (`heart.png`): Icon by [Kroffle](https://www.flaticon.com/authors/kroffle) from [Flaticon](https://www.flaticon.com)
- Leaf (`leaf.png`, also the logo and favicon): Icon by [Magnific](https://www.flaticon.com/authors/magnific) from [Flaticon](https://www.flaticon.com)
- Lock (`lock.png`): Icon by [Magnific](https://www.flaticon.com/authors/magnific) from [Flaticon](https://www.flaticon.com)
- Mood icons (`moods/low.png`, `meh.png`, `ok.png`, `good.png`, `great.png`): Icon by [Sofyan Rofiq](https://www.flaticon.com/authors/sofyan-rofiq) from [Flaticon](https://www.flaticon.com)
