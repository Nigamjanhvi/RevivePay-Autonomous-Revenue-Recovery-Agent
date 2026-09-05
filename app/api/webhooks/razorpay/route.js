import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const body = await request.json();
    const event = body.event || "payment_link.paid";

    if (!body || !body.event) {
      return NextResponse.json({ ok: false, reason: "Missing event payload." }, { status: 400 });
    }

    return NextResponse.json({
      ok: true,
      status: "verified",
      event,
      message: "Webhook payload accepted in demo mode. Payment verification continues in the workflow engine.",
    });
  } catch (error) {
    return NextResponse.json({ ok: false, message: error.message }, { status: 500 });
  }
}
