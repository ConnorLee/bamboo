import Image from "next/image"

export function Footer() {
  return (
    <footer className="bg-[#EFE7D7] border-t border-gray-200">
      <div className="container mx-auto px-3 sm:px-4 py-6 sm:py-8 flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-0">
        <div className="relative w-10 h-10 sm:w-12 sm:h-12">
          <Image
            src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/logo%20copy%202-7AiiiPwmXqos4cVn4OIhhnMMLMpgJV.png"
            alt="Halo Logo"
            fill
            className="object-contain"
            draggable={false}
          />
        </div>
        <p className="text-xs sm:text-sm text-gray-600 font-baskerville text-center sm:text-left">
          Made with ❤️ for Kelsey
        </p>
        <p className="text-xs sm:text-sm text-gray-600 font-baskerville text-center sm:text-left">© 2025 HABIT HALO</p>
      </div>
    </footer>
  )
}
