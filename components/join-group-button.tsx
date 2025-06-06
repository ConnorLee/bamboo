"use client"

import { Users } from "lucide-react"

interface JoinGroupButtonProps {
  onClick: () => void
}

export function JoinGroupButton({ onClick }: JoinGroupButtonProps) {
  return (
    <button
      onClick={onClick}
      className="flex-1 py-3 px-4 bg-white/20 backdrop-blur-md text-white font-medium rounded-full flex items-center justify-center space-x-2 shadow-lg hover:bg-white/30 transition-colors"
    >
      <Users size={18} />
      <span>Join Group</span>
    </button>
  )
}
