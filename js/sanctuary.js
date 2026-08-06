// Sanctuary Grass Field & Pug Sticker Engine

class PugEntity {
  constructor(data, stageWidth, stageHeight) {
    this.id = data.id || 'pug_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
    this.name = data.name || 'Moku';
    this.pose = data.pose || 'moku_3'; // moku_1, moku_2, moku_3, moku_3_smiling
    this.basePose = data.basePose || this.pose;

    // Stats (0 - 100)
    this.hunger = data.hunger !== undefined ? data.hunger : 80;
    this.happiness = data.happiness !== undefined ? data.happiness : 70;
    this.energy = data.energy !== undefined ? data.energy : 90;
    this.hygiene = data.hygiene !== undefined ? data.hygiene : 85;

    // Stage bounds & position
    this.stageWidth = stageWidth;
    this.stageHeight = stageHeight;
    this.x = data.x !== undefined ? data.x : 100 + Math.random() * (stageWidth - 200);
    this.y = data.y !== undefined ? data.y : 150 + Math.random() * (stageHeight - 220);
    this.targetX = this.x;
    this.targetY = this.y;
    this.speed = 1.2 + Math.random() * 0.6;
    this.facing = 1; // 1 = right, -1 = left

    // Animation & State
    this.state = 'IDLE';
    this.walkTimer = 0;
    this.idleTimer = 30 + Math.random() * 60;
    this.yBob = 0;
    
    // DOM Elements
    this.element = null;
    this.imgElement = null;
    this.nameBadge = null;
    this.thoughtBubble = null;
    this.thoughtIcon = null;
    
    this.createDOM();
  }

  createDOM() {
    this.element = document.createElement('div');
    this.element.className = 'pug-entity';
    this.element.id = this.id;

    // Thought Bubble Container (Above Head)
    this.thoughtBubble = document.createElement('div');
    this.thoughtBubble.className = 'pug-thought-bubble';
    
    this.thoughtIcon = document.createElement('img');
    this.thoughtIcon.className = 'thought-icon';
    this.thoughtBubble.appendChild(this.thoughtIcon);
    this.element.appendChild(this.thoughtBubble);

    // Thought bubble click handler
    this.thoughtBubble.addEventListener('click', (e) => {
      e.stopPropagation();
      this.handleNeedClick();
    });

    // Name badge (Above Head, unflipped)
    this.nameBadge = document.createElement('div');
    this.nameBadge.className = 'pug-name-badge';
    this.nameBadge.innerText = this.name;
    this.element.appendChild(this.nameBadge);

    // Image sticker (Flipped horizontally based on facing direction)
    this.imgElement = document.createElement('img');
    this.imgElement.className = 'pug-sticker-img';
    this.updateSpriteSrc();
    this.element.appendChild(this.imgElement);

    // Click handler on pug
    this.element.addEventListener('click', (e) => {
      e.stopPropagation();
      if (this.hunger < 60 || this.hygiene < 60) {
        this.handleNeedClick();
      } else if (window.app) {
        window.app.handlePugClick(this);
      }
    });
  }

  handleNeedClick() {
    if (this.hunger < 60) {
      this.feed(40);
      if (window.app) {
        window.app.addCurrency(15);
        window.app.addExp(10);
        window.app.sanctuary.spawnParticle(this.x, this.y - 40, '+Food & 15 P$', 'coin');
      }
    } else if (this.hygiene < 60) {
      this.groom();
      if (window.app) {
        window.app.addCurrency(15);
        window.app.addExp(10);
        window.app.sanctuary.spawnParticle(this.x, this.y - 40, '+Clean & 15 P$', 'coin');
      }
    }
    if (window.app && window.app.saveGame) window.app.saveGame();
  }

  updateSpriteSrc() {
    if (this.basePose === 'moku_3' && this.happiness >= 100) {
      this.pose = 'moku_3_smiling';
      if (this.nameBadge) this.nameBadge.classList.add('happy');
    } else if (this.basePose === 'moku_3') {
      this.pose = 'moku_3';
      if (this.nameBadge) this.nameBadge.classList.remove('happy');
    }

    const src = `assets/pugs/${this.pose}.png`;
    if (this.imgElement.getAttribute('src') !== src) {
      this.imgElement.src = src;
    }
  }

  setTarget(tx, ty) {
    // Clamp target within safe stage margins (pug sprite ~80px wide, 90px tall)
    this.targetX = Math.max(50, Math.min(tx, this.stageWidth - 90));
    this.targetY = Math.max(130, Math.min(ty, this.stageHeight - 90));
    this.state = 'WANDERING';
  }

  update(dt, foodEntities, toyEntities) {
    // Stat decay — ~10 min per full cycle at 60fps (36000 ticks to drop 40pts from 100 to 60)
    this.hunger    = Math.max(0, this.hunger    - 0.00111 * dt);
    this.happiness = Math.max(0, this.happiness - 0.00089 * dt);
    this.energy    = Math.max(0, this.energy    - 0.00067 * dt);
    this.hygiene   = Math.max(0, this.hygiene   - 0.00044 * dt);

    this.updateSpriteSrc();

    // Update Thought Bubble for Needs
    if (this.hunger < 60) {
      this.thoughtBubble.style.display = 'flex';
      this.thoughtIcon.src = 'assets/items/bone.png';
    } else if (this.hygiene < 60) {
      this.thoughtBubble.style.display = 'flex';
      this.thoughtIcon.src = 'assets/items/poop.png';
    } else {
      this.thoughtBubble.style.display = 'none';
    }

    // Wandering AI
    if (this.state === 'IDLE') {
      this.yBob = 0;
      this.idleTimer -= dt;

      if (this.hunger < 60 && foodEntities.length > 0) {
        const closestFood = foodEntities[0];
        this.setTarget(closestFood.x, closestFood.y);
      } else if (this.idleTimer <= 0) {
        // Keep random wander targets well inside stage boundaries
        const rx = 80 + Math.random() * Math.max(0, this.stageWidth - 180);
        const ry = 140 + Math.random() * Math.max(0, this.stageHeight - 240);
        this.setTarget(rx, ry);
        this.idleTimer = 60 + Math.random() * 120;
      }
    } else if (this.state === 'WANDERING') {
      const dx = this.targetX - this.x;
      const dy = this.targetY - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist > 4) {
        this.facing = dx >= 0 ? 1 : -1;
        this.x += (dx / dist) * this.speed;
        this.y += (dy / dist) * this.speed;

        this.walkTimer += 0.15;
        this.yBob = -Math.abs(Math.sin(this.walkTimer)) * 8;
      } else {
        this.state = 'IDLE';
        this.yBob = 0;
        if (window.sfx && Math.random() < 0.1) {
          window.sfx.playBark();
        }
      }
    }

    // Hard clamp: ensure pug never escapes the stage edges regardless of how they got there
    const padX = 50, padRight = 90, padTop = 130, padBottom = 90;
    this.x = Math.max(padX, Math.min(this.x, this.stageWidth - padRight));
    this.y = Math.max(padTop, Math.min(this.y, this.stageHeight - padBottom));

    // Position container (UNFLIPPED so text & bubbles stay right-side up)
    const zIndex = Math.floor(this.y);
    this.element.style.transform = `translate3d(${this.x}px, ${this.y + this.yBob}px, 0)`;
    this.element.style.zIndex = zIndex;

    // Flip ONLY the inner sticker image element & apply sparkling clean brightness filter after bath!
    if (this.isSparkling || this.hygiene >= 90) {
      this.imgElement.style.filter = 'brightness(1.18) contrast(1.05) drop-shadow(0px 0px 6px rgba(255,255,255,0.8))';
    } else {
      this.imgElement.style.filter = 'none';
    }
    this.imgElement.style.transform = `scaleX(${this.facing})`;
  }

  feed(amount = 35) {
    this.hunger = Math.min(100, this.hunger + amount);
    this.happiness = Math.min(100, this.happiness + 15);
    if (window.sfx) window.sfx.playCrunch();
    this.updateSpriteSrc();
    if (window.app && window.app.saveGame) window.app.saveGame();
  }

  pet() {
    this.happiness = Math.min(100, this.happiness + 20);
    if (window.sfx) window.sfx.playPet();
    this.updateSpriteSrc();
    if (window.app && window.app.saveGame) window.app.saveGame();
  }

  groom() {
    this.hygiene = Math.min(100, this.hygiene + 40);
    this.happiness = Math.min(100, this.happiness + 10);
    if (window.sfx) window.sfx.playScoop();
    if (window.app && window.app.saveGame) window.app.saveGame();
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      pose: this.pose,
      basePose: this.basePose,
      hunger: this.hunger,
      happiness: this.happiness,
      energy: this.energy,
      hygiene: this.hygiene,
      x: this.x,
      y: this.y
    };
  }
}

class SanctuaryEngine {
  constructor(wrapperId) {
    this.wrapper = document.getElementById(wrapperId);
    this.pugs = [];
    this.foodItems = [];
    this.toyItems = [];
    this.furnitureItems = [];

    this.activeTool = 'SELECT';
    this.initEvents();
  }

  get stageWidth() {
    return this.wrapper.clientWidth || 900;
  }

  get stageHeight() {
    return this.wrapper.clientHeight || 450;
  }

  initEvents() {
    this.wrapper.addEventListener('click', (e) => {
      if (e.target !== this.wrapper) return;
      const rect = this.wrapper.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;

      if (this.activeTool === 'BOWL') {
        this.addFoodBowl(clickX, clickY);
        this.deactivateTool();
      } else if (this.activeTool === 'TOY') {
        this.addToy(clickX, clickY);
        this.deactivateTool();
      }
    });
  }

  deactivateTool() {
    this.activeTool = null;
    document.querySelectorAll('.sanctuary-toolbar .tool-btn').forEach(b => b.classList.remove('active'));
  }

  addPug(pugData) {
    const pug = new PugEntity(pugData, this.stageWidth, this.stageHeight);
    this.pugs.push(pug);
    this.wrapper.appendChild(pug.element);
    return pug;
  }

  removePug(pugId) {
    const idx = this.pugs.findIndex(p => p.id === pugId);
    if (idx !== -1) {
      const pug = this.pugs[idx];
      if (pug.element && pug.element.parentNode) {
        pug.element.parentNode.removeChild(pug.element);
      }
      this.pugs.splice(idx, 1);
    }
  }

  addFoodBowl(x, y) {
    const bowl = document.createElement('div');
    bowl.className = 'field-item food-bowl';
    bowl.style.left = x + 'px';
    bowl.style.top = y + 'px';
    bowl.style.zIndex = Math.floor(y);

    const img = document.createElement('img');
    img.src = 'assets/items/food_bowl.png';
    img.alt = 'Pixel Food Bowl';
    bowl.appendChild(img);

    const itemObj = { x, y, el: bowl, type: 'food' };
    this.foodItems.push(itemObj);
    this.wrapper.appendChild(bowl);

    if (window.sfx) window.sfx.playClick();
    this.spawnParticle(x, y - 20, '+Food Bowl', 'coin');

    // All pugs run immediately to where the food bowl is placed!
    this.pugs.forEach(p => p.setTarget(x, y));
  }

  addToy(x, y) {
    const toy = document.createElement('div');
    toy.className = 'field-item toy-ball';
    toy.style.left = x + 'px';
    toy.style.top = y + 'px';
    toy.style.zIndex = Math.floor(y);

    const img = document.createElement('img');
    img.src = 'assets/items/tennis_ball.png?v=' + Date.now();
    img.alt = 'Pixel Tennis Ball';
    img.style.cssText = 'width:22px;height:22px;display:block;image-rendering:pixelated;pointer-events:none;';
    toy.appendChild(img);

    const itemObj = { x, y, el: toy, type: 'toy' };
    this.toyItems.push(itemObj);
    this.wrapper.appendChild(toy);

    if (window.sfx) window.sfx.playClick();
    this.spawnParticle(x, y - 20, '+Toy', 'heart');
  }

  addFurniture(x, y, name, typeClass = 'ortho-bed') {
    const furn = document.createElement('div');
    furn.className = `field-item furniture-item ${typeClass}`;
    furn.style.left = x + 'px';
    furn.style.top = y + 'px';
    furn.style.zIndex = Math.floor(y);

    const itemObj = { x, y, el: furn, name, type: 'furniture' };
    this.furnitureItems.push(itemObj);
    this.wrapper.appendChild(furn);

    if (window.sfx) window.sfx.playClick();
    this.spawnParticle(x, y - 20, `+${name}`, 'heart');
  }

  spawnParticle(x, y, text, type = 'heart') {
    const p = document.createElement('div');
    p.className = `particle ${type}`;
    p.innerText = text;
    p.style.left = x + 'px';
    p.style.top = y + 'px';
    this.wrapper.appendChild(p);

    setTimeout(() => {
      if (p.parentNode) p.parentNode.removeChild(p);
    }, 1200);
  }

  update(dt) {
    this.pugs.forEach(pug => {
      pug.update(dt, this.foodItems, this.toyItems);

      this.foodItems.forEach((food, fIdx) => {
        const dx = pug.x - food.x;
        const dy = pug.y - food.y;
        if (Math.sqrt(dx * dx + dy * dy) < 30) {
          pug.feed(40);
          this.spawnParticle(pug.x, pug.y - 40, '+Food', 'coin');
          if (food.el.parentNode) food.el.parentNode.removeChild(food.el);
          this.foodItems.splice(fIdx, 1);
        }
      });
    });
  }
}

window.SanctuaryEngine = SanctuaryEngine;
