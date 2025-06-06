"use client"

import { useState, useRef, useEffect } from "react"
import { ArrowLeft, Send, User, Clock } from "lucide-react"
import Link from "next/link"

// Import the DeviceMockup component at the top of the file
import { DeviceMockup } from "@/components/device-mockup"

// Mock data for the chat
const initialMessages = [
  {
    id: 1,
    sender: "Halo Guide",
    isGuide: true,
    content: "Welcome to today's session. Let's start by sharing one thing you're grateful for today.",
    timestamp: "10:00 AM",
  },
  {
    id: 2,
    sender: "Anonymous Owl",
    isGuide: false,
    content: "I'm grateful for another day of sobriety. It's been tough but I'm hanging in there.",
    timestamp: "10:02 AM",
  },
  {
    id: 3,
    sender: "Anonymous Fox",
    isGuide: false,
    content: "I'm grateful for this group. Having a place to check in has been really helpful for me.",
    timestamp: "10:03 AM",
  },
]

// Mock responses from the guide
const guideResponses = [
  "Thank you for sharing. It's important to acknowledge our progress, no matter how small it may seem.",
  "What strategies have you found most helpful in your journey so far?",
  "Remember that setbacks are part of the process. What matters is how we respond to them.",
  "Let's take a moment to reflect on our intentions for the week ahead.",
  "How has your perspective on sobriety changed since you started this journey?",
]

// Modify the default export function to wrap the content in the DeviceMockup
export default function ChatPage() {
  const [messages, setMessages] = useState(initialMessages)
  const [inputValue, setInputValue] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [participants, setParticipants] = useState(3) // Guide + 2 anonymous users
  const [timeRemaining, setTimeRemaining] = useState(45) // 45 minutes
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Countdown timer
  useEffect(() => {
    if (timeRemaining <= 0) return

    const timer = setInterval(() => {
      setTimeRemaining((prev) => prev - 1)
    }, 60000) // Update every minute

    return () => clearInterval(timer)
  }, [timeRemaining])

  const handleSendMessage = () => {
    if (!inputValue.trim()) return

    // Add user message
    const newUserMessage = {
      id: messages.length + 1,
      sender: "You",
      isGuide: false,
      content: inputValue,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    }

    setMessages((prev) => [...prev, newUserMessage])
    setInputValue("")

    // Simulate guide typing
    setIsTyping(true)

    // Add guide response after delay
    setTimeout(() => {
      setIsTyping(false)

      const randomResponse = guideResponses[Math.floor(Math.random() * guideResponses.length)]
      const newGuideMessage = {
        id: messages.length + 2,
        sender: "Halo Guide",
        isGuide: true,
        content: randomResponse,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      }

      setMessages((prev) => [...prev, newGuideMessage])
    }, 3000)
  }

  const content = (
    <div className="flex flex-col h-screen bg-gray-900">
      {/* Header */}
      <div className="bg-gray-800 p-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Link href="/demo" className="text-gray-300 hover:text-white">
            <ArrowLeft size={24} />
          </Link>
          <div>
            <h1 className="text-white font-medium">Morning Check-in Group</h1>
            <div className="flex items-center text-gray-400 text-sm">
              <User size={14} className="mr-1" />
              <span>{participants} participants</span>
              <span className="mx-2">•</span>
              <Clock size={14} className="mr-1" />
              <span>{timeRemaining} min remaining</span>
            </div>
          </div>
        </div>
        <div className="bg-[#7CE95E] text-black text-xs font-bold px-2 py-1 rounded-full">LIVE</div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div key={message.id} className={`flex ${message.sender === "You" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[80%] rounded-2xl p-3 ${
                message.isGuide
                  ? "bg-[#7CE95E]/20 text-white"
                  : message.sender === "You"
                    ? "bg-[#7CE95E] text-black"
                    : "bg-gray-700 text-white"
              }`}
            >
              {message.sender !== "You" && <div className="font-medium text-sm mb-1">{message.sender}</div>}
              <p>{message.content}</p>
              <div className="text-xs opacity-70 text-right mt-1">{message.timestamp}</div>
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-gray-700 rounded-2xl p-3 max-w-[80%]">
              <div className="font-medium text-sm mb-1 text-white">Halo Guide</div>
              <div className="flex space-x-1">
                <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="bg-gray-800 p-4">
        <div className="flex items-center space-x-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
            placeholder="Type your message..."
            className="flex-1 bg-gray-700 text-white rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#7CE95E]"
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputValue.trim()}
            className="bg-[#7CE95E] text-black p-2 rounded-full disabled:opacity-50"
          >
            <Send size={20} />
          </button>
        </div>
        <div className="text-xs text-gray-400 mt-2 text-center">Your messages are anonymous to other participants</div>
      </div>
    </div>
  )

  return <DeviceMockup>{content}</DeviceMockup>
}
