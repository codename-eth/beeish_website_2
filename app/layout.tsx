import type React from "react"
import type { Metadata } from "next"
import "./globals.css"
import { Providers } from "@/app/providers"
import { Toaster } from "@/components/ui/toaster"

// For Google Fonts that aren't directly supported in next/font/google,
// we can use a more reliable approach with next/font/local
// First, we'll use a fallback font while we set up the custom font
import { Fredoka } from "next/font/google"

// Use Fredoka as a fallback (it's a fun, bold font similar to what you might want)
const fredoka = Fredoka({
  weight: ["700"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-fredoka",
})

export const metadata: Metadata = {
  title: "Beeish",
  description: "Bee with us.",
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: { url: "/apple-icon.png", sizes: "180x180", type: "image/png" },
  },
  openGraph: {
    title: "Beeish",
    description: "Bee with us.",
    images: [{ url: "/bee-mascot.png", width: 1200, height: 630 }],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Beeish",
    description: "Bee with us.",
    images: ["/bee-mascot.png"],
  },
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${fredoka.variable}`}>
      <body className={`${fredoka.className} font-display font-extrabold`}>
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  )
}
