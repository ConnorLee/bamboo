"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useTheme } from "next-themes"

interface ShootingStar {
  id: number
  x: number
  delay: number
}

export const ShootingStars: React.FC = () => {
  const [stars, setStars] = useState<ShootingStar[]>([])
  const { theme } = useTheme()
  const isDark = theme === "dark"

  useEffect(() => {
    const interval = setInterval(() => {
      const newStar: ShootingStar = {
        id: Date.now(),
        x: Math.random() * 100,
        delay: Math.random() * 0.5,
      }
      setStars((prevStars) => [...prevStars, newStar])

      // Remove the star after animation completes
      setTimeout(() => {
        setStars((prevStars) => prevStars.filter((star) => star.id !== newStar.id))
      }, 1000)
    }, 6000)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      <AnimatePresence>
        {stars.map((star) => (
          <motion.div
            key={star.id}
            className="absolute w-0.5 h-0.5 rounded-full"
            style={{
              left: `${star.x}%`,
              backgroundColor: isDark ? "#FFD700" : "#E8E8E8",
              boxShadow: `0 0 4px ${isDark ? "#FFD700" : "#E8E8E8"}`,
            }}
            initial={{ top: "-2%", opacity: 1 }}
            animate={{ top: "102%", opacity: [1, 1, 0] }}
            exit={{ opacity: 0 }}
            transition={{
              duration: 1,
              delay: star.delay,
              ease: "linear",
            }}
          />
        ))}
      </AnimatePresence>
    </div>
  )
}
