"use client";

import { useState } from "react";

export default function RulesPanel() {
  const [open, setOpen] = useState(false);
  return (
    <div className="rules-panel">
      <button className="rules-toggle" onClick={() => setOpen((o) => !o)}>
        {open ? "Hide" : "Show"} the agent's decision rules
      </button>
      {open && (
        <div className="rules-body">
          <p className="rules-intro">
            These rules run before the LLM is ever called. They decide who gets contacted, at what tone, and when to
            stop — the model only drafts wording afterward.
          </p>
          <ol>
            <li><strong>Disputed invoices</strong> → never contacted automatically. Routed to compliance review.</li>
            <li><strong>Amount below ₹500</strong> → not chased. Cost of outreach exceeds expected recovery.</li>
            <li><strong>3+ automated attempts already made</strong> → handed to a human collections agent, not escalated further by the AI.</li>
            <li><strong>0–7 days overdue</strong> → gentle reminder.</li>
            <li><strong>8–21 days overdue</strong> → firmer reminder, references the earlier contact.</li>
            <li><strong>22–45 days overdue</strong> → final notice before human handoff.</li>
            <li><strong>45+ days overdue</strong> → handed to a human, not chased further by the AI.</li>
          </ol>
          <p className="rules-note">See <code>lib/escalation.js</code> in the repo for the exact implementation.</p>
        </div>
      )}
    </div>
  );
}
