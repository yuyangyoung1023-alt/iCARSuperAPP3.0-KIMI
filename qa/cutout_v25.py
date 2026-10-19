#!/usr/bin/env python3
"""Cut the V25 out of 前45.webp using the v25Outline31 SVG path as mask."""
from PIL import Image, ImageDraw
import re

SRC = "assets/brand/前45.webp"
DST = "assets/brand/v25-cutout.png"
PATH = "M542 670 L545 637 L557 609 L561 565 Q563 552 580 547 L590 524 Q601 506 660 500 L782 481 L808 435 Q822 416 850 410 L931 394 L937 389 L960 388 L970 392 L1030 385 Q1053 379 1076 386 L1111 388 Q1175 399 1292 456 Q1300 461 1303 479 L1315 542 L1324 560 L1329 606 L1334 657 Q1343 724 1326 777 Q1316 801 1292 802 Q1254 810 1235 773 L1226 748 L1093 751 Q1078 810 1033 820 Q936 840 895 752 L733 748 Q704 810 649 816 Q568 823 551 772 L545 745 L545 691 Z"

def flatten(path, steps=24):
    pts, cur = [], None
    for tok in re.findall(r'[MLQZ]|[\d.]+', path):
        if tok == 'M':
            cur = 'M'
        elif tok in 'MLQZ':
            cur = tok
        # handled below
    tokens = re.findall(r'([MLQZ])|(\d+(?:\.\d+)?)', path)
    nums = []
    pts = []
    mode = None
    for cmd, num in tokens:
        if cmd:
            mode = cmd
            if cmd == 'Z':
                pts.append(pts[0])
            continue
        nums.append(float(num))
        need = {'M': 2, 'L': 2, 'Q': 4}[mode]
        if len(nums) == need:
            if mode == 'M':
                pts.append((nums[0], nums[1]))
            elif mode == 'L':
                pts.append((nums[0], nums[1]))
            elif mode == 'Q':
                p0 = pts[-1]
                c, p1 = (nums[0], nums[1]), (nums[2], nums[3])
                for i in range(1, steps + 1):
                    t = i / steps
                    x = (1-t)**2*p0[0] + 2*(1-t)*t*c[0] + t*t*p1[0]
                    y = (1-t)**2*p0[1] + 2*(1-t)*t*c[1] + t*t*p1[1]
                    pts.append((x, y))
            nums = []
    return pts

img = Image.open(SRC).convert("RGBA")
W, H = img.size
S = 4
mask = Image.new("L", (W*S, H*S), 0)
d = ImageDraw.Draw(mask)
pts = flatten(PATH)
d.polygon([(x*S, y*S) for x, y in pts], fill=255)
mask = mask.resize((W, H), Image.LANCZOS)
img.putalpha(mask)

bbox = img.getbbox()
pad = 12
l, t, r, b = bbox
l, t = max(0, l-pad), max(0, t-pad)
r, b = min(W, r+pad), min(H, b+pad)
out = img.crop((l, t, r, b))
out.save(DST)
print("saved", DST, out.size, "bbox", bbox)
