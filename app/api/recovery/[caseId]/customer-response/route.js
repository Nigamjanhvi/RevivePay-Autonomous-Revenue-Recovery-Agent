import { NextResponse } from "next/server";
import { getCase, updateCase } from "../../../../../lib/recovery-store";

export async function POST(request, { params }) {
  const recoveryCase = getCase(params.caseId);
  if (!recoveryCase) return NextResponse.json({ message: "Recovery case was not found." }, { status: 404 });
  const body = await request.json();
  const message = String(body.message || "").trim();
  if (!message) return NextResponse.json({ message: "Customer response is required." }, { status: 400 });
  const lower = message.toLowerCase();
  const intent = lower.includes("tomorrow") || lower.includes("later") ? "wants_to_pay_later" : lower.includes("don't want") || lower.includes("stop") ? "does_not_want_to_pay" : lower.includes("paid") ? "wants_to_pay" : "uncertain";
  const status = intent === "does_not_want_to_pay" ? "STOPPED" : recoveryCase.status;
  const updated = updateCase(recoveryCase.id, { customerMessage: message, status, aiDecision: { ...recoveryCase.aiDecision, customer_intent: intent, recommended_action: intent === "wants_to_pay_later" ? "FOLLOW_UP_LATER" : intent === "does_not_want_to_pay" ? "STOP" : recoveryCase.aiDecision.recommended_action, reasoning: intent === "wants_to_pay_later" ? "The customer asked for more time, so a single follow-up is less intrusive than another immediate payment request." : intent === "does_not_want_to_pay" ? "The customer declined payment, so automated recovery should stop." : "The customer response indicates that payment recovery may still be appropriate." } });
  return NextResponse.json({ case: updated });
}
