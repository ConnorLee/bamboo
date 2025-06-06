"use client"

import { useState, useEffect, useRef } from "react"
import { Play, Pause, Volume2, VolumeX } from "lucide-react"

const shimmerAnimation = `
@keyframes shimmer {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

@keyframes glow {
  0% { box-shadow: 0 0 10px rgba(255, 255, 255, 0.3), 0 0 20px rgba(255, 255, 255, 0.3); }
  50% { box-shadow: 0 0 20px rgba(255, 255, 255, 0.3), 0 0 30px rgba(255, 255, 255, 0.3); }
  100% { box-shadow: 0 0 10px rgba(255, 255, 255, 0.3), 0 0 20px rgba(255, 255, 255, 0.3); }
}
`

export function MusicPlayer() {
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    audioRef.current = new Audio(
      "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Libianca%20-%20People%20(Lyric%20Video)-jmYRCYi6jUUpAu2T3uAYYOdXfbJGM7.mp3",
    )
    audioRef.current.loop = true

    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
    }
  }, [])

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause()
      } else {
        audioRef.current.play()
      }
      setIsPlaying(!isPlaying)
    }
  }

  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !isMuted
      setIsMuted(!isMuted)
    }
  }

  return (
    <>
      <style jsx global>
        {shimmerAnimation}
      </style>
      <div
        className="fixed bottom-4 right-4 z-50 bg-white/10 backdrop-blur-md p-3 rounded-full shadow-lg flex items-center space-x-2"
        style={{
          animation: "glow 10s linear infinite",
        }}
      >
        <button
          onClick={togglePlay}
          className="p-2 rounded-full hover:bg-white/20 transition-colors duration-200"
          aria-label={isPlaying ? "Pause music" : "Play music"}
        >
          {isPlaying ? <Pause className="w-6 h-6 text-black" /> : <Play className="w-6 h-6 text-black" />}
        </button>
        <div className="hidden sm:flex items-center space-x-2">
          <div
            className="text-sm font-medium text-transparent bg-clip-text"
            style={{
              backgroundImage: "linear-gradient(45deg, #ff0000, #ff7f00, #ffff00, #00ff00, #0000ff, #8b00ff)",
              backgroundSize: "200% auto",
              animation: "shimmer 5s linear infinite",
            }}
          >
            Libianca - People
          </div>
          <button
            onClick={toggleMute}
            className="p-2 rounded-full hover:bg-white/20 transition-colors duration-200"
            aria-label={isMuted ? "Unmute" : "Mute"}
          >
            {isMuted ? <VolumeX className="w-6 h-6 text-black" /> : <Volume2 className="w-6 h-6 text-black" />}
          </button>
        </div>
      </div>
    </>
  )
}
