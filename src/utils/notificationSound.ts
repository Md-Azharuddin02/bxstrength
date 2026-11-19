// Short two-note chime made with Web Audio, so there is no sound file to ship or load.
let ctx: AudioContext | null = null;

export function playNotificationSound() {
  try {
    const Ctx = window.AudioContext || (window as any).webkitAudioContext;
    if (!Ctx) return;
    ctx ??= new Ctx();
    // Browsers keep audio suspended until the user has interacted with the page; then this resumes it.
    if (ctx.state === 'suspended') void ctx.resume();
    const start = ctx.currentTime;
    [880, 1318.5].forEach((freq, i) => {
      const osc = ctx!.createOscillator();
      const gain = ctx!.createGain();
      const t = start + i * 0.12;
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(0.18, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.35);
      osc.connect(gain).connect(ctx!.destination);
      osc.start(t);
      osc.stop(t + 0.4);
    });
  } catch {
    // Sound is a nice-to-have; never let it break the page.
  }
}
