const cases = globalThis.__revivePayCases || new Map();
globalThis.__revivePayCases = cases;

export function saveCase(recoveryCase) {
  cases.set(recoveryCase.id, { ...recoveryCase, updatedAt: new Date().toISOString() });
  return cases.get(recoveryCase.id);
}

export function getCase(caseId) {
  return cases.get(caseId) || null;
}

export function listCases() {
  return Array.from(cases.values()).sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)));
}

export function updateCase(caseId, patch) {
  const current = getCase(caseId);
  if (!current) return null;
  return saveCase({ ...current, ...patch });
}
