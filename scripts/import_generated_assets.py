from __future__ import annotations

from collections import deque
import os
from pathlib import Path
import struct
import zlib


ROOT = Path(__file__).resolve().parents[1]
SOURCE_DIR = Path(os.environ.get("STRATEGIC_GAME_ASSET_SOURCE", ROOT / "source-assets"))

SOURCE_ASSETS = {
    "resources/fish.png": ("ChatGPT Image 29 Haz 2026 00_48_24 (6).png", False),
    "resources/game.png": ("ChatGPT Image 29 Haz 2026 00_48_24 (7).png", False),
    "resources/gold.png": ("ChatGPT Image 29 Haz 2026 00_48_24 (8).png", False),
    "resources/ore.png": ("ChatGPT Image 29 Haz 2026 00_48_25 (9).png", False),
    "markers/player-start.png": ("ChatGPT Image 29 Haz 2026 00_48_25 (10).png", False),
    "markers/enemy-start.png": ("ChatGPT Image 29 Haz 2026 00_50_03.png", True),
}


def paeth(a: int, b: int, c: int) -> int:
    p = a + b - c
    pa = abs(p - a)
    pb = abs(p - b)
    pc = abs(p - c)
    if pa <= pb and pa <= pc:
        return a
    if pb <= pc:
        return b
    return c


def read_png(path: Path) -> tuple[int, int, bytearray]:
    data = path.read_bytes()
    if data[:8] != b"\x89PNG\r\n\x1a\n":
        raise ValueError(f"Not a PNG: {path}")
    pos = 8
    width = height = color_type = None
    compressed = bytearray()
    while pos < len(data):
        length = struct.unpack(">I", data[pos:pos + 4])[0]
        kind = data[pos + 4:pos + 8]
        chunk = data[pos + 8:pos + 8 + length]
        pos += 12 + length
        if kind == b"IHDR":
            width, height, bit_depth, color_type, compression, filter_method, interlace = struct.unpack(">IIBBBBB", chunk)
            if bit_depth != 8 or compression != 0 or filter_method != 0 or interlace != 0:
                raise ValueError(f"Unsupported PNG encoding: {path}")
            if color_type not in (2, 6):
                raise ValueError(f"Unsupported PNG color type {color_type}: {path}")
        elif kind == b"IDAT":
            compressed.extend(chunk)
        elif kind == b"IEND":
            break

    if width is None or height is None or color_type is None:
        raise ValueError(f"Missing IHDR: {path}")

    channels = 4 if color_type == 6 else 3
    stride = width * channels
    raw = zlib.decompress(bytes(compressed))
    rows: list[bytearray] = []
    src = 0
    for _ in range(height):
        filter_type = raw[src]
        src += 1
        row = bytearray(raw[src:src + stride])
        src += stride
        prior = rows[-1] if rows else bytearray(stride)
        for i in range(stride):
            left = row[i - channels] if i >= channels else 0
            up = prior[i]
            upper_left = prior[i - channels] if i >= channels else 0
            if filter_type == 1:
                row[i] = (row[i] + left) & 255
            elif filter_type == 2:
                row[i] = (row[i] + up) & 255
            elif filter_type == 3:
                row[i] = (row[i] + ((left + up) // 2)) & 255
            elif filter_type == 4:
                row[i] = (row[i] + paeth(left, up, upper_left)) & 255
            elif filter_type != 0:
                raise ValueError(f"Unsupported PNG filter {filter_type}: {path}")
        rows.append(row)

    pixels = bytearray(width * height * 4)
    for y, row in enumerate(rows):
        for x in range(width):
            src_i = x * channels
            dst_i = (y * width + x) * 4
            pixels[dst_i:dst_i + 3] = row[src_i:src_i + 3]
            pixels[dst_i + 3] = row[src_i + 3] if channels == 4 else 255
    return width, height, pixels


def write_png(path: Path, width: int, height: int, pixels: bytearray) -> None:
    raw = bytearray()
    stride = width * 4
    for y in range(height):
        raw.append(0)
        start = y * stride
        raw.extend(pixels[start:start + stride])

    def chunk(kind: bytes, payload: bytes) -> bytes:
        return (
            struct.pack(">I", len(payload))
            + kind
            + payload
            + struct.pack(">I", zlib.crc32(kind + payload) & 0xFFFFFFFF)
        )

    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(
        b"\x89PNG\r\n\x1a\n"
        + chunk(b"IHDR", struct.pack(">IIBBBBB", width, height, 8, 6, 0, 0, 0))
        + chunk(b"IDAT", zlib.compress(bytes(raw), 9))
        + chunk(b"IEND", b"")
    )


def is_background(r: int, g: int, b: int, allow_gray: bool) -> bool:
    high = max(r, g, b)
    low = min(r, g, b)
    sat = high - low
    if allow_gray:
        return sat < 34 and high > 115
    return sat < 22 and high > 210


def transparentize_edges(width: int, height: int, pixels: bytearray, allow_gray: bool) -> None:
    visited = bytearray(width * height)
    queue: deque[tuple[int, int]] = deque()
    for x in range(width):
        queue.append((x, 0))
        queue.append((x, height - 1))
    for y in range(height):
        queue.append((0, y))
        queue.append((width - 1, y))

    while queue:
        x, y = queue.popleft()
        if x < 0 or y < 0 or x >= width or y >= height:
            continue
        index = y * width + x
        if visited[index]:
            continue
        visited[index] = 1
        pixel = index * 4
        r, g, b, a = pixels[pixel:pixel + 4]
        if a == 0 or not is_background(r, g, b, allow_gray):
            continue
        pixels[pixel + 3] = 0
        queue.extend(((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)))


def crop_foreground(width: int, height: int, pixels: bytearray, padding: int = 28) -> tuple[int, int, bytearray]:
    min_x, min_y = width, height
    max_x, max_y = 0, 0
    for y in range(height):
        for x in range(width):
            alpha = pixels[(y * width + x) * 4 + 3]
            if alpha > 20:
                min_x = min(min_x, x)
                min_y = min(min_y, y)
                max_x = max(max_x, x)
                max_y = max(max_y, y)
    if min_x >= width or min_y >= height:
        raise ValueError("No foreground pixels found")

    min_x = max(0, min_x - padding)
    min_y = max(0, min_y - padding)
    max_x = min(width - 1, max_x + padding)
    max_y = min(height - 1, max_y + padding)
    crop_w = max_x - min_x + 1
    crop_h = max_y - min_y + 1
    side = max(crop_w, crop_h)
    out = bytearray(side * side * 4)
    offset_x = (side - crop_w) // 2
    offset_y = (side - crop_h) // 2
    for y in range(crop_h):
        for x in range(crop_w):
            src = ((min_y + y) * width + (min_x + x)) * 4
            dst = ((offset_y + y) * side + (offset_x + x)) * 4
            out[dst:dst + 4] = pixels[src:src + 4]
    return side, side, out


def resize_nearest(width: int, height: int, pixels: bytearray, size: int) -> bytearray:
    out = bytearray(size * size * 4)
    for y in range(size):
        src_y = min(height - 1, round(y * (height - 1) / max(1, size - 1)))
        for x in range(size):
            src_x = min(width - 1, round(x * (width - 1) / max(1, size - 1)))
            src = (src_y * width + src_x) * 4
            dst = (y * size + x) * 4
            out[dst:dst + 4] = pixels[src:src + 4]
    return out


def main() -> None:
    for relative_output, (source_name, allow_gray) in SOURCE_ASSETS.items():
        source = SOURCE_DIR / source_name
        target = ROOT / "assets" / relative_output
        width, height, pixels = read_png(source)
        transparentize_edges(width, height, pixels, allow_gray)
        crop_w, crop_h, cropped = crop_foreground(width, height, pixels)
        resized = resize_nearest(crop_w, crop_h, cropped, 256)
        write_png(target, 256, 256, resized)
        print(target.relative_to(ROOT))


if __name__ == "__main__":
    main()
