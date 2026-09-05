"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getStoredMerchant } from "../../lib/auth";
import SignIn from "./SignIn";

const NAV_ITEMS = [
  ["recover", "Recover", "/recover"],
  ["history", "History", "/history"],
  ["settings", "Settings", "/settings"],
];

export default function AppShell({ activeKey, children }) {
  const [merchant, setMerchant] = useState(undefined);

  useEffect(() => {
    setMerchant(getStoredMerchant());
  }, []);

  if (merchant === undefined) {
    return <div className="auth-check-screen" aria-live="polite">Checking merchant session...</div>;
  }

  if (!merchant) {
    return <SignIn onSignIn={setMerchant} />;
  }

  return (
    <div className="operations-shell">
      <aside className="operations-sidebar">
        <Link href="/recover" className="operations-brand">Revive<span>Pay</span><small>AI Revenue Recovery Agent</small></Link>
        <div className="operations-nav-label">WORKSPACE</div>
        <nav className="operations-nav" aria-label="Operations navigation">
          {NAV_ITEMS.map(([key, label, href]) => (
            <Link key={key} href={href} className={`operations-nav-item ${activeKey === key ? "active" : ""}`}>
              <span className="operations-nav-mark" />
              {label}
            </Link>
          ))}
        </nav>
        <div className="operations-status">
          <span className="status-dot online" />
          <div><strong>Agent Online</strong><small>Demo mode · synthetic data</small></div>
        </div>
      </aside>
      <main className="operations-main">
        <header className="operations-topbar">
          <div className="operations-search">Recover a failed payment with AI</div>
          <div className="operations-topbar-meta"><span className="mode-chip">DEMO MODE</span><span className="merchant-chip">{merchant.name || merchant.email}</span></div>
        </header>
        {children}
      </main>
    </div>
  );
}
