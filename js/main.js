// Wiring: fit the 1920x1080 stage to any screen, start on one click, drive the scene
// from the music clock so picture and sound never drift apart.
(() => {
  const params = new URLSearchParams(location.search);
  const startAt = Number(params.get("t")) || 0;
  const still = params.has("still");
  const stage = document.getElementById("stage");
  const startEl = document.getElementById("start");
  const soundHint = document.getElementById("soundHint");
  const roundEl = document.getElementById("roundNo");

  let tl;
  let perfT0 = null;
  let perfOffset = startAt;
  let lastRound = -1;

  function fit() {
    const s = Math.min(window.innerWidth / 1920, window.innerHeight / 1080);
    stage.style.transform = `translate(-50%, -50%) scale(${s})`;
  }

  function elapsed() {
    if (Music.running()) return Music.songTime();
    if (perfT0 === null) return startAt;
    return (performance.now() - perfT0) / 1000 + perfOffset;
  }

  function render() {
    const t = Math.max(0, elapsed());
    tl.totalTime(t);
    const round = Math.floor(t / Scene.LOOP) + 1;
    if (round !== lastRound) {
      lastRound = round;
      roundEl.textContent = String(round).padStart(2, "0");
    }
  }

  function startBoil() {
    let frame = 0;
    setInterval(() => {
      frame = (frame + 1) % 3;
      stage.dataset.boil = String(frame);
    }, 170);
  }

  async function enableSound() {
    const from = elapsed();
    const ok = await Music.start(from).catch(() => false);
    if (ok) soundHint.removeAttribute("data-show");
    return ok;
  }

  function goFullscreen() {
    const el = document.documentElement;
    const req = el.requestFullscreen || el.webkitRequestFullscreen;
    if (req && !document.fullscreenElement && !document.webkitFullscreenElement) {
      try { req.call(el); } catch (e) { /* ignore */ }
    }
  }

  function play() {
    startEl.setAttribute("data-hidden", "");
    perfT0 = performance.now();
    perfOffset = startAt;
    gsap.ticker.add(render);
  }

  function onStartPress(event) {
    event.preventDefault();
    play();
    enableSound();
    if (!params.has("window")) goFullscreen();
  }

  function onKey(event) {
    const key = event.key.toLowerCase();
    if (key === "f") goFullscreen();
    if (key === "m") Music.toggleMute();
  }

  let idle;
  function wakeCursor() {
    document.body.classList.remove("hide-cursor");
    clearTimeout(idle);
    idle = setTimeout(() => document.body.classList.add("hide-cursor"), 2500);
  }

  function init() {
    fit();
    window.addEventListener("resize", fit);
    tl = Scene.build();
    Ambient.start(document.getElementById("ambient"));
    startBoil();
    window.addEventListener("keydown", onKey);
    window.addEventListener("pointermove", wakeCursor);
    wakeCursor();

    if (still) {
      startEl.setAttribute("data-hidden", "");
      tl.totalTime(startAt);
      return;
    }
    if (params.has("autostart")) {
      play();
      soundHint.setAttribute("data-show", "");
      window.addEventListener("pointerdown", enableSound, { once: true, capture: true });
      return;
    }
    tl.totalTime(startAt);
    document.getElementById("startBtn").addEventListener("pointerdown", onStartPress, { capture: true });
  }

  init();
})();
