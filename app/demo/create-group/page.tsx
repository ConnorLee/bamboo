"use client"

import type React from "react"

import { useState } from "react"
import { ArrowLeft, Clock, Lock, Globe } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
// Import the DeviceMockup component at the top of the file
import { DeviceMockup } from "@/components/device-mockup"

// Modify the default export function to wrap the content in the DeviceMockup
export default function CreateGroupPage() {
  const [groupName, setGroupName] = useState("")
  const [description, setDescription] = useState("")
  const [frequency, setFrequency] = useState("daily")
  const [time, setTime] = useState("08:00")
  const [isPrivate, setIsPrivate] = useState(false)
  const router = useRouter()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // In a real app, this would create the group
    // For the demo, we'll just redirect back to the main page
    router.push("/demo")
  }

  const content = (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-8 max-w-md">
        <div className="flex items-center mb-6">
          <Link href="/demo" className="text-gray-300 hover:text-white mr-3">
            <ArrowLeft size={24} />
          </Link>
          <h1 className="text-2xl font-medium">Create a New Group</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label htmlFor="groupName" className="block text-sm font-medium text-gray-300">
              Group Name
            </label>
            <input
              id="groupName"
              type="text"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="e.g., Morning Meditation Group"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#7CE95E]"
              required
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="description" className="block text-sm font-medium text-gray-300">
              Description
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What's this group about?"
              rows={3}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#7CE95E]"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-300">Meeting Frequency</label>
            <div className="grid grid-cols-3 gap-2">
              {["daily", "weekly", "monthly"].map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setFrequency(option)}
                  className={`py-2 px-4 rounded-lg capitalize ${
                    frequency === option ? "bg-[#7CE95E] text-black" : "bg-gray-800 text-gray-300"
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="time" className="flex items-center text-sm font-medium text-gray-300">
              <Clock size={16} className="mr-2" />
              Meeting Time
            </label>
            <input
              id="time"
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#7CE95E]"
              required
            />
          </div>

          <div className="flex items-center space-x-2">
            <label htmlFor="isPrivate" className="flex items-center cursor-pointer">
              <div className="relative">
                <input
                  id="isPrivate"
                  type="checkbox"
                  checked={isPrivate}
                  onChange={() => setIsPrivate(!isPrivate)}
                  className="sr-only"
                />
                <div className={`w-10 h-6 rounded-full transition ${isPrivate ? "bg-[#7CE95E]" : "bg-gray-600"}`}>
                  <div
                    className={`absolute w-4 h-4 rounded-full bg-white transition transform ${isPrivate ? "translate-x-5" : "translate-x-1"} top-1`}
                  />
                </div>
              </div>
              <div className="ml-3 text-sm">
                {isPrivate ? (
                  <div className="flex items-center">
                    <Lock size={14} className="mr-1" />
                    <span>Private Group</span>
                  </div>
                ) : (
                  <div className="flex items-center">
                    <Globe size={14} className="mr-1" />
                    <span>Public Group</span>
                  </div>
                )}
              </div>
            </label>
          </div>

          <button
            type="submit"
            className="w-full bg-[#7CE95E] text-black font-medium py-3 rounded-lg hover:bg-[#6BD84D] transition-colors"
          >
            Create Group
          </button>
        </form>
      </div>
    </div>
  )

  return <DeviceMockup>{content}</DeviceMockup>
}
