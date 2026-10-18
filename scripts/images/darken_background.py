# Swap ONLY a flat studio background for the near-black tile backdrop (#141414 centre -> #0b0b0b edges),
# leaving the subject pixel-identical. Generators re-invent the subject when asked to edit the background,
# so do it locally. Set SRC/OUT; the rim band (y < 600) uses a contrast-boosted flood + closing for
# low-contrast edges, everything else an exact flood. ALWAYS inspect before/after edge crops. (2026-10-18)
from PIL import Image, ImageDraw, ImageFilter, ImageChops
SRC = r'C:\Users\profe\AppData\Local\Temp\claude\C--Users-profe\0b76a212-5e61-4ce0-b426-896958bb0246\images\22.webp'
OUT = r'C:\Users\profe\AppData\Local\Temp\claude\C--Users-profe\0b76a212-5e61-4ce0-b426-896958bb0246\scratchpad\speaker_dark_final.png'
im = Image.open(SRC).convert('RGB')
W, H = im.size
from PIL import ImageEnhance
probe = ImageEnhance.Contrast(im.filter(ImageFilter.GaussianBlur(1.2))).enhance(3.0)
MARK = (255, 0, 255)
for xy in [(2, 2), (W - 3, 2), (2, H - 3), (W - 3, H - 3), (W // 2, 2), (W // 2, H - 3), (2, H // 2), (W - 3, H // 2)]:
    ImageDraw.floodfill(probe, xy, MARK, thresh=18)
# mask = pixels that became exactly MARK
diff = ImageChops.difference(probe, Image.new('RGB', (W, H), MARK)).convert('L')
mask = diff.point(lambda p: 255 if p == 0 else 0)
hist = mask.histogram()
print('background share', round(hist[255] / (W * H), 3))
from PIL import ImageOps
# exact edges everywhere below the rim: plain flood on the ORIGINAL image
p2 = im.copy()
for xy in [(2, 2), (W - 3, 2), (2, H - 3), (W - 3, H - 3), (W // 2, H - 3), (2, H // 2), (W - 3, H // 2)]:
    ImageDraw.floodfill(p2, xy, MARK, thresh=14)
fine = ImageChops.difference(p2, Image.new('RGB', (W, H), MARK)).convert('L').point(lambda p: 255 if p == 0 else 0)
obj = ImageOps.invert(mask)
obj = obj.filter(ImageFilter.MaxFilter(21)).filter(ImageFilter.MinFilter(21))   # close: fill bites in the rim
obj = obj.filter(ImageFilter.GaussianBlur(3)).point(lambda p: 255 if p > 127 else 0)  # smooth the outline
closed = ImageOps.invert(obj)
# use the smoothed outline only for the rim band at the top; keep the exact fill everywhere else
band = Image.new('L', (W, H), 0); ImageDraw.Draw(band).rectangle([0, 0, W, 600], fill=255)
band = band.filter(ImageFilter.GaussianBlur(20))
mask = Image.composite(closed, fine, band).filter(ImageFilter.MaxFilter(3)).filter(ImageFilter.GaussianBlur(1.4))
# near-black backdrop with a gentle vigne18e: #141414 centre -> #0b0b0b edges
g = Image.radial_gradient('L').resize((W, H))  # 0 centre .. 255 edge
v = g.point(lambda p: max(11, round(20 - 9 * p / 180)))
back = Image.merge('RGB', (v, v, v))
Image.composite(back, im, mask).save(OUT)
print('saved')
