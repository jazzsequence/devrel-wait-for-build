import type { Metadata } from "next"
import { Suspense } from "react"
import SiteHeader from "@/components/SiteHeader"
import Footer from "@/components/Footer"
import "@pantheon-systems/pds-toolkit-react/css/pds-core.css"
import "./globals.css"

export const metadata: Metadata = {
  title: "jazzsequence.com",
  description: "Posts from jazzsequence.com via the WordPress REST API",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>
        <Suspense fallback={null}><SiteHeader /></Suspense>
        {children}
        <Suspense fallback={null}><Footer /></Suspense>
      </body>
    </html>
  )
}
