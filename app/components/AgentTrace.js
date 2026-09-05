"use client";

import { useEffect, useState } from "react";

// Generic "agent is thinking" trace UI — shows the deterministic checks
// running one by one before the LLM drafting step. This is a common pattern
// in agent products generally; nothing here is copied from any specific
// company's UI, copy, or brand assets.

export default function AgentTrace({ steps, onDone }) {
  const [visibleCount, setVisibleCount] = useState(0);

  useEffect(() => {
    if (visibleCount >= steps.length) {
      onDone?.();
      return;
    }
    const t = setTimeout(() => setVisibleCount((c) => c + 1), 450);
    return () => clearTimeout(t);
  }, [visibleCount, steps.length, onDone]);

  return (
    <div className="trace-box">
      {steps.slice(0, visibleCount).map((s, i) => {
        const isLast = i === visibleCount - 1;
        const isRunning = isLast && visibleCount < steps.length;
        return (
          <div className="trace-step" key={i}>
            <span className={`trace-dot ${isRunning ? "running" : "done"}`} />
            <div>
              <div className="trace-label">{s.label}</div>
              {s.detail && <div className="trace-detail">{s.detail}</div>}
            </div>
          </div>
        );
      })}
    </div>
  );
}
