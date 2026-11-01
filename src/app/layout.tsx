import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CodeQuest — Learn to Code. Level Up.",
  description: "A gamified programming platform: worlds, levels, XP, streaks and a coding arena.",
};

// Runs before paint so there is no theme flash. Dark is the default.
const themeScript = `
try {
  var t = localStorage.getItem("cq_theme");
  if (t !== "light") document.documentElement.classList.add("dark");
} catch (e) { document.documentElement.classList.add("dark"); }
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
