"use client"

import { Plus } from "lucide-react"

interface CreateGroupButtonProps {
  onClick: () => void
}

export function CreateGroupButton({ onClick }: CreateGroupButtonProps) {
  return (
    <button
      onClick={onClick}
      className="flex-1 py-3 px-4 bg-white/20 backdrop-blur-md text-white font-medium rounded-full flex items-center justify-center space-x-2 shadow-lg hover:bg-white/30 transition-colors"
    >
      <Plus size={18} />
      <span>Create Group</span>
    </button>
  )
}
