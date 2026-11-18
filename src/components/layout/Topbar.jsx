import { useState, useEffect } from "react";
import { getTodayLabel } from "../../utils/formatTime.js";
import { useStreak } from "../../hooks/useStreak.js";
import flameIcon from "../../assets/icons/flame.png";
import "./Topbar.css";

export default function Topbar() {
  const { streak } = useStreak();
  const [helpOpen, setHelpOpen] = useState(false);

  // The panel itself lives in the Sidebar; this only mirrors whether it's
  // open, for the phone Help button's aria-expanded.
  useEffect(() => {
    const onHelp = (e) => setHelpOpen(e.detail);
    window.addEventListener("sage-help", onHelp);
    return () => window.removeEventListener("sage-help", onHelp);
  }, []);

  return (
    <header className="topbar">
      <div className="tb-brand">
        <span className="tb-title">Calm Companion</span>
        <span className="tb-date-chip">{getTodayLabel()}</span>
      </div>
      <div className="tb-right">
        <div
          className="streak-pill"
          data-tour="streak-pill"
          aria-label={streak > 0 ? `${streak} day streak` : "Complete a step to start a streak"}
        >
          {streak > 0 ? (
            <>
              <img src={flameIcon} alt="" className="streak-flame" />
              {streak}
              <span className="sp-long"> day streak</span>
            </>
          ) : (
            <>
              <span className="sp-long">Complete a step to start a streak</span>
              <span className="sp-short">Start a streak</span>
            </>
          )}
        </div>

        {/* On phones the sidebar is a tab bar with no room for these, so
            they move up here. Hidden on larger screens (see Topbar.css). */}
        <button
          className="tb-icon tb-phone-only"
          onClick={() => window.dispatchEvent(new CustomEvent("sage-help-toggle"))}
          aria-label="Help"
          aria-expanded={helpOpen}
          aria-controls="help-panel"
          data-help-toggle
          data-tour="help"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-2.9 2.6-2.9 4" />
            <circle cx="12" cy="17.6" r="1.1" fill="currentColor" stroke="none" />
          </svg>
        </button>
        <button
          className="tb-icon tb-phone-only"
          onClick={() => window.dispatchEvent(new CustomEvent("sage-profile-open"))}
          aria-label="Profile & Settings"
          data-tour="profile"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <circle cx="12" cy="8" r="4" />
            <path d="M4 20c0-4 3.58-7 8-7s8 3 8 7" />
          </svg>
        </button>
      </div>
    </header>
  );
}
