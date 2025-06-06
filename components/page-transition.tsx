"use client"

import { motion } from "framer-motion"
import { useState } from "react"
import { useRouter } from "next/navigation"

interface PageTransitionProps {
  targetPath: string
  direction?: "left" | "right" | "up" | "down"
  color?: string
  duration?: number
}

export function PageTransition({
  targetPath,
  direction = "left",
  color = "#000",
  duration = 0.8,
}: PageTransitionProps) {
  const router = useRouter()
  const [isAnimating, setIsAnimating] = useState(false)

  // Set up directional variants
  const getVariants = () => {
    switch (direction) {
      case "left":
        return {
          initial: { x: "100%", width: "100%" },
          animate: { x: "0%", width: "100%" },
          exit: { x: "-100%", width: "100%" },
        }
      case "right":
        return {
          initial: { x: "-100%", width: "100%" },
          animate: { x: "0%", width: "100%" },
          exit: { x: "100%", width: "100%" },
        }
      case "up":
        return {
          initial: { y: "100%", height: "100%" },
          animate: { y: "0%", height: "100%" },
          exit: { y: "-100%", height: "100%" },
        }
      case "down":
        return {
          initial: { y: "-100%", height: "100%" },
          animate: { y: "0%", height: "100%" },
          exit: { y: "100%", height: "100%" },
        }
      default:
        return {
          initial: { x: "100%", width: "100%" },
          animate: { x: "0%", width: "100%" },
          exit: { x: "-100%", width: "100%" },
        }
    }
  }

  const variants = getVariants()

  const handleTransition = () => {
    setIsAnimating(true)
    // Navigate after animation completes
    setTimeout(
      () => {
        router.push(targetPath)
      },
      duration * 1000 * 0.8,
    ) // Navigate slightly before animation completes
  }

  return (
    <>
      {isAnimating && (
        <motion.div
          className="fixed inset-0 z-[100] pointer-events-none"
          initial="initial"
          animate="animate"
          variants={variants}
          transition={{ duration, ease: [0.22, 1, 0.36, 1] }}
          style={{ backgroundColor: color }}
        />
      )}
      <button
        onClick={handleTransition}
        className="text-white/70 hover:text-white transition-all duration-300 text-sm backdrop-blur-sm bg-white/10 hover:bg-white/20 px-3 py-1 rounded-full"
      >
        About
      </button>
    </>
  )
}
