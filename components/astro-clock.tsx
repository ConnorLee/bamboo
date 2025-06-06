"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Moon, Sun, Star, Sparkles } from "lucide-react"

const colorSchemes = [
  {
    bg: "rgba(255, 249, 196, 0.3)",
    glow: "0 0 40px rgba(255, 236, 127, 0.4)",
    border: "rgba(255, 236, 127, 0.4)",
    mood: "Calm",
  },
  {
    bg: "rgba(255, 180, 180, 0.3)",
    glow: "0 0 40px rgba(255, 129, 129, 0.4)",
    border: "rgba(255, 129, 129, 0.4)",
    mood: "Sensitive",
  },
  {
    bg: "rgba(200, 230, 201, 0.3)",
    glow: "0 0 40px rgba(129, 199, 132, 0.4)",
    border: "rgba(129, 199, 132, 0.4)",
    mood: "Balanced",
  },
]

export function AstroClock() {
  const [date, setDate] = useState(new Date())
  const [colorIndex, setColorIndex] = useState(0)
  const [randomNumber, setRandomNumber] = useState(Math.floor(Math.random() * 30) + 1)

  useEffect(() => {
    const dateTimer = setInterval(() => {
      setDate(new Date())
    }, 1000)

    const colorTimer = setInterval(() => {
      setColorIndex((prevIndex) => (prevIndex + 1) % colorSchemes.length)
      setRandomNumber(Math.floor(Math.random() * 30) + 1) // Generate a new random number between 1 and 30
    }, 4000) // Change color and number every 4 seconds

    return () => {
      clearInterval(dateTimer)
      clearInterval(colorTimer)
    }
  }, [])

  const currentColors = colorSchemes[colorIndex] || colorSchemes[0]

  return (
    <div className="relative w-full max-w-[400px] mx-auto mt-8">
      {" "}
      {/* Added mt-8 for extra top margin */}
      {/* Main clock face */}
      <div
        className="aspect-square rounded-full border-2 backdrop-blur-xl transition-all duration-1000 ease-in-out"
        style={{
          backgroundColor: currentColors.bg,
          boxShadow: currentColors.glow,
          borderColor: currentColors.border,
        }}
      >
        {/* Background lines */}
        <div className="absolute inset-0">
          {[...Array(36)].map((_, i) => (
            <div
              key={`line-${i}`}
              className="absolute top-1/2 left-1/2 w-full h-[1px] origin-left opacity-20 transition-colors duration-1000 ease-in-out"
              style={{
                backgroundColor: "rgba(0, 0, 0, 0.1)",
                transform: `rotate(${i * 10}deg)`,
              }}
            />
          ))}
        </div>

        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div
            className="text-[15vw] sm:text-[120px] transition-all duration-1000 ease-in-out"
            style={{
              fontFamily: "Baskerville, serif",
              color: "#34E85F",
              textShadow: "0 0 20px rgba(52, 232, 95, 0.5)",
            }}
          >
            {randomNumber}
          </div>
          <div
            className="text-base sm:text-xl font-baskerville transition-all duration-1000 ease-in-out"
            style={{
              color: currentColors.border,
            }}
          >
            {currentColors.mood}
          </div>
        </div>

        {/* Orbital rings */}
        {[...Array(3)].map((_, i) => (
          <div
            key={`ring-${i}`}
            className="absolute inset-0 rounded-full border transition-all duration-1000 ease-in-out"
            style={{
              transform: `scale(${0.65 + i * 0.15})`,
              borderColor: currentColors.border,
              opacity: 0.3,
            }}
          />
        ))}

        <AnimatePresence>
          {/* Sun orbit */}
          <motion.div
            key="sun-orbit"
            className="absolute inset-0"
            animate={{
              rotate: 360,
            }}
            transition={{
              duration: 60,
              repeat: Number.POSITIVE_INFINITY,
              ease: "linear",
            }}
          >
            <div className="absolute top-[5%] left-1/2 -translate-x-1/2 text-yellow-500">
              <Sun className="h-4 w-4 sm:h-6 sm:w-6 drop-shadow-[0_0_10px_rgba(255,255,0,0.5)]" />
            </div>
          </motion.div>

          {/* Moon orbit */}
          <motion.div
            key="moon-orbit"
            className="absolute inset-0"
            animate={{
              rotate: -360,
            }}
            transition={{
              duration: 30,
              repeat: Number.POSITIVE_INFINITY,
              ease: "linear",
            }}
          >
            <div className="absolute top-[8%] left-1/2 -translate-x-1/2">
              <Moon className="h-3 w-3 sm:h-5 sm:w-5 text-gray-400 drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]" />
            </div>
          </motion.div>

          {/* Stars orbit */}
          {[...Array(12)].map((_, i) => (
            <motion.div
              key={`star-${i}`}
              className="absolute inset-0"
              animate={{
                rotate: 360,
              }}
              transition={{
                duration: 45,
                repeat: Number.POSITIVE_INFINITY,
                ease: "linear",
                delay: i * 0.5,
              }}
            >
              <div
                className="absolute top-[12%] left-1/2 -translate-x-1/2"
                style={{
                  transform: `rotate(${i * 30}deg)`,
                }}
              >
                <Star className="h-2 w-2 sm:h-3 sm:w-3 text-[#7CE95E] drop-shadow-[0_0_8px_rgba(124,233,94,0.5)]" />
              </div>
            </motion.div>
          ))}

          {/* Sparkles */}
          {[...Array(8)].map((_, i) => (
            <motion.div
              key={`sparkle-${i}`}
              className="absolute inset-0"
              animate={{
                rotate: -360,
              }}
              transition={{
                duration: 30 + i * 5,
                repeat: Number.POSITIVE_INFINITY,
                ease: "linear",
                delay: i * 0.8,
              }}
            >
              <div
                className="absolute top-[15%] left-1/2 -translate-x-1/2"
                style={{
                  transform: `rotate(${i * 45}deg)`,
                }}
              >
                <Sparkles className="h-1 w-1 sm:h-2 sm:w-2 text-white/40" />
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Zodiac symbols */}
        <div className="absolute inset-0">
          {[...Array(12)].map((_, i) => (
            <div
              key={`zodiac-${i}`}
              className="absolute top-[8%] left-1/2 -translate-x-1/2 font-baskerville text-xs sm:text-base transition-colors duration-1000 ease-in-out"
              style={{
                transform: `rotate(${i * 30}deg)`,
                color: currentColors.border,
                opacity: 0.6,
              }}
            >
              <span
                style={{
                  display: "inline-block",
                  transform: `rotate(-${i * 30}deg)`,
                }}
              >
                {["♈", "♉", "♊", "♋", "♌", "♍", "♎", "♏", "♐", "♑", "♒", "♓"][i]}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
