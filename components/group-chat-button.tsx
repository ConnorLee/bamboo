"use client"

import { MessageCircle } from "lucide-react"

interface GroupChatButtonProps {
  onClick: () => void
}

export function GroupChatButton({ onClick }: GroupChatButtonProps) {
  return (
    <button
      onClick={onClick}
      className="w-full py-3 px-4 bg-[#7CE95E] text-black font-medium rounded-full flex items-center justify-center space-x-2 shadow-lg hover:bg-[#6BD84D] transition-colors"
    >
      <MessageCircle size={20} />
      <span>Join Today's Group Session</span>
    </button>
  )
}
