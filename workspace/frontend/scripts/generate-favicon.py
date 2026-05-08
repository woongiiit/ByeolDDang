"""Generate app/icon.png and app/apple-icon.png from assets logo."""
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SRC_CANDIDATES = [
    ROOT.parent / "assets" / "icons" / "logo.png",
    ROOT / "public" / "logo.png",
]


def main() -> None:
    src = next((p for p in SRC_CANDIDATES if p.exists()), None)
    if not src:
        raise SystemExit("logo.png not found")
    img = Image.open(src).convert("RGBA")

    def tight_crop_alpha(im: Image.Image) -> Image.Image:
        bbox = im.split()[3].getbbox()
        return im.crop(bbox) if bbox else im

    def center_zoom(im: Image.Image, keep: float) -> Image.Image:
        w, h = im.size
        nw, nh = int(w * keep), int(h * keep)
        left = (w - nw) // 2
        top = (h - nh) // 2
        return im.crop((left, top, left + nw, top + nh))

    def cover_square(im: Image.Image, side: int) -> Image.Image:
        w, h = im.size
        scale = max(side / w, side / h)
        nw, nh = int(round(w * scale)), int(round(h * scale))
        resized = im.resize((nw, nh), Image.Resampling.LANCZOS)
        left = (nw - side) // 2
        top = (nh - side) // 2
        return resized.crop((left, top, left + side, top + side))

    tight = tight_crop_alpha(img)
    zoomed = center_zoom(tight, keep=0.82)

    app_dir = ROOT / "app"
    cover_square(zoomed, 512).save(app_dir / "icon.png", optimize=True)
    cover_square(zoomed, 180).save(app_dir / "apple-icon.png", optimize=True)
    print(f"src={src}, tight={tight.size}, zoomed={zoomed.size}")


if __name__ == "__main__":
    main()
