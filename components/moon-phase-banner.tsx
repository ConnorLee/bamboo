"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"

const moonPhases = [
  { phase: "New Moon", mood: "Introspective" },
  { phase: "Waxing Crescent", mood: "Hopeful" },
  { phase: "First Quarter", mood: "Determined" },
  { phase: "Waxing Gibbous", mood: "Energetic" },
  { phase: "Full Moon", mood: "Illuminated" },
  { phase: "Waning Gibbous", mood: "Grateful" },
  { phase: "Last Quarter", mood: "Reflective" },
  { phase: "Waning Crescent", mood: "Releasing" },
]

const Star = ({ x, y }: { x: number; y: number }) => (
  <motion.div
    className="absolute w-1 h-1 bg-white rounded-full"
    style={{ left: `${x}%`, top: `${y}%` }}
    animate={{
      opacity: [0.2, 1, 0.2],
      scale: [1, 1.2, 1],
    }}
    transition={{
      duration: Math.random() * 3 + 2,
      repeat: Number.POSITIVE_INFINITY,
      repeatType: "reverse",
    }}
  />
)

const Moon = ({ phase }: { phase: number }) => (
  <motion.div
    className="absolute w-8 h-8 bg-gray-300 rounded-full overflow-hidden"
    style={{
      right: "10%",
      top: "50%",
      transform: "translateY(-50%)",
    }}
    animate={{
      x: [0, 10, 0],
      y: [0, -5, 0],
    }}
    transition={{
      duration: 5,
      repeat: Number.POSITIVE_INFINITY,
      repeatType: "reverse",
    }}
  >
    <div
      className="absolute inset-0 bg-gray-800"
      style={{
        clipPath: `inset(0 ${50 - phase * 50}% 0 0)`,
      }}
    />
  </motion.div>
)

async function fetchMoonPhase() {
  try {
    const response = await fetch(`https://api.farmsense.net/v1/moonphases/?d=${Math.floor(Date.now() / 1000)}`)
    const data = await response.json()
    return {
      moonPhase: data[0].Phase,
      illumination: data[0].Illumination,
    }
  } catch (error) {
    console.error("Error fetching moon phase data:", error)
    return null
  }
}

export function MoonPhaseBanner() {
  const [currentPhase, setCurrentPhase] = useState(moonPhases[0])
  const [moonPhaseValue, setMoonPhaseValue] = useState(0)

  useEffect(() => {
    const updateMoonPhase = async () => {
      const data = await fetchMoonPhase()
      if (data) {
        const { moonPhase, illumination } = data
        setMoonPhaseValue(illumination)
        const matchedPhase = moonPhases.find((p) => p.phase.toLowerCase().includes(moonPhase.toLowerCase()))
        if (matchedPhase) {
          setCurrentPhase(matchedPhase)
        }
      }
    }

    updateMoonPhase()
    const interval = setInterval(updateMoonPhase, 3600000) // Update every hour

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="relative bg-gray-900 py-6 overflow-hidden">
      {[...Array(20)].map((_, i) => (
        <Star key={i} x={Math.random() * 100} y={Math.random() * 100} />
      ))}
      <Moon phase={moonPhaseValue} />
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center font-baskervville text-xs uppercase tracking-[3px] text-gray-300">
          Current Moon Phase: <span className="font-bold">{currentPhase.phase}</span> - General Mood:{" "}
          <span className="font-bold">{currentPhase.mood}</span>
        </div>
      </div>
    </div>
  )
}
