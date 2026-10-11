function noiseBuffer(ctx, seconds = 2) {
  const buffer = ctx.createBuffer(1, ctx.sampleRate * seconds, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length) ** .15;
  return buffer;
}

export function createCaveAudio() {
  let ctx, master, wind, windGain, timer, fireTimer, active = false, dropBuffer, loading, disposed = false;
  function drop() {
    if (!ctx || !active || !dropBuffer) return;
    const source = ctx.createBufferSource(), gain = ctx.createGain();
    source.buffer = dropBuffer;
    gain.gain.value = .25;
    source.connect(gain).connect(master);
    source.onended = () => { source.disconnect(); gain.disconnect(); };
    source.start();
  }
  function burst() {
    if (!ctx || !active) return;
    const now = ctx.currentTime, osc = ctx.createOscillator(), gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(180 + Math.random() * 90, now);
    osc.frequency.exponentialRampToValueAtTime(80, now + .08);
    gain.gain.setValueAtTime(0, now); gain.gain.linearRampToValueAtTime(.018, now + .012); gain.gain.exponentialRampToValueAtTime(.001, now + .35);
    osc.connect(gain).connect(master);osc.start(now);osc.stop(now + .4);
  }
  function schedule() { if (!active) return; drop(); timer = setTimeout(schedule, (dropBuffer.duration + 2 + Math.random() * 4) * 1000); }
  return {
    async start() {
      if (!ctx) {
        ctx = new AudioContext(); master = ctx.createGain(); master.gain.value = .7; master.connect(ctx.destination);
        const source = ctx.createBufferSource(); source.buffer = noiseBuffer(ctx); source.loop = true;
        const filter = ctx.createBiquadFilter(); filter.type = 'lowpass'; filter.frequency.value = 520;
        windGain = ctx.createGain(); windGain.gain.value = .07; source.connect(filter).connect(windGain).connect(master); source.start(); wind = source;
      }
      active = true;
      try {
        await ctx.resume();
        loading ||= fetch('/audio/cave-dripping-water.wav').then(response => {
          if (!response.ok) throw new Error('水滴音频加载失败，请重试');
          return response.arrayBuffer();
        }).then(bytes => ctx.decodeAudioData(bytes)).catch(error => { loading = null; throw error; });
        dropBuffer = await loading;
        if (!active || disposed) return;
        clearTimeout(timer); schedule();
        clearInterval(fireTimer); fireTimer = setInterval(() => burst(), 4500);
      } catch(error) { active = false; if (!disposed) await ctx.suspend(); throw error; }
    },
    stop() { active = false; clearTimeout(timer); clearInterval(fireTimer); if (ctx) ctx.suspend(); },
    async toggle() { if (active) { this.stop(); return false; } await this.start(); return active; },
    step() { if (!ctx || !active) return; burst('foot'); const now = ctx.currentTime; const source = ctx.createBufferSource(); source.buffer = noiseBuffer(ctx, .08); const filter = ctx.createBiquadFilter(); filter.type = 'bandpass'; filter.frequency.value = 700; const gain = ctx.createGain(); gain.gain.setValueAtTime(.001, now); gain.gain.exponentialRampToValueAtTime(.08, now + .012); gain.gain.exponentialRampToValueAtTime(.001, now + .09); source.connect(filter).connect(gain).connect(master); source.start(now); source.stop(now + .1); },
    fire() { if (!ctx || !active) return; burst('fire'); },
    get active() { return active; },
    dispose() { disposed = true; clearTimeout(timer); clearInterval(fireTimer); active = false; wind?.stop(); ctx?.close(); }
  };
}
