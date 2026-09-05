"use client";

import { useEffect, useState } from "react";
import AppShell from "../../components/AppShell";

export default function RecoveryCasePage() {
  const [recoveryCase, setRecoveryCase] = useState(null);
  const [error, setError] = useState("");
  useEffect(() => {
    const caseId = window.location.pathname.split("/").pop();
    fetch(`/api/recovery/${caseId}`).then(async (response) => { const data = await response.json(); if (!response.ok) throw new Error(data.message); setRecoveryCase(data.case); }).catch((requestError) => setError(requestError.message));
  }, []);
  if (error) return <AppShell activeKey="history"><main className="simple-product-page"><div className="recover-error">{error}</div></main></AppShell>;
  if (!recoveryCase) return <div className="auth-check-screen">Loading recovery case...</div>;
  const decision = recoveryCase.aiDecision;
  return <AppShell activeKey="history"><main className="simple-product-page"><header className="product-page-header"><p className="eyebrow">RECOVERY CASE</p><h1>{recoveryCase.customerName || "Customer"}</h1><p>{recoveryCase.amount ? `₹${Number(recoveryCase.amount).toLocaleString("en-IN")}` : "Amount not provided"} · {recoveryCase.failureReason}</p></header><section className="recovery-result"><div className="result-header"><div><p className="eyebrow">AI DECISION</p><h2>{decision.diagnosis}</h2></div><span className="result-status">{recoveryCase.status.replaceAll("_", " ")}</span></div><div className="result-grid"><div><span>Customer intent</span><strong>{decision.customer_intent.replaceAll("_", " ")}</strong></div><div><span>Recovery probability</span><strong>{Math.round(decision.recovery_probability * 100)}%</strong></div><div><span>Recommended action</span><strong>{decision.recommended_action.replaceAll("_", " ")}</strong></div><div><span>Policy</span><strong>{recoveryCase.policy.status}</strong></div></div><div className="decision-explanation"><span>WHY</span><p>{decision.reasoning}</p></div>{decision.customer_message && <div className="message-card"><p>{decision.customer_message}</p></div>}{recoveryCase.paymentLink && <div className="demo-note">Payment Link ready in {recoveryCase.paymentLink.mode} mode.</div>}</section></main></AppShell>;
}
