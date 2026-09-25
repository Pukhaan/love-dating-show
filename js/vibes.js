// Vibes loop: endless drifting hearts in three depths, sparkles, and cupids floating by.
(() => {
  const W = 1920;
  const H = 1080;
  const params = new URLSearchParams(location.search);
  const stage = document.getElementById("stage");
  const canvas = document.getElementById("hearts");
  const ctx = canvas.getContext("2d");
  const sprites = VibeSprites.build();

  const LAYERS = [
    { count: 26, kinds: ["bokehWhite", "bokehPink", "bokehWhite"], size: [100, 210], alpha: [0.25, 0.55], speed: [9, 18], sway: [20, 50] },
    { count: 30, kinds: ["feltWhite", "feltBlush", "feltWhite", "outlineWhite", "feltRose"], size: [44, 92], alpha: [0.82, 0.96], speed: [24, 40], sway: [24, 60] },
    { count: 7, kinds: ["feltWhite", "feltRed", "feltRose", "outlineRed", "feltWhite"], size: [118, 176], alpha: [0.92, 1], speed: [46, 66], sway: [30, 80] },
  ];
  const CUPIDS = [
    { name: "cupid-bow-white", dir: 1 },
    { name: "cupid-letter", dir: -1 },
    { name: "cupid-bow", dir: 1 },
    { name: "cupid-letter-white", dir: -1 },
  ];

  const rand = (a, b) => a + Math.random() * (b - a);
  const pick = (list) => list[Math.floor(Math.random() * list.length)];

  const hearts = [];
  const trail = [];
  const flying = [];
  const sparkles = [...Array(70).keys()].map(() => ({
    x: rand(0, W), y: rand(0, H), size: rand(18, 58), speed: rand(0.6, 1.6), phase: rand(0, Math.PI * 2), rise: rand(2, 8),
  }));

  function spawn(layer, anywhere) {
    const size = rand(...layer.size);
    return {
      layer, kind: pick(layer.kinds), size,
      x0: rand(-60, W + 60), y: anywhere ? rand(-size, H + size) : H + size,
      vy: rand(...layer.speed), sway: rand(...layer.sway), freq: rand(0.12, 0.3), phase: rand(0, Math.PI * 2),
      rot: rand(-0.35, 0.35), spin: rand(-0.08, 0.08), alpha: rand(...layer.alpha),
    };
  }

  LAYERS.forEach((layer) => {
    for (let i = 0; i < layer.count; i += 1) hearts.push(spawn(layer, true));
  });
  hearts.sort((a, b) => LAYERS.indexOf(a.layer) - LAYERS.indexOf(b.layer));

  function drawSprite(img, x, y, width, rot, alpha) {
    const scale = width / VibeSprites.BASE;
    const w = img.width * scale;
    const h = img.height * scale;
    ctx.globalAlpha = alpha;
    ctx.setTransform(Math.cos(rot), Math.sin(rot), -Math.sin(rot), Math.cos(rot), x, y);
    ctx.drawImage(img, -w / 2, -h / 2, w, h);
  }

  function update(dt, t) {
    hearts.forEach((p, i) => {
      p.y -= p.vy * dt;
      p.rot += p.spin * dt;
      if (p.y < -p.size) hearts[i] = Object.assign(spawn(p.layer, false), { layer: p.layer });
    });
    for (let i = trail.length - 1; i >= 0; i -= 1) {
      const p = trail[i];
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (p.life <= 0) trail.splice(i, 1);
    }
    sparkles.forEach((s) => {
      s.y -= s.rise * dt;
      if (s.y < -40) { s.y = H + 40; s.x = rand(0, W); }
    });
    flying.forEach((c) => emitTrail(c, dt, t));
  }

  function draw(t) {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, W, H);
    hearts.forEach((p) => {
      const x = p.x0 + Math.sin(t * p.freq + p.phase) * p.sway;
      drawSprite(sprites[p.kind], x, p.y, p.size, p.rot + Math.sin(t * 0.5 + p.phase) * 0.08, p.alpha);
    });
    trail.forEach((p) => drawSprite(sprites[p.kind], p.x, p.y, p.size, p.rot, Math.min(1, p.life / 0.6) * 0.95));
    sparkles.forEach((s) => {
      const a = Math.pow(Math.sin(t * s.speed + s.phase) * 0.5 + 0.5, 3);
      if (a > 0.02) drawSprite(sprites.sparkle, s.x, s.y, s.size * (0.5 + a * 0.8), 0, a);
    });
    ctx.globalAlpha = 1;
  }

  function emitTrail(c, dt) {
    c.acc += dt;
    if (c.acc < 0.28) return;
    c.acc = 0;
    const x = gsap.getProperty(c.el, "x") - c.dir * 150;
    const y = gsap.getProperty(c.el, "y") + rand(-30, 40);
    trail.push({
      kind: pick(["feltRed", "feltWhite", "feltBlush", "outlineWhite"]), x, y, size: rand(18, 34),
      vx: -c.dir * rand(10, 30), vy: rand(-40, -15), rot: rand(-0.4, 0.4), life: rand(1.6, 2.6),
    });
  }

  function makeCupid(name) {
    const el = document.createElement("div");
    el.className = "sprite cupid-fly";
    el.innerHTML = [0, 1, 2].map((i) => `<img src="assets/${name}-${i}.png" alt="" draggable="false">`).join("");
    document.getElementById("cupids").appendChild(el);
    gsap.set(el, { xPercent: -50, yPercent: -50, x: -600, y: -600 });
    return el;
  }

  const cupidEls = CUPIDS.map((c) => ({ ...c, el: makeCupid(c.name) }));
  let nextCupid = 0;

  function launchCupid(progress = 0) {
    const c = cupidEls[nextCupid];
    nextCupid = (nextCupid + 1) % cupidEls.length;
    if (flying.some((f) => f.el === c.el)) return;
    const y0 = rand(260, 760);
    const scale = rand(0.75, 1.05);
    const fromX = c.dir > 0 ? -320 : W + 320;
    const toX = c.dir > 0 ? W + 320 : -320;
    const entry = { el: c.el, dir: c.dir, acc: 0 };
    flying.push(entry);
    const tl = gsap.timeline({
      onComplete: () => flying.splice(flying.indexOf(entry), 1),
    });
    tl.fromTo(c.el, { x: fromX, y: y0, scale, rotation: -4 * c.dir }, { x: toX, duration: rand(13, 17), ease: "none" }, 0)
      .to(c.el, { y: y0 - rand(50, 110), duration: 2.2, ease: "sine.inOut", yoyo: true, repeat: 5 }, 0)
      .to(c.el, { rotation: 4 * c.dir, duration: 1.6, ease: "sine.inOut", yoyo: true, repeat: 7 }, 0);
    tl.progress(progress);
    Music.sfx("flutter");
  }

  function scheduleCupids() {
    launchCupid();
    gsap.delayedCall(rand(8, 12), scheduleCupids);
  }

  let last = performance.now();
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    const t = now / 1000;
    update(dt, t);
    draw(t);
    requestAnimationFrame(frame);
  }

  function init() {
    Shell.fit(stage);
    Shell.startBoil(stage);
    Shell.bindKeys();
    Shell.autoHideCursor();

    if (params.has("still")) {
      document.getElementById("start").setAttribute("data-hidden", "");
      for (let i = 0; i < 300; i += 1) update(1 / 30, i / 30);
      gsap.set(cupidEls[0].el, { x: 620, y: 420, scale: 0.95 });
      gsap.set(cupidEls[1].el, { x: 1380, y: 660, scale: 0.85 });
      draw(10);
      return;
    }
    requestAnimationFrame(frame);
    Shell.onStart({
      params,
      soundFrom: () => 9,
      onPlay: () => gsap.delayedCall(2.5, scheduleCupids),
    });
  }

  init();
})();
