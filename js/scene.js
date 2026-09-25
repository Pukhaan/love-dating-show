// The 72 s story, built once as a paused GSAP timeline that main.js scrubs by the music clock.
// Beats land on bar lines: one bar = 2.25 s.
window.Scene = (() => {
  const CX = 960;
  const DECK_Y = 610;
  const LOW_Y = 950;
  const CARD_Y = 620;
  const HEART_Y = 588;
  const COUNT = 8;
  const ROT = [-2.2, 1.4, -0.8, 2.1, -1.6, 0.9, -2.6, 1.8];
  const LOOP = 72;

  const CAPTIONS = {
    intro: "Love is always<br>a good idea",
    shuffle: "Shuffle<br>the hearts",
    halves: "Two halves",
    match: "It's a<br>match",
    sealed: "Signed<br>&amp; sealed",
    next: "Next round<br>is shuffling",
  };
  const TYPED = [
    "love is always a good idea",
    "love is always a good idea",
    "love is always a good idea",
    "love is always a good idea",
    "love is always a good idea",
  ];

  const $ = (sel) => document.querySelector(sel);
  const slot = (k, dy = DECK_Y, s = 1) => ({
    x: CX + (k - 3.5) * 0.9 * s,
    y: dy - k * 1.8 * s,
    rotation: ROT[k],
    scale: s,
  });

  function riffle(order, dir) {
    const a = order.filter((_, i) => i % 2 === 0);
    const b = order.filter((_, i) => i % 2 === 1);
    const [first, second] = dir > 0 ? [b, a] : [a, b];
    const out = [];
    for (let i = 0; i < Math.max(a.length, b.length); i += 1) {
      if (first[i] !== undefined) out.push(first[i]);
      if (second[i] !== undefined) out.push(second[i]);
    }
    return { a, b, out };
  }

  function planDeck() {
    const first = riffle([...Array(COUNT).keys()], 1);
    const second = riffle(first.out, -1);
    const final = second.out;
    return { passes: [first, second], final, left: final[COUNT - 1], right: final[COUNT - 2] };
  }

  function buildDom(plan) {
    const captions = {};
    Object.entries(CAPTIONS).forEach(([key, html]) => {
      const el = document.createElement("div");
      el.className = "caption stitch-text";
      el.innerHTML = `<span>${html}</span>`;
      $("#captions").appendChild(el);
      captions[key] = el;
    });

    const typed = TYPED.map((line, i) => {
      const p = document.createElement("p");
      p.textContent = line;
      if (i % 2 === 1) p.className = "offset";
      $("#typed").appendChild(p);
      return p;
    });

    const cards = [...Array(COUNT).keys()].map((i) => {
      const face = i === plan.left ? "left" : i === plan.right ? "right" : null;
      const el = Pieces.card(face);
      $("#deck").appendChild(el);
      return el;
    });

    $("#arrow").innerHTML = Pieces.arrowSvg();
    $("#thread").innerHTML = Pieces.threadSvg();
    $("#bigHeart").innerHTML = Pieces.heartSvg("red");
    $(".env-heart").innerHTML = Pieces.heartSvg("red");
    $(".env-front").innerHTML = Pieces.envFront();
    $(".env-flap").innerHTML = Pieces.envFlap();
    Pieces.sprite($("#cupidBow"), "cupid-bow");
    Pieces.sprite($("#cupidLetter"), "cupid-letter");
    Pieces.sprite($("#seal"), "cupid-seal");

    const burst = [...Array(12).keys()].map((i) => {
      const el = document.createElement("div");
      el.className = "burst-heart";
      el.innerHTML = i % 3 === 0 ? Pieces.outlineHeart("#2440A8") : Pieces.heartSvg(i % 2 ? "pink" : "red");
      $("#burst").appendChild(el);
      return el;
    });

    return { captions, typed, cards, burst };
  }

  const clip = (v) => ({ clipPath: v, webkitClipPath: v });

  function stitchIn(tl, el, at, duration = 1.5) {
    tl.fromTo(el, clip("inset(0% 100% 0% 0%)"), {
      ...clip("inset(0% 0% 0% 0%)"), duration, ease: "steps(22)", immediateRender: false,
    }, at);
  }

  function stitchOut(tl, el, at, duration = 0.7) {
    tl.to(el, { ...clip("inset(0% 0% 0% 100%)"), duration, ease: "steps(12)" }, at);
  }

  function setInitial(dom) {
    const centered = ["#arrow", "#bigHeart", "#envGroup", "#cupidBow", "#cupidLetter", ...dom.cards, ...dom.burst];
    gsap.set(centered, { xPercent: -50, yPercent: -50 });
    Object.values(dom.captions).forEach((el) => gsap.set(el, clip("inset(0% 100% 0% 0%)")));
    dom.typed.forEach((p) => gsap.set(p, clip("inset(0% 100% 0% 0%)")));
    dom.cards.forEach((el, i) => {
      gsap.set(el, { ...slot(i), zIndex: i + 1 });
      gsap.set(el.querySelector(".card-inner"), { rotationY: 0, transformPerspective: 1400 });
    });
    gsap.set("#arrow", { x: 195, y: HEART_Y, opacity: 0 });
    gsap.set("#threadRect", { attr: { width: 0 } });
    gsap.set("#bigHeart", { x: CX, y: HEART_Y, opacity: 0, scale: 0.3 });
    gsap.set(dom.burst, { x: CX, y: HEART_Y, opacity: 0 });
    gsap.set("#envGroup", { x: CX, y: 1700 });
    gsap.set(".env-flap", { rotationX: 180, transformPerspective: 1200, transformOrigin: "50% 0%" });
    gsap.set(".env-heart", { opacity: 0, y: 0 });
    gsap.set("#seal", { opacity: 0, scale: 2.3, rotation: -24, transformOrigin: "50% 50%" });
    gsap.set("#cupidBow", { x: -420, y: 380, rotation: -10 });
    gsap.set("#cupidLetter", { x: 2350, y: 480, rotation: 8 });
  }

  function addShuffle(tl, dom, pass, at, dir) {
    const el = (i) => dom.cards[i];
    tl.to(pass.a.map(el), { x: CX - 230 * dir, y: DECK_Y + 10, rotation: -9 * dir, duration: 0.6, ease: "power2.inOut", stagger: 0.02 }, at)
      .to(pass.b.map(el), { x: CX + 230 * dir, y: DECK_Y + 10, rotation: 9 * dir, duration: 0.6, ease: "power2.inOut", stagger: 0.02 }, at + 0.05);
    pass.out.forEach((cardIndex, k) => {
      const t = at + 0.85 + k * 0.07;
      tl.set(el(cardIndex), { zIndex: k + 1 }, t)
        .to(el(cardIndex), { ...slot(k), duration: 0.28, ease: "power2.out" }, t);
    });
    tl.call(() => Music.sfx("flutter"), null, at + 0.85);
  }

  function addIntroAndShuffle(tl, dom, plan) {
    stitchIn(tl, dom.captions.intro, 0.3, 2.2);
    dom.typed.forEach((p, i) => {
      tl.to(p, { ...clip("inset(0% 0% 0% 0%)"), duration: 0.9, ease: "steps(26)" }, 1.0 + i * 0.95);
    });
    tl.to("#typed", { opacity: 0, duration: 0.8 }, 8.0);
    stitchOut(tl, dom.captions.intro, 8.2);

    stitchIn(tl, dom.captions.shuffle, 9.0);
    addShuffle(tl, dom, plan.passes[0], 9.6, 1);
    addShuffle(tl, dom, plan.passes[1], 12.0, -1);

    const order = plan.final.map((i) => dom.cards[i]);
    order.forEach((card, k) => {
      tl.to(card, {
        x: CX + (k - 3.5) * 82, y: DECK_Y + Math.abs(k - 3.5) * 14 - 8, rotation: (k - 3.5) * 7,
        duration: 1.0, ease: "power3.out",
      }, 14.4 + k * 0.05);
      tl.to(card, { ...slot(k), duration: 0.8, ease: "power2.inOut" }, 16.6 + k * 0.03);
    });
    tl.call(() => Music.sfx("flutter"), null, 14.4);
    tl.to(order, { y: "-=10", duration: 0.15, yoyo: true, repeat: 1, ease: "sine.inOut" }, 17.8);
    stitchOut(tl, dom.captions.shuffle, 21.6);
  }

  function addDraw(tl, dom, plan) {
    const L = dom.cards[plan.left];
    const R = dom.cards[plan.right];
    const rest = plan.final.slice(0, COUNT - 2).map((i) => dom.cards[i]);
    stitchIn(tl, dom.captions.halves, 22.5, 1.2);
    tl.set(L, { zIndex: 30 }, 22.5).set(R, { zIndex: 29 }, 22.5)
      .to(L, { y: DECK_Y - 60, duration: 0.35, ease: "power2.out" }, 22.5)
      .to(L, { x: CX - 360, y: CARD_Y, rotation: -3, scale: 1.08, duration: 1.1, ease: "power3.inOut" }, 22.85)
      .to(R, { y: DECK_Y - 60, duration: 0.35, ease: "power2.out" }, 22.9)
      .to(R, { x: CX + 360, y: CARD_Y, rotation: 3, scale: 1.08, duration: 1.1, ease: "power3.inOut" }, 23.25);
    rest.forEach((card, k) => tl.to(card, { ...slot(k, LOW_Y, 0.6), duration: 1.2, ease: "power2.inOut" }, 23.3 + k * 0.03));
    tl.to(L.querySelector(".card-inner"), { rotationY: 180, duration: 0.8, ease: "power2.inOut" }, 24.4)
      .to(R.querySelector(".card-inner"), { rotationY: 180, duration: 0.8, ease: "power2.inOut" }, 24.8);
    stitchOut(tl, dom.captions.halves, 28.6);
    return { L, R };
  }

  function addArrow(tl, { R }) {
    tl.fromTo("#cupidBow", { x: -420, y: 380, rotation: -10 }, { x: 190, y: 597, rotation: 0, duration: 2.2, ease: "power2.out", immediateRender: false }, 29.25)
      .call(() => Music.sfx("flutter"), null, 29.3)
      .to("#cupidBow", { y: 610, duration: 0.5, yoyo: true, repeat: 1, ease: "sine.inOut" }, 31.5)
      .to("#cupidBow", { x: 176, rotation: -1.5, duration: 0.9, ease: "power1.inOut" }, 32.6)
      .set("#arrow", { opacity: 1, x: 195 }, 33.75)
      .to("#cupidBow", { x: 196, rotation: 0, duration: 0.12, ease: "power2.out" }, 33.75)
      .to("#arrow", { x: 1051, duration: 0.55, ease: "power2.in" }, 33.75)
      .fromTo("#threadRect", { attr: { width: 380 } }, { attr: { width: 861 }, duration: 0.55, ease: "power2.in", immediateRender: false }, 33.75)
      .call(() => Music.sfx("whoosh"), null, 33.75)
      .call(() => Music.sfx("thud"), null, 34.3)
      .to(R, { x: CX + 372, rotation: 5, duration: 0.1, ease: "power2.out" }, 34.3)
      .to(R, { x: CX + 360, rotation: 3, duration: 0.6, ease: "elastic.out(1, 0.4)" }, 34.4)
      .to("#arrow", { x: 1063, duration: 0.1, ease: "power2.out" }, 34.3)
      .to("#arrow", { x: 1051, duration: 0.6, ease: "elastic.out(1, 0.4)" }, 34.4)
      .to("#cupidBow", { x: -450, y: 260, rotation: -12, duration: 2.2, ease: "power2.in" }, 34.9);
  }

  function addMatch(tl, dom, { L, R }) {
    tl.to(L, { x: CX - 140, rotation: 0, duration: 1.7, ease: "power3.inOut" }, 38.25)
      .to(R, { x: CX + 140, rotation: 0, duration: 1.7, ease: "power3.inOut" }, 38.25)
      .to("#arrow", { x: 831, duration: 1.7, ease: "power3.inOut" }, 38.25)
      .to("#arrow", { opacity: 0, duration: 0.5 }, 39.3)
      .to("#thread", { opacity: 0, duration: 0.8 }, 38.25)
      .fromTo("#bigHeart", { scale: 0.3, opacity: 0, rotation: -8 }, { scale: 1, opacity: 1, rotation: 0, duration: 0.9, ease: "back.out(2.2)", immediateRender: false }, 40.5)
      .call(() => Music.sfx("chime"), null, 40.5)
      .to("#bigHeart", { scale: 1.08, duration: 0.28, yoyo: true, repeat: 3, ease: "sine.inOut" }, 41.5);
    stitchIn(tl, dom.captions.match, 40.5, 1.2);
    dom.burst.forEach((el, i) => {
      const a = (i / dom.burst.length) * Math.PI * 2;
      const r = 260 + (i % 3) * 60;
      tl.fromTo(el, { x: CX, y: HEART_Y, scale: 0.4, opacity: 1, rotation: 0 }, {
        x: CX + Math.cos(a) * r, y: HEART_Y + Math.sin(a) * r * 0.7, scale: 1, opacity: 0,
        rotation: (i % 2 ? 1 : -1) * 40, duration: 1.5, ease: "power2.out", immediateRender: false,
      }, 40.55);
    });
    tl.to(L.querySelector(".card-inner"), { rotationY: 0, duration: 0.7, ease: "power2.inOut" }, 42.4)
      .to(R.querySelector(".card-inner"), { rotationY: 0, duration: 0.7, ease: "power2.inOut" }, 42.55)
      .to(L, { ...slot(7, LOW_Y, 0.6), duration: 1.2, ease: "power2.inOut" }, 43.0)
      .to(R, { ...slot(6, LOW_Y, 0.6), duration: 1.2, ease: "power2.inOut" }, 43.1)
      .to("#bigHeart", { y: 470, duration: 1.4, ease: "sine.inOut" }, 43.6);
  }

  function addEnvelope(tl, dom) {
    tl.to("#envGroup", { y: 720, duration: 1.6, ease: "power3.out" }, 45.0)
      .to("#bigHeart", { y: 547, scale: 0.47, duration: 1.1, ease: "power2.inOut" }, 47.2)
      .set("#bigHeart", { opacity: 0 }, 48.35)
      .set(".env-heart", { opacity: 1 }, 48.35)
      .to(".env-heart", { y: 150, duration: 0.7, ease: "power2.in" }, 48.4)
      .to(".env-flap", { rotationX: 0, duration: 0.7, ease: "power2.inOut" }, 49.4)
      .call(() => Music.sfx("flutter"), null, 49.4);
    stitchOut(tl, dom.captions.match, 50.6);
    stitchIn(tl, dom.captions.sealed, 51.75);
    tl.to("#seal", { opacity: 1, duration: 0.15 }, 53.5)
      .to("#seal", { scale: 0.72, rotation: -8, duration: 0.35, ease: "power4.in" }, 53.65)
      .call(() => Music.sfx("stamp"), null, 54.0)
      .to("#envGroup", { y: "+=8", duration: 0.08, yoyo: true, repeat: 1 }, 54.0)
      .to("#seal", { scale: 0.68, duration: 0.08, yoyo: true, repeat: 1 }, 54.0);
    stitchOut(tl, dom.captions.sealed, 57.0);
  }

  function addDelivery(tl, dom) {
    tl.fromTo("#cupidLetter", { x: 2350, y: 480, rotation: 8 }, { x: 1260, y: 600, rotation: 0, duration: 2.2, ease: "power2.out", immediateRender: false }, 58.5)
      .call(() => Music.sfx("flutter"), null, 58.6)
      .to("#cupidLetter", { y: 614, duration: 0.5, yoyo: true, repeat: 1, ease: "sine.inOut" }, 60.7)
      .to("#envGroup", { x: 1145, y: 581, scale: 0.17, duration: 1.1, ease: "power2.inOut" }, 61.0)
      .to("#envGroup", { opacity: 0, duration: 0.25 }, 61.9)
      .to("#cupidLetter", { x: -500, y: 360, rotation: 6, duration: 3.4, ease: "power1.in" }, 62.3);
    stitchIn(tl, dom.captions.next, 65.25);
  }

  function addReturn(tl, dom, plan) {
    plan.final.forEach((cardIndex, k) => {
      tl.to(dom.cards[cardIndex], { ...slot(k), duration: 1.6, ease: "power3.inOut" }, 65.5 + k * 0.04);
    });
    stitchOut(tl, dom.captions.next, 69.8, 0.8);
    tl.set({}, {}, LOOP);
  }

  function build() {
    const plan = planDeck();
    const dom = buildDom(plan);
    setInitial(dom);
    const tl = gsap.timeline({ paused: true, repeat: -1 });
    addIntroAndShuffle(tl, dom, plan);
    const drawn = addDraw(tl, dom, plan);
    addArrow(tl, drawn);
    addMatch(tl, dom, drawn);
    addEnvelope(tl, dom);
    addDelivery(tl, dom);
    addReturn(tl, dom, plan);
    return tl;
  }

  return { build, LOOP };
})();
