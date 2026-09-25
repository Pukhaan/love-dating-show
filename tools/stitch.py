"""Turn flat ink drawings into transparent, embroidered-looking PNGs.

Each source gets three variants with shifted stitch phase and a tiny wobble,
so swapping them at a low frame rate reads as a hand-stitched loop.
"""
import math
import random
import sys
import zlib
from pathlib import Path

from PIL import Image, ImageChops, ImageFilter

# (source drawing, output name, thread color)
INKS = [
    ("cupid-bow", "cupid-bow", (196, 36, 30)),
    ("cupid-letter", "cupid-letter", (196, 36, 30)),
    ("cupid-seal", "cupid-seal", (32, 58, 160)),
    ("cupid-bow", "cupid-bow-white", (255, 244, 248)),
    ("cupid-letter", "cupid-letter-white", (255, 244, 248)),
]
TARGET_WIDTH = 640
VARIANTS = 3


def ink_mask(img: Image.Image) -> Image.Image:
    gray = img.convert("L")
    ink = ImageChops.invert(gray)
    ink = ink.point(lambda v: 0 if v < 26 else min(255, int((v - 26) * 2.1)))
    return ink.filter(ImageFilter.MaxFilter(3)).filter(ImageFilter.GaussianBlur(0.6))


def stitch_field(size, seed: int, angle_deg: float, period: float) -> Image.Image:
    rnd = random.Random(seed)
    w, h = size
    field = Image.new("L", size)
    px = field.load()
    a = math.radians(angle_deg)
    ca, sa = math.cos(a), math.sin(a)
    row_jitter = [rnd.uniform(-1.4, 1.4) for _ in range(h)]
    phase = rnd.uniform(0, period)
    for y in range(h):
        jy = row_jitter[y]
        for x in range(w):
            t = (y * ca + x * sa + jy + phase) / period
            stripe = 0.5 + 0.5 * math.sin(2 * math.pi * t)
            breaks = 0.5 + 0.5 * math.sin(2 * math.pi * (x * ca - y * sa) / (period * 3.2))
            v = 0.62 + 0.3 * stripe + 0.08 * breaks + rnd.uniform(-0.05, 0.05)
            px[x, y] = max(0, min(255, int(v * 255)))
    return field


def wobble(mask: Image.Image, seed: int) -> Image.Image:
    rnd = random.Random(seed)
    dx, dy = rnd.uniform(-1.2, 1.2), rnd.uniform(-1.2, 1.2)
    rot = rnd.uniform(-0.35, 0.35)
    return mask.rotate(rot, resample=Image.BICUBIC, translate=(dx, dy))


def render(src: Path, out_dir: Path, out_name: str, ink_rgb) -> None:
    img = Image.open(src).convert("RGB")
    scale = TARGET_WIDTH / img.width
    img = img.resize((TARGET_WIDTH, int(img.height * scale)), Image.LANCZOS)
    base_mask = ink_mask(img)
    for i in range(VARIANTS):
        seed = zlib.crc32(f"{out_name}-{i}".encode()) & 0xFFFF
        mask = wobble(base_mask, seed)
        field = stitch_field(img.size, seed, angle_deg=14 + i * 3, period=3.6)
        # Blank the thread texture outside the ink so empty pixels compress well.
        shade = ImageChops.multiply(field, mask.point(lambda v: 255 if v > 3 else 0))
        # Light thread keeps its brightness; stitches only dip slightly, with a pink cast.
        light = sum(ink_rgb) > 600
        tints = (1.0, 0.9, 0.94) if light else (1.0, 1.0, 1.0)

        def channel(c, tint):
            if light:
                return lambda v: min(255, int(c * (0.8 + 0.2 * v / 255) * (tint + (1 - tint) * v / 255)))
            return lambda v: min(255, int(c * v / 255 + 28 * (v / 255) ** 6))

        red, grn, blu = (shade.point(channel(c, t)) for c, t in zip(ink_rgb, tints))
        out = Image.merge("RGBA", (red, grn, blu, mask))
        out.save(out_dir / f"{out_name}-{i}.png", optimize=True)
        print("wrote", out_dir / f"{out_name}-{i}.png")


def main() -> None:
    src_dir, out_dir = Path(sys.argv[1]), Path(sys.argv[2])
    out_dir.mkdir(parents=True, exist_ok=True)
    for src_name, out_name, rgb in INKS:
        render(src_dir / f"{src_name}.png", out_dir, out_name, rgb)


if __name__ == "__main__":
    main()
