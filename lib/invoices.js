// Synthetic B2B receivables batch for demo purposes.
// Field meanings:
// amount            -> outstanding amount in INR
// daysOverdue       -> days past the due date
// failureReason     -> why the payment is outstanding
// previousAttempts  -> how many recovery contacts have already gone out
// disputed          -> customer has formally disputed the charge (must never be auto-chased)

export const invoiceBatch = [
  { id: "INV-1001", customerName: "Anaya Textiles Pvt Ltd", amount: 42000, daysOverdue: 4, failureReason: "card_declined", previousAttempts: 0, disputed: false },
  { id: "INV-1002", customerName: "Kaveri Foods & Beverages", amount: 118500, daysOverdue: 12, failureReason: "insufficient_funds", previousAttempts: 1, disputed: false },
  { id: "INV-1003", customerName: "Bluepeak Logistics", amount: 260000, daysOverdue: 30, failureReason: "bank_error", previousAttempts: 2, disputed: false },
  { id: "INV-1004", customerName: "Northgate Interiors", amount: 15500, daysOverdue: 9, failureReason: "card_declined", previousAttempts: 0, disputed: false },
  { id: "INV-1005", customerName: "Suryoday Electricals", amount: 340, daysOverdue: 18, failureReason: "insufficient_funds", previousAttempts: 0, disputed: false },
  { id: "INV-1006", customerName: "Marigold Hospitality Group", amount: 89000, daysOverdue: 52, failureReason: "bank_error", previousAttempts: 3, disputed: false },
  { id: "INV-1007", customerName: "Trishul Auto Components", amount: 175000, daysOverdue: 6, failureReason: "card_declined", previousAttempts: 0, disputed: false },
  { id: "INV-1008", customerName: "Oakridge Learning Systems", amount: 54000, daysOverdue: 21, failureReason: "insufficient_funds", previousAttempts: 1, disputed: false },
  { id: "INV-1009", customerName: "Velvet Fashion House", amount: 63500, daysOverdue: 15, failureReason: "chargeback_filed", previousAttempts: 1, disputed: true },
  { id: "INV-1010", customerName: "Copperline Engineering", amount: 410000, daysOverdue: 38, failureReason: "bank_error", previousAttempts: 2, disputed: false },
];
