import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
  metadataBase: new URL("https://stenochecker.in"),

  title: {
    default: "StenoCheck – Stenography & Typing Practice",
    template: "%s | StenoCheck",
  },

  description:
    "StenoCheck is an online platform for stenography passage checking, typing practice, accuracy, speed and mistake analysis for competitive exams.",

  keywords: [
    "StenoCheck",
    "steno checker",
    "stenography practice",
    "stenography passage checking",
    "steno typing test",
    "SSC Stenographer typing test",
    "steno passage checker",
    "typing practice",
  ],

  applicationName: "StenoCheck",

  alternates: {
    canonical: "https://stenochecker.in",
  },

  icons: {
    icon: "/logo.png",
    shortcut: "/logo.png",
    apple: "/logo.png",
  },

  openGraph: {
    title: "StenoCheck – Stenography & Typing Practice",
    description:
      "Practice stenography and typing, check passages, accuracy, speed and mistakes with StenoCheck.",
    url: "https://stenochecker.in",
    siteName: "StenoCheck",
    type: "website",
    images: [
      {
        url: "/logo.png",
        width: 512,
        height: 512,
        alt: "StenoCheck Logo",
      },
    ],
  },

  twitter: {
    card: "summary",
    title: "StenoCheck – Stenography & Typing Practice",
    description:
      "Online stenography passage checking and typing practice platform.",
    images: ["/logo.png"],
  },

  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}