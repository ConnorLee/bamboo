"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useMediaQuery } from "@/hooks/use-media-query"

interface DeviceMockupProps {
  children: React.ReactNode
}

export function DeviceMockup({ children }: DeviceMockupProps) {
  const [mounted, setMounted] = useState(false)
  const isDesktopOrTablet = useMediaQuery("(min-width: 768px)")

  // Prevent hydration mismatch by only rendering after mount
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  // On mobile, render the content directly without the mockup
  if (!isDesktopOrTablet) {
    return <>{children}</>
  }

  // On desktop/tablet, render the content inside a phone mockup
  return (
    <div className="flex items-center justify-center min-h-screen bg-black p-8">
      <div className="relative mx-auto border-gray-800 dark:border-gray-800 bg-gray-800 border-[14px] rounded-[2.5rem] h-[600px] max-h-[90vh] w-[300px] shadow-xl">
        <div className="w-[148px] h-[18px] bg-gray-800 top-0 rounded-b-[1rem] left-1/2 -translate-x-1/2 absolute"></div>
        <div className="h-[46px] w-[3px] bg-gray-800 absolute -start-[17px] top-[124px] rounded-s-lg"></div>
        <div className="h-[46px] w-[3px] bg-gray-800 absolute -start-[17px] top-[178px] rounded-s-lg"></div>
        <div className="h-[64px] w-[3px] bg-gray-800 absolute -end-[17px] top-[142px] rounded-e-lg"></div>
        <div className="rounded-[2rem] overflow-hidden w-full h-full bg-white">
          <div className="w-full h-full overflow-hidden">{children}</div>
        </div>
      </div>
    </div>
  )
}
