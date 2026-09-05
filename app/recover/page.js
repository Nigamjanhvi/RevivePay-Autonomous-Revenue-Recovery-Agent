"use client";

import { useState } from "react";
import Link from "next/link";
import AppShell from "../components/AppShell";

const EXAMPLES = {
  failed: "Payment of ₹2,499 failed for Rahul Sharma. He tried twice and says he still wants to pay. UPI failed with a timeout.",
  checkout: "Rahul Sharma stopped checkout while trying to pay ₹2,499. He has not completed the payment yet and may need help.",
  overdue: "₹18,000 invoice for Priya Mehta is 12 days overdue. She said she can pay tomorrow.",
};

export default function RecoverPage() {
  const [situation, setSituation] = useState("");
  const [result, setResult] = useState(null);
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");
  const [linkStatus, setLinkStatus] = useState("idle");

  async function analyze(event) {
    event.preventDefault();
    if (!situation.trim()) return;
    setStatus("loading");
    setError("");
    setResult(null);
    try {
      const response = await fetch("/api/recovery/analyze", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ situation }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Unable to analyze this case.");
      setResult(data.case);
      const history = JSON.parse(window.localStorage.getItem("revivepay_history") || "[]");
      window.localStorage.setItem("revivepay_history", JSON.stringify([data.case, ...history.filter((item) => item.id !== data.case.id)]));
      setStatus("ready");
    } catch (analysisError) {
      setError(analysisError.message);
      setStatus("error");
    }
  }

  async function createPaymentLink() {
    if (!result || linkStatus === "loading" || result.paymentLink) return;
    setLinkStatus("loading");
    try {
      const response = await fetch(`/api/recovery/${result.id}/create-payment-link`, { method: "POST" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Payment Link could not be created.");
      setResult(data.case);
      const history = JSON.parse(window.localStorage.getItem("revivepay_history") || "[]");
      window.localStorage.setItem("revivepay_history", JSON.stringify([data.case, ...history.filter((item) => item.id !== data.case.id)]));
      setLinkStatus("ready");
    } catch (linkError) {
      setError(linkError.message);
      setLinkStatus("error");
    }
  }

  return <AppShell activeKey="recover">
    <main className="recover-page">
      <header className="recover-hero"><p className="eyebrow">AI REVENUE RECOVERY AGENT</p><h1>Recover failed payments with AI.</h1><p>Tell RevivePay what happened. It understands the customer situation, recommends the safest next action, and waits for real payment confirmation.</p></header>
      <section className="recover-input-panel"><div className="section-heading"><div><h2>Tell RevivePay what happened</h2><p>Use natural language. You do not need to fill in every detail.</p></div></div><div className="quick-starts"><button type="button" onClick={() => setSituation(EXAMPLES.failed)}>Payment failed</button><button type="button" onClick={() => setSituation(EXAMPLES.checkout)}>Customer stopped checkout</button><button type="button" onClick={() => setSituation(EXAMPLES.overdue)}>Invoice overdue</button></div><form onSubmit={analyze}><textarea value={situation} onChange={(event) => setSituation(event.target.value)} placeholder="Payment of ₹2,499 failed for Rahul Sharma. The customer has tried twice and says they still want to pay. UPI failed with a timeout." /><div className="recover-form-footer"><span>RevivePay will never claim payment succeeded without verification.</span><button className="primary-soft-button" disabled={status === "loading" || !situation.trim()}>{status === "loading" ? "Analyzing..." : "Analyze & Recover"}</button></div></form></section>
      {status === "loading" && <section className="agent-thinking"><span className="thinking-dot" /><strong>RevivePay is analyzing the payment...</strong><small>Understanding the issue, assessing intent, and choosing a recovery strategy.</small></section>}
      {error && <section className="recover-error"><strong>Unable to analyze this case.</strong><span>{error}</span><small>Technical provider details are kept server-side.</small></section>}
      {result && <RecoveryResult result={result} onCreateLink={createPaymentLink} linkStatus={linkStatus} />}
    </main>
  </AppShell>;
}

function RecoveryResult({ result, onCreateLink, linkStatus }) {
  const decision = result.aiDecision;
  const stopped = decision.recommended_action === "STOP";
  return <section className="recovery-result"><div className="result-header"><div><p className="eyebrow">AI DECISION</p><h2>{result.customerName || "Customer situation"}</h2><p>{result.amount ? `₹${Number(result.amount).toLocaleString("en-IN")}` : "Amount not provided"} · {result.failureReason}</p></div><span className={`result-status ${result.status.toLowerCase()}`}>{result.status.replaceAll("_", " ")}</span></div><div className="result-grid"><div><span>Customer intent</span><strong>{decision.customer_intent.replaceAll("_", " ")}</strong></div><div><span>Recovery probability</span><strong>{Math.round(decision.recovery_probability * 100)}%</strong></div><div><span>Recommended action</span><strong>{decision.recommended_action.replaceAll("_", " ")}</strong></div><div><span>Policy</span><strong>{result.policy.status}</strong></div></div><div className="decision-explanation"><span>WHY</span><p>{decision.reasoning}</p></div>{decision.customer_message && <div className="message-card"><div><p className="eyebrow">AI-GENERATED MESSAGE</p><p>{decision.customer_message}</p></div><button type="button" onClick={() => navigator.clipboard?.writeText(decision.customer_message)}>Copy</button></div>}<div className="result-actions">{!stopped && result.policy.status === "APPROVED" && <button type="button" className="primary-soft-button" onClick={onCreateLink} disabled={linkStatus === "loading" || Boolean(result.paymentLink)}>{linkStatus === "loading" ? "Creating payment link..." : result.paymentLink ? "Payment Link created" : "Create Payment Link"}</button>}{result.paymentLink && <a className="secondary-soft-button inline-link" href={result.paymentLink.url} target="_blank" rel="noreferrer">Open Demo Payment Link</a>}<Link href="/history" className="secondary-soft-button inline-link">View History</Link></div>{result.paymentLink && <div className="demo-note">Demo Payment Link created. No real money or customer message was sent.</div>}</section>;
}
