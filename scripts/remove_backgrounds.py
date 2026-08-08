import os
from PIL import Image

os.makedirs('assets/pugs', exist_ok=True)
os.makedirs('assets/backgrounds', exist_ok=True)
os.makedirs('assets/items', exist_ok=True)

targets = {
    'pugs/Moku Standing #1.png': 'assets/pugs/moku_1.png',
    'pugs/Moku Standing #2 (Blue Harness) .png': 'assets/pugs/moku_2.png',
    'pugs/Moku Standing #3 (Blue Harness).png': 'assets/pugs/moku_3.png',
    'pugs/Moku Standing #3 (Blue Harness Smiling).png': 'assets/pugs/moku_3_smiling.png',
    'pugs/Moku Standing #4 (Red Harness).png': 'assets/pugs/moku_4.png',
    'pugs/Kaleo Standing #1.png': 'assets/pugs/kaleo_1.png',
    'pugs/Kaleo Standing #2 (Tan Collar).png': 'assets/pugs/kaleo_2.png',
    'pugs/Kaleo Standing #3 (Puppy).png': 'assets/pugs/kaleo_3.png',
    'pugs/Kaleo Standing #4 (Referee).png': 'assets/pugs/kaleo_4.png',
    'pugs/Kaleo Standing #5 (Skeleton).png': 'assets/pugs/kaleo_5.png',
    'pugs/Kaleo Standing #6 (Light Up Harness).png': 'assets/pugs/kaleo_6.png',
    'pugs/Kaleo Standing #7 (Backpack).png': 'assets/pugs/kaleo_7.png',
    'pugs/Kaleo Standing #8 (Red Harness).png': 'assets/pugs/kaleo_8.png',
    'pugs/Kaleo Standing #8 (Red Harness Sad).png': 'assets/pugs/kaleo_8_sad.png',
    'pugs/Kaleo Standing #8 (Red Harness Smiling).png': 'assets/pugs/kaleo_8_smiling.png',
    'pugs/Kaleo Standing #9 (Tan Harness).png': 'assets/pugs/kaleo_9.png',
    'pugs/Kaleo Standing #9 (Tan Harness Sad).png': 'assets/pugs/kaleo_9_sad.png',
    'pugs/Kaleo Standing #9 (Tan Harness Smiling).png': 'assets/pugs/kaleo_9_smiling.png',
    'pugs/Kaleo Standing #10 (Tan Harness).png': 'assets/pugs/kaleo_10.png',
    'pugs/Kaleo Standing #11 (Police Officer).png': 'assets/pugs/kaleo_11.png',
    'pugs/Kaleo Standing #12 (Christmas).png': 'assets/pugs/kaleo_12.png',
    'pugs/Kaleo Standing #13 (Bee).png': 'assets/pugs/kaleo_13.png',
    'pugs/Kaleo Standing #14 (Red Harness).png': 'assets/pugs/kaleo_14.png',
    'pugs/Kaleo Standing #14 (Red Harness Walking).png': 'assets/pugs/kaleo_14_walking.png',
    'pugs/Kaleo Standing #15 (Black Harness).png': 'assets/pugs/kaleo_15.png',
    'pugs/Kaleo Standing #16 (Tan Harness).png': 'assets/pugs/kaleo_16.png',
    'pugs/Kaleo Standing #16 (Tan Harness Sad).png': 'assets/pugs/kaleo_16_sad.png',
    'pugs/Kaleo Standing #17 (Pirate).png': 'assets/pugs/kaleo_17.png',
    'pugs/Kaleo Standing #18 (Shark).png': 'assets/pugs/kaleo_18.png',
    'pugs/Kaleo Standing #19 (Moose).png': 'assets/pugs/kaleo_19.png',
    'pugs/Kaleo Standing #20 (Stick).png': 'assets/pugs/kaleo_20.png'
}

def remove_exact_bg(img, color_tolerance=8):
    """
    Flood fills from outer edges matching background color shade.
    Preserves all internal details.
    """
    img = img.convert("RGBA")
    width, height = img.size
    pixels = img.load()
    
    bg_r, bg_g, bg_b, _ = pixels[0, 0]
    
    visited = set()
    queue = []
    
    for x in range(width):
        queue.append((x, 0))
        queue.append((x, height - 1))
    for y in range(height):
        queue.append((0, y))
        queue.append((width - 1, y))
        
    while queue:
        x, y = queue.pop(0)
        if (x, y) in visited:
            continue
        visited.add((x, y))
        
        r, g, b, a = pixels[x, y]
        if abs(r - bg_r) <= color_tolerance and abs(g - bg_g) <= color_tolerance and abs(b - bg_b) <= color_tolerance:
            pixels[x, y] = (0, 0, 0, 0)
            
            for dx, dy in [(-1,0), (1,0), (0,-1), (0,1)]:
                nx, ny = x + dx, y + dy
                if 0 <= nx < width and 0 <= ny < height and (nx, ny) not in visited:
                    queue.append((nx, ny))

    return img

def remove_white_bg(img, threshold=235):
    """Removes white/light background from pixel art graphics."""
    img = img.convert("RGBA")
    width, height = img.size
    pixels = img.load()
    
    visited = set()
    queue = []
    
    for x in range(width):
        queue.append((x, 0))
        queue.append((x, height - 1))
    for y in range(height):
        queue.append((0, y))
        queue.append((width - 1, y))
        
    while queue:
        x, y = queue.pop(0)
        if (x, y) in visited:
            continue
        visited.add((x, y))
        
        r, g, b, a = pixels[x, y]
        if r >= threshold and g >= threshold and b >= threshold:
            pixels[x, y] = (0, 0, 0, 0)
            
            for dx, dy in [(-1,0), (1,0), (0,-1), (0,1)]:
                nx, ny = x + dx, y + dy
                if 0 <= nx < width and 0 <= ny < height and (nx, ny) not in visited:
                    queue.append((nx, ny))

    return img

def clean_sprite_outline(src, dst):
    """Isolates pixel art sprites bounded by dark outlines from solid/dithered background canvas."""
    im = Image.open(src).convert('RGBA')
    w, h = im.size
    pixels = im.load()

    visited = set()
    queue = []

    for x in range(w):
        queue.append((x, 0))
        queue.append((x, h - 1))
    for y in range(h):
        queue.append((0, y))
        queue.append((w - 1, y))

    while queue:
        x, y = queue.pop(0)
        if (x, y) in visited:
            continue
        visited.add((x, y))

        r, g, b, a = pixels[x, y]
        is_outline = (r < 45 and g < 45 and b < 45)
        
        if not is_outline:
            pixels[x, y] = (0, 0, 0, 0)
            for dx, dy in [(-1,0), (1,0), (0,-1), (0,1)]:
                nx, ny = x + dx, y + dy
                if 0 <= nx < w and 0 <= ny < h and (nx, ny) not in visited:
                    queue.append((nx, ny))

    bbox = im.getbbox()
    if bbox:
        im = im.crop(bbox)

    im.save(dst, 'PNG')
    print(f"Isolated transparent sprite: {dst}")

print("Processing pug stickers...")
for src, dst in targets.items():
    if os.path.exists(src):
        img = Image.open(src)
        clean_img = remove_exact_bg(img, color_tolerance=5)
        clean_img.save(dst, "PNG")

# Process pixel poop
if os.path.exists('pixel poop.png'):
    poop_img = Image.open('pixel poop.png')
    clean_poop = remove_exact_bg(poop_img, color_tolerance=15)
    clean_poop.save('assets/items/poop.png', "PNG")
    clean_poop.save('assets/poop.png', "PNG")

# Process food bowl
if os.path.exists('pixel pet food bowl.jpg'):
    clean_sprite_outline('pixel pet food bowl.jpg', 'assets/items/food_bowl.png')

# Process thought bubble
if os.path.exists('thought bubble.png'):
    tb_img = Image.open('thought bubble.png')
    clean_tb = remove_white_bg(tb_img, threshold=235)
    clean_tb.save('assets/items/thought_bubble.png', "PNG")

# Process bone
if os.path.exists('bone.png'):
    bone_img = Image.open('bone.png')
    clean_bone = remove_white_bg(bone_img, threshold=240)
    clean_bone.save('assets/items/bone.png', "PNG")

# Bath mini game assets (clean transparent tools)
if os.path.exists('bath mini game/shampoo.jpg'):
    clean_sprite_outline('bath mini game/shampoo.jpg', 'assets/items/shampoo.png')

if os.path.exists('bath mini game/showerhead.jpg'):
    clean_sprite_outline('bath mini game/showerhead.jpg', 'assets/items/showerhead.png')

if os.path.exists('bath mini game/bubble.png'):
    bubble_img = Image.open('bath mini game/bubble.png')
    bubble_img.save('assets/items/bubble.png', "PNG")

if os.path.exists('bath mini game/shower background.jpg'):
    bg_bath = Image.open('bath mini game/shower background.jpg')
    bg_bath.save('assets/backgrounds/bath_room.jpg')

# Grass & walk background
if os.path.exists('pixel grass background.png'):
    Image.open('pixel grass background.png').save('assets/backgrounds/grass.png')

if os.path.exists('walking mini game/walking game background.jpg'):
    Image.open('walking mini game/walking game background.jpg').save('assets/backgrounds/walk_path.jpg')

print("All assets processed successfully!")
