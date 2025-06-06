// Audio context singleton to prevent multiple instances
let audioContext: AudioContext | null = null
let oscillator: OscillatorNode | null = null
let gainNode: GainNode | null = null

export const playMeditativeSound = () => {
  try {
    // Initialize audio context if it doesn't exist
    if (!audioContext) {
      audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    }

    // If oscillator is already playing, don't create a new one
    if (oscillator) return

    // Create oscillator for a calming frequency
    oscillator = audioContext.createOscillator()
    gainNode = audioContext.createGain()

    // Set up a lower calming frequency (174Hz - Solfeggio frequency associated with relaxation)
    oscillator.type = "sine"
    oscillator.frequency.setValueAtTime(174, audioContext.currentTime)

    // Create a smoother ease-in curve for the volume
    // Start with a very small value (not zero) for exponential ramp
    const startVolume = 0.0001
    const targetVolume = 0.03
    const fadeInDuration = 1.5 // slightly longer for smoother feel

    gainNode.gain.setValueAtTime(startVolume, audioContext.currentTime)

    // Use exponentialRampToValueAtTime for more natural sounding fade-in
    gainNode.gain.exponentialRampToValueAtTime(targetVolume, audioContext.currentTime + fadeInDuration)

    // Connect nodes
    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)

    // Start the oscillator
    oscillator.start()
  } catch (error) {
    console.error("Error playing meditative sound:", error)
  }
}

export const stopMeditativeSound = () => {
  try {
    if (!gainNode || !oscillator || !audioContext) return

    // Create a smoother ease-out curve for the volume
    const currentTime = audioContext.currentTime
    const fadeOutDuration = 1.2 // slightly longer for smoother fade-out

    // Get current volume
    const currentVolume = gainNode.gain.value

    // Cancel any scheduled values
    gainNode.gain.cancelScheduledValues(currentTime)

    // Set current value
    gainNode.gain.setValueAtTime(currentVolume, currentTime)

    // Create a more natural fade-out curve
    // We use exponentialRampToValueAtTime for a natural decay
    // But we can't ramp to exactly 0, so we use a very small value
    gainNode.gain.exponentialRampToValueAtTime(0.0001, currentTime + fadeOutDuration)

    // Then set it to 0 immediately after
    gainNode.gain.setValueAtTime(0, currentTime + fadeOutDuration)

    // Stop the oscillator after fade out
    setTimeout(
      () => {
        if (oscillator) {
          oscillator.stop()
          oscillator = null
        }
      },
      fadeOutDuration * 1000 + 50,
    ) // Convert to ms and add a small buffer
  } catch (error) {
    console.error("Error stopping meditative sound:", error)
  }
}
