import Image from "next/image"
import { EmailForm } from "./email-form"
import { VectorAstroBackground } from "./vector-astro-background"

const heroContents = [
  {
    title: "A guiding light for sobriety.",
    description:
      "Align your stars, master your habits. Halo leverages astrology to better keep you in touch with your moods, sensitivity, and reduces the chance of relapse.",
    image: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Group%2011-RdE6CA7pOMLAQmeeCzLHHuAKBJHSfM.png",
  },
]

export function HeroSection() {
  return (
    <section
      className="pt-20 lg:pt-32 2xl:pt-40 pb-20 text-center relative overflow-hidden min-h-screen bg-[#EFE7D7]"
      style={{ width: "100vw", maxWidth: "100%" }}
    >
      <VectorAstroBackground />
      <div className="container mx-auto px-4 pt-16 lg:pt-24 2xl:pt-32 max-w-5xl relative z-10">
        <div className="max-w-4xl mx-auto mb-16">
          <div className="flex flex-col items-center">
            <div className="relative w-full max-w-[800px] aspect-[16/9] mb-4 sm:mb-8 md:mb-16 px-4 sm:px-0">
              <Image
                src={heroContents[0].image}
                alt={heroContents[0].title}
                fill
                className="object-contain"
                priority
                draggable="false"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-medium mb-4 sm:mb-6 font-comfortaa tracking-[-2px] sm:tracking-[-3px] px-4 sm:px-6">
              {heroContents[0].title}
            </h1>
            <p className="text-sm sm:text-base md:text-lg lg:text-xl text-gray-600 dark:text-gray-300 mb-6 sm:mb-8 max-w-3xl mx-auto font-comfortaa px-4 sm:px-6">
              {heroContents[0].description}
            </p>
          </div>
          <div className="flex justify-center">
            <EmailForm buttonText="Notify Me" />
          </div>
          <div className="flex justify-center mt-8 mb-16">
            <div className="opacity-50 relative w-[200px] h-[60px] sm:h-[60px]">
              <Image
                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/url-H285DFku2keuxHM9wPHVaPLdwsqKas.png"
                alt="Download on the App Store"
                fill
                style={{ objectFit: "contain" }}
                sizes="200px"
                className="h-[42px] sm:h-[60px]"
                priority
                draggable="false"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
