"use client"

import type React from "react"
import { useMemo, useCallback } from "react"
import { motion, useAnimation } from "framer-motion"
import { useTheme } from "next-themes"

interface Star {
  x: number
  y: number
  size: number
}

interface Circle {
  x: number
  y: number
  size: number
}

const zodiacIcons = [
  { name: "Aries", path: "M0 8 L6 0 L12 8 M0 14 L6 6 L12 14" },
  { name: "Taurus", path: "M1 7C1 3.68629 3.68629 1 7 1C10.3137 1 13 3.68629 13 7M3 13H11" },
  { name: "Gemini", path: "M3 1v12M11 1v12M3 7h8" },
  {
    name: "Cancer",
    path: "M1 8a6 6 0 1 0 12 0 6 6 0 1 0-12 0zm2-3a1 1 0 1 0 2 0 1 1 0 1 0-2 0zm6 0a1 1 0 1 0 2 0 1 1 0 1 0-2 0z",
  },
  { name: "Leo", path: "M4 4a4 4 0 1 1 5 5L7 13M11 2 A2 2 0 0 1 13 4 A2 2 0 0 1 11 6 A2 2 0 0 1 9 4 A2 2 0 0 1 11 2" },
  { name: "Virgo", path: "M3 1v10a2 2 0 0 0 4 0V1m4 0v10a2 2 0 0 0 4 0V1M3 6h12" },
  { name: "Libra", path: "M1 3h12M1 7h12M4 11h6" },
  { name: "Scorpio", path: "M1 8h12M7 2v12m3-3l2 2-2 2" },
  { name: "Sagittarius", path: "M1 13L13 1M13 1H8m5 0v5M1 8l5 5" },
  { name: "Capricorn", path: "M1 8a4 4 0 0 1 8 0v4m-8 0h12" },
  { name: "Aquarius", path: "M1 5q2.5 2.5 5 0t5 0M1 9q2.5 2.5 5 0t5 0" },
  { name: "Pisces", path: "M1 5q2.5 2.5 5 0t5 0M1 5v6m12-6v6" },
]

export const VectorAstroBackground: React.FC = () => {
  const { theme } = useTheme()
  const isDark = theme === "dark"
  const controls = useAnimation()

  const getColor = useCallback(
    (opacity = 0.05) => {
      return isDark ? `rgba(255, 215, 0, ${opacity})` : `rgba(169, 150, 131, ${opacity})`
    },
    [isDark],
  )

  const stars: Star[] = useMemo(() => {
    return Array.from({ length: 50 }, () => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 1.5 + 0.5,
    }))
  }, [])

  const circles: Circle[] = useMemo(() => {
    return Array.from({ length: 5 }, () => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 20 + 10,
    }))
  }, [])

  return (
    <div className="absolute inset-0 w-full h-full">
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice">
        <defs>
          <filter id="noise">
            <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" />
            <feComposite operator="in" in2="SourceGraphic" />
          </filter>
        </defs>

        <rect width="100%" height="100%" fill={isDark ? "#1a1a1a" : "#EFE7D7"} />

        {/* Background Circles */}
        {circles.map((circle, i) => (
          <circle
            key={`circle-${i}`}
            cx={circle.x}
            cy={circle.y}
            r={circle.size}
            fill="none"
            stroke={getColor(0.03)}
            strokeWidth="0.5"
          />
        ))}

        {/* Stars */}
        {stars.map((star, i) => (
          <circle key={`star-${i}`} cx={star.x} cy={star.y} r={star.size} fill={getColor(0.06)} />
        ))}

        {/* Zodiac Wheel */}
        <motion.g
          animate={{ rotate: 360 }}
          transition={{ duration: 200, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
          style={{ originX: "50px", originY: "50px" }}
        >
          <circle cx="50" cy="50" r="30" fill="none" stroke={getColor(0.075)} strokeWidth="0.5" />
          {zodiacIcons.map((icon, i) => (
            <g key={`zodiac-${i}`} transform={`rotate(${i * 30} 50 50) translate(50, 20)`}>
              <g transform="translate(-7, -7) scale(0.9)">
                <path d={icon.path} fill="none" stroke={getColor(0.15)} strokeWidth="0.5" filter="url(#noise)" />
              </g>
            </g>
          ))}
        </motion.g>

        {/* Simplified Constellation Lines */}
        <path
          d="M10,10 L30,20 L50,10 L70,30 L90,20 M20,80 L40,70 L60,90 L80,60 M15,50 Q30,30 50,50 T85,50"
          fill="none"
          stroke={getColor(0.03)}
          strokeWidth="0.2"
        />
      </svg>
    </div>
  )
}
