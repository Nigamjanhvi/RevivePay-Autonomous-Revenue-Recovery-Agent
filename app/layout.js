import "./globals.css";

export const metadata = {
  title: "RecoverAI — B2B Receivables Recovery Agent",
  description: "Demo: an AI-assisted agent for chasing overdue B2B receivables with deterministic compliance rules.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
