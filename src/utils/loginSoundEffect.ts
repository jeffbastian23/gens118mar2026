// iPhone-like "Gensi" notification sound using Web Audio API
export const playGensiSound = () => {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // Create a pleasant notification chime similar to iPhone tri-tone
    const playNote = (frequency: number, startTime: number, duration: number, volume: number = 0.3) => {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = frequency;
      oscillator.type = 'sine';
      
      // Smooth envelope for pleasant sound
      gainNode.gain.setValueAtTime(0, audioContext.currentTime + startTime);
      gainNode.gain.linearRampToValueAtTime(volume, audioContext.currentTime + startTime + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + startTime + duration);
      
      oscillator.start(audioContext.currentTime + startTime);
      oscillator.stop(audioContext.currentTime + startTime + duration);
    };
    
    // Create a tri-tone melody like iPhone notification
    // First note - higher pitch
    playNote(1319, 0, 0.15, 0.25); // E6
    
    // Second note - middle pitch  
    playNote(1047, 0.12, 0.15, 0.25); // C6
    
    // Third note - resolution
    playNote(1568, 0.24, 0.3, 0.3); // G6
    
    // Add a subtle harmonic overlay for richness
    playNote(2637, 0.24, 0.25, 0.1); // E7 harmonic
    
  } catch (error) {
    console.log('Audio playback not supported:', error);
  }
};
