// Markup builders for the stitched props. Pure string/DOM helpers, no animation.
window.Pieces = (() => {
  const HEART = "M50 88 C20 65 0 46 0 26 C0 10 12 0 26 0 C37 0 45 6 50 15 C55 6 63 0 74 0 C88 0 100 10 100 26 C100 46 80 65 50 88 Z";
  const INNER = "translate(50 44) scale(0.84) translate(-50 -44)";

  const heartSvg = (fill = "red", viewBox = "0 0 100 90") => `
    <svg viewBox="${viewBox}" aria-hidden="true">
      <path d="${HEART}" fill="url(#satin-${fill})" stroke="#7A1410" stroke-width="1.5"
        stroke-dasharray="2.6 1.3" stroke-linecap="round"/>
      <path d="${HEART}" transform="${INNER}" fill="none" stroke="#F6B0C2" stroke-width="0.9"
        stroke-dasharray="1.6 1.8" opacity="0.75"/>
    </svg>`;

  const outlineHeart = (color) => `
    <svg viewBox="-4 -4 108 98" aria-hidden="true">
      <path d="${HEART}" fill="none" stroke="${color}" stroke-width="7" stroke-linejoin="round"
        stroke-dasharray="11 4" stroke-linecap="round"/>
    </svg>`;

  const smallHeart = () => `<svg viewBox="0 0 100 90"><path d="${HEART}" fill="currentColor"/></svg>`;

  const star = (color) => `
    <svg viewBox="-50 -50 100 100" aria-hidden="true">
      <path d="M0 -46 L6 -8 L32 -32 L9 -3 L46 0 L9 4 L32 32 L6 9 L0 46 L-6 9 L-32 32 L-9 4 L-46 0 L-9 -3 L-32 -32 L-6 -8 Z"
        fill="${color}"/>
    </svg>`;

  function sprite(el, name) {
    el.innerHTML = [0, 1, 2].map((i) => `<img src="assets/${name}-${i}.png" alt="" draggable="false">`).join("");
  }

  function corner(pos) {
    return `<div class="corner ${pos}"><b>L</b>${smallHeart()}<i>LOVER</i></div>`;
  }

  function card(face) {
    const el = document.createElement("div");
    el.className = "card";
    const faceMarkup = face === "left"
      ? `${corner("tl")}${corner("bl")}<div class="half left">${heartSvg("red", "0 0 50 90")}</div>`
      : face === "right"
        ? `${corner("tr")}${corner("br")}<div class="half right">${heartSvg("red", "50 0 50 90")}</div>`
        : "";
    el.innerHTML = `
      <div class="card-inner">
        <div class="card-back">
          <span class="back-word top">LOVER</span>
          <div class="back-heart">${heartSvg("red")}</div>
          <span class="back-word bottom">LOVER</span>
        </div>
        <div class="card-face">${faceMarkup}</div>
      </div>`;
    return el;
  }

  const arrowSvg = () => `
    <svg viewBox="0 0 380 70" aria-hidden="true">
      <line x1="40" y1="35" x2="330" y2="35" stroke="url(#satin-red)" stroke-width="7" stroke-linecap="round"/>
      <line x1="40" y1="35" x2="330" y2="35" stroke="#7A1410" stroke-width="1.2" stroke-dasharray="3 2.4" opacity=".7"/>
      <g transform="translate(374 35) rotate(-90) scale(.46) translate(-50 -88)">
        <path d="${HEART}" fill="url(#satin-red)" stroke="#7A1410" stroke-width="3" stroke-dasharray="5 3"/>
      </g>
      <path d="M40 35 L6 12 M40 35 L6 58 M60 35 L28 12 M60 35 L28 58 M80 35 L50 14 M80 35 L50 56"
        stroke="#E88AA4" stroke-width="5" stroke-linecap="round" fill="none"/>
    </svg>`;

  const threadSvg = () => `
    <defs><clipPath id="threadClip"><rect id="threadRect" x="0" y="0" width="0" height="1080"/></clipPath></defs>
    <g clip-path="url(#threadClip)">
      <path d="M380 590 C620 572 820 610 1000 588 S 1180 596 1260 590" fill="none" stroke="#B31D17"
        stroke-width="3.2" stroke-dasharray="13 7" stroke-linecap="round"/>
    </g>`;

  const envFront = () => `
    <path d="M0 40 L280 212 L560 40 L560 352 Q560 360 552 360 L8 360 Q0 360 0 352 Z" fill="#F2EBDA"/>
    <path d="M14 56 L280 222 L546 56" fill="none" stroke="#C3251D" stroke-width="2.4" stroke-dasharray="10 6"
      stroke-linecap="round"/>
    <rect x="14" y="14" width="532" height="332" rx="6" fill="none" stroke="#C3251D" stroke-width="2"
      stroke-dasharray="9 7" opacity=".55"/>
    <text x="280" y="338" text-anchor="middle" font-family="Snell Roundhand, Brush Script MT, cursive"
      font-size="44" fill="url(#satin-red)" stroke="#7A1410" stroke-width=".6">Lover</text>`;

  const envFlap = () => `
    <path d="M0 0 L560 0 L292 202 Q280 211 268 202 Z" fill="#F8F3E6" stroke="#CDBFA3" stroke-width="2"/>
    <path d="M18 12 L280 196 L542 12" fill="none" stroke="#C3251D" stroke-width="2.4" stroke-dasharray="10 6"
      stroke-linecap="round"/>`;

  return { heartSvg, outlineHeart, smallHeart, star, sprite, card, arrowSvg, threadSvg, envFront, envFlap };
})();
