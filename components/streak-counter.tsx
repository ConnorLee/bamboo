"use client"

import { motion } from "framer-motion"
import { RainbowHalo } from "./rainbow-halo"
import confetti from "canvas-confetti"
import { useRef } from "react"

interface StreakCounterProps {
  streak: number
  isActive: boolean
  onClick: () => void
}

export function StreakCounter({ streak, isActive, onClick }: StreakCounterProps) {
  const buttonRef = useRef<HTMLButtonElement>(null)

  const handleClick = () => {
    // Trigger confetti effect
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      const x = (rect.left + rect.width / 2) / window.innerWidth
      const y = (rect.top + rect.height / 2) / window.innerHeight

      confetti({
        particleCount: 100,
        spread: 70,
        origin: { x, y },
        colors: ["#7CE95E", "#ffffff", "#E8F5E9"],
        zIndex: 1000,
        disableForReducedMotion: true,
      })
    }

    onClick()
  }

  return (
    <button
      ref={buttonRef}
      onClick={handleClick}
      className="relative flex items-center justify-center focus:outline-none"
      aria-label={`Streak counter: ${streak} days`}
    >
      {/* Rainbow halo effect */}
      <RainbowHalo size={300} />

      {/* Pulsing rings */}
      {[...Array(3)].map((_, i) => (
        <motion.div
          key={`ring-${i}`}
          className="absolute rounded-full border border-[#7CE95E]/30"
          style={{
            width: 140 + i * 20,
            height: 140 + i * 20,
          }}
          animate={{
            scale: [1, 1.05, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 3,
            repeat: Number.POSITIVE_INFINITY,
            delay: i * 0.5,
            ease: "easeInOut",
          }}
        />
      ))}

      {/* Center circle with streak number */}
      <motion.div
        className="relative z-10 w-32 h-32 rounded-full bg-[#7CE95E] flex items-center justify-center"
        style={{
          boxShadow: "0 0 15px rgba(124, 233, 94, 0.5)",
        }}
        animate={
          isActive
            ? {
                scale: [1, 1.1, 1],
                transition: { duration: 0.5 },
              }
            : {}
        }
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <span
          className="text-white text-6xl font-bold transition-opacity duration-300"
          style={{ opacity: isActive ? 1 : 0.5 }}
        >
          {streak}
        </span>
      </motion.div>
    </button>
  )
}
