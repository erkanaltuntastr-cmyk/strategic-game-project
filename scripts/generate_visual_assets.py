from __future__ import annotations

import math
import random
import struct
import zlib
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
TILE_DIR = ROOT / "assets" / "tiles"
RESOURCE_DIR = ROOT / "assets" / "resources"
MARKER_DIR = ROOT / "assets" / "markers"
SIZE = 96


def write_png(path: Path, pixels: list[list[tuple[int, int, int, int]]]) -> None:
    height = len(pixels)
    width = len(pixels[0])
    raw = bytearray()
    for row in pixels:
        raw.append(0)
        for r, g, b, a in row:
            raw.extend((r, g, b, a))

    def chunk(kind: bytes, data: bytes) -> bytes:
        return (
            struct.pack(">I", len(data))
            + kind
            + data
            + struct.pack(">I", zlib.crc32(kind + data) & 0xFFFFFFFF)
        )

    png = (
        b"\x89PNG\r\n\x1a\n"
        + chunk(b"IHDR", struct.pack(">IIBBBBB", width, height, 8, 6, 0, 0, 0))
        + chunk(b"IDAT", zlib.compress(bytes(raw), 9))
        + chunk(b"IEND", b"")
    )
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(png)


def clamp(value: float) -> int:
    return max(0, min(255, int(value)))


def canvas(color: tuple[int, int, int, int], size: int = SIZE) -> list[list[tuple[int, int, int, int]]]:
    return [[color for _ in range(size)] for _ in range(size)]


def blend_pixel(pixels, x: int, y: int, color: tuple[int, int, int, int]) -> None:
    if y < 0 or y >= len(pixels) or x < 0 or x >= len(pixels[0]):
        return
    sr, sg, sb, sa = color
    dr, dg, db, da = pixels[y][x]
    alpha = sa / 255
    out_a = alpha + da / 255 * (1 - alpha)
    if out_a == 0:
        pixels[y][x] = (0, 0, 0, 0)
        return
    r = (sr * alpha + dr * (da / 255) * (1 - alpha)) / out_a
    g = (sg * alpha + dg * (da / 255) * (1 - alpha)) / out_a
    b = (sb * alpha + db * (da / 255) * (1 - alpha)) / out_a
    pixels[y][x] = (clamp(r), clamp(g), clamp(b), clamp(out_a * 255))


def fill_circle(pixels, cx: float, cy: float, radius: float, color: tuple[int, int, int, int]) -> None:
    for y in range(math.floor(cy - radius), math.ceil(cy + radius) + 1):
        for x in range(math.floor(cx - radius), math.ceil(cx + radius) + 1):
            dx = x - cx
            dy = y - cy
            if dx * dx + dy * dy <= radius * radius:
                edge = 1 - min(1, math.sqrt(dx * dx + dy * dy) / radius)
                blend_pixel(pixels, x, y, (*color[:3], clamp(color[3] * (0.55 + edge * 0.45))))


def draw_line(pixels, x1: float, y1: float, x2: float, y2: float, color, width: int = 1) -> None:
    steps = int(max(abs(x2 - x1), abs(y2 - y1))) + 1
    for step in range(steps + 1):
        t = step / max(1, steps)
        x = x1 + (x2 - x1) * t
        y = y1 + (y2 - y1) * t
        for oy in range(-width, width + 1):
            for ox in range(-width, width + 1):
                if ox * ox + oy * oy <= width * width:
                    blend_pixel(pixels, round(x) + ox, round(y) + oy, color)


def fill_triangle(pixels, points, color) -> None:
    (x1, y1), (x2, y2), (x3, y3) = points
    min_x = math.floor(min(x1, x2, x3))
    max_x = math.ceil(max(x1, x2, x3))
    min_y = math.floor(min(y1, y2, y3))
    max_y = math.ceil(max(y1, y2, y3))
    denom = (y2 - y3) * (x1 - x3) + (x3 - x2) * (y1 - y3)
    if denom == 0:
        return
    for y in range(min_y, max_y + 1):
        for x in range(min_x, max_x + 1):
            a = ((y2 - y3) * (x - x3) + (x3 - x2) * (y - y3)) / denom
            b = ((y3 - y1) * (x - x3) + (x1 - x3) * (y - y3)) / denom
            c = 1 - a - b
            if a >= 0 and b >= 0 and c >= 0:
                blend_pixel(pixels, x, y, color)


def textured_base(top, bottom, seed: int) -> list[list[tuple[int, int, int, int]]]:
    rng = random.Random(seed)
    pixels = []
    for y in range(SIZE):
        row = []
        t = y / (SIZE - 1)
        for x in range(SIZE):
            light = 1 + 0.08 * math.sin((x + seed) * 0.17) + 0.06 * math.sin((x + y) * 0.11)
            noise = rng.randint(-12, 12)
            r = top[0] * (1 - t) + bottom[0] * t
            g = top[1] * (1 - t) + bottom[1] * t
            b = top[2] * (1 - t) + bottom[2] * t
            row.append((clamp(r * light + noise), clamp(g * light + noise), clamp(b * light + noise), 255))
        pixels.append(row)
    return pixels


def make_grassland() -> list[list[tuple[int, int, int, int]]]:
    pixels = textured_base((185, 204, 112), (79, 126, 58), 11)
    rng = random.Random(12)
    for _ in range(26):
        x = rng.randint(5, 90)
        y = rng.randint(7, 88)
        draw_line(pixels, x, y, x + rng.randint(-7, 7), y + rng.randint(-2, 7), (221, 216, 113, 92), 1)
    for _ in range(8):
        fill_circle(pixels, rng.randint(8, 88), rng.randint(8, 88), rng.randint(8, 15), (230, 213, 112, 38))
    return pixels


def make_forest() -> list[list[tuple[int, int, int, int]]]:
    pixels = textured_base((89, 124, 58), (22, 53, 31), 21)
    rng = random.Random(22)
    for _ in range(30):
        x = rng.randint(7, 88)
        y = rng.randint(8, 86)
        radius = rng.randint(7, 13)
        fill_circle(pixels, x, y, radius, (33, rng.randint(82, 120), 38, 210))
        fill_circle(pixels, x - 3, y - 4, radius * 0.45, (137, 176, 71, 92))
    return pixels


def make_hill() -> list[list[tuple[int, int, int, int]]]:
    pixels = textured_base((191, 151, 91), (91, 64, 44), 31)
    rng = random.Random(32)
    for y in (29, 44, 60):
        draw_line(pixels, 12, y, 80, y + rng.randint(-12, 10), (83, 58, 38, 96), 2)
        draw_line(pixels, 16, y - 4, 74, y + rng.randint(-8, 8) - 4, (232, 205, 151, 58), 1)
    for _ in range(12):
        fill_circle(pixels, rng.randint(10, 86), rng.randint(10, 86), rng.randint(4, 9), (75, 54, 39, 52))
    return pixels


def make_mountain() -> list[list[tuple[int, int, int, int]]]:
    pixels = textured_base((154, 103, 67), (55, 43, 38), 41)
    peaks = [
        ((10, 86), (39, 13), (67, 86)),
        ((39, 88), (66, 24), (91, 88)),
    ]
    for points in peaks:
        fill_triangle(pixels, points, (105, 66, 48, 230))
        fill_triangle(pixels, (points[0], points[1], ((points[1][0] + points[2][0]) / 2, points[2][1])), (163, 100, 61, 210))
        fill_triangle(pixels, ((points[1][0] - 8, points[1][1] + 18), points[1], (points[1][0] + 9, points[1][1] + 20)), (239, 221, 181, 190))
    for x in range(12, 86, 12):
        draw_line(pixels, x, 70, x + 9, 91, (32, 28, 28, 84), 2)
    return pixels


def make_water() -> list[list[tuple[int, int, int, int]]]:
    pixels = textured_base((101, 204, 199), (12, 75, 104), 51)
    rng = random.Random(52)
    for y in range(20, 90, 16):
        draw_line(pixels, 10, y, 40, y + rng.randint(-3, 3), (218, 255, 248, 92), 1)
        draw_line(pixels, 52, y + 5, 88, y + rng.randint(-3, 3), (218, 255, 248, 72), 1)
    for _ in range(10):
        fill_circle(pixels, rng.randint(12, 84), rng.randint(12, 84), rng.randint(6, 13), (155, 238, 225, 38))
    return pixels


def transparent_icon() -> list[list[tuple[int, int, int, int]]]:
    return canvas((0, 0, 0, 0), 48)


def make_resource_icon(kind: str) -> list[list[tuple[int, int, int, int]]]:
    pixels = transparent_icon()
    fill_circle(pixels, 24, 24, 19, (24, 20, 14, 168))
    if kind == "fish":
        fill_circle(pixels, 23, 24, 12, (111, 211, 222, 235))
        fill_triangle(pixels, ((34, 24), (43, 16), (43, 32)), (72, 169, 190, 230))
        fill_circle(pixels, 18, 21, 2, (8, 40, 48, 255))
    elif kind == "game":
        fill_circle(pixels, 24, 27, 11, (206, 157, 84, 235))
        draw_line(pixels, 18, 17, 10, 8, (234, 219, 172, 220), 2)
        draw_line(pixels, 30, 17, 38, 8, (234, 219, 172, 220), 2)
    elif kind == "gold":
        fill_circle(pixels, 24, 24, 13, (245, 191, 54, 245))
        fill_circle(pixels, 20, 19, 5, (255, 240, 139, 180))
    else:
        fill_triangle(pixels, ((13, 31), (24, 11), (37, 31)), (180, 174, 159, 245))
        fill_triangle(pixels, ((16, 35), (36, 25), (35, 39)), (105, 105, 99, 235))
    return pixels


def make_start_marker(color: tuple[int, int, int]) -> list[list[tuple[int, int, int, int]]]:
    pixels = transparent_icon()
    fill_circle(pixels, 24, 24, 20, (*color, 90))
    fill_circle(pixels, 24, 24, 12, (*color, 210))
    fill_circle(pixels, 24, 24, 5, (255, 246, 202, 235))
    return pixels


def main() -> None:
    assets = {
        TILE_DIR / "grassland.png": make_grassland(),
        TILE_DIR / "forest.png": make_forest(),
        TILE_DIR / "hill.png": make_hill(),
        TILE_DIR / "mountain.png": make_mountain(),
        TILE_DIR / "water.png": make_water(),
    }
    for kind in ("fish", "game", "gold", "ore"):
        assets[RESOURCE_DIR / f"{kind}.png"] = make_resource_icon(kind)
    assets[MARKER_DIR / "player-start.png"] = make_start_marker((35, 84, 132))
    assets[MARKER_DIR / "enemy-start.png"] = make_start_marker((142, 38, 35))

    for path, pixels in assets.items():
        write_png(path, pixels)
        print(path.relative_to(ROOT))


if __name__ == "__main__":
    main()
