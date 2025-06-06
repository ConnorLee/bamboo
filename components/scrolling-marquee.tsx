"use client"

import { motion } from "framer-motion"

export function ScrollingMarquee() {
  // Create an array with multiple copies of the text to ensure continuous scrolling
  const marqueeVariants = {
    animate: {
      x: [0, -1000],
      transition: {
        x: {
          repeat: Number.POSITIVE_INFINITY,
          repeatType: "loop",
          duration: 40,
          ease: "linear",
        },
      },
    },
  }

  const text = "AN EMOTIONAL SUPPORT COMPANY • LOS ANGELES, CA • "
  // Repeat the text multiple times to ensure it fills the screen width
  const repeatedText = Array(10).fill(text).join("")

  return (
    <div className="fixed bottom-8 left-0 right-0 overflow-hidden bg-transparent py-4 z-30 opacity-60">
      <motion.div className="whitespace-nowrap" variants={marqueeVariants} animate="animate">
        <span className="inline-block text-white text-xs tracking-[0.2em] uppercase font-light">{repeatedText}</span>
      </motion.div>
    </div>
  )
}
