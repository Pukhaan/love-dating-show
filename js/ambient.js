// Background life that never stops: drifting stitched hearts and slow blue stars.
window.Ambient = (() => {
  const COLORS = ["#C3251D", "#E88AA4", "#2440A8", "#C3251D", "#EE9FB8"];
  const MAX_HEARTS = 14;
  let layer;
  let live = 0;

  const rand = (a, b) => a + Math.random() * (b - a);
  const pick = (list) => list[Math.floor(Math.random() * list.length)];

  function spawnHeart(warm = false) {
    if (live >= MAX_HEARTS || document.hidden) return;
    const el = document.createElement("div");
    const size = rand(22, 54);
    el.className = "ambient-bit";
    el.style.width = `${size}px`;
    el.style.height = `${size * 0.92}px`;
    el.innerHTML = Math.random() < 0.55 ? Pieces.outlineHeart(pick(COLORS)) : Pieces.heartSvg(Math.random() < 0.5 ? "pink" : "red");
    layer.appendChild(el);
    live += 1;

    const startX = rand(60, 1860);
    const drift = rand(-120, 120);
    const startY = warm ? rand(260, 1100) : 1140;
    const duration = rand(16, 26) * ((startY + 120) / 1260);
    gsap.set(el, { x: startX, y: startY, rotation: rand(-25, 25), opacity: 0 });
    const tl = gsap.timeline({
      onComplete: () => {
        el.remove();
        live -= 1;
      },
    });
    tl.to(el, { y: -120, duration, ease: "none" }, 0)
      .to(el, { opacity: rand(0.35, 0.7), duration: 2.5 }, 0)
      .to(el, { opacity: 0, duration: 3 }, duration - 3)
      .to(el, { x: startX + drift, duration: duration / 2, ease: "sine.inOut", yoyo: true, repeat: 1 }, 0)
      .to(el, { rotation: `+=${rand(-30, 30)}`, duration: duration / 2, ease: "sine.inOut", yoyo: true, repeat: 1 }, 0);
  }

  function placeStars() {
    const spots = [[240, 300], [1660, 260], [1500, 820], [360, 720], [1780, 560], [140, 480], [1180, 180]];
    spots.forEach(([x, y], i) => {
      const el = document.createElement("div");
      const size = 18 + (i % 3) * 8;
      el.className = "ambient-bit";
      el.style.width = `${size}px`;
      el.style.height = `${size}px`;
      el.innerHTML = Pieces.star(i % 2 ? "#2440A8" : "#C3251D");
      layer.appendChild(el);
      gsap.set(el, { x, y, scale: 0.4, opacity: 0.2, transformOrigin: "50% 50%" });
      gsap.to(el, {
        scale: 1,
        opacity: 0.75,
        rotation: 45,
        duration: rand(2.2, 3.6),
        ease: "sine.inOut",
        yoyo: true,
        repeat: -1,
        delay: i * 0.7,
      });
    });
  }

  function start(root) {
    layer = root;
    placeStars();
    for (let i = 0; i < 7; i += 1) spawnHeart(true);
    setInterval(() => spawnHeart(false), 1600);
  }

  return { start };
})();
