"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"

export function Navbar() {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 py-4 px-6">
      <div className="flex justify-between items-center">
        <Link
          href="/"
          className="relative h-10 w-24 bg-transparent transition-opacity duration-300"
          style={{ opacity: isHovered ? 1 : 0.4 }}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <Image
            src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/hal%E2%80%A2-RVpK080xqh3pGbovA2eM5Ccp9vy5iH.png"
            alt="hal•"
            fill
            className="object-contain object-left"
            priority
            sizes="(max-width: 768px) 96px, 96px"
          />
        </Link>
      </div>
    </nav>
  )
}
