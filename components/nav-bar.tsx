"use client"

import Image from "next/image"
import Link from "next/link"
import { motion } from "framer-motion"

export function NavBar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-black/50 backdrop-blur-md border-b border-white/10">
      <div className="container mx-auto px-3 sm:px-4 py-2 flex justify-between items-center">
        <Link href="/" className="relative w-16 h-16 sm:w-24 sm:h-24">
          <motion.div
            animate={{
              rotate: [0, 5, 0, -5, 0],
            }}
            transition={{
              duration: 10,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
            className="w-full h-full"
          >
            <Image
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/logo%20copy%202-7AiiiPwmXqos4cVn4OIhhnMMLMpgJV.png"
              alt="Halo Logo"
              fill
              className="object-contain"
              priority
              draggable={false}
            />
          </motion.div>
        </Link>
        <div className="flex items-center">
          <Link
            href="/about"
            className="text-white/70 hover:text-white transition-colors duration-200 font-baskervville uppercase tracking-[2px] text-sm mr-16 sm:mr-4"
          >
            ABOUT
          </Link>
        </div>
      </div>
    </nav>
  )
}
