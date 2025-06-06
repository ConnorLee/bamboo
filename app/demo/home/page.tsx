"use client"

import { useState } from "react"
import { DeviceMockup } from "@/components/device-mockup"
import { useRouter } from "next/navigation"
import { Calendar, Bell, Settings, Users, MessageCircle, BarChart } from "lucide-react"

export default function AppHomePage() {
  const router = useRouter()
  const [streak, setStreak] = useState(15) // One more than the lock screen

  const content = (
    <div className="min-h-screen bg-gray-900 text-white relative pb-16">
      {" "}
      {/* Added pb-16 for bottom nav spacing */}
      {/* Header */}
      <div className="bg-gray-800 p-4 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-10 h-10 rounded-full bg-[#7CE95E] flex items-center justify-center">
            <span className="text-black font-bold">{streak}</span>
          </div>
          <div>
            <h1 className="font-medium">Habit Halo</h1>
            <p className="text-xs text-gray-400">15 day streak 🔥</p>
          </div>
        </div>
        <button className="p-2 rounded-full bg-gray-700">
          <Bell size={20} />
        </button>
      </div>
      {/* Main Content - Added max-h-[calc(100vh-144px)] and overflow-y-auto to make content scrollable */}
      <div className="p-4 max-h-[calc(100vh-144px)] overflow-y-auto">
        <div className="mb-6">
          <h2 className="text-xl font-medium mb-3">Today's Focus</h2>
          <div className="bg-gray-800 rounded-lg p-4">
            <p className="text-gray-300 mb-2">"The journey of a thousand miles begins with a single step."</p>
            <p className="text-xs text-gray-400">What small step will you take today to maintain your sobriety?</p>
          </div>
        </div>

        <div className="mb-6">
          <h2 className="text-xl font-medium mb-3">Upcoming Sessions</h2>
          <div className="bg-gray-800 rounded-lg p-4 mb-2">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-medium">Morning Check-in</h3>
                <p className="text-xs text-gray-400">Today, 10:00 AM • 3 participants</p>
              </div>
              <button className="bg-[#7CE95E] text-black text-xs font-medium px-3 py-1 rounded-full">Join</button>
            </div>
          </div>
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-medium">Evening Reflection</h3>
                <p className="text-xs text-gray-400">Today, 7:00 PM • 8 participants</p>
              </div>
              <button className="bg-gray-700 text-white text-xs font-medium px-3 py-1 rounded-full">Remind</button>
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-xl font-medium mb-3">Your Groups</h2>
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-gray-800 rounded-lg p-3 flex flex-col items-center">
              <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center mb-2">
                <Users size={20} className="text-blue-400" />
              </div>
              <span className="text-sm">Daily Support</span>
            </div>
            <div className="bg-gray-800 rounded-lg p-3 flex flex-col items-center">
              <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center mb-2">
                <MessageCircle size={20} className="text-purple-400" />
              </div>
              <span className="text-sm">Newcomers</span>
            </div>
            <div className="bg-gray-800 rounded-lg p-3 flex flex-col items-center">
              <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center mb-2">
                <BarChart size={20} className="text-green-400" />
              </div>
              <span className="text-sm">Progress</span>
            </div>
            <div className="bg-gray-800 rounded-lg p-3 flex flex-col items-center">
              <div className="w-10 h-10 rounded-full bg-gray-500/20 flex items-center justify-center mb-2">
                <Settings size={20} className="text-gray-400" />
              </div>
              <span className="text-sm">Settings</span>
            </div>
          </div>
        </div>
      </div>
      {/* Bottom Navigation - Changed from fixed to absolute positioning */}
      <div className="absolute bottom-0 left-0 right-0 bg-gray-800 flex justify-around p-3 border-t border-gray-700">
        <button className="p-2 text-[#7CE95E]">
          <Calendar size={24} />
        </button>
        <button className="p-2 text-gray-400">
          <Users size={24} />
        </button>
        <button className="p-2 text-gray-400">
          <MessageCircle size={24} />
        </button>
        <button className="p-2 text-gray-400">
          <BarChart size={24} />
        </button>
      </div>
    </div>
  )

  return <DeviceMockup>{content}</DeviceMockup>
}
