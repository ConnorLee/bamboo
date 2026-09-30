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
    images: [{ url: "/social/halo-support-v1.jpg", width: 1200, height: 630, type: "image/jpeg", alt: "Halo — A support system. For your progress. Silver and amethyst bracelet concept in violet light." }],
  },
}

export default function AboutPage() {
  return <LegacyHomepage />
}
