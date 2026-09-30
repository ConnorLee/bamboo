import type { Metadata } from "next"
import { LegacyHomepage } from "@/components/legacy-homepage"

export const metadata: Metadata = {
  title: "About Halo — An Emotional Support Company",
  description: "Design-thinking meets sobriety. Get to know Halo and join the waitlist.",
  alternates: { canonical: "/about" },
  openGraph: {
    title: "About Halo — An Emotional Support Company",
    description: "Design-thinking meets sobriety. Get to know Halo and join the waitlist.",
    url: "/about",
    siteName: "Halo",
    type: "website",
    images: [{ url: "/og-image.jpeg", width: 1200, height: 630, alt: "Halo app" }],
  },
}

export default function AboutPage() {
  return <LegacyHomepage />
}
