"use client"

import { useState } from "react"
import { ArrowLeft, Search, Users, Clock, Calendar } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
// Import the DeviceMockup component at the top of the file
import { DeviceMockup } from "@/components/device-mockup"

// Mock data for available groups
const availableGroups = [
  {
    id: 1,
    name: "Morning Meditation",
    members: 12,
    time: "8:00 AM",
    frequency: "Daily",
    description: "Start your day with mindfulness and intention setting.",
  },
  {
    id: 2,
    name: "Evening Check-in",
    members: 8,
    time: "7:00 PM",
    frequency: "Daily",
    description: "Reflect on your day and set intentions for tomorrow.",
  },
  {
    id: 3,
    name: "Weekend Warriors",
    members: 15,
    time: "10:00 AM",
    frequency: "Weekends",
    description: "Support for getting through challenging weekend triggers.",
  },
  {
    id: 4,
    name: "Newcomers Circle",
    members: 6,
    time: "6:00 PM",
    frequency: "Tuesdays & Thursdays",
    description: "A safe space for those just beginning their sobriety journey.",
  },
]

// Modify the default export function to wrap the content in the DeviceMockup
export default function JoinGroupPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const router = useRouter()

  const filteredGroups = availableGroups.filter(
    (group) =>
      group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      group.description.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handleJoinGroup = (groupId: number) => {
    // In a real app, this would join the group
    // For the demo, we'll just redirect back to the main page
    router.push("/demo")
  }

  const content = (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center mb-6">
          <Link href="/demo" className="text-gray-300 hover:text-white mr-3">
            <ArrowLeft size={24} />
          </Link>
          <h1 className="text-2xl font-medium">Join a Group</h1>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={18} className="text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search groups..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#7CE95E]"
          />
        </div>

        {/* Group List */}
        <div className="space-y-4">
          {filteredGroups.length > 0 ? (
            filteredGroups.map((group) => (
              <div key={group.id} className="bg-gray-800 rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <h2 className="text-lg font-medium">{group.name}</h2>
                  <button
                    onClick={() => handleJoinGroup(group.id)}
                    className="bg-[#7CE95E] text-black text-sm font-medium px-3 py-1 rounded-full hover:bg-[#6BD84D] transition-colors"
                  >
                    Join
                  </button>
                </div>
                <p className="text-gray-300 text-sm mb-3">{group.description}</p>
                <div className="flex items-center text-xs text-gray-400 space-x-4">
                  <div className="flex items-center">
                    <Users size={14} className="mr-1" />
                    <span>{group.members} members</span>
                  </div>
                  <div className="flex items-center">
                    <Clock size={14} className="mr-1" />
                    <span>{group.time}</span>
                  </div>
                  <div className="flex items-center">
                    <Calendar size={14} className="mr-1" />
                    <span>{group.frequency}</span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-400">No groups found matching "{searchTerm}"</p>
            </div>
          )}
        </div>

        {/* Invite Code Section */}
        <div className="mt-8 bg-gray-800 rounded-lg p-4">
          <h2 className="text-lg font-medium mb-3">Have an invite code?</h2>
          <div className="flex space-x-2">
            <input
              type="text"
              placeholder="Enter invite code"
              className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#7CE95E]"
            />
            <button className="bg-[#7CE95E] text-black px-4 py-2 rounded-lg font-medium hover:bg-[#6BD84D] transition-colors">
              Join
            </button>
          </div>
        </div>
      </div>
    </div>
  )

  return <DeviceMockup>{content}</DeviceMockup>
}
