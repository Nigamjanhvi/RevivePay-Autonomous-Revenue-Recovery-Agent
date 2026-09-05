# RevivePay

**AI Revenue Recovery Agent**

RevivePay helps merchants recover legitimate unpaid revenue after failed payments, UPI timeouts, checkout abandonment, overdue payments, and customer payment delays.

The product is built for the **Razorpay AI Builder Buildathon 2026, Track 3: AI Revenue Recovery**.

## Product Objective

RevivePay turns a payment problem into a controlled recovery workflow:

> Merchant context -> AI understanding -> structured recommendation -> policy check -> bounded action -> payment verification

The merchant describes what happened in natural language. RevivePay then:

1. Understands the payment situation.
2. Diagnoses the likely failure reason.
3. Classifies customer intent.
4. Estimates recovery probability.
5. Recommends the least intrusive effective action.
6. Generates a contextual customer message.
7. Applies deterministic server-side policy rules.
8. Creates a Demo or Razorpay Test Mode Payment Link when approved.
9. Waits for payment confirmation.
10. Marks revenue recovered only after a confirmed payment result.

RevivePay is not a generic chatbot and does not allow the AI model to directly execute financial actions.

## What Problem It Solves

Merchants lose revenue when payment failures are missed or handled poorly. Common problems include:

- Failed card or UPI payments are not followed up.
- Customers are repeatedly contacted without understanding their intent.
- A generic reminder is sent when a Payment Link would be more useful.
- Customer requests to pay later are treated as immediate payment failures.
- Payment is incorrectly considered recovered when a link is merely created.
- Sensitive or uncertain cases are handled automatically without review.

RevivePay provides a clear decision process and separates four important outcomes:

- **AI recommendation:** What the model suggests.
- **Policy decision:** Whether the server allows the action.
- **Execution result:** Whether a Payment Link was actually created.
- **Payment verification:** Whether money was actually received and verified.

## Main User Experience

The application has three primary surfaces:

### Recover

The main workspace. A merchant enters a situation such as:

```text
Payment of ₹2,499 failed for Rahul Sharma. He tried twice and says he still wants to pay. UPI failed with a timeout.
```

The merchant clicks **Analyze & Recover** and receives:

- Diagnosis
- Failure reason
- Customer intent
- Confidence
- Recovery probability
- Recommended action
- Policy result
- Business explanation for the recommendation
- AI-generated customer message

If policy approves a Payment Link action, the merchant can create it.

### History

Shows analyzed recovery cases with:

- Customer
- Amount
- Payment issue
- Current action/status
- Link to the case detail

### Settings

Contains the focused merchant preferences:

- Business name
- Demo Mode or Razorpay Test Mode
- Maximum recovery attempts
- Maximum customer messages
- Minimum AI confidence

## Example Recovery Scenario

Rahul Sharma tried to pay ₹2,499 twice. The UPI payment timed out, but Rahul still wants to pay.

RevivePay processes the case like this:

1. The merchant submits the situation.
2. Gemini identifies the customer intent as `wants_to_pay`.
3. Gemini recommends `CREATE_PAYMENT_LINK`.
4. The policy layer checks confidence, recovery probability, risk flags, and customer intent.
5. The policy approves the action.
6. RevivePay creates a simulated Payment Link in Demo Mode or a Razorpay Test Mode link when configured.
7. RevivePay prepares a polite customer message.
8. The case moves to `WAITING_FOR_PAYMENT`.
9. A payment event is confirmed.
10. The case becomes `RECOVERED` only after verification.

Other supported intent examples include:

- “I can pay tomorrow.” -> `wants_to_pay_later` -> `FOLLOW_UP_LATER`
- “I do not want to pay anymore.” -> `does_not_want_to_pay` -> `STOP`
- “I already paid.” -> payment should be verified before any further recovery action

## AI Decision Pipeline

```text
Natural-language situation
        |
        v
Server recovery context
        |
        v
Gemini structured analysis
        |
        v
Decision normalization and validation
        |
        v
Deterministic policy evaluation
        |
        v
Approved action or review/stop decision
        |
        v
Demo or Razorpay Test Payment Link
        |
        v
Payment confirmation and verification
```

### Structured AI output

The analysis endpoint expects the model to return JSON containing:

```json
{
  "diagnosis": "UPI payment timeout",
  "failure_reason": "Temporary payment failure",
  "customer_intent": "wants_to_pay",
  "confidence": 0.95,
  "recovery_probability": 0.88,
  "recommended_action": "CREATE_PAYMENT_LINK",
  "channel": "WHATSAPP",
  "customer_message": "Hi Rahul, your payment did not go through...",
  "reasoning": "The customer still wants to pay, so a fresh payment path is appropriate.",
  "risk_flags": [],
  "next_step": "Create a Payment Link and wait for confirmation."
}
```

The server normalizes invalid or missing values and does not allow arbitrary model output to execute money actions.

### AI system instructions

The server-side prompt instructs Gemini to:

- Understand payment failures, UPI failures, card failures, overdue payments, and checkout abandonment.
- Identify customer intent before recommending outreach.
- Prefer the least intrusive effective action.
- Never invent transaction facts, discounts, payment status, or Payment Links.
- Never claim payment succeeded without verification.
- Stop recovery when a customer opts out.
- Escalate disputes, fraud signals, sensitive financial requests, and uncertain cases.
- Generate short, polite, transparent, non-threatening communication.

## Policy Engine

The policy layer is deterministic and server-side. It checks whether the AI recommendation is allowed.

Current checks include:

- Customer does not want further recovery outreach.
- AI confidence is below the configured threshold.
- Recovery probability is too low.
- The AI recommends human review.
- The proposed action is approved before execution.

Possible policy outcomes:

- `APPROVED`
- `HUMAN_REVIEW`
- `STOPPED`

The AI recommends. The policy decides. The executor performs the approved action.

## Payment Links

Payment Links are the primary concrete recovery action.

### Demo Mode

Demo Mode is the default safe mode:

- No real payment is processed.
- No real customer message is sent.
- A clearly labeled demo URL is generated.
- The UI identifies the result as simulated.

### Razorpay Test Mode

When `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` are configured, the server can call the official Razorpay Payment Links API:

```text
POST https://api.razorpay.com/v1/payment_links
```

Credentials stay on the server. They are never exposed through client-side code.

The application does not claim a link was created until the backend confirms the result.

## Payment Lifecycle

RevivePay deliberately separates link creation from revenue recovery:

```text
Payment Link created
        |
        v
Waiting for payment
        |
        v
Payment event received
        |
        v
Payment verified
        |
        v
Recovered
```

Partial payments are represented as partial recovery, with the remaining outstanding amount kept visible.

## API Routes

### Analyze a recovery situation

```text
POST /api/recovery/analyze
```

Request:

```json
{
  "situation": "₹2499 payment failed for Rahul Sharma. He still wants to pay."
}
```

Returns a canonical recovery case containing the AI decision and policy result.

### Create a Payment Link

```text
POST /api/recovery/:caseId/create-payment-link
```

The server validates the case, checks policy, prevents duplicate creation, and creates either a Demo or Razorpay Test Mode Payment Link.

### Process a customer response

```text
POST /api/recovery/:caseId/customer-response
```

Request:

```json
{
  "message": "I can pay tomorrow."
}
```

The response is classified into an intent and the case recommendation is updated.

### Confirm a payment

```text
POST /api/recovery/:caseId/confirm-payment
```

Request:

```json
{
  "amount": 2499
}
```

The case becomes `RECOVERED` or `PARTIALLY_RECOVERED` based on the confirmed amount.

### Get a case

```text
GET /api/recovery/:caseId
```

### Get recovery history

```text
GET /api/recovery/history
```

### Razorpay webhook endpoint

```text
POST /api/webhooks/razorpay
```

The endpoint exists as the integration boundary for payment events. Production use should verify Razorpay webhook signatures, identify the matching case, deduplicate events, and update payment state before resuming recovery.

## Authentication

RevivePay uses a native merchant sign-in gate. The current demo implementation stores the merchant session in browser storage so the local demo can run without Firebase or a database.

This is suitable for a local prototype, not production authentication. A production deployment should replace it with:

- Secure password hashing
- HTTP-only session cookies
- Server-side merchant identity
- Merchant-scoped persistent records
- Protected API routes

## Technology Stack

- **Framework:** Next.js 14.2.35
- **Frontend:** React 18.3.1
- **Routing:** Next.js App Router
- **Backend:** Next.js Route Handlers
- **AI provider:** Google Gemini REST API
- **Configured model:** `GEMINI_MODEL`, currently `gemini-3.6-flash`
- **Payments:** Razorpay Payment Links API for optional Test Mode
- **Styling:** CSS in `app/globals.css`
- **Demo case storage:** In-memory server store in `lib/recovery-store.js`
- **Merchant demo session:** Browser storage in `lib/auth.js`

## Project Structure

```text
app/
  page.js                                  Root entry, opens Recover
  layout.js                                App metadata and global CSS
  globals.css                              Product UI styles
  recover/page.js                          Main AI recovery workspace
  history/page.js                          Recovery history
  settings/page.js                         Merchant preferences
  recovery/[caseId]/page.js                Recovery case detail
  components/AppShell.js                   Authenticated product shell
  components/SignIn.js                     Native merchant sign-in screen
  api/recovery/analyze/route.js             AI analysis and policy evaluation
  api/recovery/history/route.js             Case history endpoint
  api/recovery/[caseId]/route.js            Case lookup endpoint
  api/recovery/[caseId]/create-payment-link Payment Link executor
  api/recovery/[caseId]/customer-response   Customer intent update endpoint
  api/recovery/[caseId]/confirm-payment     Payment confirmation endpoint
  api/webhooks/razorpay/route.js            Razorpay webhook boundary

lib/
  auth.js                                   Demo merchant session helpers
  recovery-store.js                         Canonical in-memory recovery cases
```

## Environment Variables

Create `.env.local` in the project root:

```env
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-3.6-flash
```

Optional Razorpay Test Mode variables:

```env
RAZORPAY_KEY_ID=your_test_key_id
RAZORPAY_KEY_SECRET=your_test_key_secret
RAZORPAY_WEBHOOK_SECRET=your_test_webhook_secret
```

Never commit `.env.local` or expose secrets through `NEXT_PUBLIC_*` variables.

## Local Development

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

The project has also been tested locally on port `3003`.

## Production Build

```bash
npm run build
npm run start
```

The build performs Next.js compilation, linting, type checks, page generation, and route validation.

## Demo Walkthrough

1. Open the Recover page.
2. Enter:

   ```text
   ₹2499 payment failed for Rahul Sharma. He tried twice and still wants to pay. UPI timed out.
   ```

3. Click **Analyze & Recover**.
4. Review the structured AI diagnosis and customer intent.
5. Review the policy result.
6. Click **Create Payment Link**.
7. Open History to see the case.
8. Use the payment confirmation endpoint or Demo Mode flow to simulate payment.
9. Confirm that the case becomes recovered only after payment confirmation.

## Error Handling

The UI does not expose raw provider errors. It shows user-safe messages for:

- Missing API credentials
- Invalid AI output
- Gemini timeout
- Gemini rate limits
- Gemini service overload
- Network/provider failures
- Payment Link creation failures

Technical details are logged server-side.

For example, a temporary Gemini overload is shown as:

> The AI service is temporarily busy. Please try again in a moment.

The application never fabricates an AI result when the provider fails.

## Current Limitations

This repository is a functional prototype/demo. The following areas need production hardening:

- Recovery cases are stored in memory and reset when the server restarts.
- Merchant sessions use browser storage rather than secure HTTP-only cookies.
- Customer messages are prepared/simulated; no WhatsApp, SMS, or email provider is connected.
- Razorpay webhook signature verification and full event idempotency need production implementation.
- Merchant data isolation requires a persistent database and server-derived merchant identity.
- Gemini availability depends on API credentials, model availability, quota, and provider capacity.

## Design Principles

- AI recommends; deterministic policy controls execution.
- A Payment Link is not the same as recovered revenue.
- Payment must be verified before recovery is reported.
- Customer intent controls the next communication.
- Opt-outs, disputes, fraud signals, and uncertainty must stop or escalate recovery.
- Demo Mode must never be presented as real money movement.
- The product should explain what happened, why the action was selected, whether it was allowed, and what happens next.
