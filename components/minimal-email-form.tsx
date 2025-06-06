"use client"

import type React from "react"

import { useState } from "react"
import { useToast } from "@/components/ui/use-toast"

export function MinimalEmailForm() {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch("/api/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (response.ok) {
        toast({
          title: "Thanks!",
          description: "You've been added to our waitlist.",
          duration: 3000,
        })
        setEmail("")
        setIsSubmitted(true)
      } else {
        throw new Error(data.error || "An error occurred")
      }
    } catch (error: any) {
      console.error("Submission error:", error)
      toast({
        title: "Error",
        description: error.message || "An error occurred. Please try again.",
        variant: "destructive",
        duration: 3000,
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-xs mx-auto">
      <div className="flex flex-col gap-2">
        <input
          type="email"
          name="email"
          placeholder="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full bg-[#1A1A1A] border border-[#333] rounded-md px-4 py-2 text-white placeholder:text-gray-500 focus:outline-none focus:ring-1 focus:ring-white/20"
          disabled={isLoading || isSubmitted}
        />
        <button
          type="submit"
          className="w-full bg-[#E5E5E5] hover:bg-white text-black font-medium py-2 rounded-md transition-colors duration-300"
          disabled={isLoading || isSubmitted}
        >
          {isLoading ? "Submitting..." : isSubmitted ? "Thanks!" : "notify me"}
        </button>
      </div>
    </form>
  )
}
