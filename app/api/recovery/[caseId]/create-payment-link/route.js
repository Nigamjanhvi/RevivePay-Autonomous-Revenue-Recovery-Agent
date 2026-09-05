import { NextResponse } from "next/server";
import { getCase, updateCase } from "../../../../../lib/recovery-store";

export async function POST(request, { params }) {
  const recoveryCase = getCase(params.caseId);
  if (!recoveryCase) return NextResponse.json({ message: "Recovery case was not found." }, { status: 404 });
  if (recoveryCase.paymentLink) return NextResponse.json({ case: recoveryCase });
  if (recoveryCase.policy.status !== "APPROVED") return NextResponse.json({ message: "This recovery action is not approved by policy." }, { status: 403 });
  try {
    let paymentLink;
    if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
      const credentials = Buffer.from(`${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`).toString("base64");
      const response = await fetch("https://api.razorpay.com/v1/payment_links", { method: "POST", headers: { Authorization: `Basic ${credentials}`, "Content-Type": "application/json" }, body: JSON.stringify({ amount: Math.round((recoveryCase.amount || 0) * 100), currency: recoveryCase.currency || "INR", reference_id: recoveryCase.id, description: "RevivePay recovery payment", customer: { name: recoveryCase.customerName }, notify: { sms: false, email: false } }) });
      if (!response.ok) throw new Error("Razorpay Payment Link creation failed.");
      const data = await response.json();
      paymentLink = { id: data.id, url: data.short_url, mode: "RAZORPAY_TEST" };
    } else {
      paymentLink = { id: `demo_link_${recoveryCase.id}`, url: `http://demo.revivepay.local/pay/${recoveryCase.id}`, mode: "DEMO" };
    }
    const updated = updateCase(recoveryCase.id, { paymentLink, status: "WAITING_FOR_PAYMENT" });
    return NextResponse.json({ case: updated });
  } catch (error) {
    console.error("Payment Link creation failed", error);
    return NextResponse.json({ message: "Payment Link could not be created." }, { status: 502 });
  }
}
