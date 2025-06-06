"use client"

import Spline from "@splinetool/react-spline/next"
import Link from "next/link"

export default function Contact() {
  return (
    <main className="relative w-full h-screen overflow-hidden">
      {/* Back button */}
      <div className="absolute top-4 left-4 z-50">
        <Link
          href="/"
          className="text-white/70 hover:text-white transition-opacity text-sm backdrop-blur-sm bg-black/20 px-3 py-1 rounded-full"
        >
          ← Back
        </Link>
      </div>

      {/* Spline scene */}
      <Spline scene="https://prod.spline.design/NDnzvy6nbYL4C6TA/scene.splinecode" className="w-full h-full" />
    </main>
  )
}
