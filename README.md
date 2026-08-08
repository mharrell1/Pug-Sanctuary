# 🐶 Pug Sanctuary.exe (Y2K Virtual Pet Game)

![Pug Sanctuary Desktop App](assets/pugs/moku_1.png)

**Pug Sanctuary.exe** is a retro Y2K desktop-inspired virtual pet game built with HTML5, CSS3, JavaScript, and Firebase. Inspired by nostalgic classics like *Nintendogs*, *Tamagotchi*, and *Old Dog Haven*, players can adopt senior/rescue pugs, feed them, give them baths, dress them up, play interactive mini-games, and build their ultimate sanctuary!

---

## 🌟 Key Features

- 🖥️ **Y2K Windows Desktop Aesthetic**: Nostalgic 90s/2000s desktop window UI complete with title bars, retro sound effects, tab switches, and pixel fonts.
- 🐾 **Adopt & Care for Pugs**: Name your pugs, track their hunger, hygiene, happiness, and energy levels in real-time. Choose from **25 unique adoptable pug styles** (including Classic Kaleo, Puppy, Referee, Skeleton, Bee, and Pirate).
- 😀 **Dynamic Happiness Poses**: Pugs react dynamically to their care! If their happiness level drops below 50, they will show a sad face (if available), and when their happiness level is high (>= 80), they will show a happy, smiling face.
- 🚫 **Pug Collision Avoidance**: Active pugs in the sanctuary field steer clear of each other, dynamically preventing overlaps and keeping the sanctuary orderly.
- 🦴 **Continuous Platformer Walking Mini-Game**: Take your pug on a walk in the park! Use arrow keys to jump and navigate past obstacles to collect bones and earn **PugBucks ($P)**. The game automatically adapts the walking sprite to match the adopted pug (e.g. red/tan harnesses).
- 🛁 **Interactive 3-Step Bath Mini-Game**: Lather your pug with shampoo bubbles, rinse them clean with the shower nozzle, and finish by brushing them with the Pet Brush for extra fluff!
- 🛍️ **PugMart Shop & Decorations**: Earn PugBucks and EXP to level up your sanctuary and unlock new toys, treats, heart rugs, fountains, and dog beds (available in 6 colors!).
- 🎨 **Canva-Style Furniture Editor**: Click any placed furniture to open a dynamic editor box to easily resize, rotate (↺), or remove (X) items.
- 💾 **User Accounts & Progress Persistence**: Log in with your username to automatically save and sync your sanctuary progress across devices.
- 📏 **Dynamic Boundary Scaling**: Wandering boundaries automatically adapt to any window size, ensuring pugs never wander outside of view when the game window is small or resized.

---

## 🎮 How to Play

1. **Adopt a Pug**: Pick a starting pug pose and give your pug a custom name.
2. **Care for Your Pugs**:
   - Click **Place Food Bowl** or **Place Toy** on the grass field to feed and entertain your pugs.
   - Use the **Poop Scoop** tool to keep the sanctuary clean!
   - **Edit Furniture**: Click on any placed furniture (like beds or rugs) to reveal the editor box. Drag to move, use the corners to resize, the '↺' arrow to angle it, or the 'X' to put it back in your inventory.
3. **Mini-Games**:
   - **Walk Mode**: Use `Arrow Up` / `Arrow Down` to move your pug and collect bone gifts while avoiding fire hydrants.
   - **Bath Mode**: Click the shampoo tool to suds up your pug, switch to the shower nozzle to rinse them, and (if you own it) use the Pet Brush for a sparkling finish.
4. **PugMart**: Visit the shop tab to buy kibble, treats, heart rugs, solar fountains, and dog beds as you level up. All items are stored in your visual inventory!

---

## 🛠️ Built With

- **HTML5 & CSS3**: Custom Y2K window styling, responsive flexbox layout, and CSS animations.
- **JavaScript (ES6+)**: Custom Canvas 2D engine for physics, minigame collision detection, particle systems, and audio management.
- **Firebase Auth & Firestore**: Save state persistence and user authentication.
- **Web Audio API**: Retro sound effects (squeaks, barks, coins, level-ups).

---

## 🚀 Local Development Setup

To run Pug Sanctuary locally on your machine:

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/mharrell1/Pug-Sanctuary.git
   cd Pug-Sanctuary
   ```

2. **Serve the Files**:
   Using Python's built-in HTTP server:
   ```bash
   python3 -m http.server 8080
   ```

3. **Open in Browser**:
   Navigate to `http://localhost:8080` in your web browser.

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.
