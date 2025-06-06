"use client"

import type React from "react"

import Image from "next/image"
import { useState } from "react"
import { AnimatedLogo } from "@/components/animated-logo"
import { AboutSection } from "@/components/about-section"
import { MinimalEmailForm } from "@/components/minimal-email-form"
import { ScrollingMarquee } from "@/components/scrolling-marquee"
import { Navbar } from "@/components/navbar"
import { Toaster } from "@/components/ui/toaster"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"

export default function Home() {
  const [showAbout, setShowAbout] = useState(false)

  const toggleAbout = (e: React.MouseEvent) => {
    e.preventDefault()
    setShowAbout(!showAbout)
  }

  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center relative overflow-hidden">
      {/* Navbar */}
      <Navbar />

      {/* The Facts and About Links - Top Right */}
      <div className="absolute top-4 right-6 z-50 flex items-center gap-3">
        <button
          onClick={toggleAbout}
          className={`text-white/70 hover:text-white transition-all duration-300 text-sm backdrop-blur-sm ${
            showAbout ? "bg-white/20 text-white" : "bg-white/10"
          } px-3 py-1 rounded-full`}
        >
          {showAbout ? "Close" : "The Facts"}
        </button>
        <Link
          href="/contact"
          className="text-white/70 hover:text-white transition-all duration-300 text-sm backdrop-blur-sm bg-white/10 hover:bg-white/20 px-3 py-1 rounded-full"
        >
          About
        </Link>
      </div>

      {/* Top Phone - with subtle animation */}
      <motion.div
        className="absolute top-[-250px] sm:top-[-280px] md:top-[-300px] lg:top-[-350px] left-1/2 transform -translate-x-1/2 z-10"
        animate={{
          y: [0, -8, 0],
          x: [0, 5, 0, -5, 0],
          opacity: showAbout ? 0.3 : 1,
        }}
        transition={{
          y: { duration: 12, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" },
          x: { duration: 12, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" },
          opacity: { duration: 0.5 },
        }}
      >
        <div className="relative w-[420px] h-[840px] sm:w-[460px] sm:h-[920px] md:w-[500px] md:h-[1000px] lg:w-[520px] lg:h-[1040px]">
          <Image
            src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Display%202235%20Copy.png-vaBzHOjhWqmIcGV7lNQJp2AbPodOrs.jpeg"
            alt="Halo App Impulsivity Tracker"
            fill
            className="object-contain"
          />
        </div>
      </motion.div>

      {/* Left Phone - with subtle animation */}
      <motion.div
        className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-2/3 sm:-translate-x-1/2 md:-translate-x-1/3 lg:-translate-x-1/4"
        animate={{
          y: [0, 10, 0],
          x: [0, -5, 0],
          rotate: [-5, -7, -5],
          opacity: showAbout ? 0.3 : 1,
        }}
        transition={{
          y: { duration: 15, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" },
          x: { duration: 15, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" },
          rotate: { duration: 15, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" },
          opacity: { duration: 0.5 },
        }}
      >
        <div className="relative w-[390px] h-[780px] sm:w-[420px] sm:h-[840px] md:w-[460px] md:h-[920px] lg:w-[500px] lg:h-[1000px]">
          <Image
            src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Display%2022352%20Copy.png-oa7vvFXncJW3N9D9zdsyAs5mA29qM1.jpeg"
            alt="Halo App Chat Interface"
            fill
            className="object-contain"
          />
        </div>
      </motion.div>

      {/* Right Phone - with subtle animation and new image */}
      <motion.div
        className="absolute right-0 top-1/2 transform -translate-y-1/2 translate-x-2/3 sm:translate-x-1/2 md:translate-x-1/3 lg:translate-x-1/4"
        animate={{
          y: [0, -10, 0],
          x: [0, 8, 0],
          rotate: [5, 7, 5],
          opacity: showAbout ? 0.3 : 1,
        }}
        transition={{
          y: { duration: 18, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" },
          x: { duration: 18, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" },
          rotate: { duration: 18, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" },
          opacity: { duration: 0.5 },
        }}
      >
        <div className="relative w-[310px] h-[620px] sm:w-[340px] sm:h-[680px] md:w-[370px] md:h-[740px] lg:w-[390px] lg:h-[780px]">
          <Image
            src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Display%2022358%20Copy-7a1skef2WHINvuObaaupljJyGdKjOu.png"
            alt="Halo App Sober Journey Screen"
            fill
            className="object-contain"
          />
        </div>
      </motion.div>

      {/* Center Content */}
      <div className="z-20 flex flex-col items-center justify-center gap-8 px-4">
        <AnimatePresence mode="wait">
          {showAbout ? (
            <motion.div
              key="about"
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: -20 }}
              transition={{ duration: 0.6, ease: "easeInOut" }}
            >
              <AboutSection />
            </motion.div>
          ) : (
            <motion.div
              key="logo"
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: -20 }}
              transition={{ duration: 0.6, ease: "easeInOut" }}
            >
              <AnimatedLogo />
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div animate={{ opacity: showAbout ? 0.5 : 1 }} transition={{ duration: 0.5 }}>
          <MinimalEmailForm />
        </motion.div>
      </div>

      {/* Bottom Gradient */}
      <div
        className="absolute bottom-0 left-0 right-0 h-[300px] z-20 pointer-events-none"
        style={{
          background:
            "linear-gradient(to top, rgba(0,0,0,1) 0%, rgba(0,0,0,0.8) 40%, rgba(0,0,0,0.4) 70%, rgba(0,0,0,0) 100%)",
        }}
      />

      {/* Scrolling Marquee - Increased z-index to appear above gradient */}
      <div className="z-30">
        <ScrollingMarquee />
      </div>

      {/* Copyright Footer - moved to far left */}
      <div className="absolute bottom-2 left-6 z-30">
        <p className="text-white/20 text-xs font-light">© 2025 Habit Halo</p>
      </div>

      <Toaster position="bottom-center" />
    </main>
  )
}
