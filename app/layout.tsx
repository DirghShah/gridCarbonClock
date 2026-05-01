import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Grid Carbon Clock — When is Texas electricity cleanest?",
  description:
    "Live carbon intensity of the ERCOT grid plus a 24-hour forecast. Run your dishwasher, charge your EV, and pre-cool your house when the grid is cleanest.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
