// All routing/compliance decisions below are deterministic rules, NOT model
// output. The LLM (see app/api/generate-message) is only ever used to draft
// the human-facing wording for a stage the rules engine has already chosen.
// This keeps every "should we contact this customer, and how hard" decision
// auditable and reproducible — the LLM cannot skip a disputed invoice or
// escalate past the stop rule on its own.

export const STAGES = {
  GENTLE: "STAGE_1_GENTLE",
  FIRM: "STAGE_2_FIRM",
  FINAL: "STAGE_3_FINAL_NOTICE",
  HANDOFF: "STAGE_4_HUMAN_HANDOFF",
  STOPPED_DISPUTED: "STOPPED_DISPUTED",
  STOPPED_LOW_VALUE: "STOPPED_LOW_VALUE",
};

const LOW_VALUE_THRESHOLD = 500; // below this, automated chasing isn't cost-effective
const MAX_AUTOMATED_ATTEMPTS = 3; // after this, hand off to a human collections agent

// Illustrative recovery-rate assumptions for this demo, based on typical
// dunning-email benchmarks. On a real deployment these would come from this
// company's own historical recovery data per stage, not be hardcoded.
const SIMULATED_RECOVERY_RATE = {
  [STAGES.GENTLE]: 0.45,
  [STAGES.FIRM]: 0.3,
  [STAGES.FINAL]: 0.15,
  [STAGES.HANDOFF]: 0, // not counted as AI-recovered; it's now a human's job
  [STAGES.STOPPED_DISPUTED]: 0,
  [STAGES.STOPPED_LOW_VALUE]: 0,
};

export function classify(invoice) {
  if (invoice.disputed) {
    return { stage: STAGES.STOPPED_DISPUTED, reason: "Formally disputed — never auto-contacted, routed to compliance review." };
  }
  if (invoice.amount < LOW_VALUE_THRESHOLD) {
    return { stage: STAGES.STOPPED_LOW_VALUE, reason: `Below ₹${LOW_VALUE_THRESHOLD} — cost of automated outreach exceeds expected recovery.` };
  }
  if (invoice.previousAttempts >= MAX_AUTOMATED_ATTEMPTS) {
    return { stage: STAGES.HANDOFF, reason: `${invoice.previousAttempts} automated attempts already made — handed to a human collections agent.` };
  }
  if (invoice.daysOverdue <= 7) {
    return { stage: STAGES.GENTLE, reason: "Recently overdue — a light reminder is appropriate." };
  }
  if (invoice.daysOverdue <= 21) {
    return { stage: STAGES.FIRM, reason: "Meaningfully overdue — firmer tone, still cooperative." };
  }
  if (invoice.daysOverdue <= 45) {
    return { stage: STAGES.FINAL, reason: "Significantly overdue — final notice before escalation." };
  }
  return { stage: STAGES.HANDOFF, reason: "Overdue beyond 45 days — handed to a human collections agent." };
}

export function classifyBatch(invoices) {
  return invoices.map((inv) => {
    const { stage, reason } = classify(inv);
    const simulatedRecovered = Math.round(inv.amount * SIMULATED_RECOVERY_RATE[stage]);
    return { ...inv, stage, reason, simulatedRecovered };
  });
}

export function summarize(classified) {
  const totalAtRisk = classified.reduce((sum, i) => sum + i.amount, 0);
  const totalSimulatedRecovered = classified.reduce((sum, i) => sum + i.simulatedRecovered, 0);
  const stopped = classified.filter((i) => i.stage === STAGES.STOPPED_DISPUTED || i.stage === STAGES.STOPPED_LOW_VALUE);
  const contacted = classified.filter((i) => [STAGES.GENTLE, STAGES.FIRM, STAGES.FINAL].includes(i.stage));
  const handedOff = classified.filter((i) => i.stage === STAGES.HANDOFF);
  return {
    totalAtRisk,
    totalSimulatedRecovered,
    stoppedCount: stopped.length,
    contactedCount: contacted.length,
    handedOffCount: handedOff.length,
  };
}
