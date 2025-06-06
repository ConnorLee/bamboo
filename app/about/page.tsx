"use client"

import { type ClassValue, clsx } from "clsx"
import type React from "react"
import { useEffect, useMemo, useRef, useState } from "react"
import { twMerge } from "tailwind-merge"
import Link from "next/link"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

interface FlickeringGridProps extends React.HTMLAttributes<HTMLDivElement> {
  squareSize?: number
  gridGap?: number
  flickerChance?: number
  color?: string
  width?: number
  height?: number
  className?: string
  maxOpacity?: number
  startImmediately?: boolean
}

const FlickeringGrid = ({
  squareSize = 4,
  gridGap = 6,
  flickerChance = 0.3,
  color = "rgb(0, 0, 0)",
  width,
  height,
  className,
  maxOpacity = 0.3,
  startImmediately = false,
  ...props
}: FlickeringGridProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [isInView, setIsInView] = useState(startImmediately)

  const gridStateRef = useRef<{
    squares: Float32Array
    cols: number
    rows: number
    dpr: number
    lastMaxOpacity: number
  }>({
    squares: new Float32Array(0),
    cols: 0,
    rows: 0,
    dpr: 1,
    lastMaxOpacity: maxOpacity,
  })

  const memoizedColor = useMemo(() => {
    const toRGBA = (colorValue: string) => {
      if (typeof window === "undefined") return `rgba(0,0,0,`
      const tempCanvas = document.createElement("canvas")
      tempCanvas.width = tempCanvas.height = 1
      const ctx = tempCanvas.getContext("2d")
      if (!ctx) return `rgba(0,0,0,`
      ctx.fillStyle = colorValue
      ctx.fillRect(0, 0, 1, 1)
      const [r, g, b] = Array.from(ctx.getImageData(0, 0, 1, 1).data)
      return `rgba(${r},${g},${b},`
    }
    return toRGBA(color)
  }, [color])

  useEffect(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return

    const dpr = window.devicePixelRatio || 1
    gridStateRef.current.dpr = dpr

    const updateGridStructure = () => {
      const currentWidth = width || container.clientWidth
      const currentHeight = height || container.clientHeight

      if (canvas.width !== currentWidth * dpr || canvas.height !== currentHeight * dpr) {
        canvas.width = currentWidth * dpr
        canvas.height = currentHeight * dpr
        canvas.style.width = `${currentWidth}px`
        canvas.style.height = `${currentHeight}px`
      }

      const newCols = Math.ceil(currentWidth / (squareSize + gridGap))
      const newRows = Math.ceil(currentHeight / (squareSize + gridGap))

      if (
        newCols !== gridStateRef.current.cols ||
        newRows !== gridStateRef.current.rows ||
        maxOpacity !== gridStateRef.current.lastMaxOpacity
      ) {
        gridStateRef.current.cols = newCols
        gridStateRef.current.rows = newRows
        gridStateRef.current.squares = new Float32Array(newCols * newRows)
        for (let i = 0; i < gridStateRef.current.squares.length; i++) {
          gridStateRef.current.squares[i] = Math.random() * maxOpacity
        }
        gridStateRef.current.lastMaxOpacity = maxOpacity
      }
    }

    updateGridStructure()
    const resizeObserver = new ResizeObserver(updateGridStructure)
    resizeObserver.observe(container)
    return () => resizeObserver.disconnect()
  }, [width, height, squareSize, gridGap, maxOpacity])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !isInView) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    let animationFrameId: number
    let lastTime = performance.now()

    const animate = (time: number) => {
      const deltaTime = (time - lastTime) / 1000
      lastTime = time
      const { squares, cols, rows, dpr } = gridStateRef.current

      for (let i = 0; i < squares.length; i++) {
        if (Math.random() < flickerChance * deltaTime) {
          squares[i] = Math.random() * maxOpacity
        }
        squares[i] = Math.min(squares[i], maxOpacity)
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height)
      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          const index = i * rows + j
          if (index < squares.length) {
            const currentOpacity = squares[index]
            ctx.fillStyle = `${memoizedColor}${currentOpacity})`
            ctx.fillRect(
              i * (squareSize + gridGap) * dpr,
              j * (squareSize + gridGap) * dpr,
              squareSize * dpr,
              squareSize * dpr,
            )
          }
        }
      }
      animationFrameId = requestAnimationFrame(animate)
    }
    animationFrameId = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(animationFrameId)
  }, [isInView, memoizedColor, flickerChance, maxOpacity, squareSize, gridGap])

  useEffect(() => {
    if (startImmediately) {
      if (!isInView) setIsInView(true)
      return
    }
    const canvas = canvasRef.current
    if (!canvas) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry) setIsInView(entry.isIntersecting)
      },
      { threshold: 0.01 },
    )
    observer.observe(canvas)
    return () => {
      observer.disconnect()
    }
  }, [startImmediately, isInView])

  return (
    <div ref={containerRef} className={cn("h-full w-full", className)} {...props}>
      <canvas ref={canvasRef} className="pointer-events-none" />
    </div>
  )
}

interface GeneratedGridSettings {
  color: string
  maxOpacity: number
  flickerChance: number
  squareSize: number
  gridGap: number
}

// Live Death Counter Component
const LiveDeathCounter = () => {
  const [deathCount, setDeathCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Base statistics from CDC and SAMHSA (2023 data)
    const baseStats = {
      alcoholDeathsPerYear: 178000, // CDC estimate for alcohol-related deaths
      substanceDeathsPerYear: 107000, // Drug overdose deaths
      totalDeathsPerYear: 285000, // Combined estimate
    }

    // Calculate deaths per second
    const deathsPerSecond = baseStats.totalDeathsPerYear / (365 * 24 * 60 * 60)

    // Start from beginning of current year
    const startOfYear = new Date(new Date().getFullYear(), 0, 1)
    const now = new Date()
    const secondsSinceStartOfYear = (now.getTime() - startOfYear.getTime()) / 1000

    // Calculate initial count
    const initialCount = Math.floor(secondsSinceStartOfYear * deathsPerSecond)
    setDeathCount(initialCount)
    setIsLoading(false)

    // Update counter every second
    const interval = setInterval(() => {
      setDeathCount((prev) => prev + Math.round(deathsPerSecond))
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  const formatNumber = (num: number) => {
    return num.toLocaleString()
  }

  if (isLoading) {
    return (
      <div className="text-center mb-8">
        <div className="text-white/50 text-sm mb-2">Loading...</div>
      </div>
    )
  }

  return (
    <div className="text-center mb-8">
      <div className="text-white/70 text-xs mb-1 tracking-wider uppercase">Substance & Alcohol Deaths This Year</div>
      <div className="text-red-400 text-2xl font-mono font-bold tabular-nums">{formatNumber(deathCount)}</div>
      <div className="text-white/40 text-xs mt-1">Based on CDC & SAMHSA estimates</div>
    </div>
  )
}

const svgDataUrlForEffect: string =
  "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTQ2IiBoZWlnaHQ9IjM3NiIgdmlld0JveD0iMCAwIDU0NiAzNzYiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxwYXRoIGQ9Ik0xODcuODU2IDM3NkM3OS4zMDgxIDM3NiAwLjA5NzQxMzEgMjk2LjA1NiAwLjA5NzQxMzEgMTg4LjI0MUMwLjA5NzQxMzEgNzkuNjkzNSA3OS4zMDgxIDAuNDgyNzk1IDE4Ny44NTYgMC40ODI3OTVIMzU4LjAxMkM0NjYuNTYgMC40ODI3OTUgNTQ1Ljc3MSA3OS42OTM1IDU0NS43NzEgMTg4LjI0MUM1NDUuNzcxIDI5Ni4wNTYgNDY2LjU2IDM3NiAzNTguMDEyIDM3NkgxODcuODU2Wk0yNzIuOTM0IDI4Mi4xMjFDMzI1Ljc0MSAyODIuMTIxIDM2Ni44MTMgMjQxLjA0OCAzNjYuODEzIDE4OC4yNDFDMzY2LjgxMyAxMzUuNDM0IDMyNS43NDEgOTQuMzYyMSAyNzIuOTM0IDk0LjM2MjFDMjIwLjEyNyA5NC4zNjIxIDE3OS4wNTUgMTM1LjQzNCAxNzkuMDU1IDE4OC4yNDFDMTc5LjA1NSAyNDEuMDQ4IDIyMC4xMjcgMjgyLjEyMSAyNzIuOTM0IDI4Mi4xMjFaIiBmaWxsPSIjRjRGNEY0Ii8+Cjwvc3ZnPgo="

const svgMaskGridSettingsForEffect: GeneratedGridSettings = {
  color: "#b6ff4b",
  maxOpacity: 0.75,
  flickerChance: 0.27,
  squareSize: 11,
  gridGap: 4,
}

const backgroundGridSettingsForEffect: GeneratedGridSettings = {
  color: "#5a4a4a",
  maxOpacity: 0.52,
  flickerChance: 0.45,
  squareSize: 2,
  gridGap: 8,
}

const GeneratedFlickerEffect = () => {
  const maskStyle: React.CSSProperties = {
    WebkitMaskImage: `url('${svgDataUrlForEffect}')`,
    WebkitMaskSize: "contain",
    WebkitMaskPosition: "center",
    WebkitMaskRepeat: "no-repeat",
    maskImage: `url('${svgDataUrlForEffect}')`,
    maskSize: "contain",
    maskPosition: "center",
    maskRepeat: "no-repeat",
  }

  return (
    <div className="relative w-96 h-96 mx-auto">
      <FlickeringGrid className="absolute inset-0 z-0" {...backgroundGridSettingsForEffect} startImmediately={true} />
      <div className="absolute inset-0 z-10" style={maskStyle}>
        <FlickeringGrid {...svgMaskGridSettingsForEffect} startImmediately={true} />
      </div>
    </div>
  )
}

export default function AboutPage() {
  return (
    <div className="relative w-full h-screen bg-black flex flex-col items-center justify-center">
      {/* Navigation */}
      <div className="absolute top-4 left-4 z-20">
        <Link
          href="/"
          className="text-white/70 hover:text-white transition-opacity text-sm backdrop-blur-sm bg-black/20 px-3 py-1 rounded-full"
        >
          ← Back
        </Link>
      </div>

      {/* Live Death Counter */}
      <LiveDeathCounter />

      {/* Centered Flickering Icon */}
      <div className="flex items-center justify-center">
        <GeneratedFlickerEffect />
      </div>
    </div>
  )
}
