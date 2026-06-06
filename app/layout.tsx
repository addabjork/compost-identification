import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Compost Waste Identifier — Eval Results",
  description:
    "Comparing vision model accuracy at identifying compostable vs non-compostable waste",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-gray-950 text-gray-100 antialiased">{children}</body>
    </html>
  );
}
