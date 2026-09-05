"use client";

import { useEffect, useMemo, useState } from "react";
import { invoiceBatch } from "../lib/invoices";
import { classifyBatch, summarize, STAGES } from "../lib/escalation";
import { getStoredMerchant, signOutMerchant } from "../lib/auth";
import Intro from "./components/Intro";
import SignIn from "./components/SignIn";
import AgentTrace from "./components/AgentTrace";
import RulesPanel from "./components/RulesPanel";
import StageFunnel from "./components/StageFunnel";

const BADGE = {
  [STAGES.GENTLE]: { cls: "gentle", label: "Gentle reminder" },
  [STAGES.FIRM]: { cls: "firm", label: "Firm reminder" },
  [STAGES.FINAL]: { cls: "final", label: "Final notice" },
  [STAGES.HANDOFF]: { cls: "handoff", label: "Human handoff" },
  [STAGES.STOPPED_DISPUTED]: { cls: "stopped", label: "Stopped — disputed" },
  [STAGES.STOPPED_LOW_VALUE]: { cls: "stopped", label: "Stopped — low value" },
};

const ELIGIBLE_FOR_DRAFT = [STAGES.GENTLE, STAGES.FIRM, STAGES.FINAL];

const FILTERS = [
  { key: "all", label: "All" },
  { key: "contacted", label: "Contacted", test: (s) => ELIGIBLE_FOR_DRAFT.includes(s) },
  { key: "handoff", label: "Human handoff", test: (s) => s === STAGES.HANDOFF },
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

export default function Page() {
  const [showIntro, setShowIntro] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);
  const [user, setUser] = useState(null);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    setUser(getStoredMerchant());
    setAuthChecked(true);
  }, []);

  const classified = useMemo(() => classifyBatch(invoiceBatch), []);
  const summary = useMemo(() => summarize(classified), [classified]);
  const visible = useMemo(() => {
    const f = FILTERS.find((f) => f.key === filter);
    return f?.test ? classified.filter((inv) => f.test(inv.stage)) : classified;
  }, [classified, filter]);

  const [tone, setTone] = useState("english");
  const [rowState, setRowState] = useState({});

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
        setRowState((s) => ({ ...s, [inv.id]: { error: data.error || "Failed to generate message." } }));
        return;
      }
      setRowState((s) => ({ ...s, [inv.id]: { text: data.message } }));
    } catch (err) {
      setRowState((s) => ({ ...s, [inv.id]: { error: err.message } }));
    }
  }

  async function draftAllEligible() {
    for (const inv of classified) {
      if (ELIGIBLE_FOR_DRAFT.includes(inv.stage)) {
        await draftMessage(inv);
        await new Promise((r) => setTimeout(r, 50));
      }
    }
  }

  if (showIntro) return <Intro onFinish={() => setShowIntro(false)} />;
  if (!authChecked) return null;
  if (!user) return <SignIn onSignIn={setUser} />;

  const firstName = (user.name || user.email || "Merchant").split(" ")[0];

  return (
    <div className="shell">
      <div className="topbar">
        <div>
          <div className="wordmark">Recover<span>AI</span></div>
          <div className="tagline">
            B2B receivables recovery agent — {firstName}&apos;s demo batch of {classified.length} invoices
          </div>
        </div>
        <div className="topbar-right">
          <div className="tone-toggle">
            <button className={tone === "english" ? "active" : ""} onClick={() => setTone("english")}>English</button>
            <button className={tone === "hinglish" ? "active" : ""} onClick={() => setTone("hinglish")}>Hinglish</button>
          </div>
          <div className="user-chip">
            <span>{firstName}</span>
            <button className="signout-btn" onClick={() => {
              signOutMerchant();
              setUser(null);
            }}>Sign out</button>
          </div>
        </div>
      </div>

      <div className="demo-banner">
        Demo mode: routing and stopping decisions below are deterministic rules (see lib/escalation.js), applied to a
        synthetic invoice batch. &quot;Simulated recovered&quot; uses disclosed, illustrative recovery-rate assumptions
        per stage — it is not live payment data. Only the message wording is generated by an LLM. Sign-in is a
        native RevivePay merchant session, not Firebase.
      </div>

      <div className="stat-row">
        <div className="stat-card">
          <div className="stat-label">Total at-risk value</div>
          <div className="stat-value">{inr(summary.totalAtRisk)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Simulated recovered</div>
          <div className="stat-value good">{inr(summary.totalSimulatedRecovered)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Contacted (automated)</div>
          <div className="stat-value">{summary.contactedCount}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Stopped / handed off</div>
          <div className="stat-value warn">{summary.stoppedCount + summary.handedOffCount}</div>
        </div>
      </div>

      <div className="panel-row">
        <div className="panel">
          <div className="panel-title">Batch breakdown by stage</div>
          <StageFunnel classified={classified} />
        </div>
        <div className="panel">
          <RulesPanel />
        </div>
      </div>

      <div className="actions-row">
        <button className="btn btn-primary" onClick={draftAllEligible}>Run agent on eligible invoices</button>
        <div className="filter-tabs">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              className={`filter-tab ${filter === f.key ? "active" : ""}`}
              onClick={() => setFilter(f.key)}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th>Customer</th>
            <th>Amount</th>
            <th>Days overdue</th>
            <th>Stage</th>
            <th>Why</th>
            <th>Sim. recovered</th>
            <th>Outreach</th>
          </tr>
        </thead>
        <tbody>
          {visible.map((inv) => {
            const badge = BADGE[inv.stage];
            const eligible = ELIGIBLE_FOR_DRAFT.includes(inv.stage);
            const row = rowState[inv.id];
            return (
              <tr key={inv.id}>
                <td>
                  <div className="customer">{inv.customerName}</div>
                  <div className="muted">{inv.id}</div>
                </td>
                <td>{inr(inv.amount)}</td>
                <td>{inv.daysOverdue}</td>
                <td><span className={`badge ${badge.cls}`}>{badge.label}</span></td>
                <td className="muted" style={{ maxWidth: 220 }}>{inv.reason}</td>
                <td className={inv.simulatedRecovered > 0 ? "recovered" : "muted"}>
                  {inv.simulatedRecovered > 0 ? inr(inv.simulatedRecovered) : "—"}
                </td>
                <td>
                  {eligible ? (
                    <>
                      <button className="msg-btn" disabled={row?.tracing || row?.loading} onClick={() => draftMessage(inv)}>
                        {row?.tracing || row?.loading ? "Running…" : row?.text ? "Regenerate" : "Run agent"}
                      </button>
                      {row?.tracing && (
                        <AgentTrace steps={row.traceSteps} onDone={() => afterTrace(inv)} />
                      )}
                      {row?.text && <div className="msg-box">{row.text}</div>}
                      {row?.error && <div className="msg-error">{row.error}</div>}
                    </>
                  ) : (
                    <span className="muted">No automated outreach</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <footer className="note">
        RecoverAI — built for the Razorpay AI Buildathon (Track: AI Revenue Recovery). Routing, stopping criteria,
        and compliance exclusions are deterministic (lib/escalation.js). The LLM (Gemini, called server-side in
        app/api/generate-message) only drafts message wording for invoices the rules engine has already approved
        for contact.
      </footer>
    </div>
  );
}
