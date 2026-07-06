let isMuted = false;

export const setMuted = (muted: boolean) => {
  isMuted = muted;
};

export const getMuted = () => isMuted;

// Play a short click for correct typing
export const playCorrectSound = () => {
  if (isMuted) return;
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(600, ctx.currentTime); // High pitched click
    
    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.05);
  } catch (e) {
    console.warn("Audio error:", e);
  }
};

// Play a low buzzer for errors
export const playErrorSound = () => {
  if (isMuted) return;
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "triangle";
    osc.frequency.setValueAtTime(130, ctx.currentTime); // Low buzz

    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.15);
  } catch (e) {
    console.warn("Audio error:", e);
  }
};

// Play a celebratory fanfare for game completion
export const playVictorySound = () => {
  if (isMuted) return;
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    
    const playNote = (freq: number, start: number, duration: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, ctx.currentTime + start);
      
      gain.gain.setValueAtTime(0.1, ctx.currentTime + start);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + duration);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start(ctx.currentTime + start);
      osc.stop(ctx.currentTime + start + duration);
    };

    // Major pentatonic fanfare (C4, E4, G4, C5)
    playNote(261.63, 0.0, 0.15); // C4
    playNote(329.63, 0.15, 0.15); // E4
    playNote(392.00, 0.3, 0.15); // G4
    playNote(523.25, 0.45, 0.4); // C5
  } catch (e) {
    console.warn("Audio error:", e);
  }
};
