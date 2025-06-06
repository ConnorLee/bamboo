"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"

const bannerContent = [
  {
    text: "Your guide to modern sobriety.",
    bgColor: "rgba(244, 164, 96, 0.4)", // Orange with 40% opacity
  },
  {
    text: "The future of sobriety starts here.",
    bgColor: "rgba(139, 69, 19, 0.4)", // Brown/rust with 40% opacity
  },
  {
    text: "Sobriety, reimagined for the 21st century.",
    bgColor: "rgba(147, 112, 219, 0.4)", // Purple/lavender with 40% opacity
  },
  {
    text: "Navigate your journey, one streak at a time.",
    bgColor: "rgba(255, 69, 0, 0.4)", // Red with 40% opacity
  },
  {
    text: "Empowering change, fueled by the stars.",
    bgColor: "rgba(64, 224, 208, 0.4)", // Turquoise with 40% opacity
  },
  {
    text: "Your habits, aligned with the universe.",
    bgColor: "rgba(124, 233, 94, 0.4)", // Original green with 40% opacity
  },
  {
    text: "Sobriety just met its match.",
    bgColor: "rgba(255, 215, 0, 0.4)", // Yellow with 40% opacity
  },
  {
    text: "Where progress meets purpose.",
    bgColor: "rgba(244, 164, 96, 0.4)", // Back to orange with 40% opacity
  },
  {
    text: "Redefining recovery with cosmic clarity.",
    bgColor: "rgba(147, 112, 219, 0.4)", // Back to purple with 40% opacity
  },
  {
    text: "Consistency meets the cosmos.",
    bgColor: "rgba(64, 224, 208, 0.4)", // Back to turquoise with 40% opacity
  },
]

export function RotatingBanner() {
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % bannerContent.length)
    }, 5000) // Change text every 5 seconds

    return () => clearInterval(interval)
  }, [])

  return (
    <div
      className="py-4 overflow-hidden transition-colors duration-1000 ease-in-out"
      style={{
        backgroundColor: bannerContent[currentIndex].bgColor,
      }}
    >
      <div className="container mx-auto px-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
            className="text-center font-baskervville text-lg text-black"
            style={{ opacity: 1 }} // Ensure text is fully opaque
          >
            {bannerContent[currentIndex].text}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
