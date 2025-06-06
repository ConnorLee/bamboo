export default function Loading() {
  return (
    <div className="w-full h-screen flex items-center justify-center bg-black">
      <div className="flex flex-col items-center">
        <div className="w-12 h-12 border-4 border-white/20 border-t-white/80 rounded-full animate-spin"></div>
        <p className="mt-4 text-white/60">Loading 3D scene...</p>
      </div>
    </div>
  )
}
