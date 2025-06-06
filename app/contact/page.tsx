"use client"

import { useState, useEffect } from "react"
import Spline from "@splinetool/react-spline/next"
import Link from "next/link"
import { motion } from "framer-motion"

export default function Contact() {
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  const handleLoad = () => {
    setIsLoading(false)
  }

  const handleError = () => {
    setIsLoading(false)
    setHasError(true)
  }

  // Add timeout for loading
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (isLoading) {
        setHasError(true)
      }
    }, 15000) // 15 second timeout
    return () => clearTimeout(timeout)
  }, [isLoading])

  return (
    <motion.main
      className="relative w-full h-screen overflow-hidden bg-black"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      {/* Back button with entrance animation */}
      <motion.div
        className="absolute top-4 left-4 z-50"
        initial={{ x: -50, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.5 }}
      >
        <Link
          href="/"
          className="text-white/70 hover:text-white transition-opacity text-sm backdrop-blur-sm bg-black/20 px-3 py-1 rounded-full"
        >
          ← Back
        </Link>
      </motion.div>

      {/* Loading state */}
      {isLoading && !hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-black z-10">
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 border-4 border-white/20 border-t-white/80 rounded-full animate-spin"></div>
            <p className="mt-4 text-white/60">Loading 3D scene...</p>
            <p className="mt-2 text-white/40 text-sm">This may take a moment</p>
          </div>
        </div>
      )}

      {/* Error state */}
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-black z-10">
          <div className="flex flex-col items-center text-center max-w-md px-6">
            <div className="w-20 h-20 rounded-full bg-gradient-to-r from-purple-500/20 to-blue-500/20 flex items-center justify-center mb-6">
              <svg className="w-10 h-10 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-semibold text-white mb-3">About Halo</h2>
            <p className="text-white/70 mb-6 leading-relaxed">
              Halo is a revolutionary sobriety app that connects people in recovery through supportive communities,
              daily check-ins, and meaningful connections. Our mission is to make recovery accessible, engaging, and
              sustainable for everyone.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
            >
              Reload 3D Experience
            </button>
          </div>
        </div>
      )}

      {/* Spline scene */}
      <div className="w-full h-full">
        <Spline
          scene="https://prod.spline.design/NDnzvy6nbYL4C6TA/scene.splinecode"
          onLoad={handleLoad}
          onError={handleError}
          className="w-full h-full"
        />
      </div>
    </motion.main>
  )
}
