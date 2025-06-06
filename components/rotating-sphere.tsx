"use client"

import { useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"

interface RotatingSphereProps {
  isVisible: boolean
}

export function RotatingSphere({ isVisible }: RotatingSphereProps) {
  const sphereRef = useRef<HTMLDivElement>(null)

  // Create a shimmering effect with the specific green colors from the reference
  useEffect(() => {
    if (!isVisible || !sphereRef.current) return

    const sphere = sphereRef.current
    let angle = 0

    const updateHighlight = () => {
      angle = (angle + 0.5) % 360
      const x = 50 + 30 * Math.cos((angle * Math.PI) / 180)
      const y = 50 + 30 * Math.sin((angle * Math.PI) / 180)

      // Updated gradient with colors that match the reference image
      sphere.style.background = `radial-gradient(
        circle at ${x}% ${y}%, 
        rgba(205, 240, 120, 0.9) 0%, 
        rgba(160, 210, 80, 1) 30%, 
        rgba(75, 120, 40, 1) 70%, 
        rgba(40, 70, 20, 0.9) 100%
      )`
    }

    const intervalId = setInterval(updateHighlight, 50)
    return () => clearInterval(intervalId)
  }, [isVisible])

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          ref={sphereRef}
          className="rounded-full z-20"
          initial={{ scale: 0 }}
          animate={{
            scale: 1,
            rotate: 360,
          }}
          exit={{ scale: 0 }}
          transition={{
            scale: {
              type: "spring",
              stiffness: 260,
              damping: 20,
              duration: 0.5,
            },
            rotate: {
              duration: 20,
              repeat: Number.POSITIVE_INFINITY,
              ease: "linear",
            },
          }}
          style={{
            background:
              "radial-gradient(circle at 30% 30%, rgba(205, 240, 120, 0.9) 0%, rgba(160, 210, 80, 1) 30%, rgba(75, 120, 40, 1) 70%, rgba(40, 70, 20, 0.9) 100%)",
            width: "2.5rem",
            height: "2.5rem",
            boxShadow: "0 0 15px rgba(120, 180, 60, 0.6), inset 0 0 8px rgba(255, 255, 255, 0.4)",
          }}
        />
      )}
    </AnimatePresence>
  )
}
