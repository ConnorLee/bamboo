"use client"

import type React from "react"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"

interface EmailFormProps {
  buttonText: string
}

export function EmailForm({ buttonText }: EmailFormProps) {
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
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-md mx-auto bg-white/5 backdrop-blur-md p-2 rounded-lg border border-white/10"
    >
      <div className="flex gap-2">
        <Input
          type="email"
          name="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="bg-black/50 border-white/10 text-white placeholder:text-white/50"
          disabled={isLoading || isSubmitted}
        />
        <Button
          type="submit"
          className="bg-[#7CE95E] hover:bg-[#7CE95E]/90 text-black font-medium whitespace-nowrap transition-opacity duration-300"
          disabled={isLoading || isSubmitted}
        >
          {isLoading ? "Submitting..." : isSubmitted ? "Thanks!" : buttonText}
        </Button>
      </div>
    </form>
  )
}
