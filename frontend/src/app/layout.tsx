import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";

/* 
  1. FONT CONFIGURATION
  We import the "Outfit" font from Google Fonts. It is a very clean, modern geometric font 
  that looks premium on web apps. We assign it to a CSS variable `--font-outfit` so Tailwind can use it.
*/
const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

/* 
  2. PAGE METADATA
  This controls what shows up in the browser tab and in Google Search results for our application.
*/
export const metadata: Metadata = {
  title: "Al-Mu'allim | Islamic Classroom",
  description: "A modern platform for teachers and students to track daily religious practices and habits.",
};

/* 
  3. ROOT LAYOUT
  This is the main wrapper for our entire application. Every page will be rendered inside this HTML body.
*/
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // We attach our font variable to the <html> tag so it cascades down to all elements.
    // We add suppressHydrationWarning because browser extensions (like Grammarly) 
    // inject code into the HTML, which causes noisy React warnings in development.
    <html lang="en" className={`${outfit.variable} antialiased h-full`} suppressHydrationWarning>
      {/* 
        We use Tailwind classes here:
        - min-h-full & flex-col: Ensures the page takes up the full height of the screen.
        - bg-background & text-foreground: Applies our light/dark mode colors from globals.css.
        - selection:bg-primary-500: When a user highlights text, it highlights in our Deep Green!
      */}
      <body 
        className="min-h-full flex flex-col bg-background text-foreground selection:bg-primary-500 selection:text-white"
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
