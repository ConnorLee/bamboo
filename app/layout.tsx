import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { Toaster } from "@/components/ui/toaster"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  metadataBase: new URL("https://www.habithalo.app"),
  title: "Halo — A support system. For your progress.",
  description: "Meet Halo. A support system for your sober journey.",
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
    title: "Halo — A support system. For your progress.",
    description: "Meet Halo. A support system for your sober journey.",
    url: "https://www.habithalo.app",
    siteName: "Halo",
    images: [
      {
        url: "/social/halo-support-v1.jpg",
        width: 1200,
        height: 630,
        type: "image/jpeg",
        alt: "Halo — A support system. For your progress. A silver bracelet concept with an amethyst milestone stone, lit in violet against a dark background.",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  // Add Twitter card metadata
  twitter: {
    card: "summary_large_image",
    title: "Halo — A support system. For your progress.",
    description: "Meet Halo. A support system for your sober journey.",
    images: [{ url: "/social/halo-support-v1.jpg", alt: "Halo — A support system. For your progress. Silver and amethyst bracelet concept in violet light." }],
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
        <meta name="color-scheme" content="dark" />
        <link rel="icon" href="/favicon.png" type="image/png" sizes="any" />
        <link rel="icon" href="/favicon.ico" sizes="32x32" />
        <link rel="apple-touch-icon" href="/apple-icon.png" />
        <style
          dangerouslySetInnerHTML={{
            __html: `
            html, body {
              background-color: #000000 !important;
              color: #ffffff !important;
              margin: 0;
              padding: 0;
              width: 100%;
              height: 100%;
              overflow-x: hidden;
            }
            * {
              box-sizing: border-box;
            }
          `,
          }}
        />
      </head>
      <body className={`${inter.className} bg-black text-white min-h-screen`}>
        {children}
        <Toaster />
      </body>
    </html>
  )
}
