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
    let nextPose = this.basePose || 'moku_1';
    const hasSad = ['kaleo_8', 'kaleo_9', 'kaleo_16'].includes(this.basePose);
    const hasSmiling = ['kaleo_8', 'kaleo_9', 'moku_3'].includes(this.basePose);

    if (this.happiness < 50 && hasSad) {
      nextPose = `${this.basePose}_sad`;
    } else if (this.happiness >= 80 && hasSmiling) {
      nextPose = `${this.basePose}_smiling`;
    } else {
      nextPose = this.basePose;
    }

    this.pose = nextPose;

    if (this.nameBadge) {
      if (this.happiness >= 80) {
        this.nameBadge.classList.add('happy');
      } else {
        this.nameBadge.classList.remove('happy');
      }
    }

    const src = `assets/pugs/${this.pose || 'moku_1'}.png`;
    if (this.imgElement.getAttribute('src') !== src) {
      this.imgElement.src = src;
      this.imgElement.onerror = () => {
        if (this.imgElement.src.includes('moku_1.png')) return;
        this.imgElement.src = 'assets/pugs/moku_1.png';
      };
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
    // Add 1000 to the pug's z-index so it renders on top of placed ground items!
    const zIndex = Math.floor(this.y) + 1000;
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
      if (e.target === this.wrapper) {
        this.deactivateFurnitureEdit();
      }

      if (e.target !== this.wrapper) return;
      const rect = this.wrapper.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;

      if (this.activeTool === 'BOWL') {
        const activeFood = window.app && window.app.activeFood ? window.app.activeFood : 'kibble';
        this.addFoodBowl(clickX, clickY, activeFood);
      } else if (this.activeTool === 'TOY') {
        const activeToy = window.app && window.app.activeToy ? window.app.activeToy : 'rubber_duck';
        this.addToy(clickX, clickY, activeToy);
      }
    });

    let isDragging = false;
    let isScaling = false;
    let initialScale = 1;
    let initialMouseY = 0;
    let dragOffsetX = 0;
    let dragOffsetY = 0;

    this.wrapper.addEventListener('mousedown', (e) => {
      if (this.activeFurniture) {
        if (e.target.classList.contains('edit-handle')) {
          isScaling = true;
          initialScale = this.activeFurniture.scale;
          initialMouseY = e.clientY;
          e.stopPropagation();
          return;
        }
        
        if (e.target === this.activeFurniture.el || this.activeFurniture.el.contains(e.target)) {
          if (!e.target.classList.contains('edit-action-btn')) {
            isDragging = true;
            const rect = this.activeFurniture.el.getBoundingClientRect();
            dragOffsetX = e.clientX - rect.left;
            dragOffsetY = e.clientY - rect.top;
            e.stopPropagation();
          }
        }
      }
    });

    document.addEventListener('mousemove', (e) => {
      if (isScaling && this.activeFurniture) {
        const deltaY = initialMouseY - e.clientY; 
        const newScale = Math.max(0.5, Math.min(3.5, initialScale + deltaY * 0.015));
        this.activeFurniture.scale = newScale;
        this.activeFurniture.updateTransform();
      }
      else if (isDragging && this.activeFurniture) {
        const wrapperRect = this.wrapper.getBoundingClientRect();
        let newX = e.clientX - wrapperRect.left - dragOffsetX;
        let newY = e.clientY - wrapperRect.top - dragOffsetY;
        
        newX = Math.max(0, Math.min(newX, this.stageWidth - 50));
        newY = Math.max(0, Math.min(newY, this.stageHeight - 50));
        
        this.activeFurniture.x = newX;
        this.activeFurniture.y = newY;
        this.activeFurniture.el.style.left = newX + 'px';
        this.activeFurniture.el.style.top = newY + 'px';
        this.activeFurniture.el.style.zIndex = Math.floor(newY);
      }
    });

    document.addEventListener('mouseup', () => {
      if (isDragging || isScaling) {
        isDragging = false;
        isScaling = false;
        if (window.app && window.app.saveGame) window.app.saveGame();
      }
    });

    // Touch support for furniture drag & scaling
    this.wrapper.addEventListener('touchstart', (e) => {
      if (this.activeFurniture && e.touches.length > 0) {
        const touch = e.touches[0];
        if (e.target.classList.contains('edit-handle')) {
          isScaling = true;
          initialScale = this.activeFurniture.scale;
          initialMouseY = touch.clientY;
          e.stopPropagation();
          e.preventDefault();
          return;
        }
        
        if (e.target === this.activeFurniture.el || this.activeFurniture.el.contains(e.target)) {
          if (!e.target.classList.contains('edit-action-btn')) {
            isDragging = true;
            const rect = this.activeFurniture.el.getBoundingClientRect();
            dragOffsetX = touch.clientX - rect.left;
            dragOffsetY = touch.clientY - rect.top;
            e.stopPropagation();
            e.preventDefault();
          }
        }
      }
    }, { passive: false });

    document.addEventListener('touchmove', (e) => {
      if (e.touches.length === 0) return;
      const touch = e.touches[0];
      if (isScaling && this.activeFurniture) {
        const deltaY = initialMouseY - touch.clientY; 
        const newScale = Math.max(0.5, Math.min(3.5, initialScale + deltaY * 0.015));
        this.activeFurniture.scale = newScale;
        this.activeFurniture.updateTransform();
        e.preventDefault();
      }
      else if (isDragging && this.activeFurniture) {
        const wrapperRect = this.wrapper.getBoundingClientRect();
        let newX = touch.clientX - wrapperRect.left - dragOffsetX;
        let newY = touch.clientY - wrapperRect.top - dragOffsetY;
        
        newX = Math.max(0, Math.min(newX, this.stageWidth - 50));
        newY = Math.max(0, Math.min(newY, this.stageHeight - 50));
        
        this.activeFurniture.x = newX;
        this.activeFurniture.y = newY;
        this.activeFurniture.el.style.left = newX + 'px';
        this.activeFurniture.el.style.top = newY + 'px';
        this.activeFurniture.el.style.zIndex = Math.floor(newY);
        e.preventDefault();
      }
    }, { passive: false });

    document.addEventListener('touchend', () => {
      if (isDragging || isScaling) {
        isDragging = false;
        isScaling = false;
        if (window.app && window.app.saveGame) window.app.saveGame();
      }
    });
  }

  activateFurnitureEdit(itemObj) {
    this.deactivateFurnitureEdit();
    this.activeFurniture = itemObj;
    this.activeFurniture.el.classList.add('active-edit');
    
    if (!this.activeFurniture.el.querySelector('.edit-handle')) {
      const handles = ['top-left', 'top-right', 'bottom-left', 'bottom-right'];
      handles.forEach(pos => {
        const h = document.createElement('div');
        h.className = `edit-handle ${pos}`;
        this.activeFurniture.el.appendChild(h);
      });
      
      const rmBtn = document.createElement('div');
      rmBtn.className = 'edit-action-btn edit-btn-remove';
      rmBtn.innerText = 'X';
      rmBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.removeFurniture(this.activeFurniture);
        this.deactivateFurnitureEdit();
      });
      this.activeFurniture.el.appendChild(rmBtn);
      
      const rotBtn = document.createElement('div');
      rotBtn.className = 'edit-action-btn edit-btn-rotate';
      rotBtn.innerText = '↻';
      rotBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.activeFurniture.angle = (this.activeFurniture.angle + 45) % 360;
        this.activeFurniture.updateTransform();
        if (window.app && window.app.saveGame) window.app.saveGame();
      });
      this.activeFurniture.el.appendChild(rotBtn);
    }
  }

  deactivateFurnitureEdit() {
    if (this.activeFurniture) {
      this.activeFurniture.el.classList.remove('active-edit');
      this.activeFurniture = null;
    }
  }

  deactivateTool() {
    this.activeTool = null;
    document.querySelectorAll('.sanctuary-toolbar .tool-btn').forEach(b => b.classList.remove('active'));
  }
  clearSanctuary() {
    // Clear pugs
    this.pugs.forEach(pug => {
      if (pug.element && pug.element.parentNode) {
        pug.element.parentNode.removeChild(pug.element);
      }
    });
    this.pugs = [];

    // Clear food bowls
    this.foodItems.forEach(item => {
      if (item.el && item.el.parentNode) {
        item.el.parentNode.removeChild(item.el);
      }
    });
    this.foodItems = [];

    // Clear toys
    this.toyItems.forEach(item => {
      if (item.el && item.el.parentNode) {
        item.el.parentNode.removeChild(item.el);
      }
    });
    this.toyItems = [];

    // Clear furniture
    this.furnitureItems.forEach(item => {
      if (item.el && item.el.parentNode) {
        item.el.parentNode.removeChild(item.el);
      }
    });
    this.furnitureItems = [];
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

  addFoodBowl(x, y, itemId = 'kibble') {
    const shopItem = window.app ? window.app.shopItems.find(i => i.id === itemId) : null;
    const name = shopItem ? shopItem.name : 'Food Bowl';
    
    const bowl = document.createElement('div');
    bowl.className = 'field-item food-bowl';
    bowl.style.left = x + 'px';
    bowl.style.top = y + 'px';
    bowl.style.zIndex = Math.floor(y);

    const img = document.createElement('img');
    // Map items to images
    if (itemId === 'salmon_treat') {
      img.src = 'assets/items/salmon_treat.png';
    } else if (itemId === 'berry_smoothie') {
      img.src = 'assets/items/berry_smoothie.png';
    } else {
      img.src = 'assets/items/kibble.png?v=3'; // default kibble
    }
    
    img.alt = name;
    img.style.cssText = 'width:32px;height:32px;display:block;image-rendering:pixelated;pointer-events:none;';
    bowl.appendChild(img);

    const itemObj = { x, y, el: bowl, type: 'food', id: itemId, name };
    this.foodItems.push(itemObj);
    this.wrapper.appendChild(bowl);

    if (window.sfx) window.sfx.playClick();
    this.spawnParticle(x, y - 20, `+${name}`, 'coin');

    // All pugs run immediately to where the food bowl is placed!
    this.pugs.forEach(p => p.setTarget(x, y));
  }

  addToy(x, y, itemId = 'rubber_duck') {
    const shopItem = window.app ? window.app.shopItems.find(i => i.id === itemId) : null;
    const toy = document.createElement('div');
    toy.className = `field-item toy-ball`;
    toy.style.left = x + 'px';
    toy.style.top = y + 'px';
    toy.style.zIndex = Math.floor(y);
    toy.style.cursor = 'pointer';

    const img = document.createElement('img');
    // Simple mapping for toys, or fallback to tennis ball if not found
    img.src = itemId === 'rubber_duck' ? 'assets/items/rubber_duck.png' : 'assets/items/toy_tennis_ball.png';
    img.alt = shopItem ? shopItem.name : 'Pixel Toy';
    img.style.cssText = 'width:32px;height:32px;display:block;image-rendering:pixelated;pointer-events:none;';
    toy.appendChild(img);

    const itemObj = { x, y, el: toy, type: 'toy', id: itemId };
    this.toyItems.push(itemObj);
    this.wrapper.appendChild(toy);

    toy.addEventListener('click', (e) => {
      e.stopPropagation();
      this.removeToy(itemObj);
    });

    if (window.sfx) window.sfx.playClick();
    this.spawnParticle(x, y - 20, `+${shopItem ? shopItem.name : 'Toy'}`, 'heart');
  }

  removeToy(itemObj) {
    const idx = this.toyItems.indexOf(itemObj);
    if (idx !== -1) {
      if (itemObj.el.parentNode) itemObj.el.parentNode.removeChild(itemObj.el);
      this.toyItems.splice(idx, 1);
      if (window.sfx) window.sfx.playScoop();
      if (window.app) window.app.showNotification(`RETURNED TO INVENTORY`);
      if (window.app && window.app.saveGame) window.app.saveGame();
    }
  }

  addFurniture(x, y, itemId = 'dog_bed_brown', scale = 1, angle = 0) {
    // Find shop item - for color variants, check the colors array inside parent items
    let shopItem = window.app ? window.app.shopItems.find(i => i.id === itemId) : null;
    let typeClass = 'ortho-bed';
    let name = 'FURNITURE';

    if (shopItem) {
      typeClass = shopItem.class || 'ortho-bed';
      name = shopItem.name;
    } else if (window.app) {
      // Check if it's a color variant (e.g. ortho_bed_brown) inside a parent item with .colors
      for (const parent of window.app.shopItems) {
        if (parent.colors) {
          const colorEntry = parent.colors.find(c => c.id === itemId);
          if (colorEntry) {
            typeClass = parent.class || 'ortho-bed';
            name = `${colorEntry.label.toUpperCase()} DOG BED`;
            break;
          }
        }
      }
    }

    const furn = document.createElement('div');
    furn.className = `field-item furniture-item ${typeClass}`;
    furn.style.left = x + 'px';
    furn.style.top = y + 'px';
    furn.style.zIndex = Math.floor(y);
    furn.style.cursor = 'pointer';
    furn.style.position = 'absolute';

    const img = document.createElement('img');
    img.src = `assets/items/${itemId}.png?v=9`;
    img.style.cssText = 'width:64px;height:64px;display:block;image-rendering:pixelated;pointer-events:none;object-fit:contain;transition: width 0.1s, height 0.1s;';
    
    let baseW = 64;
    let baseH = 64;
    
    const updateTransform = () => {
      img.style.transform = `rotate(${itemObj.angle}deg)`;
      img.style.width = (baseW * itemObj.scale) + 'px';
      img.style.height = (baseH * itemObj.scale) + 'px';
    };
    
    img.onload = () => {
      furn.style.background = 'transparent';
      furn.style.border = 'none';
      furn.style.boxShadow = 'none';
      furn.style.width = 'auto';
      furn.style.height = 'auto';
      
      if (itemId === 'flower_box') {
        baseW = 100; baseH = 100;
      } else if (itemId === 'dog_house') {
        baseW = 120; baseH = 120;
      } else if (itemId === 'water_fountain') {
        baseW = 90; baseH = 90;
      } else if (itemId === 'heart_rug') {
        baseW = 100; baseH = 100;
      }
      updateTransform();
    };
    
    img.onerror = () => {
      img.style.display = 'none';
    };
    
    furn.appendChild(img);

    const itemObj = { x, y, el: furn, name, type: 'furniture', id: itemId, scale, angle, updateTransform };
    this.furnitureItems.push(itemObj);
    this.wrapper.appendChild(furn);

    furn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.activateFurnitureEdit(itemObj);
    });

    if (window.sfx) window.sfx.playClick();
    this.spawnParticle(x, y - 20, `+${name}`, 'heart');
  }

  removeFurniture(itemObj) {
    const idx = this.furnitureItems.indexOf(itemObj);
    if (idx !== -1) {
      if (itemObj.el.parentNode) itemObj.el.parentNode.removeChild(itemObj.el);
      this.furnitureItems.splice(idx, 1);
      if (window.sfx) window.sfx.playScoop();
      if (window.app) window.app.showNotification(`RETURNED TO INVENTORY`);
      if (window.app && window.app.saveGame) window.app.saveGame();
    }
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
    const currentWidth = this.stageWidth;
    const currentHeight = this.stageHeight;
    this.pugs.forEach(pug => {
      pug.stageWidth = currentWidth;
      pug.stageHeight = currentHeight;
      pug.update(dt, this.foodItems, this.toyItems);

      this.foodItems.forEach((food, fIdx) => {
        const dx = pug.x - food.x;
        const dy = pug.y - food.y;
        if (Math.sqrt(dx * dx + dy * dy) < 30) {
          let hungerBoost = 30;
          let moodBoost = 0;
          if (food.id === 'salmon_treat') {
            hungerBoost = 45;
            moodBoost = 15;
          } else if (food.id === 'berry_smoothie') {
            hungerBoost = 60;
            moodBoost = 30;
          }
          
          pug.feed(hungerBoost);
          if (moodBoost > 0) pug.pet();
          pug.mood = Math.min(100, pug.mood + moodBoost);
          
          this.spawnParticle(pug.x, pug.y - 40, `+${food.name || 'Food'}`, 'coin');
          if (food.el.parentNode) food.el.parentNode.removeChild(food.el);
          this.foodItems.splice(fIdx, 1);
        }
      });
    });

    // Separation / collision avoidance logic for pugs
    const minDistance = 75;
    for (let i = 0; i < this.pugs.length; i++) {
      for (let j = i + 1; j < this.pugs.length; j++) {
        const pugA = this.pugs[i];
        const pugB = this.pugs[j];
        const dx = pugB.x - pugA.x;
        const dy = pugB.y - pugA.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < minDistance) {
          const overlap = minDistance - dist;
          const angle = dist > 0 ? Math.atan2(dy, dx) : Math.random() * Math.PI * 2;
          const forceX = Math.cos(angle) * overlap * 0.5;
          const forceY = Math.sin(angle) * overlap * 0.5;
          
          pugA.x -= forceX;
          pugA.y -= forceY;
          pugB.x += forceX;
          pugB.y += forceY;
          
          // Hard clamp
          const padX = 50, padRight = 90, padTop = 130, padBottom = 90;
          pugA.x = Math.max(padX, Math.min(pugA.x, pugA.stageWidth - padRight));
          pugA.y = Math.max(padTop, Math.min(pugA.y, pugA.stageHeight - padBottom));
          pugB.x = Math.max(padX, Math.min(pugB.x, pugB.stageWidth - padRight));
          pugB.y = Math.max(padTop, Math.min(pugB.y, pugB.stageHeight - padBottom));
          
          // Update transform and zIndex
          pugA.element.style.transform = `translate3d(${pugA.x}px, ${pugA.y + pugA.yBob}px, 0)`;
          pugA.element.style.zIndex = Math.floor(pugA.y) + 1000;
          pugB.element.style.transform = `translate3d(${pugB.x}px, ${pugB.y + pugB.yBob}px, 0)`;
          pugB.element.style.zIndex = Math.floor(pugB.y) + 1000;
        }
      }
    }
  }
}

window.SanctuaryEngine = SanctuaryEngine;
