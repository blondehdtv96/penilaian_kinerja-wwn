import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "VoO / Ide Kaizen - Performance Management System",
  description: "Bridgestone Operator Performance Management",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body className="antialiased">{children}</body>
    </html>
  );
}
