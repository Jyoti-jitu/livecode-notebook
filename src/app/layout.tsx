import type { Metadata } from "next";
import { Outfit, Geist_Mono } from "next/font/google";
import "./globals.css";

const outfit = Outfit({ variable: "--font-outfit", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "LiveCode Notebook — Real-time Collaborative Code Editor",
  description: "A modern collaborative coding and learning platform with Monaco Editor, Yjs real-time sync, and Jupyter-style notebooks.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${outfit.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-gradient-to-br from-love-bg-start via-love-bg-middle to-love-bg-end dark:from-love-dark-bg dark:via-love-dark dark:to-neutral-900 transition-colors duration-300">
        {children}
      </body>
    </html>
  );
}
