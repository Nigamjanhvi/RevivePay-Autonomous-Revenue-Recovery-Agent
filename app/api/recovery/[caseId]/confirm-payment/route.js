import { NextResponse } from "next/server";
import { getCase, updateCase } from "../../../../../lib/recovery-store";

export async function POST(request, { params }) {
  const recoveryCase = getCase(params.caseId);
  if (!recoveryCase) return NextResponse.json({ message: "Recovery case was not found." }, { status: 404 });
  const body = await request.json().catch(() => ({}));
  const amount = Math.min(Number(body.amount || recoveryCase.amount || 0), recoveryCase.amount || 0);
  const updated = updateCase(recoveryCase.id, { status: amount >= recoveryCase.amount ? "RECOVERED" : "PARTIALLY_RECOVERED", recoveredAmount: amount, outstandingAmount: Math.max(0, (recoveryCase.amount || 0) - amount) });
  return NextResponse.json({ case: updated });
}
