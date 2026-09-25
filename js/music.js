// A music-box waltz synthesized with Web Audio. 16 bars at 80 BPM in 3/4 = 36 s,
// so two passes line up exactly with the 72 s scene loop.
window.Music = (() => {
  const BPM = 80;
  const BEAT = 60 / BPM;
  const BAR = BEAT * 3;
  const SONG_BARS = 16;
  const LOOKAHEAD = 0.35;

  const PC = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
  const hz = (n) => {
    const acc = n[1] === "#" ? 1 : n[1] === "b" ? -1 : 0;
    const midi = 12 * (Number(n.slice(acc ? 2 : 1)) + 1) + PC[n[0]] + acc;
    return 440 * Math.pow(2, (midi - 69) / 12);
  };

  const CHORDS = ["C", "Am", "F", "G", "C", "Am", "Dm", "G", "F", "G", "Em", "Am", "F", "G", "C", "C"];
  const VOICING = {
    C: ["C4", "E4", "G4"], Am: ["A3", "C4", "E4"], F: ["F3", "A3", "C4"],
    G: ["G3", "B3", "D4"], Dm: ["F3", "A3", "D4"], Em: ["E3", "G3", "B3"],
  };
  const ROOT = { C: "C3", Am: "A2", F: "F2", G: "G2", Dm: "D3", Em: "E2" };
  const MELODY = [
    [["E5", 1], ["G5", 1], ["C6", 1]], [["B5", 1.5], ["A5", 0.5], ["E5", 1]],
    [["F5", 1], ["A5", 1], ["C6", 1]], [["B5", 2], ["G5", 1]],
    [["E5", 1], ["G5", 1], ["E6", 1]], [["D6", 1], ["C6", 1], ["A5", 1]],
    [["F5", 1], ["A5", 1], ["D6", 1]], [["B5", 2], ["G5", 0.5], ["A5", 0.5]],
    [["A5", 1], ["C6", 1], ["F6", 1]], [["E6", 1], ["D6", 1], ["B5", 1]],
    [["G5", 1], ["B5", 1], ["E6", 1]], [["C6", 1.5], ["B5", 0.5], ["A5", 1]],
    [["A5", 1], ["G5", 1], ["F5", 1]], [["D5", 1], ["G5", 1], ["B5", 1]],
    [["C6", 3]], [[null, 1], ["G5", 1], ["E5", 1]],
  ];

  let ctx = null;
  let master, boxBus, padBus, reverb, delay, noiseBuf;
  let songT0 = 0;
  let nextBar = 0;
  let timer = null;
  let muted = false;
  const lastSfx = {};

  const jitter = (amt) => (Math.random() * 2 - 1) * amt;

  function makeImpulse(seconds, decay) {
    const len = Math.floor(ctx.sampleRate * seconds);
    const buf = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch += 1) {
      const data = buf.getChannelData(ch);
      for (let i = 0; i < len; i += 1) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
    }
    return buf;
  }

  function makeNoise(seconds) {
    const len = Math.floor(ctx.sampleRate * seconds);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i += 1) data[i] = Math.random() * 2 - 1;
    return buf;
  }

  function buildGraph() {
    master = ctx.createGain();
    master.gain.value = 0.85;
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -16;
    comp.ratio.value = 3;
    master.connect(comp).connect(ctx.destination);

    reverb = ctx.createConvolver();
    reverb.buffer = makeImpulse(3.2, 2.6);
    const revGain = ctx.createGain();
    revGain.gain.value = 0.5;
    reverb.connect(revGain).connect(master);

    delay = ctx.createDelay(2);
    delay.delayTime.value = BEAT * 0.75;
    const fb = ctx.createGain();
    fb.gain.value = 0.26;
    const tone = ctx.createBiquadFilter();
    tone.type = "lowpass";
    tone.frequency.value = 2600;
    delay.connect(tone).connect(fb).connect(delay);
    const delayOut = ctx.createGain();
    delayOut.gain.value = 0.22;
    tone.connect(delayOut).connect(master);

    boxBus = ctx.createGain();
    boxBus.gain.value = 0.9;
    boxBus.connect(master);
    boxBus.connect(reverb);
    boxBus.connect(delay);

    padBus = ctx.createGain();
    padBus.gain.value = 0.6;
    padBus.connect(master);
    padBus.connect(reverb);

    noiseBuf = makeNoise(2);
    startCrackle();
  }

  function envGain(t, peak, attack, decay) {
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay);
    return g;
  }

  function box(t, f, v = 1, dest = boxBus) {
    const car = ctx.createOscillator();
    car.frequency.value = f;
    const mod = ctx.createOscillator();
    mod.frequency.value = f * 3.5;
    const modDepth = ctx.createGain();
    modDepth.gain.setValueAtTime(f * 1.4 * v, t);
    modDepth.gain.exponentialRampToValueAtTime(f * 0.02, t + 0.3);
    mod.connect(modDepth).connect(car.frequency);
    const shimmer = ctx.createOscillator();
    shimmer.frequency.value = f * 2.01;
    const g = envGain(t, 0.2 * v, 0.004, 1.9);
    const g2 = envGain(t, 0.045 * v, 0.003, 0.55);
    car.connect(g).connect(dest);
    shimmer.connect(g2).connect(dest);
    [car, mod, shimmer].forEach((o) => { o.start(t); o.stop(t + 2.1); });
  }

  function pad(t, notes, dur, level = 0.024) {
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 950;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(level, t + 0.6);
    g.gain.setValueAtTime(level, t + dur - 0.4);
    g.gain.linearRampToValueAtTime(0.0001, t + dur + 0.6);
    lp.connect(g).connect(padBus);
    notes.forEach((n) => [-6, 6].forEach((cents) => {
      const o = ctx.createOscillator();
      o.type = "triangle";
      o.frequency.value = hz(n);
      o.detune.value = cents;
      o.connect(lp);
      o.start(t);
      o.stop(t + dur + 0.7);
    }));
  }

  function bass(t, f) {
    const o = ctx.createOscillator();
    o.frequency.value = f;
    const o2 = ctx.createOscillator();
    o2.frequency.value = f * 2;
    const g = envGain(t, 0.15, 0.006, 1.3);
    const g2 = envGain(t, 0.03, 0.006, 0.5);
    o.connect(g).connect(master);
    o2.connect(g2).connect(master);
    [o, o2].forEach((x) => { x.start(t); x.stop(t + 1.4); });
  }

  function noiseHit(t, freq, q, peak, decay, type = "bandpass", dest = master) {
    const src = ctx.createBufferSource();
    src.buffer = noiseBuf;
    const f = ctx.createBiquadFilter();
    f.type = type;
    f.frequency.value = freq;
    f.Q.value = q;
    const g = envGain(t, peak, 0.003, decay);
    src.connect(f).connect(g).connect(dest);
    src.start(t, Math.random());
    src.stop(t + decay + 0.05);
    return f;
  }

  function startCrackle() {
    const len = ctx.sampleRate * 4;
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i += 1) {
      d[i] = (Math.random() * 2 - 1) * 0.006;
      if (Math.random() < 0.00045) d[i] += (Math.random() < 0.5 ? -1 : 1) * (0.2 + Math.random() * 0.35);
    }
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.loop = true;
    const hp = ctx.createBiquadFilter();
    hp.type = "highpass";
    hp.frequency.value = 1400;
    const g = ctx.createGain();
    g.gain.value = 0.3;
    src.connect(hp).connect(g).connect(master);
    src.start();
  }

  function scheduleBar(index, t) {
    const inLoop = index % (SONG_BARS * 2);
    const bar = index % SONG_BARS;
    const chord = CHORDS[bar];
    const intro = inLoop < 4;
    const secondPass = inLoop >= SONG_BARS;

    pad(t, VOICING[chord], BAR, intro ? 0.018 : 0.026);
    if (!intro) bass(t + jitter(0.006), hz(ROOT[chord]));
    [1, 2].forEach((beat) => {
      const bt = t + beat * BEAT + jitter(0.008);
      VOICING[chord].forEach((n, k) => box(bt + k * 0.012, hz(n) * 2, 0.32 + jitter(0.04)));
      if (!intro) noiseHit(bt, 7200, 0.8, 0.016, 0.07);
    });

    let at = 0;
    MELODY[bar].forEach(([note, beats]) => {
      if (note) {
        const nt = t + at * BEAT + jitter(0.01);
        box(nt, hz(note), 0.95 + jitter(0.08));
        if (secondPass && at % 1 === 0) box(nt + 0.004, hz(note) * 2, 0.22);
      }
      at += beats;
    });
  }

  function tick() {
    while (songT0 + nextBar * BAR < ctx.currentTime + LOOKAHEAD) {
      const t = songT0 + nextBar * BAR;
      if (t > ctx.currentTime - 0.05) scheduleBar(nextBar, t);
      nextBar += 1;
    }
  }

  async function start(fromSeconds = 0) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    if (!ctx) {
      ctx = new AC();
      buildGraph();
    }
    if (ctx.state !== "running") await ctx.resume();
    songT0 = ctx.currentTime + 0.08 - fromSeconds;
    nextBar = Math.ceil(fromSeconds / BAR);
    clearInterval(timer);
    timer = setInterval(tick, 25);
    tick();
    return ctx.state === "running";
  }

  const running = () => Boolean(ctx) && ctx.state === "running";
  const songTime = () => ctx.currentTime - songT0;

  function toggleMute() {
    if (!ctx) return;
    muted = !muted;
    master.gain.setTargetAtTime(muted ? 0 : 0.85, ctx.currentTime, 0.08);
  }

  function sfx(name) {
    if (!running() || document.hidden) return;
    const now = ctx.currentTime;
    if (lastSfx[name] && now - lastSfx[name] < 0.5) return;
    lastSfx[name] = now;
    if (name === "whoosh") {
      const f = noiseHit(now, 400, 1.4, 0.12, 0.55);
      f.frequency.exponentialRampToValueAtTime(2800, now + 0.45);
    } else if (name === "thud" || name === "stamp") {
      const o = ctx.createOscillator();
      o.frequency.setValueAtTime(170, now);
      o.frequency.exponentialRampToValueAtTime(52, now + 0.22);
      const g = envGain(now, name === "stamp" ? 0.4 : 0.22, 0.004, 0.32);
      o.connect(g).connect(master);
      o.start(now);
      o.stop(now + 0.4);
      noiseHit(now, 900, 0.7, name === "stamp" ? 0.1 : 0.05, 0.12, "lowpass");
    } else if (name === "chime") {
      ["C6", "E6", "G6", "C7"].forEach((n, i) => box(now + i * 0.075, hz(n), 0.7));
    } else if (name === "flutter") {
      for (let i = 0; i < 5; i += 1) noiseHit(now + i * 0.07, 2400, 2, 0.02, 0.05);
    }
  }

  return { start, running, songTime, toggleMute, sfx, LOOP: BAR * SONG_BARS * 2 };
})();
