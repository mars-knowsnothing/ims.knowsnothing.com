import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from 'next/link';
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Mars' Personal Website",
  description: "A personal website for Mars, built with Next.js and FastAPI.",
};

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/blog', label: 'Blog' },
  { href: '/bookshelf', label: 'Bookshelf' },
  { href: '/movies', label: 'Movies' },
  { href: '/chat', label: 'Chat' },
];

function Header() {
  return (
    <header className="bg-gray-900 text-white shadow-md">
      <nav className="container mx-auto px-4 py-4 flex justify-between items-center">
        <Link href="/" className="text-2xl font-bold text-cyan-400">
          Mars
        </Link>
        <div className="space-x-4">
          {navLinks.map(link => (
            <Link key={link.href} href={link.href} className="text-gray-300 hover:text-white transition-colors">
              {link.label}
            </Link>
          ))}
        </div>
      </nav>
    </header>
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="bg-gray-900">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased font-sans`}
      >
        <Header />
        {children}
      </body>
    </html>
  );
}
