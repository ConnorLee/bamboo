import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { Toaster } from "@/components/ui/toaster"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Halo - An Emotional Support Company",
  description: "Design-thinking meets sobriety.",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "32x32" },
      { url: "/favicon.png", sizes: "any" },
    ],
    apple: { url: "/apple-icon.png", sizes: "180x180" },
    shortcut: { url: "/favicon.png" },
  },
  // Add Open Graph metadata
  openGraph: {
    title: "Halo - An Emotional Support Company",
    description: "Design-thinking meets sobriety.",
    url: "https://habithalo.com",
    siteName: "Habit Halo",
    images: [
      {
        url: "/og-image.jpeg",
        width: 1200,
        height: 630,
        alt: "Halo App - Track your progress and stay on your path",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  // Add Twitter card metadata
  twitter: {
    card: "summary_large_image",
    title: "Halo - An Emotional Support Company",
    description: "Design-thinking meets sobriety.",
    images: ["/og-image.jpeg"],
    creator: "@habithalo",
  },
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0" />
        <link rel="icon" href="/favicon.png" type="image/png" sizes="any" />
        <link rel="icon" href="/favicon.ico" sizes="32x32" />
        <link rel="apple-touch-icon" href="/apple-icon.png" />
      </head>
      <body className={`${inter.className} bg-black text-white`}>
        {children}
        <Toaster position="bottom-center" />
      </body>
    </html>
  )
}
