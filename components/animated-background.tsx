"use client"

import { motion } from "framer-motion"
import { useEffect, useState } from "react"

const NUM_STARS = 150
const NUM_CONSTELLATIONS = 15
const NUM_CONNECTING_LINES = 40
const NUM_BACKGROUND_CIRCLES = 8

interface Star {
  x: number
  y: number
  size: number
  delay: number
}

interface Constellation {
  points: { x: number; y: number }[]
  delay: number
}

interface ConnectingLine {
  start: { x: number; y: number }
  end: { x: number; y: number }
  delay: number
}

interface BackgroundCircle {
  x: number
  y: number
  size: number
  delay: number
}

export function AnimatedBackground() {
  const [stars, setStars] = useState<Star[]>([])
  const [constellations, setConstellations] = useState<Constellation[]>([])
  const [connectingLines, setConnectingLines] = useState<ConnectingLine[]>([])
  const [backgroundCircles, setBackgroundCircles] = useState<BackgroundCircle[]>([])

  useEffect(() => {
    // Generate random stars
    const newStars = Array.from({ length: NUM_STARS }, () => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 2 + 0.5,
      delay: Math.random() * 5,
    }))
    setStars(newStars)

    // Generate random constellations with more complex patterns
    const newConstellations = Array.from({ length: NUM_CONSTELLATIONS }, () => {
      const numPoints = Math.floor(Math.random() * 9) + 7
      const centerX = Math.random() * 100
      const centerY = Math.random() * 100
      const radius = Math.random() * 20 + 5

      const points = Array.from({ length: numPoints }, (_, i) => {
        const angle = (i / numPoints) * Math.PI * 2
        const distance = radius * (0.5 + Math.random() * 0.5)
        return {
          x: centerX + Math.cos(angle) * distance,
          y: centerY + Math.sin(angle) * distance,
        }
      })
      return {
        points,
        delay: Math.random() * 5,
      }
    })
    setConstellations(newConstellations)

    // Generate connecting lines between constellations
    const newConnectingLines = Array.from({ length: NUM_CONNECTING_LINES }, () => ({
      start: { x: Math.random() * 100, y: Math.random() * 100 },
      end: { x: Math.random() * 100, y: Math.random() * 100 },
      delay: Math.random() * 5,
    }))
    setConnectingLines(newConnectingLines)

    // Generate background circles
    const newBackgroundCircles = Array.from({ length: NUM_BACKGROUND_CIRCLES }, () => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 30 + 10,
      delay: Math.random() * 5,
    }))
    setBackgroundCircles(newBackgroundCircles)
  }, [])

  return (
    <div className="absolute inset-0 overflow-hidden bg-gray-50">
      {/* Background circles */}
      {backgroundCircles.map((circle, i) => (
        <motion.div
          key={`bg-circle-${i}`}
          className="absolute rounded-full border border-gray-200"
          style={{
            left: `${circle.x}%`,
            top: `${circle.y}%`,
            width: `${circle.size}%`,
            height: `${circle.size}%`,
          }}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 0.2 }}
          transition={{
            duration: 10,
            delay: circle.delay,
            repeat: Number.POSITIVE_INFINITY,
            repeatType: "reverse",
            ease: "easeInOut",
          }}
        />
      ))}

      {/* Background connecting lines */}
      <svg className="absolute inset-0 w-full h-full">
        {connectingLines.map((line, i) => (
          <motion.line
            key={`line-${i}`}
            x1={`${line.start.x}%`}
            y1={`${line.start.y}%`}
            x2={`${line.end.x}%`}
            y2={`${line.end.y}%`}
            stroke="rgba(156, 163, 175, 0.15)"
            strokeWidth="0.5"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{
              duration: 4,
              delay: line.delay,
              repeat: Number.POSITIVE_INFINITY,
              repeatType: "reverse",
              ease: "easeInOut",
            }}
          />
        ))}
      </svg>

      {/* Stars */}
      {stars.map((star, i) => (
        <motion.div
          key={`star-${i}`}
          className="absolute rounded-full bg-gray-400"
          style={{
            left: `${star.x}%`,
            top: `${star.y}%`,
            width: star.size,
            height: star.size,
          }}
          animate={{
            opacity: [0.2, 0.8, 0.2],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 3,
            delay: star.delay,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
          }}
        />
      ))}

      {/* Constellations */}
      {constellations.map((constellation, i) => (
        <svg key={`constellation-${i}`} className="absolute inset-0 w-full h-full">
          {/* Complex constellation patterns */}
          <motion.path
            d={`M ${constellation.points.map((p) => `${p.x} ${p.y}`).join(" L ")} Z`}
            fill="none"
            stroke="rgba(156, 163, 175, 0.2)"
            strokeWidth="0.5"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{
              duration: 4,
              delay: constellation.delay,
              repeat: Number.POSITIVE_INFINITY,
              repeatType: "reverse",
              ease: "easeInOut",
            }}
          />

          {/* Additional connecting lines within constellation */}
          {constellation.points.map((point, j) => (
            <motion.line
              key={`inner-line-${i}-${j}`}
              x1={`${point.x}`}
              y1={`${point.y}`}
              x2={`${constellation.points[(j + 3) % constellation.points.length].x}`}
              y2={`${constellation.points[(j + 3) % constellation.points.length].y}`}
              stroke="rgba(156, 163, 175, 0.1)"
              strokeWidth="0.5"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{
                duration: 3,
                delay: constellation.delay + j * 0.2,
                repeat: Number.POSITIVE_INFINITY,
                repeatType: "reverse",
                ease: "easeInOut",
              }}
            />
          ))}

          {/* Constellation points */}
          {constellation.points.map((point, j) => (
            <motion.circle
              key={`point-${i}-${j}`}
              cx={point.x}
              cy={point.y}
              r="1"
              fill="rgba(156, 163, 175, 0.4)"
              initial={{ scale: 0 }}
              animate={{ scale: [0, 1, 0] }}
              transition={{
                duration: 3,
                delay: constellation.delay + j * 0.2,
                repeat: Number.POSITIVE_INFINITY,
                ease: "easeInOut",
              }}
            />
          ))}
        </svg>
      ))}

      {/* Central Zodiac Wheel */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        <motion.div
          className="w-40 h-40 rounded-full border border-gray-300 flex items-center justify-center"
          animate={{ rotate: 360 }}
          transition={{
            duration: 120,
            repeat: Number.POSITIVE_INFINITY,
            ease: "linear",
          }}
        >
          {/* Zodiac circles */}
          {[...Array(12)].map((_, i) => (
            <div
              key={`zodiac-${i}`}
              className="absolute w-full h-full"
              style={{
                transform: `rotate(${i * 30}deg)`,
              }}
            >
              <motion.div
                className="absolute top-0 left-1/2 w-3 h-3 bg-gray-200 rounded-full"
                style={{
                  transform: "translate(-50%, -50%)",
                }}
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.5, 1, 0.5],
                }}
                transition={{
                  duration: 3,
                  delay: i * 0.25,
                  repeat: Number.POSITIVE_INFINITY,
                  ease: "easeInOut",
                }}
              />
            </div>
          ))}

          {/* Inner circle patterns */}
          <div className="w-32 h-32 rounded-full border border-gray-300 relative">
            <div
              className="absolute inset-0 border-2 border-gray-200 rounded-full"
              style={{ clipPath: "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)" }}
            />
            <div
              className="absolute inset-0 border-2 border-gray-200 rounded-full"
              style={{ clipPath: "polygon(50% 25%, 75% 50%, 50% 75%, 25% 50%)" }}
            />
          </div>

          {/* Additional intricate lines */}
          <svg className="absolute inset-0 w-full h-full">
            {[...Array(8)].map((_, i) => (
              <motion.path
                key={`intricate-line-${i}`}
                d={`M ${20 + i * 5} 20 Q ${50 + i * 2} ${50 + i * 2}, ${80 - i * 5} 80`}
                fill="none"
                stroke="rgba(156, 163, 175, 0.3)"
                strokeWidth="0.5"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{
                  duration: 4,
                  delay: i * 0.5,
                  repeat: Number.POSITIVE_INFINITY,
                  repeatType: "reverse",
                  ease: "easeInOut",
                }}
              />
            ))}
          </svg>
        </motion.div>
      </div>
    </div>
  )
}
