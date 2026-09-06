import { NextResponse } from "next/server";
import { saveCase } from "../../../../lib/recovery-store";

const SYSTEM_INSTRUCTIONS = `You are RevivePay, an AI revenue recovery agent for merchants using Razorpay. Understand failed payments, checkout abandonment, overdue payments and customer replies. Recommend the least intrusive effective recovery action. Never invent facts, discounts, payment status or Razorpay links. Never claim payment succeeded unless verified. Do not execute financial actions; return only a structured recommendation for a deterministic server policy to review. Do not use threats, dark patterns or fake urgency. Return valid JSON only with diagnosis, failure_reason, customer_intent, confidence, recovery_probability, recommended_action, channel, customer_message, reasoning, risk_flags, next_step.`;

export async function POST(request) {
  try {
    const body = await request.json();
    const situation = String(body.situation || "").trim();
    if (!situation) return NextResponse.json({ message: "Describe the payment situation first." }, { status: 400 });
    const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return NextResponse.json({ message: "AI analysis is temporarily unavailable. Configure GEMINI_API_KEY on the server." }, { status: 503 });
    const prompt = `${SYSTEM_INSTRUCTIONS}\n\nMerchant situation:\n${situation}\n\nUse these exact enum values where applicable: customer_intent = wants_to_pay, uncertain, wants_to_pay_later, does_not_want_to_pay, needs_help. recommended_action = CREATE_PAYMENT_LINK, SEND_PAYMENT_MESSAGE, SEND_REMINDER, FOLLOW_UP_LATER, HUMAN_REVIEW, STOP. channel = WHATSAPP, SMS, EMAIL, NONE. confidence and recovery_probability must be numbers from 0 to 1.\nReturn JSON only.`;
    let decision;
    try {
      const response = await callGemini([model], apiKey, prompt);
      if (!response.ok) {
        const providerMessage = await response.text();
        console.error("Gemini analysis failed", response.status, providerMessage);
        if (response.status !== 429 && response.status !== 503) return NextResponse.json({ message: "AI analysis is temporarily unavailable." }, { status: 502 });
      } else {
        const payload = await response.json();
        const text = payload?.candidates?.[0]?.content?.parts?.[0]?.text || "";
        decision = JSON.parse(text.replace(/^```json\s*/i, "").replace(/```$/i, "").trim());
      }
    } catch (providerError) {
      console.error("Gemini provider unavailable; using local recovery policy", providerError);
    }
    if (!decision) decision = createFallbackDecision(situation);
    const normalized = normalizeDecision(decision);
    const recoveryCase = saveCase({ id: `case_${Date.now()}`, customerName: extractCustomerName(situation), amount: extractAmount(situation), currency: "INR", failureReason: normalized.failure_reason, situation, status: policyStatus(normalized), aiDecision: normalized, policy: evaluatePolicy(normalized), paymentLink: null, createdAt: new Date().toISOString() });
    return NextResponse.json({ case: recoveryCase });
  } catch (error) {
    console.error("Recovery analysis failed", error);
    if (error.status === 429 || error.status === 503) return NextResponse.json({ message: "The AI service is temporarily busy. Please try again in a moment." }, { status: error.status });
    return NextResponse.json({ message: error.name === "TimeoutError" ? "AI analysis timed out. Please try again." : "AI analysis returned an invalid decision. Please try again." }, { status: 502 });
  }
}

async function callGemini(models, apiKey, prompt) {
  const body = JSON.stringify({
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: { temperature: 0.2, responseMimeType: "application/json" },
  });
  let lastError;

  for (const model of models) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
        signal: AbortSignal.timeout(20000),
      });

      if (response.ok) return response;

      const providerMessage = await response.text();
      console.error(`Gemini analysis failed for ${model}`, response.status, providerMessage);
      if (response.status !== 429 && response.status !== 503) return new Response(providerMessage, { status: response.status });
      lastError = Object.assign(new Error(`Gemini returned ${response.status}`), { status: response.status });
    } catch (error) {
      lastError = error;
      console.error(`Gemini request failed for ${model}`, error);
    }
  }

  throw lastError || new Error("Gemini request failed.");
}

function normalizeDecision(value) {
  const allowedIntents = ["wants_to_pay", "uncertain", "wants_to_pay_later", "does_not_want_to_pay", "needs_help"];
  const allowedActions = ["CREATE_PAYMENT_LINK", "SEND_PAYMENT_MESSAGE", "SEND_REMINDER", "FOLLOW_UP_LATER", "HUMAN_REVIEW", "STOP"];
  return { diagnosis: String(value.diagnosis || "Payment issue"), failure_reason: String(value.failure_reason || "Unknown payment issue"), customer_intent: allowedIntents.includes(value.customer_intent) ? value.customer_intent : "uncertain", confidence: clamp(value.confidence), recovery_probability: clamp(value.recovery_probability), recommended_action: allowedActions.includes(value.recommended_action) ? value.recommended_action : "HUMAN_REVIEW", channel: value.channel || "NONE", customer_message: String(value.customer_message || ""), reasoning: String(value.reasoning || "The recommendation is based on the available payment context."), risk_flags: Array.isArray(value.risk_flags) ? value.risk_flags.map(String) : [], next_step: String(value.next_step || "Review the recommendation before executing an action.") };
}
function createFallbackDecision(situation) {
  const lowerSituation = situation.toLowerCase();
  const customerDeclined = /does not want|don't want|do not want|refuse|declined|not interested/.test(lowerSituation);
  const wantsToPay = /still want|wants to pay|want to pay|complete the payment|pay tomorrow|tried twice/.test(lowerSituation);
  const technicalFailure = /timeout|timed out|failed|rejected|declined|error/.test(lowerSituation);
  return {
    diagnosis: technicalFailure ? "Payment attempt needs recovery" : "Payment situation needs review",
    failure_reason: technicalFailure ? "Payment attempt did not complete" : "Payment status is unclear",
    customer_intent: customerDeclined ? "does_not_want_to_pay" : wantsToPay ? "wants_to_pay" : "uncertain",
    confidence: customerDeclined || wantsToPay ? 0.82 : 0.55,
    recovery_probability: customerDeclined ? 0.05 : wantsToPay ? 0.75 : 0.35,
    recommended_action: customerDeclined ? "STOP" : wantsToPay ? "CREATE_PAYMENT_LINK" : "HUMAN_REVIEW",
    channel: customerDeclined ? "NONE" : "WHATSAPP",
    customer_message: wantsToPay ? "Hi, we noticed your recent payment attempt did not complete. Here is a fresh payment link where you can try again: {{payment_link}}. Please let us know if you need any assistance." : "",
    reasoning: "The AI provider was unavailable, so this recommendation was generated by the server recovery policy using the payment context you provided.",
    risk_flags: ["AI provider unavailable; review before contacting the customer."],
    next_step: wantsToPay ? "Review the recovery message and create a payment link." : "Review the case before taking action.",
  };
}
function clamp(value) { const number = Number(value); return Number.isFinite(number) ? Math.max(0, Math.min(1, number)) : 0; }
function evaluatePolicy(decision) { if (decision.customer_intent === "does_not_want_to_pay" || decision.recommended_action === "STOP") return { status: "STOPPED", reason: "Customer does not want further recovery outreach." }; if (decision.confidence < 0.7 || decision.recovery_probability < 0.4 || decision.recommended_action === "HUMAN_REVIEW") return { status: "HUMAN_REVIEW", reason: "The decision needs merchant review before recovery." }; return { status: "APPROVED", reason: "The proposed recovery action is within the simple recovery policy." }; }
function policyStatus(decision) { return evaluatePolicy(decision).status === "APPROVED" ? "ACTION_READY" : evaluatePolicy(decision).status; }
function extractAmount(value) {
  const labeledAmount = value.match(/(?:₹|rs\.?\s*|inr\s*)([\d,]+)/i);
  const plainAmount = value.match(/(?:payment|invoice|amount)\s*(?:of|for)?\s*([\d,]+)/i);
  const match = labeledAmount || plainAmount;
  return match ? Number(match[1].replaceAll(",", "")) : null;
}
function extractCustomerName(value) { const match = value.match(/for\s+([A-Z][A-Za-z]+(?:\s+[A-Z][A-Za-z]+){0,2})/); return match?.[1] || "Customer"; }
