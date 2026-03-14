import type { Metadata } from "next";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = {
  title: "CAT 2026 Puzzle Practice",
  description: "Daily Sudoku and Kakuro practice for CAT 2026",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-black text-green-400">
        <SiteHeader />
        {children}
      </body>
    </html>
  );
}