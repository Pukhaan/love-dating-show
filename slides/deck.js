// Slide navigation with a gentle stitch-in for each slide's pieces.
// Keys: → / space / click next, ← back, F full screen. ?slide=4&still renders one slide without motion.
(() => {
  const params = new URLSearchParams(location.search);
  const still = params.has("still");
  const stage = document.getElementById("stage");
  const slides = [...document.querySelectorAll(".slide")];
  const pageNo = document.getElementById("pageNo");
  const clip = (v) => ({ clipPath: v, webkitClipPath: v });
  let index = 0;

  const clamp = (i) => Math.max(0, Math.min(slides.length - 1, i));
  const pad = (n) => String(n).padStart(2, "0");

  function fillArt() {
    document.querySelectorAll(".cupid[data-name]").forEach((el) => {
      const name = el.dataset.name;
      el.innerHTML = [0, 1, 2].map((i) => `<img src="../assets/${name}-${i}.png" alt="" draggable="false">`).join("");
    });
    document.querySelectorAll("[data-heart]").forEach((el) => {
      el.innerHTML = Pieces.heartSvg(el.dataset.heart);
    });
  }

  function enter(slide) {
    const items = [...slide.querySelectorAll("[data-in]")];
    gsap.killTweensOf(items);
    if (still) {
      gsap.set(items, { opacity: 1, y: 0, ...clip("inset(0% 0% 0% 0%)") });
      return;
    }
    items.forEach((el, k) => {
      const delay = 0.12 + k * 0.14;
      if (el.classList.contains("stitch-text")) {
        gsap.fromTo(el, { opacity: 1, ...clip("inset(0% 100% 0% 0%)") },
          { ...clip("inset(0% 0% 0% 0%)"), duration: 1.1, ease: "steps(20)", delay });
      } else {
        gsap.fromTo(el, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.6, ease: "power2.out", delay });
      }
    });
  }

  function show(i) {
    index = clamp(i);
    slides.forEach((s, k) => s.toggleAttribute("data-active", k === index));
    pageNo.textContent = `${pad(index + 1)} / ${pad(slides.length)}`;
    if (!still) history.replaceState(null, "", `#${index + 1}`);
    enter(slides[index]);
  }

  function onKey(event) {
    const key = event.key;
    if (["ArrowRight", "ArrowDown", " ", "PageDown", "Enter"].includes(key)) { event.preventDefault(); show(index + 1); }
    if (["ArrowLeft", "ArrowUp", "PageUp", "Backspace"].includes(key)) { event.preventDefault(); show(index - 1); }
    if (key === "Home") show(0);
    if (key === "End") show(slides.length - 1);
    if (key.toLowerCase() === "f") Shell.goFullscreen();
  }

  function init() {
    if (still) stage.classList.add("still");
    Shell.fit(stage);
    Shell.startBoil(stage);
    Shell.autoHideCursor();
    fillArt();
    const fromUrl = Number(params.get("slide")) || Number(location.hash.slice(1)) || 1;
    show(fromUrl - 1);
    window.addEventListener("keydown", onKey);
    stage.addEventListener("pointerdown", (event) => {
      if (event.button !== 0) return;
      show(event.clientX < window.innerWidth * 0.25 ? index - 1 : index + 1);
    });
  }

  init();
})();
