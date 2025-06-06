"use client"

import { motion } from "framer-motion"

interface RainbowHaloProps {
  size?: number
}

export function RainbowHalo({ size = 300 }: RainbowHaloProps) {
  return (
    <motion.div
      className="absolute rounded-full"
      style={{
        width: size,
        height: size,
        background: "transparent",
        boxShadow: `
          0 0 20px 5px rgba(255, 255, 255, 0.2),
          0 0 40px 10px rgba(255, 165, 0, 0.1),
          0 0 60px 15px rgba(255, 215, 0, 0.1),
          0 0 80px 20px rgba(124, 233, 94, 0.1)
        `,
      }}
      animate={{
        scale: [1, 1.02, 1],
        opacity: [0.8, 1, 0.8],
      }}
      transition={{
        duration: 4,
        repeat: Number.POSITIVE_INFINITY,
        repeatType: "reverse",
      }}
    />
  )
}
