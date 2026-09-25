// Pre-rendered heart and sparkle sprites for the vibes canvas. Drawing these once
// keeps the per-frame work to plain drawImage calls, which Safari handles well.
window.VibeSprites = (() => {
  const HEART = new Path2D("M50 88 C20 65 0 46 0 26 C0 10 12 0 26 0 C37 0 45 6 50 15 C55 6 63 0 74 0 C88 0 100 10 100 26 C100 46 80 65 50 88 Z");
  const BASE = 128;
  const SCALE = BASE / 100;

  function makeCanvas(w, h) {
    const c = document.createElement("canvas");
    c.width = Math.ceil(w);
    c.height = Math.ceil(h);
    return c;
  }

  // Diagonal satin stitches that tile seamlessly every 8px.
  function satinTile(base, stripe, line) {
    const c = makeCanvas(8, 8);
    const x = c.getContext("2d");
    x.fillStyle = base;
    x.fillRect(0, 0, 8, 8);
    const lines = (color, width, offset) => {
      x.strokeStyle = color;
      x.lineWidth = width;
      x.beginPath();
      for (let i = -8; i <= 16; i += 4) {
        x.moveTo(i + offset, 0);
        x.lineTo(i + offset + 8, 8);
      }
      x.stroke();
    };
    lines(stripe, 2.4, 0);
    lines(line, 0.6, 2.2);
    return c;
  }

  function felt({ base, stripe, line, stitch, inner, shadow }) {
    const pad = 22;
    const c = makeCanvas(BASE + pad * 2, BASE * 0.9 + pad * 2);
    const x = c.getContext("2d");
    x.translate(pad, pad);
    x.scale(SCALE, SCALE);
    x.save();
    x.shadowColor = shadow;
    x.shadowBlur = 10;
    x.shadowOffsetY = 4;
    x.fillStyle = x.createPattern(satinTile(base, stripe, line), "repeat");
    x.fill(HEART);
    x.restore();
    x.lineCap = "round";
    x.setLineDash([3.2, 1.8]);
    x.lineWidth = 1.7;
    x.strokeStyle = stitch;
    x.stroke(HEART);
    x.translate(50, 44);
    x.scale(0.84, 0.84);
    x.translate(-50, -44);
    x.setLineDash([2, 2.2]);
    x.lineWidth = 1.1;
    x.strokeStyle = inner;
    x.stroke(HEART);
    return c;
  }

  // Soft blurred heart: draw the shape far off-canvas and keep only its shadow.
  function bokeh(color, blur) {
    const pad = blur * 2 + 8;
    const c = makeCanvas(BASE + pad * 2, BASE * 0.9 + pad * 2);
    const x = c.getContext("2d");
    x.shadowColor = color;
    x.shadowBlur = blur;
    x.shadowOffsetX = 6000;
    x.translate(pad - 6000, pad);
    x.scale(SCALE, SCALE);
    x.fillStyle = "#000";
    x.fill(HEART);
    return c;
  }

  function outline(color) {
    const pad = 16;
    const c = makeCanvas(BASE + pad * 2, BASE * 0.9 + pad * 2);
    const x = c.getContext("2d");
    x.translate(pad, pad);
    x.scale(SCALE, SCALE);
    x.shadowColor = "rgba(150, 30, 90, 0.25)";
    x.shadowBlur = 6;
    x.shadowOffsetY = 2;
    x.lineCap = "round";
    x.lineJoin = "round";
    x.setLineDash([9, 4]);
    x.lineWidth = 4.6;
    x.strokeStyle = color;
    x.stroke(HEART);
    return c;
  }

  function sparkle() {
    const size = 96;
    const c = makeCanvas(size, size);
    const x = c.getContext("2d");
    const mid = size / 2;
    const glow = x.createRadialGradient(mid, mid, 0, mid, mid, mid);
    glow.addColorStop(0, "rgba(255, 255, 255, 0.95)");
    glow.addColorStop(0.18, "rgba(255, 240, 248, 0.55)");
    glow.addColorStop(1, "rgba(255, 220, 238, 0)");
    x.fillStyle = glow;
    x.fillRect(0, 0, size, size);
    x.strokeStyle = "rgba(255, 255, 255, 0.95)";
    x.lineCap = "round";
    [[0, 44, 1.6], [Math.PI / 2, 44, 1.6], [Math.PI / 4, 18, 1], [-Math.PI / 4, 18, 1]].forEach(([a, len, w]) => {
      x.lineWidth = w;
      x.beginPath();
      x.moveTo(mid - Math.cos(a) * len, mid - Math.sin(a) * len);
      x.lineTo(mid + Math.cos(a) * len, mid + Math.sin(a) * len);
      x.stroke();
    });
    return c;
  }

  function build() {
    return {
      bokehWhite: bokeh("rgba(255, 246, 250, 1)", 16),
      bokehPink: bokeh("rgba(255, 196, 224, 1)", 26),
      feltWhite: felt({ base: "#FFF1F6", stripe: "#FFFFFF", line: "rgba(230,150,180,.55)", stitch: "#EE8AB0", inner: "#FFD0E1", shadow: "rgba(170,40,100,.28)" }),
      feltBlush: felt({ base: "#FBC3D7", stripe: "#FFDCE8", line: "rgba(210,90,140,.5)", stitch: "#DC6397", inner: "#FFE6EF", shadow: "rgba(170,40,100,.25)" }),
      feltRose: felt({ base: "#EE78A8", stripe: "#F699BE", line: "rgba(160,30,90,.5)", stitch: "#BE3B78", inner: "#FFC4DA", shadow: "rgba(150,20,80,.3)" }),
      feltRed: felt({ base: "#C3251D", stripe: "#DE4236", line: "#84150F", stitch: "#7A1410", inner: "#F6B0C2", shadow: "rgba(120,10,40,.3)" }),
      outlineWhite: outline("#FFF6FA"),
      outlineRed: outline("#C3251D"),
      sparkle: sparkle(),
    };
  }

  return { build, BASE };
})();
