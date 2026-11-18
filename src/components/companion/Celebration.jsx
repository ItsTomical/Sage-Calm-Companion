import { useEffect, useState } from "react";
import "./Celebration.css";

// Any component can set this off: celebrate()
export function celebrate() {
  window.dispatchEvent(new CustomEvent("sage-celebrate"));
}

// The app's own palette rather than party colours, so finishing a task feels
// like the rest of Sage rather than a different app interrupting.
const COLOURS = [
  "var(--sage)",
  "var(--sage-light)",
  "var(--blush)",
  "var(--dusty-rose)",
  "var(--warm-amber)",
  "var(--sky-mist)",
  "var(--lavender-mist)",
];

const PIECES = 46;
const LONGEST_FALL = 2500; // keep above the slowest piece below

function makePieces() {
  return Array.from({ length: PIECES }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    colour: COLOURS[i % COLOURS.length],
    delay: Math.random() * 500,
    fall: 1700 + Math.random() * 700,
    drift: (Math.random() - 0.5) * 140,
    spin: (Math.random() - 0.5) * 540,
    size: 6 + Math.random() * 5,
    round: Math.random() < 0.35,
  }));
}

export default function Celebration() {
  const [pieces, setPieces] = useState(null);

  useEffect(() => {
    let timer;

    function onCelebrate() {
      // This app is for people who are already overwhelmed, so a sudden burst
      // of motion is the last thing some of them want. Skip it entirely when
      // the system asks for reduced motion.
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      setPieces(makePieces());
      clearTimeout(timer);
      timer = setTimeout(() => setPieces(null), LONGEST_FALL);
    }

    window.addEventListener("sage-celebrate", onCelebrate);
    return () => {
      window.removeEventListener("sage-celebrate", onCelebrate);
      clearTimeout(timer);
    };
  }, []);

  if (!pieces) return null;

  return (
    <div className="celebration" aria-hidden="true">
      {pieces.map((p) => (
        <span
          key={p.id}
          className={`cf-piece${p.round ? " cf-round" : ""}`}
          style={{
            left: `${p.left}%`,
            width: `${p.size}px`,
            height: `${p.round ? p.size : p.size * 1.6}px`,
            background: p.colour,
            animationDelay: `${p.delay}ms`,
            animationDuration: `${p.fall}ms`,
            "--drift": `${p.drift}px`,
            "--spin": `${p.spin}deg`,
          }}
        />
      ))}
    </div>
  );
}
