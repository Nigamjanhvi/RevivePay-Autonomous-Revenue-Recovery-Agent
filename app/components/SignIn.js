"use client";

import { useState } from "react";
import { signInMerchant } from "../../lib/auth";

export default function SignIn({ onSignIn }) {
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const merchant = signInMerchant(form);
      onSignIn?.(merchant);
    } catch (err) {
      setError("Unable to sign in. Please check your merchant credentials and try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleDemoAccess() {
    const demoMerchant = signInMerchant({
      name: "Demo Merchant",
      email: "demo@revivepay.ai",
      password: "demo123",
    });
    onSignIn?.(demoMerchant);
  }

  return (
    <div className="revivepay-auth-shell">
      <div className="auth-story-panel">
        <div className="brand-lockup" aria-label="RevivePay brand logo">
          <span className="brand-mark" aria-hidden="true">
            <svg viewBox="0 0 48 48" role="img">
              <circle cx="24" cy="24" r="20" fill="rgba(47,111,237,0.12)" stroke="rgba(47,111,237,0.28)" />
              <path d="M14 26c2.8-7.8 7.6-11.8 13.3-11.8 3.7 0 6.7 1.2 9 3.6" fill="none" stroke="#2f6fed" strokeWidth="2.4" strokeLinecap="round" />
              <path d="M31 17l5.2 2.4-1.6 5.1" fill="none" stroke="#2f6fed" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M34 31.5c-2.8 7.7-7.6 11.7-13.3 11.7-3.7 0-6.7-1.2-9-3.6" fill="none" stroke="#14264a" strokeWidth="2.4" strokeLinecap="round" />
              <path d="M17 31l-5.2-2.4 1.6-5.1" fill="none" stroke="#14264a" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          <span className="brand-text">
            Revive<span>Pay</span>
          </span>
        </div>

        <div className="hero-copy-wrap">
          <p className="eyebrow">AI-POWERED REVENUE RECOVERY</p>
          <h1 className="hero-title">
            Recover revenue.<br />
            <span>Automatically.</span>
          </h1>
          <p className="hero-copy">
            RevivePay detects payment failures, understands why revenue is at risk, and executes the right recovery workflow — automatically and safely.
          </p>
        </div>

        <div className="feature-strip">
          <article className="feature-card">
            <div className="feature-icon" aria-hidden="true">
              <SparklesIcon />
            </div>
            <div>
              <h3>AI Diagnosis</h3>
              <p>Understands why a payment failed</p>
            </div>
          </article>

          <article className="feature-card">
            <div className="feature-icon" aria-hidden="true">
              <RefreshIcon />
            </div>
            <div>
              <h3>Smart Recovery</h3>
              <p>Chooses the next-best recovery action</p>
            </div>
          </article>

          <article className="feature-card">
            <div className="feature-icon" aria-hidden="true">
              <ShieldIcon />
            </div>
            <div>
              <h3>Safety Controls</h3>
              <p>Every action is policy-checked and audited</p>
            </div>
          </article>
        </div>

        <div className="flow-visual" aria-label="Revenue recovery workflow illustration">
          <div className="flow-node node-surface">
            <span className="flow-label">Payment Failed</span>
            <strong>₹12,500</strong>
            <small>Bank timeout</small>
          </div>

          <div className="flow-connector" aria-hidden="true" />

          <div className="flow-node node-ai">
            <span className="flow-label">AI Diagnosis</span>
            <strong>Recovery probability</strong>
            <small>87%</small>
          </div>

          <div className="flow-connector" aria-hidden="true" />

          <div className="flow-node node-action">
            <span className="flow-label">Recovery Action</span>
            <strong>Payment link</strong>
            <small>Generated</small>
          </div>

          <div className="flow-connector" aria-hidden="true" />

          <div className="flow-node node-success">
            <span className="flow-label">Recovered</span>
            <strong>₹12,500</strong>
            <small>Payment captured</small>
          </div>
        </div>

        <div className="mini-stats" aria-label="Product capabilities">
          <div>
            <span>AI-DRIVEN</span>
            <strong>Recovery Decisions</strong>
          </div>
          <div>
            <span>REAL-TIME</span>
            <strong>Payment Monitoring</strong>
          </div>
          <div>
            <span>FULL</span>
            <strong>Auditability</strong>
          </div>
        </div>
      </div>

      <div className="auth-login-panel">
        <div className="login-card">
          <div className="auth-header">
            <h2>Welcome back</h2>
            <p>Sign in to your RevivePay merchant dashboard.</p>
          </div>

          <form className="login-form" onSubmit={handleSubmit} noValidate>
            <div className="field-group">
              <label htmlFor="merchant-name">Merchant / Business Name</label>
              <div className="input-wrap">
                <span className="input-icon" aria-hidden="true"><StoreIcon /></span>
                <input
                  id="merchant-name"
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="Acme Pay"
                  autoComplete="organization"
                />
              </div>
            </div>

            <div className="field-group">
              <label htmlFor="merchant-email">Email address</label>
              <div className="input-wrap">
                <span className="input-icon" aria-hidden="true"><MailIcon /></span>
                <input
                  id="merchant-email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                  placeholder="ops@acmepay.com"
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            <div className="field-group">
              <label htmlFor="merchant-password">Password</label>
              <div className="input-wrap password-wrap">
                <span className="input-icon" aria-hidden="true"><LockIcon /></span>
                <input
                  id="merchant-password"
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
            </div>

            {error && (
              <div className="inline-error" role="alert" aria-live="polite">
                <span className="error-icon" aria-hidden="true"><AlertIcon /></span>
                <div>
                  <strong>Unable to sign in</strong>
                  <p>{error}</p>
                </div>
              </div>
            )}

            <div className="auth-actions">
              <button type="submit" className="primary-action" disabled={loading}>
                {loading ? (
                  <>
                    <span className="spinner" aria-hidden="true" />
                    Signing in...
                  </>
                ) : (
                  <>
                    Access Dashboard
                    <ArrowIcon />
                  </>
                )}
              </button>

              <div className="demo-divider" aria-hidden="true">or</div>

              <button type="button" className="secondary-action" onClick={handleDemoAccess}>
                Explore Demo Dashboard
              </button>
            </div>
          </form>

          <div className="trust-row" aria-label="Secure merchant access">
            <span className="trust-icon" aria-hidden="true"><ShieldIcon /></span>
            <p>
              <strong>Merchant workspace access</strong>
              <span>Securely access your RevivePay recovery dashboard.</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function SparklesIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3v3" />
      <path d="M12 18v3" />
      <path d="m5.5 5.5 2.1 2.1" />
      <path d="m16.4 16.4 2.1 2.1" />
      <path d="M3 12h3" />
      <path d="M18 12h3" />
      <path d="m5.5 18.5 2.1-2.1" />
      <path d="m16.4 7.6 2.1-2.1" />
    </svg>
  );
}

function RefreshIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12a9 9 0 0 1 15.3-6.3L21 7" />
      <path d="M21 12a9 9 0 0 1-15.3 6.3L3 17" />
      <path d="M21 4v3h-3" />
      <path d="M3 20v-3h3" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3 5 6v6c0 4.3 2.8 8.2 7 9 4.2-.8 7-4.7 7-9V6l-7-3Z" />
      <path d="m9.5 12 1.7 1.7 3.3-3.9" />
    </svg>
  );
}

function StoreIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 9h16" />
      <path d="M6 9V6.5A1.5 1.5 0 0 1 7.5 5h9A1.5 1.5 0 0 1 18 6.5V9" />
      <path d="M5 9v8.5A1.5 1.5 0 0 0 6.5 19h11A1.5 1.5 0 0 0 19 17.5V9" />
      <path d="M10 12h4" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m4 7 8 6 8-6" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="10" width="14" height="10" rx="2" />
      <path d="M8 10V7.5A4 4 0 0 1 12 4a4 4 0 0 1 4 3.5V10" />
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 3l18 18" />
      <path d="M10.6 10.6A2 2 0 0 0 13.4 13.4" />
      <path d="M9.1 5.5A10.9 10.9 0 0 1 12 5c6.5 0 10 7 10 7a18.1 18.1 0 0 1-4.9 6.1" />
      <path d="M14.9 18.5A10.9 10.9 0 0 1 12 19c-6.5 0-10-7-10-7a18.1 18.1 0 0 1 4.8-6" />
    </svg>
  );
}

function AlertIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v5" />
      <path d="M12 16h.01" />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14" />
      <path d="m13 5 7 7-7 7" />
    </svg>
  );
}
