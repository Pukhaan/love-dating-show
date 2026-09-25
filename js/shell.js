// Screen plumbing shared by both loops: fit the 1920x1080 stage, full screen,
// hide the cursor, stop-motion "boil" frames, and the F / M keys.
window.Shell = (() => {
  function fit(stage) {
    const apply = () => {
      const s = Math.min(window.innerWidth / 1920, window.innerHeight / 1080);
      stage.style.transform = `translate(-50%, -50%) scale(${s})`;
    };
    apply();
    window.addEventListener("resize", apply);
  }

  function goFullscreen() {
    const el = document.documentElement;
    const req = el.requestFullscreen || el.webkitRequestFullscreen;
    if (req && !document.fullscreenElement && !document.webkitFullscreenElement) {
      try { req.call(el); } catch (e) { /* ignore */ }
    }
  }

  function startBoil(stage) {
    let frame = 0;
    setInterval(() => {
      frame = (frame + 1) % 3;
      stage.dataset.boil = String(frame);
    }, 170);
  }

  function autoHideCursor() {
    let idle;
    const wake = () => {
      document.body.classList.remove("hide-cursor");
      clearTimeout(idle);
      idle = setTimeout(() => document.body.classList.add("hide-cursor"), 2500);
    };
    window.addEventListener("pointermove", wake);
    wake();
  }

  function bindKeys() {
    window.addEventListener("keydown", (event) => {
      const key = event.key.toLowerCase();
      if (key === "f") goFullscreen();
      if (key === "m") Music.toggleMute();
    });
  }

  // Wires the start button (or ?autostart) and calls onPlay once.
  function onStart({ params, onPlay, soundFrom }) {
    const startEl = document.getElementById("start");
    const soundHint = document.getElementById("soundHint");
    const enableSound = async () => {
      const ok = await Music.start(soundFrom()).catch(() => false);
      if (ok) soundHint.removeAttribute("data-show");
    };
    const play = () => {
      startEl.setAttribute("data-hidden", "");
      onPlay();
    };
    if (params.has("autostart")) {
      play();
      soundHint.setAttribute("data-show", "");
      window.addEventListener("pointerdown", enableSound, { once: true, capture: true });
      return;
    }
    document.getElementById("startBtn").addEventListener("pointerdown", (event) => {
      event.preventDefault();
      play();
      enableSound();
      if (!params.has("window")) goFullscreen();
    }, { capture: true });
  }

  return { fit, goFullscreen, startBoil, autoHideCursor, bindKeys, onStart };
})();
