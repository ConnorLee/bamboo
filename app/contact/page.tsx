"use client"

import type React from "react"

import { useEffect, useState } from "react"
import Link from "next/link"

declare global {
  namespace JSX {
    interface IntrinsicElements {
      "spline-viewer": {
        url: string
        style?: React.CSSProperties
        loading?: string
        "events-target"?: string
      }
    }
  }
}

export default function Contact() {
  const [isScriptLoaded, setIsScriptLoaded] = useState(false)
  const [isViewerReady, setIsViewerReady] = useState(false)
  const [hasError, setHasError] = useState(false)

  useEffect(() => {
    // Load the Spline viewer script
    const script = document.createElement("script")
    script.type = "module"
    script.src = "https://unpkg.com/@splinetool/viewer@1.10.2/build/spline-viewer.js"
    script.onload = () => {
      console.log("Spline script loaded")
      setIsScriptLoaded(true)
      // Give a moment for the web component to register
      setTimeout(() => setIsViewerReady(true), 500)
    }
    script.onerror = () => {
      console.error("Failed to load Spline script")
      setHasError(true)
    }

    document.head.appendChild(script)

    // Cleanup
    return () => {
      if (document.head.contains(script)) {
        document.head.removeChild(script)
      }
    }
  }, [])

  // Fallback timeout
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (!isViewerReady && !hasError) {
        console.log("Timeout reached, showing fallback")
        setHasError(true)
      }
    }, 10000) // 10 second timeout

    return () => clearTimeout(timeout)
  }, [isViewerReady, hasError])

  if (hasError) {
    return (
      <main className="relative w-full h-screen overflow-hidden bg-black">
        {/* Transparent Navbar */}
        <div className="absolute top-0 left-0 right-0 z-50 py-4 px-6">
          <div className="flex justify-between items-center">
            <Link
              href="/"
              className="relative h-12 w-32 bg-transparent transition-opacity duration-300 opacity-40 hover:opacity-100"
            >
              <img
                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/logo-DlZIvmZclrbG5bFthBBHZVCXTX8vwq.png"
                alt="halo"
                className="w-full h-full object-contain object-left"
              />
            </Link>
            <div className="flex items-center gap-3">
              <Link
                href="/"
                className="text-white/70 hover:text-white transition-all duration-300 text-sm backdrop-blur-sm bg-white/10 hover:bg-white/20 px-3 py-1 rounded-full"
              >
                Home
              </Link>
              <div className="text-white/70 text-sm backdrop-blur-sm bg-white/20 px-3 py-1 rounded-full">About</div>
            </div>
          </div>
        </div>

        {/* Error Message */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20 text-center max-w-md px-6">
          <h1 className="text-4xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white to-[#7CE95E]">
            About Halo
          </h1>
          <p className="text-xl text-white/80 mb-8 leading-relaxed">
            Halo is an emotional support company designed to help you navigate your journey toward better habits and
            mental wellbeing.
          </p>
          <div className="space-y-4">
            <a
              href="mailto:hello@habithalo.com"
              className="inline-block bg-[#7CE95E] text-black px-6 py-3 rounded-full font-semibold hover:bg-[#6BD84F] transition-colors"
            >
              Contact Us
            </a>
            <p className="text-white/60 text-sm">3D experience temporarily unavailable</p>
          </div>
        </div>

        {/* Transparent Scrolling Marquee */}
        <div className="absolute bottom-8 left-0 right-0 z-30">
          <div className="overflow-hidden py-4">
            <div className="whitespace-nowrap animate-scroll">
              <span className="inline-block text-white/60 text-xs tracking-[0.2em] uppercase font-light">
                AN EMOTIONAL SUPPORT COMPANY • LOS ANGELES, CA • AN EMOTIONAL SUPPORT COMPANY • LOS ANGELES, CA • AN
                EMOTIONAL SUPPORT COMPANY • LOS ANGELES, CA •
              </span>
            </div>
          </div>
        </div>

        {/* Copyright Footer */}
        <div className="absolute bottom-2 left-6 z-30">
          <p className="text-white/20 text-xs font-light">© 2025 Habit Halo</p>
        </div>
      </main>
    )
  }

  return (
    <main className="relative w-full h-screen overflow-hidden bg-black">
      {/* Transparent Navbar */}
      <div className="absolute top-0 left-0 right-0 z-50 py-4 px-6">
        <div className="flex justify-between items-center">
          <Link
            href="/"
            className="relative h-12 w-32 bg-transparent transition-opacity duration-300 opacity-40 hover:opacity-100"
          >
            <img
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/logo-DlZIvmZclrbG5bFthBBHZVCXTX8vwq.png"
              alt="halo"
              className="w-full h-full object-contain object-left"
            />
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="text-white/70 hover:text-white transition-all duration-300 text-sm backdrop-blur-sm bg-white/10 hover:bg-white/20 px-3 py-1 rounded-full"
            >
              Home
            </Link>
            <div className="text-white/70 text-sm backdrop-blur-sm bg-white/20 px-3 py-1 rounded-full">About</div>
          </div>
        </div>
      </div>

      {/* Loading indicator */}
      {!isViewerReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-black z-40">
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 border-4 border-white/20 border-t-white/80 rounded-full animate-spin"></div>
            <p className="mt-4 text-white/60">{!isScriptLoaded ? "Loading viewer..." : "Preparing 3D scene..."}</p>
          </div>
        </div>
      )}

      {/* Spline Viewer - Full Screen */}
      {isScriptLoaded && (
        <div className="absolute inset-0 z-10">
          <spline-viewer
            url="https://prod.spline.design/NDnzvy6nbYL4C6TA/scene.splinecode"
            style={{
              width: "100%",
              height: "100%",
              display: "block",
            }}
          />
        </div>
      )}

      {/* Transparent Scrolling Marquee */}
      <div className="absolute bottom-8 left-0 right-0 z-30">
        <div className="overflow-hidden py-4">
          <div className="flex animate-scroll whitespace-nowrap">
            <span className="inline-block text-white/60 text-xs tracking-[0.2em] uppercase font-light pr-8">
              AN EMOTIONAL SUPPORT COMPANY • LOS ANGELES, CA • AN EMOTIONAL SUPPORT COMPANY • LOS ANGELES, CA • AN
              EMOTIONAL SUPPORT COMPANY • LOS ANGELES, CA • AN EMOTIONAL SUPPORT COMPANY • LOS ANGELES, CA • AN
              EMOTIONAL SUPPORT COMPANY • LOS ANGELES, CA • AN EMOTIONAL SUPPORT COMPANY • LOS ANGELES, CA
            </span>
            <span className="inline-block text-white/60 text-xs tracking-[0.2em] uppercase font-light pr-8">
              AN EMOTIONAL SUPPORT COMPANY • LOS ANGELES, CA • AN EMOTIONAL SUPPORT COMPANY • LOS ANGELES, CA • AN
              EMOTIONAL SUPPORT COMPANY • LOS ANGELES, CA • AN EMOTIONAL SUPPORT COMPANY • LOS ANGELES, CA • AN
              EMOTIONAL SUPPORT COMPANY • LOS ANGELES, CA • AN EMOTIONAL SUPPORT COMPANY • LOS ANGELES, CA
            </span>
          </div>
        </div>
      </div>

      {/* Copyright Footer */}
      <div className="absolute bottom-2 left-6 z-30">
        <p className="text-white/20 text-xs font-light">© 2025 Habit Halo</p>
      </div>
    </main>
  )
}
