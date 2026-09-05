import { NextResponse } from "next/server";
import { getCase } from "../../../../lib/recovery-store";

export async function GET(request, { params }) {
  const recoveryCase = getCase(params.caseId);
  if (!recoveryCase) return NextResponse.json({ message: "Recovery case was not found." }, { status: 404 });
  return NextResponse.json({ case: recoveryCase });
}