"use client"

import { useState, useEffect, useRef } from "react"
import Image from "next/image"
import { RotatingSphere } from "./rotating-sphere"
import { playMeditativeSound, stopMeditativeSound } from "@/utils/audio-utils"

const logoImages = [
  {
    src: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/5-l2GskMFykuUUoOxudgoQWGOIK3jCea.png",
    alt: "Halo Logo - Green Variant",
  },
  {
    src: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/2-nkBetyvUmQhY7V0KhZIkAbstFtcqLV.png",
    alt: "Halo Logo - Blue Variant",
  },
  {
    src: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/1-3Kb2scbL3Wr69Wv9IjUs7ixItOGHS0.png",
    alt: "Halo Logo - Gray Variant",
  },
  {
    src: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Mask%20group-KXurvwdmEayCYBOXvUC2NrvuuwZhZT.png",
    alt: "Halo Logo - Red Variant",
  },
]

export function AnimatedLogo() {
  const [activeIndex, setActiveIndex] = useState(0)
  const [nextIndex, setNextIndex] = useState(1)
  const [activeOpacity, setActiveOpacity] = useState(1)
  const [nextOpacity, setNextOpacity] = useState(0)
  const [showSphere, setShowSphere] = useState(false)
  const logoRef = useRef<HTMLDivElement>(null)
  const [audioInitialized, setAudioInitialized] = useState(false)

  // Handle logo animation
  useEffect(() => {
    const interval = setInterval(() => {
      // Start fading out current image and fading in next image
      const fadeAnimation = () => {
        const steps = 20
        const duration = 1000 // 1 second for the crossfade
        const stepTime = duration / steps
        let step = 0

        const fadeInterval = setInterval(() => {
          step++
          const progress = step / steps

          // Fade out current image
          setActiveOpacity(1 - progress)

          // Fade in next image
          setNextOpacity(progress)

          if (step >= steps) {
            clearInterval(fadeInterval)
            // Once fade is complete, make the next image the active one
            setActiveIndex(nextIndex)
            setNextIndex((nextIndex + 1) % logoImages.length)
            setActiveOpacity(1)
            setNextOpacity(0)
          }
        }, stepTime)
      }

      fadeAnimation()
    }, 3000) // Change every 3 seconds

    return () => clearInterval(interval)
  }, [activeIndex, nextIndex])

  // Handle mouse events and sound
  const handleMouseEnter = () => {
    setShowSphere(true)
    if (typeof window !== "undefined") {
      // Initialize audio on first interaction
      if (!audioInitialized) {
        // Create a silent audio context to initialize it (needed for Safari)
        const ac = new (window.AudioContext || (window as any).webkitAudioContext)()
        ac.resume().then(() => {
          setAudioInitialized(true)
          playMeditativeSound()
        })
      } else {
        playMeditativeSound()
      }
    }
  }

  const handleMouseLeave = () => {
    setShowSphere(false)
    if (typeof window !== "undefined") {
      stopMeditativeSound()
    }
  }

  return (
    <div
      className="relative w-32 h-32 sm:w-48 sm:h-48 mx-auto"
      ref={logoRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* All images are always present, we just control their opacity */}
      {logoImages.map((logo, index) => (
        <div
          key={index}
          className="absolute inset-0"
          style={{
            opacity: index === activeIndex ? activeOpacity : index === nextIndex ? nextOpacity : 0,
            transition: "opacity 50ms linear", // Smooth micro-transitions
          }}
        >
          <Image src={logo.src || "/placeholder.svg"} alt={logo.alt} fill className="object-contain" priority />
        </div>
      ))}

      {/* Add the rotating sphere in the middle */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <RotatingSphere isVisible={showSphere} />
      </div>
    </div>
  )
}
