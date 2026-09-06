"use client";

import { useEffect, useState } from "react";

export default function DemoPaymentPage() {
  const [recoveryCase, setRecoveryCase] = useState(null);
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState("");
  const caseId = typeof window === "undefined" ? "" : window.location.pathname.split("/").pop();

  useEffect(() => {
    if (!caseId) return;
    fetch(`/api/recovery/${caseId}`)
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || "Payment link was not found.");
        setRecoveryCase(data.case);
        setStatus("ready");
      })
      .catch((requestError) => { setError(requestError.message); setStatus("error"); });
  }, [caseId]);

  async function confirmPayment() {
    setStatus("processing");
    const response = await fetch(`/api/recovery/${caseId}/confirm-payment`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ amount: recoveryCase.amount }) });
    const data = await response.json();
    if (!response.ok) { setError(data.message || "Payment could not be confirmed."); setStatus("error"); return; }
    setRecoveryCase(data.case);
    setStatus("paid");
  }

  if (status === "loading") return <main className="demo-payment-page"><p>Loading secure demo payment...</p></main>;
  if (status === "error") return <main className="demo-payment-page"><section className="demo-payment-card"><h1>Payment link unavailable</h1><p>{error}</p></section></main>;
  if (status === "paid") return <main className="demo-payment-page"><section className="demo-payment-card"><p className="eyebrow">PAYMENT CONFIRMED</p><h1>Thank you, {recoveryCase.customerName || "customer"}.</h1><p>Your demo payment of ₹{Number(recoveryCase.amount || 0).toLocaleString("en-IN")} was recorded successfully.</p><span className="demo-payment-success">RECOVERED</span></section></main>;
  return <main className="demo-payment-page"><section className="demo-payment-card"><p className="eyebrow">REVIVEPAY DEMO CHECKOUT</p><h1>Complete your payment</h1><p className="demo-payment-customer">For {recoveryCase.customerName || "customer"}</p><div className="demo-payment-amount">₹{Number(recoveryCase.amount || 0).toLocaleString("en-IN")}</div><p className="demo-payment-copy">This is a demo payment page. No real money will be charged.</p><button className="primary-soft-button" type="button" onClick={confirmPayment}>Simulate Successful Payment</button></section></main>;
}