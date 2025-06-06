"use client"

export function GlobalStyles() {
  return (
    <style jsx global>{`
      .toaster-container {
        z-index: 9999;
        position: fixed;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        width: 90%;
        max-width: 400px;
      }
      
      @media (max-width: 640px) {
        .toaster-container {
          bottom: 10px;
          width: 95%;
        }
      }
    `}</style>
  )
}
