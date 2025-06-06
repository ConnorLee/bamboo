"use client"

import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"
import { AnimatedStarsBackground } from "./animated-stars-background"
import { useEffect, useState } from "react"

const twinkleKeyframes = `
@keyframes twinkle {
  0%, 100% { opacity: 0.2; }
  50% { opacity: 0.7; }
}
`

const adviceWords = ["release", "exercise", "embrace"]
const moodColors = [
  "rgb(124, 233, 94)", // Green
  "rgb(255, 183, 77)", // Orange
  "rgb(255, 121, 121)", // Red
  "rgb(130, 177, 255)", // Blue
]

const getMoodColor = (moodNumber) => {
  const normalizedMood = Math.min(Math.max(moodNumber, 0), 10) / 10
  const green = moodColors[0]
  const red = moodColors[2]
  const r =
    Number.parseInt(red.slice(4, 7).split(",")[0]) * normalizedMood +
    Number.parseInt(green.slice(4, 7).split(",")[0]) * (1 - normalizedMood)
  const g =
    Number.parseInt(red.slice(4, 7).split(",")[1]) * normalizedMood +
    Number.parseInt(green.slice(4, 7).split(",")[1]) * (1 - normalizedMood)
  const b =
    Number.parseInt(red.slice(4, 7).split(",")[2]) * normalizedMood +
    Number.parseInt(green.slice(4, 7).split(",")[2]) * (1 - normalizedMood)
  return `rgb(${r}, ${g}, ${b})`
}

export function FeaturesSection() {
  const [currentAdvice, setCurrentAdvice] = useState(0)
  const [activeCheckmark, setActiveCheckmark] = useState(false)
  const [moodColor, setMoodColor] = useState(0)
  const [moodNumber, setMoodNumber] = useState(5)

  useEffect(() => {
    const style = document.createElement("style")
    style.textContent = twinkleKeyframes
    document.head.appendChild(style)
    return () => {
      document.head.removeChild(style)
    }
  }, [])

  useEffect(() => {
    const adviceInterval = setInterval(() => {
      setCurrentAdvice((prev) => (prev + 1) % adviceWords.length)
    }, 4000)

    const checkmarkInterval = setInterval(() => {
      setActiveCheckmark((prev) => !prev)
    }, 3000)

    const colorInterval = setInterval(() => {
      setMoodColor((prev) => (prev + 1) % moodColors.length)
      setMoodNumber((prevMood) => {
        const newMood = Math.min(Math.max(prevMood + (Math.random() - 0.5), 0), 10)
        return Number.parseFloat(newMood.toFixed(1))
      })
    }, 5000)

    return () => {
      clearInterval(adviceInterval)
      clearInterval(checkmarkInterval)
      clearInterval(colorInterval)
    }
  }, [])

  return (
    <section className="py-20 bg-[#EFE7D7] relative overflow-hidden">
      <AnimatedStarsBackground />
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-medium mb-4 font-comfortaa tracking-tight text-black">
            Your Cosmic Companion
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto font-comfortaa">
            Halo combines astrology with habit tracking to provide you with personalized insights and guidance.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {/* Personalized Advice */}
          <motion.div
            className="text-center"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0 }}
          >
            <h3 className="font-baskervville text-base tracking-[0.2em] mb-6 text-black">PERSONALIZED ADVICE</h3>
            <div className="bg-gray-900 rounded-3xl p-8 shadow-lg relative overflow-hidden">
              {[...Array(20)].map((_, i) => (
                <div
                  key={i}
                  className="absolute"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                    width: "1px",
                    height: "1px",
                    backgroundColor: "white",
                    opacity: Math.random() * 0.5 + 0.2,
                    animation: `twinkle ${Math.random() * 3 + 2}s infinite ease-in-out`,
                  }}
                />
              ))}
              <div className="relative h-48 w-48 mx-auto flex items-center justify-center">
                <AnimatePresence mode="wait">
                  <motion.span
                    key={currentAdvice}
                    className="absolute font-baskervville text-2xl text-white"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 1 }}
                  >
                    "{adviceWords[currentAdvice]}"
                  </motion.span>
                </AnimatePresence>
              </div>
            </div>
          </motion.div>

          {/* Emotional Forecast */}
          <motion.div
            className="text-center"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <h3 className="font-baskervville text-base tracking-[0.2em] mb-6 text-black">EMOTIONAL FORECAST</h3>
            <div className="bg-gray-900 rounded-3xl p-8 shadow-lg relative overflow-hidden">
              {[...Array(20)].map((_, i) => (
                <div
                  key={i}
                  className="absolute"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                    width: "1px",
                    height: "1px",
                    backgroundColor: "white",
                    opacity: Math.random() * 0.5 + 0.2,
                    animation: `twinkle ${Math.random() * 3 + 2}s infinite ease-in-out`,
                  }}
                />
              ))}
              <div className="relative h-48 w-48 mx-auto">
                <motion.div
                  animate={{
                    rotate: 360,
                  }}
                  transition={{
                    rotate: {
                      duration: 20,
                      repeat: Number.POSITIVE_INFINITY,
                      ease: "linear",
                    },
                  }}
                  className="absolute inset-0 opacity-50"
                  style={{
                    backgroundColor: getMoodColor(moodNumber),
                    filter: `hue-rotate(${moodColor * 90}deg)`,
                  }}
                >
                  <Image
                    src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Group%203%20Copy%204-rRiMqOwsvm0y9VxV7MO1WBRYZdiNaz.png"
                    alt="Emotional forecast indicator"
                    fill
                    className="object-contain"
                  />
                </motion.div>
                <motion.div
                  animate={{ color: moodColors[moodColor] }}
                  transition={{ duration: 2 }}
                  className="absolute inset-0 flex items-center justify-center z-10"
                >
                  <span className="font-baskervville text-5xl text-white">{moodNumber.toFixed(1)}</span>
                </motion.div>
                <motion.div
                  animate={{
                    rotate: -360,
                  }}
                  transition={{
                    rotate: {
                      duration: 40,
                      repeat: Number.POSITIVE_INFINITY,
                      ease: "linear",
                    },
                  }}
                  className="absolute inset-0"
                  style={{
                    width: "100%",
                    height: "100%",
                  }}
                >
                  <svg viewBox="0 0 100 100" className="w-full h-full">
                    <defs>
                      <path id="curve" d="M 50, 50 m -37, 0 a 37,37 0 1,1 74,0 a 37,37 0 1,1 -74,0" fill="none" />
                    </defs>
                    <text
                      fontSize="5px"
                      letterSpacing="2px"
                      className="font-comfortaa uppercase"
                      fill="rgba(255, 255, 255, 0.7)"
                    >
                      <textPath xlinkHref="#curve">
                        reading • reading • reading • reading • reading • reading •
                      </textPath>
                    </text>
                  </svg>
                </motion.div>
              </div>
            </div>
          </motion.div>

          {/* Daily Check-ins */}
          <motion.div
            className="text-center"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <h3 className="font-baskervville text-base tracking-[0.2em] mb-6 text-black">DAILY CHECK-INS</h3>
            <div className="bg-gray-900 rounded-3xl p-8 shadow-lg relative overflow-hidden">
              {[...Array(20)].map((_, i) => (
                <div
                  key={i}
                  className="absolute"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                    width: "1px",
                    height: "1px",
                    backgroundColor: "white",
                    opacity: Math.random() * 0.5 + 0.2,
                    animation: `twinkle ${Math.random() * 3 + 2}s infinite ease-in-out`,
                  }}
                />
              ))}
              <div className="relative h-48 w-48 mx-auto">
                <div className="absolute inset-0 border-2 border-[#7CE95E]/20 rounded-lg" />
                <AnimatePresence mode="wait">
                  {activeCheckmark && (
                    <motion.div
                      key="checkmark"
                      className="absolute inset-0 flex items-center justify-center"
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.5 }}
                      transition={{
                        duration: 0.5,
                        type: "spring",
                        stiffness: 200,
                        damping: 10,
                      }}
                    >
                      <div className="relative w-24 h-24">
                        <Image
                          src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Group%202%20Copy%203-h4PzLktm1ObCfkabK2HRDILqKDNJ2d.png"
                          alt="Check-in confirmation"
                          fill
                          className="object-contain"
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
                <AnimatePresence>
                  {activeCheckmark && (
                    <motion.div
                      key="ripple"
                      className="absolute inset-0 rounded-lg"
                      initial={{ scale: 0.5, opacity: 1, borderWidth: 0 }}
                      animate={{ scale: 1.5, opacity: 0, borderWidth: 4 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 1, ease: "easeOut" }}
                      style={{
                        border: "2px solid #7CE95E",
                      }}
                    />
                  )}
                </AnimatePresence>
                <AnimatePresence>
                  {activeCheckmark && (
                    <>
                      {[...Array(5)].map((_, index) => (
                        <motion.div
                          key={`plus-one-${index}`}
                          className="absolute text-[#7CE95E] font-bold text-lg"
                          initial={{
                            opacity: 0,
                            scale: 0.5,
                            x: 0,
                            y: 0,
                          }}
                          animate={{
                            opacity: [0, 1, 0],
                            scale: [0.5, 1.5, 1],
                            x: Math.cos(index * Math.PI * 0.4) * 50,
                            y: Math.sin(index * Math.PI * 0.4) * 50 - 25,
                          }}
                          transition={{
                            duration: 1.5,
                            times: [0, 0.3, 1],
                            ease: "easeOut",
                          }}
                          aria-hidden="true"
                        >
                          +1
                        </motion.div>
                      ))}
                    </>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
