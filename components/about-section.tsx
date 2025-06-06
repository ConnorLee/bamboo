"use client"

import { useEffect, useState } from "react"
import { FlickeringGrid } from "./flickering-grid"

interface GeneratedGridSettings {
  color: string
  maxOpacity: number
  flickerChance: number
  squareSize: number
  gridGap: number
}

const svgDataUrlForEffect: string = `data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTQ2IiBoZWlnaHQ9IjM3NiIgdmlld0JveD0iMCAwIDU0NiAzNzYiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxwYXRoIGQ9Ik0xODcuODU2IDM3NkM3OS4zMDgxIDM3NiAwLjA5NzQxMzEgMjk2LjA1NiAwLjA5NzQxMzEgMTg4LjI0MUMwLjA5NzQxMzEgNzkuNjkzNSA3OS4zMDgxIDAuNDgyNzk1IDE4Ny44NTYgMC40ODI3OTVIMzU4LjAxMkM0NjYuNTYgMC40ODI3OTUgNTQ1Ljc3MSA3OS42OTM1IDU0NS43NzEgMTg4LjI0MUM1NDUuNzcxIDI5Ni4wNTYgNDY2LjU2IDM3NiAzNTguMDEyIDM3NkgxODcuODU2Wk0yNzIuOTM0IDI4Mi4xMjFDMzI1Ljc0MSAyODIuMTIxIDM2Ni44MTMgMjQxLjA0OCAzNjYuODEzIDE4OC4yNDFDMzY2LjgxMyAxMzUuNDM0IDMyNS43NDEgOTQuMzYyMSAyNzIuOTM0IDk0LjM2MjFDMjIwLjEyNyA5NC4zNjIxIDE3OS4wNTUgMTM1LjQzNCAxNzkuMDU1IDE4OC4yNDFDMTc5LjA1NSAyNDEuMDQ4IDIyMC4xMjcgMjgyLjEyMSAyNzIuOTM0IDI4Mi4xMjFaIiBmaWxsPSIjRkZGRkZGIi8+Cjwvc3ZnPgo=`

const redMaskGridSettings: GeneratedGridSettings = {
  color: "#FF5F1F",
  maxOpacity: 0.6,
  flickerChance: 0.08,
  squareSize: 4,
  gridGap: 2,
}

const greenMaskGridSettings: GeneratedGridSettings = {
  color: "#22C55E",
  maxOpacity: 0.6,
  flickerChance: 0.08,
  squareSize: 4,
  gridGap: 2,
}

const backgroundGridSettingsForEffect: GeneratedGridSettings = {
  color: "#1F1F1F",
  maxOpacity: 0.2,
  flickerChance: 0.05,
  squareSize: 2,
  gridGap: 3,
}

export function AboutSection() {
  const [deathCount, setDeathCount] = useState(0)
  const [recoveryCount, setRecoveryCount] = useState(2342537)
  const [showRecovery, setShowRecovery] = useState(false)
  const [isTransitioning, setIsTransitioning] = useState(false)

  useEffect(() => {
    // Calculate deaths since start of year
    const startOfYear = new Date(new Date().getFullYear(), 0, 1)
    const now = new Date()
    const msElapsed = now.getTime() - startOfYear.getTime()

    // 285,000 deaths per year = ~9.04 deaths per 1000 seconds
    const deathsPerMs = 285000 / (365.25 * 24 * 60 * 60 * 1000)
    const initialCount = Math.floor(msElapsed * deathsPerMs)

    setDeathCount(initialCount)

    // Update death count every second
    const deathInterval = setInterval(() => {
      setDeathCount((prev) => prev + Math.floor(deathsPerMs * 1000))
    }, 1000)

    // Update recovery count every 10 seconds
    const recoveryInterval = setInterval(() => {
      setRecoveryCount((prev) => prev + 1)
    }, 10000)

    // Toggle between death and recovery stats every 5 seconds with transition
    const toggleInterval = setInterval(() => {
      setIsTransitioning(true)

      setTimeout(() => {
        setShowRecovery((prev) => !prev)
        setTimeout(() => {
          setIsTransitioning(false)
        }, 100)
      }, 300)
    }, 5000)

    return () => {
      clearInterval(deathInterval)
      clearInterval(recoveryInterval)
      clearInterval(toggleInterval)
    }
  }, [])

  const currentMaskSettings = showRecovery ? greenMaskGridSettings : redMaskGridSettings

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Counter with fade transition */}
      <div
        className={`text-center mb-4 transition-all duration-300 ease-in-out ${
          isTransitioning ? "opacity-0 scale-95 blur-sm" : "opacity-100 scale-100 blur-0"
        }`}
      >
        {showRecovery ? (
          <>
            <div className="text-green-400 text-2xl font-mono font-bold">{recoveryCount.toLocaleString()}</div>
            <div className="text-white/60 text-sm mt-1">people in recovery today</div>
            <div className="text-white/40 text-xs mt-1">Source: SAMHSA & Recovery Organizations</div>
          </>
        ) : (
          <>
            <div className="text-red-400 text-2xl font-mono font-bold">{deathCount.toLocaleString()}</div>
            <div className="text-white/60 text-sm mt-1">Substance & alcohol deaths this year</div>
            <div className="text-white/40 text-xs mt-1">Source: CDC & SAMHSA</div>
          </>
        )}
      </div>

      {/* Flickering Grid Logo - reduced size */}
      <div
        className={`relative w-56 h-36 transition-all duration-500 ease-in-out ${
          isTransitioning ? "scale-95 opacity-80" : "scale-100 opacity-100"
        }`}
      >
        {/* Background grid */}
        <div className="absolute inset-0 bg-black">
          <FlickeringGrid className="w-full h-full" {...backgroundGridSettingsForEffect} startImmediately={true} />
        </div>

        {/* Masked logo grid */}
        <div
          className="absolute inset-0"
          style={{
            WebkitMask: `url("${svgDataUrlForEffect}") center/contain no-repeat`,
            mask: `url("${svgDataUrlForEffect}") center/contain no-repeat`,
          }}
        >
          <FlickeringGrid className="w-full h-full" {...currentMaskSettings} startImmediately={true} />
        </div>
      </div>
    </div>
  )
}
