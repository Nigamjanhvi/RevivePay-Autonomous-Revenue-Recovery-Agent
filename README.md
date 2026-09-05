# RecoverAI — AI Revenue Recovery Agent

Built for the **Razorpay AI Buildathon 2026 — Track 3: AI Revenue Recovery**.

## What it does

Takes a batch of overdue B2B invoices and, for each one:

1. Runs **deterministic compliance/routing rules** (`lib/escalation.js`) — never the LLM — to decide:
   - Should this customer be contacted at all? (disputed invoices and sub-₹500 accounts are automatically excluded)
   - What escalation stage are they at? (gentle → firm → final notice → human handoff)
   - **Stopping criteria**: after 3 automated attempts or 45+ days overdue, it hands off to a human instead of escalating further.
2. Only once a stage is approved does it call **Gemini** (server-side, `app/api/generate-message/route.js`) to draft the actual outreach message — in English or Hinglish.
3. Shows a **simulated recovered amount** per stage, computed from disclosed, illustrative recovery-rate assumptions — clearly labeled as a demo simulation on synthetic data, not live payment collection.

This split is intentional: it's the "AI Judgment" criterion in the brief — using the model only where judgment/wording is genuinely needed, and keeping every compliance-relevant decision (who gets contacted, how hard, when to stop) auditable and rule-based.

## What's real vs. simulated — be upfront about this on the panel

- **Real:** the Next.js app, the rules engine, the live Gemini API call that drafts each message, the UI.
- **Simulated:** the invoice batch (10 synthetic records) and the "recovered ₹" figures (illustrative probabilities per stage, not from live transactions). Say this plainly in your pitch video — it's honest and it's still a legitimate demonstration of the agent's decision logic.
- **Demo-only:** sign-in is a front-end gate with no backend/database — say this too if asked.

## Local setup

```bash
npm install
cp .env.example .env.local
# put your real Gemini API key in .env.local
npm run dev
```

Get a free Gemini API key at https://aistudio.google.com/apikey (free tier is enough for a demo).

## Deploy to Vercel

```bash
npm i -g vercel
vercel
```
Then in the Vercel project settings, add the environment variable `GEMINI_API_KEY` with your key, and redeploy.

## What broke and how it was fixed

*(Fill this in with your own experience while testing — the brief asks for this explicitly and it's one of their four scoring criteria. Some starting candidates based on how this was built:)*
- If Gemini free-tier rate limits hit while running "Run agent on eligible invoices" on all rows back-to-back — note how you handled it (e.g. added a delay between calls, or a retry).
- If a message came back in the wrong tone/length — note how you adjusted the prompt in `route.js`.

## Project structure

```
app/
  page.js                     — dashboard (client component)
  components/Intro.js         — opening animation
  components/SignIn.js        — demo sign-in gate
  components/AgentTrace.js    — animated step trace shown before each drafted message
  api/generate-message/route.js — server-side Gemini call
lib/
  invoices.js                 — synthetic invoice batch
  escalation.js                — deterministic routing/compliance rules
```
