"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { format } from "date-fns"
import Link from "next/link"
import { StreakCounter } from "@/components/streak-counter"
import { useRouter } from "next/navigation"
import { DeviceMockup } from "@/components/device-mockup"

export default function DemoPage() {
  const [currentBackground, setCurrentBackground] = useState(0)
  const [streak, setStreak] = useState(14)
  const [hasCheckedIn, setHasCheckedIn] = useState(false)
  const router = useRouter()

  const backgrounds = [
    "/backgrounds/mountain-halo.jpeg",
    "/backgrounds/forest-halo.jpeg",
    "/backgrounds/ocean-halo.jpeg",
    "/backgrounds/valley-halo.jpeg",
    "/backgrounds/tree-halo.jpeg",
  ]

  // Change background every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentBackground((prev) => (prev + 1) % backgrounds.length)
    }, 10000)
    return () => clearInterval(interval)
  }, [])

  const handleCheckIn = () => {
    if (!hasCheckedIn) {
      setHasCheckedIn(true)

      // Navigate to home screen after a short delay to allow animation to play
      setTimeout(() => {
        router.push("/demo/home")
      }, 800)
    }
  }

  const content = (
    <div className="relative h-screen w-full overflow-hidden">
      {/* Background Image */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentBackground}
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${backgrounds[currentBackground]})` }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.5 }}
        />
      </AnimatePresence>

      {/* Overlay for better text readability */}
      <div className="absolute inset-0 bg-black/10" />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-between h-full py-8 px-4">
        {/* Header */}
        <div className="w-full flex justify-between items-center">
          <Link
            href="/"
            className="text-white/70 hover:text-white transition-opacity text-sm backdrop-blur-sm bg-black/20 px-3 py-1 rounded-full"
          >
            ← Back to Home
          </Link>
          <div className="text-white/70 text-sm backdrop-blur-sm bg-black/20 px-3 py-1 rounded-full">Demo Mode</div>
        </div>

        {/* Streak Counter */}
        <div className="flex-1 flex items-center justify-center">
          <StreakCounter streak={streak} isActive={hasCheckedIn} onClick={handleCheckIn} />
        </div>

        {/* Bottom Text */}
        <div className="flex flex-col items-center space-y-6 mb-8">
          <p className="text-white text-xl font-light text-center drop-shadow-md">tap the halo to show up today</p>
          <p className="text-white text-3xl font-medium text-center drop-shadow-md">
            {format(new Date(), "EEEE, MMMM do")}
          </p>
        </div>
      </div>
    </div>
  )

  return <DeviceMockup>{content}</DeviceMockup>
}
