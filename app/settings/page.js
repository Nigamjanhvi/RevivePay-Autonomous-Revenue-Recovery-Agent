"use client";

import { useState } from "react";
import AppShell from "../components/AppShell";

export default function SettingsPage() {
  const [saved, setSaved] = useState(false);
  const [mode, setMode] = useState("DEMO");
  return <AppShell activeKey="settings"><main className="simple-product-page"><header className="product-page-header"><p className="eyebrow">SETTINGS</p><h1>Merchant settings</h1><p>Choose how RevivePay behaves and keep payment credentials private.</p></header><section className="settings-form"><label>Business name<input placeholder="Your business name" /></label><fieldset><legend>AI behavior</legend><label><input type="radio" checked={mode === "DEMO"} onChange={() => setMode("DEMO")} /> Demo Mode · simulated links, no real messages</label><label><input type="radio" checked={mode === "TEST"} onChange={() => setMode("TEST")} /> Razorpay Test Mode · server-side credentials required</label></fieldset><fieldset><legend>Recovery preferences</legend><label>Maximum recovery attempts<input type="number" defaultValue="3" /></label><label>Maximum customer messages<input type="number" defaultValue="3" /></label><label>Minimum AI confidence<input type="number" defaultValue="70" /></label></fieldset><button type="button" className="primary-soft-button" onClick={() => setSaved(true)}>Save settings</button>{saved && <span className="saved-note">Settings saved locally for this demo merchant.</span>}</section></main></AppShell>;
}
