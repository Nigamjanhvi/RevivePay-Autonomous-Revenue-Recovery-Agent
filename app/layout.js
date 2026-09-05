import "./globals.css";

export const metadata = {
  title: "RevivePay — AI Revenue Recovery Agent",
  description: "Recover failed payments with AI-powered diagnosis, personalized outreach and Payment Links.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
