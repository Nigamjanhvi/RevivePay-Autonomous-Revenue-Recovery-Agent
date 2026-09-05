"use client";

import { useEffect, useMemo, useState } from "react";
import { invoiceBatch } from "../lib/invoices";
import { classifyBatch, summarize, STAGES } from "../lib/escalation";
import { getStoredMerchant, signOutMerchant } from "../lib/auth";
import Intro from "./components/Intro";
import SignIn from "./components/SignIn";
import AgentTrace from "./components/AgentTrace";

const BADGE = {
  [STAGES.GENTLE]: { cls: "gentle", label: "Gentle reminder" },
  [STAGES.FIRM]: { cls: "firm", label: "Firm reminder" },
  [STAGES.FINAL]: { cls: "final", label: "Final notice" },
  [STAGES.HANDOFF]: { cls: "handoff", label: "Human handoff" },
  [STAGES.STOPPED_DISPUTED]: { cls: "stopped", label: "Stopped — disputed" },
  [STAGES.STOPPED_LOW_VALUE]: { cls: "stopped", label: "Stopped — low value" },
};

const ELIGIBLE_FOR_DRAFT = [STAGES.GENTLE, STAGES.FIRM, STAGES.FINAL];

const NAV_ITEMS = [
  { key: "overview", label: "Overview", icon: "overview" },
  { key: "queue", label: "Recovery Queue", icon: "queue" },
  { key: "agent", label: "Agent Control", icon: "agent" },
  { key: "customers", label: "Customers", icon: "customers" },
  { key: "analytics", label: "Analytics", icon: "analytics" },
  { key: "audit", label: "Audit Trail", icon: "audit" },
  { key: "safety", label: "Safety", icon: "safety" },
];

const FILTERS = [
  { key: "all", label: "All" },
  { key: "contacted", label: "At risk", test: (s) => ELIGIBLE_FOR_DRAFT.includes(s) },
  { key: "handoff", label: "Human review", test: (s) => s === STAGES.HANDOFF },
  { key: "stopped", label: "Stopped", test: (s) => s === STAGES.STOPPED_DISPUTED || s === STAGES.STOPPED_LOW_VALUE },
];

function inr(n) {
  return "₹" + n.toLocaleString("en-IN");
}

function traceStepsFor(inv) {
  const steps = [
    { label: "Checking dispute status", detail: inv.disputed ? "Flagged as disputed." : "No dispute on file." },
    { label: "Checking value threshold", detail: `₹${inv.amount.toLocaleString("en-IN")} vs ₹500 minimum.` },
    { label: "Checking prior attempts", detail: `${inv.previousAttempts} automated attempt(s) so far.` },
    { label: "Determining escalation stage", detail: BADGE[inv.stage].label },
  ];
  if (ELIGIBLE_FOR_DRAFT.includes(inv.stage)) {
    steps.push({ label: "Drafting message with Gemini", detail: null });
  }
  return steps;
}

const stageSequence = [
  "Detected",
  "Analyzing",
  "Diagnosed",
  "Recommendation",
  "Policy Check",
  "Action",
  "Verifying",
  "Recovered",
];

export default function Page() {
  const [showIntro, setShowIntro] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);
  const [user, setUser] = useState(null);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState("INV-1001");
  const [tone, setTone] = useState("english");
  const [rowState, setRowState] = useState({});

  useEffect(() => {
    setUser(getStoredMerchant());
    setAuthChecked(true);
  }, []);

  const classified = useMemo(() => classifyBatch(invoiceBatch), []);
  const summary = useMemo(() => summarize(classified), [classified]);

  const visible = useMemo(() => {
    const f = FILTERS.find((f) => f.key === filter);
    return classified.filter((inv) => {
      const matchesFilter = !f || !f.test || f.test(inv.stage);
      const matchesSearch =
        !search ||
        inv.customerName.toLowerCase().includes(search.toLowerCase()) ||
        inv.id.toLowerCase().includes(search.toLowerCase()) ||
        inv.failureReason.toLowerCase().includes(search.toLowerCase());
      return matchesFilter && matchesSearch;
    });
  }, [classified, filter, search]);

  const selectedCase = useMemo(() => {
    return visible.find((inv) => inv.id === selectedId) || classified.find((inv) => inv.id === selectedId) || classified[0];
  }, [visible, classified, selectedId]);

  const recoveredCases = useMemo(
    () => classified.filter((inv) => inv.simulatedRecovered > 0).slice(0, 4),
    [classified]
  );

  const insightCards = useMemo(() => {
    const topOpportunity = [...classified].sort((a, b) => b.simulatedRecovered - a.simulatedRecovered)[0];
    const highProbability = classified.filter((inv) => inv.simulatedRecovered >= 30000).length;
    const humanReview = classified.filter((inv) => inv.stage === STAGES.HANDOFF || inv.stage === STAGES.FINAL).length;
    const commonFailure = Object.entries(
      classified.reduce((acc, inv) => {
        acc[inv.failureReason] = (acc[inv.failureReason] || 0) + 1;
        return acc;
      }, {})
    ).sort((a, b) => b[1] - a[1])[0];

    return [
      {
        title: "High recovery opportunities",
        text: `${highProbability} invoices have strong recovery probability.`,
        rail: "opportunity",
      },
      {
        title: "Best performing action",
        text: `Payment links are the strongest next action for ${topOpportunity.customerName}.`,
        rail: "action",
      },
      {
        title: "Risk alert",
        text: `${humanReview} high-value cases need human review or policy checks.`,
        rail: "risk",
      },
      {
        title: "Failure pattern",
        text: `${commonFailure[0].replace(/_/g, " ")} is the most common failure type.`,
        rail: "pattern",
      },
    ];
  }, [classified]);

  const agentTimeline = useMemo(
    () => [
      { time: "10:42:31", text: "Payment failure detected", caseId: "INV-1006" },
      { time: "10:42:32", text: "Customer context retrieved", caseId: "INV-1006" },
      { time: "10:42:33", text: `AI diagnosis completed · ${selectedCase.failureReason.replace(/_/g, " ")} · Recovery probability ${Math.max(72, Math.round((selectedCase.simulatedRecovered / selectedCase.amount) * 100))}%`, caseId: selectedCase.id },
      { time: "10:42:34", text: "Policy gate passed", caseId: selectedCase.id },
      { time: "10:42:35", text: "Payment link generated", caseId: selectedCase.id },
      { time: "10:42:36", text: "Awaiting payment confirmation", caseId: selectedCase.id },
    ],
    [selectedCase]
  );

  const auditRows = useMemo(
    () => [
      { time: "14:02:31", actor: "RevivePay Agent", event: "payment.failed", caseId: "INV-1001", decision: "Bank timeout", policy: "PASSED", action: "Payment link", result: "Pending" },
      { time: "14:07:09", actor: "RevivePay Agent", event: "customer.context", caseId: "INV-1002", decision: "Insufficient funds", policy: "PASSED", action: "Reminder + retry", result: "Queued" },
      { time: "14:12:18", actor: "Policy Engine", event: "policy.check", caseId: "INV-1003", decision: "Recovery eligible", policy: "APPROVED", action: "Payment link", result: "Approved" },
      { time: "14:28:54", actor: "Merchant", event: "manual.review", caseId: "INV-1006", decision: "High-risk account", policy: "HOLD", action: "Escalate to human", result: "Reviewed" },
    ],
    []
  );

  async function draftMessage(inv) {
    const steps = traceStepsFor(inv);
    setRowState((s) => ({ ...s, [inv.id]: { tracing: true, traceSteps: steps } }));
  }

  async function afterTrace(inv) {
    if (!ELIGIBLE_FOR_DRAFT.includes(inv.stage)) {
      setRowState((s) => ({ ...s, [inv.id]: { ...s[inv.id], tracing: false } }));
      return;
    }
    setRowState((s) => ({ ...s, [inv.id]: { ...s[inv.id], tracing: false, loading: true } }));
    try {
      const res = await fetch("/api/generate-message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: inv.customerName,
          amount: inv.amount,
          daysOverdue: inv.daysOverdue,
          stage: inv.stage,
          tone,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setRowState((s) => ({ ...s, [inv.id]: { error: data.error || "The AI recovery engine couldn’t complete this analysis." } }));
        return;
      }
      setRowState((s) => ({ ...s, [inv.id]: { text: data.message } }));
    } catch (err) {
      setRowState((s) => ({ ...s, [inv.id]: { error: "AI analysis temporarily unavailable. The case remains safely paused and no automated action was executed." } }));
    }
  }

  async function draftAllEligible() {
    for (const inv of classified) {
      if (ELIGIBLE_FOR_DRAFT.includes(inv.stage)) {
        await draftMessage(inv);
        await new Promise((r) => setTimeout(r, 50));
        await afterTrace(inv);
      }
    }
  }

  if (showIntro) return <Intro onFinish={() => setShowIntro(false)} />;
  if (!authChecked) return null;
  if (!user) return <SignIn onSignIn={setUser} />;

  const firstName = (user.name || user.email || "Merchant").split(" ")[0];
  const selectedBadge = BADGE[selectedCase.stage];

  return (
    <div className="revivepay-shell">
      <aside className="sidebar">
        <div className="sidebar-top">
          <div className="brand-lockup compact" aria-label="RevivePay logo">
            <span className="brand-mark" aria-hidden="true">
              <svg viewBox="0 0 48 48" role="img">
                <circle cx="24" cy="24" r="20" fill="rgba(47,111,237,0.12)" stroke="rgba(47,111,237,0.28)" />
                <path d="M14 26c2.8-7.8 7.6-11.8 13.3-11.8 3.7 0 6.7 1.2 9 3.6" fill="none" stroke="#2f6fed" strokeWidth="2.4" strokeLinecap="round" />
                <path d="M31 17l5.2 2.4-1.6 5.1" fill="none" stroke="#2f6fed" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M34 31.5c-2.8 7.7-7.6 11.7-13.3 11.7-3.7 0-6.7-1.2-9-3.6" fill="none" stroke="#14264a" strokeWidth="2.4" strokeLinecap="round" />
                <path d="M17 31l-5.2-2.4 1.6-5.1" fill="none" stroke="#14264a" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            <span className="brand-text small">
              Revive<span>Pay</span>
            </span>
          </div>
        </div>

        <nav className="sidebar-nav" aria-label="Main navigation">
          {NAV_ITEMS.map((item) => (
            <button key={item.key} className={`nav-item ${item.key === "overview" ? "active" : ""}`} type="button">
              <span className="nav-icon" aria-hidden="true">
                <NavIcon kind={item.icon} />
              </span>
              {item.label}
            </button>
          ))}
        </nav>

        <div className="agent-badge-card">
          <div className="caption-row">
            <span className="status-dot online" />
            <span>AI Agent Status</span>
          </div>
          <div className="status-text">● Online</div>
          <div className="status-meta">Monitoring {summary.contactedCount + summary.handedOffCount} active cases</div>
        </div>

        <div className="sidebar-footer">
          <button type="button" className="ghost-link">Settings</button>
          <button type="button" className="ghost-link">Help</button>
          <button type="button" className="ghost-link" onClick={() => { signOutMerchant(); setUser(null); }}>Profile</button>
        </div>
      </aside>

      <main className="main-panel">
        <header className="topbar-panel">
          <div className="searchbar-wrap">
            <SearchIcon />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search invoices, customers, or ask RevivePay..."
              aria-label="Search recovery cases"
            />
          </div>

          <div className="topbar-actions">
            <button type="button" className="chip-button">● Demo Mode</button>
            <button type="button" className="icon-button" aria-label="Notifications">
              <BellIcon />
              <span className="notification-badge">3</span>
            </button>
            <div className="profile-pill">
              <div className="profile-avatar">{firstName.slice(0, 1).toUpperCase()}</div>
              <div>
                <strong>{firstName}</strong>
                <small>Merchant</small>
              </div>
            </div>
          </div>
        </header>

        <section className="welcome-row">
          <div>
            <p className="eyebrow-light">AI AGENT ONLINE</p>
            <h1>Good evening, {firstName}</h1>
            <p className="muted-prose">
              Your AI recovery agent is actively working across your revenue pipeline.
            </p>
          </div>

          <div className="header-actions">
            <span className="agent-online-pill"><span className="status-dot online" /> Agent Online</span>
            <button type="button" className="primary-soft-button">View Agent</button>
            <button type="button" className="secondary-soft-button">Last 30 days ▾</button>
          </div>
        </section>

        <section className="metrics-grid">
          <div className="metric-card accent">
            <div className="metric-topline">
              <span className="metric-label">Revenue at Risk</span>
              <span className="metric-trend up">↑ 12.4%</span>
            </div>
            <div className="metric-value">{inr(summary.totalAtRisk)}</div>
            <div className="metric-foot">Across {classified.length} active recovery cases</div>
          </div>

          <div className="metric-card">
            <div className="metric-topline">
              <span className="metric-label">Potentially Recoverable</span>
              <span className="metric-trend up">+ Recovery</span>
            </div>
            <div className="metric-value">{inr(summary.totalSimulatedRecovered)}</div>
            <div className="metric-foot">Based on the existing demo simulation model</div>
          </div>

          <div className="metric-card">
            <div className="metric-topline">
              <span className="metric-label">Recovered Revenue</span>
              <span className="metric-trend up">Live</span>
            </div>
            <div className="metric-value">{inr(Math.round(summary.totalSimulatedRecovered * 0.65))}</div>
            <div className="metric-foot">Verified in simulated recovery flow</div>
          </div>

          <div className="metric-card">
            <div className="metric-topline">
              <span className="metric-label">Recovery Rate</span>
              <span className="metric-trend up">+ trend</span>
            </div>
            <div className="metric-value">{(summary.totalSimulatedRecovered / Math.max(summary.totalAtRisk, 1) * 100).toFixed(1)}%</div>
            <div className="metric-foot">Across the current invoice batch</div>
          </div>

          <div className="metric-card">
            <div className="metric-topline">
              <span className="metric-label">Active Cases</span>
              <span className="metric-trend neutral">Monitoring</span>
            </div>
            <div className="metric-value">{summary.contactedCount + summary.handedOffCount}</div>
            <div className="metric-foot">Cases in motion or queued</div>
          </div>

          <div className="metric-card">
            <div className="metric-topline">
              <span className="metric-label">Human Review</span>
              <span className="metric-trend warn">Policy gate</span>
            </div>
            <div className="metric-value">{summary.handedOffCount}</div>
            <div className="metric-foot">Escalation and review cases</div>
          </div>
        </section>

        <section className="main-grid">
          <div className="stack-column">
            <div className="panel-card agent-panel">
              <div className="panel-header room-between">
                <div className="title-group">
                  <span className="sparkle-dot" aria-hidden="true">✦</span>
                  <h3>RevivePay Agent</h3>
                </div>
                <span className="online-pill"><span className="status-dot online" /> Online</span>
              </div>

              <div className="panel-subtitle">Autonomous revenue recovery</div>

              <div className="timeline-panel">
                {agentTimeline.map((event) => (
                  <div className="timeline-row" key={`${event.time}-${event.caseId}`}>
                    <div className="timeline-time">{event.time}</div>
                    <div className="timeline-line"><i className="timeline-dot" /></div>
                    <div className="timeline-copy">
                      <span>{event.text}</span>
                      <small>{event.caseId}</small>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="panel-card">
              <div className="panel-header room-between">
                <div>
                  <h3>Recovery Queue</h3>
                  <small className="subtle-text">Revenue opportunities requiring automated or human action</small>
                </div>
                <div className="filter-pills">
                  {FILTERS.map((f) => (
                    <button
                      key={f.key}
                      type="button"
                      className={`mini-filter ${filter === f.key ? "active" : ""}`}
                      onClick={() => setFilter(f.key)}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="queue-list">
                {visible.map((inv) => {
                  const row = rowState[inv.id];
                  const isSelected = selectedCase.id === inv.id;
                  return (
                    <div key={inv.id} className={`queue-item ${isSelected ? "selected" : ""}`} onClick={() => setSelectedId(inv.id)}>
                      <div className="queue-main">
                        <div className="company-block">
                          <strong>{inv.customerName}</strong>
                          <span>{inv.id}</span>
                        </div>
                        <div className="amount-block">
                          <strong>{inr(inv.amount)}</strong>
                          <span>{inv.daysOverdue} days overdue</span>
                        </div>
                        <div className="signal-block">
                          <span className={`badge ${BADGE[inv.stage].cls}`}>{BADGE[inv.stage].label}</span>
                          <small>{inv.failureReason.replace(/_/g, " ")}</small>
                        </div>
                        <div className="recovery-block">
                          <strong>{inr(inv.simulatedRecovered)}</strong>
                          <span>expected recovery</span>
                        </div>
                      </div>
                      <div className="queue-actions">
                        <button type="button" className="queued-button" onClick={(e) => { e.stopPropagation(); draftMessage(inv); }}>
                          {row?.tracing || row?.loading ? "Running..." : "Open Case"}
                        </button>
                        <button type="button" className="menu-button" aria-label={`More actions for ${inv.id}`}>
                          ⋯
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="stack-column right-stack">
            <div className="panel-card">
              <div className="panel-header">
                <div>
                  <h3>Agent State</h3>
                </div>
              </div>
              <div className="state-rail" aria-label="Recovery state machine">
                {stageSequence.map((state, index) => (
                  <div key={state} className={`state-node ${index <= 5 ? "done" : ""} ${index === 5 ? "active" : ""}`}>
                    <span className="node-dot" />
                    <span>{state}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="panel-card">
              <div className="panel-header room-between">
                <h3>AI decision</h3>
                <button type="button" className="small-link">View audit</button>
              </div>
              <div className="case-header">
                <div>
                  <div className="case-title">{selectedCase.customerName}</div>
                  <div className="case-meta">{selectedCase.id} · {inr(selectedCase.amount)}</div>
                </div>
                <span className={`badge ${selectedBadge.cls}`}>{selectedBadge.label}</span>
              </div>

              <div className="decision-grid">
                <div>
                  <span>Failure</span>
                  <strong>{selectedCase.failureReason.replace(/_/g, " ")}</strong>
                </div>
                <div>
                  <span>Recovery probability</span>
                  <strong>{Math.max(72, Math.round((selectedCase.simulatedRecovered / selectedCase.amount) * 100))}%</strong>
                </div>
                <div>
                  <span>Recommended action</span>
                  <strong>Send payment link</strong>
                </div>
                <div>
                  <span>Expected recovery</span>
                  <strong>{inr(selectedCase.simulatedRecovered)}</strong>
                </div>
              </div>

              <div className="policy-box">
                <div className="policy-header">Policy gate</div>
                <ul>
                  <li>✓ Amount within limit</li>
                  <li>✓ Contact limit not exceeded</li>
                  <li>✓ Customer not opted out</li>
                  <li>✓ No fraud block</li>
                  <li>✓ Expected recovery above cost floor</li>
                </ul>
              </div>

              <div className="case-actions">
                <button type="button" className="primary-soft-button" onClick={() => afterTrace(selectedCase)}>Run Agent</button>
                <button type="button" className="secondary-soft-button">Approve</button>
              </div>
            </div>

            <div className="panel-card insight-panel">
              <div className="panel-header">
                <h3>AI insights</h3>
              </div>
              <div className="insight-list">
                {insightCards.map((card) => (
                  <div key={card.title} className="insight-card">
                    <div className={`insight-rail ${card.rail}`} />
                    <div>
                      <strong>{card.title}</strong>
                      <p>{card.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="bottom-grid">
          <div className="panel-card">
            <div className="panel-header room-between">
              <h3>AI-generated outreach</h3>
              <span className="chip-tag">SIMULATED OUTREACH</span>
            </div>
            <div className="outreach-box">
              {rowState[selectedCase.id]?.text ? (
                <>
                  <p>{rowState[selectedCase.id].text}</p>
                  <div className="outreach-meta">
                    <span>Language: {tone === "hinglish" ? "Hinglish" : "English"}</span>
                    <span>Channel: WhatsApp / Email</span>
                  </div>
                </>
              ) : (
                <>
                  <p>Hi {selectedCase.customerName.split(" ")[0]}, your payment is still pending. We would appreciate a prompt update and a resolution to the outstanding amount.</p>
                  <div className="outreach-meta">
                    <span>Language: {tone === "hinglish" ? "Hinglish" : "English"}</span>
                    <span>Channel: WhatsApp / Email</span>
                  </div>
                </>
              )}
            </div>
            {rowState[selectedCase.id]?.error && (
              <div className="inline-message error-message">{rowState[selectedCase.id].error}</div>
            )}
            {rowState[selectedCase.id]?.tracing && <AgentTrace steps={rowState[selectedCase.id].traceSteps} onDone={() => afterTrace(selectedCase)} />}
          </div>

          <div className="panel-card">
            <div className="panel-header room-between">
              <h3>Safety & controls</h3>
              <button type="button" className="small-link">Policy engine</button>
            </div>
            <div className="control-list">
              <div className="control-row"><span>Maximum automated transaction value</span><strong>₹1,00,000</strong></div>
              <div className="control-row"><span>Maximum contacts per customer</span><strong>3</strong></div>
              <div className="control-row"><span>Minimum AI confidence</span><strong>70%</strong></div>
              <div className="control-row"><span>Expected recovery threshold</span><strong>₹12,000</strong></div>
            </div>
          </div>

          <div className="panel-card">
            <div className="panel-header">
              <h3>Audit trail</h3>
            </div>
            <div className="audit-list">
              {auditRows.map((row) => (
                <div key={`${row.time}-${row.caseId}`} className="audit-item">
                  <div className="audit-time">{row.time}</div>
                  <div className="audit-copy">
                    <strong>{row.actor}</strong>
                    <span>{row.event} · {row.caseId}</span>
                    <small>{row.action} · {row.result}</small>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="6" />
      <path d="M20 20l-4.2-4.2" />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 17h5l-1.4-1.4A2 2 0 0 1 18 14.2V11a6 6 0 1 0-12 0v3.2a2 2 0 0 1-.6 1.4L4 17h5" />
      <path d="M10 20a2 2 0 0 0 4 0" />
    </svg>
  );
}

function NavIcon({ kind }) {
  const shared = { width: 16, height: 16, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.8", strokeLinecap: "round", strokeLinejoin: "round" };
  switch (kind) {
    case "overview":
      return <svg {...shared}><path d="M4 12.5 12 4l8 8.5" /><path d="M5 10.5V19h14v-8.5" /></svg>;
    case "queue":
      return <svg {...shared}><path d="M5 7h14" /><path d="M5 12h14" /><path d="M5 17h10" /></svg>;
    case "agent":
      return <svg {...shared}><path d="M12 3v4" /><path d="M12 17v4" /><path d="M4.9 7.1 7.1 9.3" /><path d="M16.9 14.7l2.2 2.2" /><path d="M3 12h4" /><path d="M17 12h4" /><path d="M4.9 16.9l2.2-2.2" /><path d="M16.9 9.3l2.2-2.2" /><circle cx="12" cy="12" r="3" /></svg>;
    case "customers":
      return <svg {...shared}><path d="M16 19v-1a4 4 0 0 0-8 0v1" /><circle cx="12" cy="8" r="3" /><path d="M20 19v-1a4 4 0 0 0-3-3.87" /><path d="M4 19v-1a4 4 0 0 1 3-3.87" /></svg>;
    case "analytics":
      return <svg {...shared}><path d="M4 18V7" /><path d="M10 18V4" /><path d="M16 18v-9" /><path d="M22 18v-6" /></svg>;
    case "audit":
      return <svg {...shared}><path d="M7 4h10l3 3v12a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z" /><path d="M14 4v4h4" /><path d="M8 13h8" /><path d="M8 17h8" /></svg>;
    case "safety":
      return <svg {...shared}><path d="M12 3 5 6v6c0 4.3 2.8 8.2 7 9 4.2-.8 7-4.7 7-9V6l-7-3Z" /><path d="m9.5 12 1.7 1.7 3.3-3.9" /></svg>;
    default:
      return null;
  }
}
