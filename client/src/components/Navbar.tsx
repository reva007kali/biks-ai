import React from "react";

interface NavbarProps {
  currentStep: number;
  maxStepReached: number;
  canNavigateToStep: (step: number) => boolean;
  onStepClick: (step: number) => void;
  onReset: () => void;
  website: string;
}

const steps = [
  { num: 2, label: "Company Analysis" },
  { num: 3, label: "Leads" },
  { num: 4, label: "Marketing Kit" },
];

export default function Navbar({ currentStep, maxStepReached, canNavigateToStep, onStepClick, onReset, website }: NavbarProps) {
  const domain = website ? website.replace(/^https?:\/\//, "").replace(/\/$/, "") : "";

  return (
    <nav style={{
      display: "grid",
      gridTemplateColumns: "1fr auto 1fr",
      alignItems: "center",
      padding: "18px 32px",
      borderBottom: "1px solid var(--line)",
      background: "var(--bg)",
    }}>
      {/* Logo */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 3, width: 18, height: 18 }}>
          <span style={{ background: "var(--ink)", borderRadius: 1, display: "block" }} />
          <span style={{ background: "var(--ink)", borderRadius: 1, display: "block" }} />
          <span style={{ background: "var(--ink)", borderRadius: 1, display: "block" }} />
          <span style={{ background: "var(--ink)", borderRadius: 1, display: "block" }} />
        </div>
        <span style={{ fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 16, color: "var(--ink)" }}>
          Biks.ai
        </span>
      </div>

      {/* Step indicators */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {steps.map((s, i) => {
          const isDone = currentStep > s.num;
          const isActive = currentStep === s.num;
          const isPending = currentStep < s.num && s.num > maxStepReached;
          const isClickable = canNavigateToStep(s.num);

          return (
            <React.Fragment key={s.num}>
              {i > 0 && <span style={{ color: "var(--line)", fontSize: 12 }}>—</span>}
              <div
                onClick={() => { if (isClickable) onStepClick(s.num); }}
                onMouseEnter={(e) => { if (isClickable && !isActive) e.currentTarget.style.opacity = "0.7"; }}
                onMouseLeave={(e) => { e.currentTarget.style.opacity = isPending ? "0.4" : "1"; }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  cursor: isClickable ? "pointer" : "default",
                  opacity: isPending ? 0.4 : 1,
                  transition: "opacity 0.15s",
                }}
              >
                <span style={{
                  width: 22,
                  height: 22,
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 11,
                  fontWeight: 600,
                  background: isActive ? "var(--action)" : isDone ? "var(--surface-sunk)" : "transparent",
                  color: isActive ? "var(--action-fg)" : isDone ? "var(--ink-3)" : "var(--ink-3)",
                  border: isActive ? "none" : "1px solid var(--line)",
                }}>
                  {isDone ? "✓" : s.num - 1}
                </span>
                <span style={{
                  fontSize: 13,
                  fontWeight: isActive ? 500 : 400,
                  color: isActive ? "var(--ink)" : isDone ? "var(--ink-3)" : "var(--ink-3)",
                }}>
                  {s.label}
                </span>
              </div>
            </React.Fragment>
          );
        })}
      </div>

      {/* Right: domain + reset */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 12 }}>
        {domain && (
          <span style={{ fontSize: 12, color: "var(--ink-3)" }}>{domain}</span>
        )}
        <button
          onClick={onReset}
          style={{
            background: "none",
            border: "none",
            padding: "6px 0",
            fontSize: 13,
            fontWeight: 500,
            color: "var(--ink-3)",
            cursor: "pointer",
            fontFamily: "var(--font-sans)",
          }}
        >
          Reset
        </button>
      </div>
    </nav>
  );
}
