"""Replicate the judge view: the contact sheet the house judge actually sees.

The rules say: one JPEG contact sheet of every screenshot, in the dossier's
order, the cover (the first screenshot by name) on top fitted inside
768 x 480 pixels, and the others in a row beneath it, each in a smaller cell.

    python tools/sheet.py <screenshotsDir> <out.jpg>
"""
import os
import sys

from PIL import Image

COVER_W, COVER_H = 768, 480
CELL_W, CELL_H = 252, 158
GAP = PAD = 6


def fit(path, box_w, box_h):
    """Fit inside the box, never enlarging."""
    image = Image.open(path)
    image = image.convert("RGB")
    scale = min(box_w / image.width, box_h / image.height, 1.0)
    if scale < 1.0:
        image = image.resize((max(1, round(image.width * scale)), max(1, round(image.height * scale))), Image.LANCZOS)
    return image


def main():
    directory = sys.argv[1] if len(sys.argv) > 1 else "screenshots"
    out = sys.argv[2] if len(sys.argv) > 2 else "sheet.jpg"
    names = sorted(
        name for name in os.listdir(directory) if name.lower().endswith((".png", ".jpg", ".jpeg"))
    )
    if not names:
        raise SystemExit("no screenshots found in " + directory)

    cover = fit(os.path.join(directory, names[0]), COVER_W, COVER_H)
    others = [fit(os.path.join(directory, name), CELL_W, CELL_H) for name in names[1:]]

    row_width = sum(image.width for image in others) + GAP * (len(others) - 1)
    sheet_w = max(COVER_W, row_width) + PAD * 2
    row_top = PAD + cover.height + GAP
    sheet_h = row_top + (max(image.height for image in others) if others else 0) + PAD

    sheet = Image.new("RGB", (sheet_w, sheet_h), (12, 10, 20))
    sheet.paste(cover, (PAD + (COVER_W - cover.width) // 2, PAD))

    x = (sheet_w - row_width) // 2
    for image in others:
        sheet.paste(image, (x, row_top))
        x += image.width + GAP

    sheet.save(out, quality=90)
    print("cover:", names[0], cover.size)
    for name, image in zip(names[1:], others):
        print("  cell:", name, image.size)
    print("sheet:", out, sheet.size)


if __name__ == "__main__":
    main()
