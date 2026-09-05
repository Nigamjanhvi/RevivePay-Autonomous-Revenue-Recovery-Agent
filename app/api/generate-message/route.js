import { NextResponse } from "next/server";

// This route is the ONLY place the LLM is called. It never decides whether
// or how hard to chase an invoice — that comes from lib/escalation.js and is
// passed in as `stage`. The model's job is strictly to word the message.

const STAGE_INSTRUCTIONS = {
  STAGE_1_GENTLE:
    "Write a short, friendly payment reminder. Assume good faith — this could be an oversight. Warm, low-pressure tone.",
  STAGE_2_FIRM:
    "Write a firmer payment reminder. Reference that this is a follow-up to a previous message. Professional, direct, but still respectful.",
  STAGE_3_FINAL_NOTICE:
    "Write a final notice before this account is escalated to manual collections. Clear and serious in tone, but never threatening or non-compliant — no legal threats, no aggressive language.",
};

export async function POST(request) {
  const body = await request.json();
  const { customerName, amount, daysOverdue, stage, tone } = body;

  if (!STAGE_INSTRUCTIONS[stage]) {
    return NextResponse.json({ error: "This stage is not eligible for AI-drafted outreach." }, { status: 400 });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "GEMINI_API_KEY is not configured on the server." }, { status: 500 });
  }

  const styleNote =
    tone === "hinglish"
      ? "Write it in casual Hinglish (Hindi-English mix, Latin script), the way an Indian B2B accounts team would message a client on WhatsApp."
      : "Write it in plain business English, suitable for email.";

  const prompt = `You are drafting a payment recovery message for a B2B accounts receivable team.
Customer: ${customerName}
Outstanding amount: ₹${amount.toLocaleString("en-IN")}
Days overdue: ${daysOverdue}

Instruction: ${STAGE_INSTRUCTIONS[stage]}
${styleNote}

Rules: Never threaten legal action. Never mention interest/penalties unless asked. Keep it under 90 words. Output only the message text, no subject line, no preamble.`;

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      }
    );

    if (!res.ok) {
      const errText = await res.text();
      return NextResponse.json({ error: `Gemini API error: ${errText}` }, { status: 502 });
    }

    const data = await res.json();
    const message = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
    return NextResponse.json({ message });
  } catch (err) {
    return NextResponse.json({ error: `Request failed: ${err.message}` }, { status: 500 });
  }
}
