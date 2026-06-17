"""Generate Marea PWA Icons — Sovereign Mint wave on LANA canvas."""
import os
import math
from PIL import Image, ImageDraw

OUT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# LANA canonical colors
CANVAS = (10, 15, 13, 255)       # #0a0f0d
MINT = (77, 184, 150, 255)        # #4db896
MINT_SOFT = (58, 138, 114, 255)   # #3a8a72


def generate():
    for size in [192, 512]:
        cx = size // 2
        amp = int(size * 0.20)
        base_y = cx + int(size * 0.26)

        # === Standard icon (purpose: any) ===
        img = Image.new("RGBA", (size, size), CANVAS)
        draw = ImageDraw.Draw(img)

        poly = [(0, size), (0, base_y)]
        for x in range(0, size, 2):
            rel = x / size
            y = base_y - amp * (math.sin(rel * math.pi * 0.7) +
                               math.sin(rel * math.pi * 1.2) * 0.45)
            poly.append((x, int(y)))
        poly.append((size, size))
        draw.polygon(poly, fill=MINT)

        # Crest line
        crest = []
        for x in range(0, size, 2):
            rel = x / size
            y = base_y - amp * (math.sin(rel * math.pi * 0.7) +
                               math.sin(rel * math.pi * 1.2) * 0.45)
            crest.append((x, int(y)))
        draw.line(crest, fill=MINT_SOFT, width=max(2, int(size * 0.012)))

        # Sparkles
        for sx in [int(size * 0.30), int(size * 0.50), int(size * 0.70)]:
            sy = int(base_y - amp * 0.85)
            r = max(2, int(size * 0.018))
            draw.ellipse([sx - r, sy - r, sx + r, sy + r], fill=MINT_SOFT)

        out = os.path.join(OUT_DIR, f"icon-{size}.png")
        img.save(out, "PNG")
        print(f"[OK] icon-{size}.png")

        # === Maskable icon (safe zone = 60%) ===
        img_mask = Image.new("RGBA", (size, size), CANVAS)
        draw_mask = ImageDraw.Draw(img_mask)

        safe_scale = 0.58
        amp_m = int(amp * safe_scale)
        base_y_m = cx + int(size * 0.14)

        poly_m = [(0, size), (0, base_y_m)]
        for x in range(0, size, 2):
            rel = x / size
            y = base_y_m - amp_m * (math.sin(rel * math.pi * 0.7) +
                                    math.sin(rel * math.pi * 1.2) * 0.45)
            poly_m.append((x, int(y)))
        poly_m.append((size, size))
        draw_mask.polygon(poly_m, fill=MINT)

        crest_m = []
        for x in range(0, size, 2):
            rel = x / size
            y = base_y_m - amp_m * (math.sin(rel * math.pi * 0.7) +
                                    math.sin(rel * math.pi * 1.2) * 0.45)
            crest_m.append((x, int(y)))
        draw_mask.line(crest_m, fill=MINT_SOFT, width=max(1, int(size * 0.008)))

        out_mask = os.path.join(OUT_DIR, f"icon-{size}-maskable.png")
        img_mask.save(out_mask, "PNG")
        print(f"[OK] icon-{size}-maskable.png")

    # === Favicon SVG ===
    svg = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect width="64" height="64" rx="12" fill="#0a0f0d"/>
  <path d="M0 44 Q8 32 16 36 Q24 40 32 30 Q40 20 48 28 Q56 36 64 26 L64 64 L0 64Z"
        fill="#4db896"/>
  <path d="M0 44 Q8 32 16 36 Q24 40 32 30 Q40 20 48 28 Q56 36 64 26"
        fill="none" stroke="#3a8a72" stroke-width="1.5"/>
  <circle cx="18" cy="28" r="1.8" fill="#3a8a72" opacity="0.8"/>
  <circle cx="34" cy="22" r="2" fill="#3a8a72" opacity="0.8"/>
  <circle cx="52" cy="24" r="1.6" fill="#3a8a72" opacity="0.8"/>
</svg>'''
    with open(os.path.join(OUT_DIR, "favicon.svg"), "w", encoding="utf-8") as f:
        f.write(svg)
    print("[OK] favicon.svg")


if __name__ == "__main__":
    generate()
    print("\nMarea icons generated -- LANA Sovereign Mint on Canvas.")
