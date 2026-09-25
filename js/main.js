// Story loop: drive the scene from the music clock so picture and sound never drift apart.
(() => {
  const params = new URLSearchParams(location.search);
  const startAt = Number(params.get("t")) || 0;
  const stage = document.getElementById("stage");
  const roundEl = document.getElementById("roundNo");

  let tl;
  let perfT0 = null;
  let lastRound = -1;

  function elapsed() {
    if (Music.running()) return Music.songTime();
    if (perfT0 === null) return startAt;
    return (performance.now() - perfT0) / 1000 + startAt;
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

  function init() {
    Shell.fit(stage);
    tl = Scene.build();
    Ambient.start(document.getElementById("ambient"));
    Shell.startBoil(stage);
    Shell.bindKeys();
    Shell.autoHideCursor();
    tl.totalTime(startAt);

    if (params.has("still")) {
      document.getElementById("start").setAttribute("data-hidden", "");
      return;
    }
    Shell.onStart({
      params,
      soundFrom: elapsed,
      onPlay: () => {
        perfT0 = performance.now();
        gsap.ticker.add(render);
      },
    });
  }

  init();
})();
