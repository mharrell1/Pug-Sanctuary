// Main Application Coordinator & State Manager

class PugSanctuaryApp {
  constructor() {
    this.sanctuary = new SanctuaryEngine('sanctuary-stage');
    this.walkingGame = new WalkingMiniGame();
    this.bathGame = new BathMiniGame();

    this.coins = 100;
    this.exp = 0;
    this.level = 1;
    this.activeInspectorPug = null;
    this.selectedAdoptPose = 'moku_1';

    this.inventory = {
      furniture: [],
      toys: ['toy_tennis_ball'],
      food: ['kibble'],
      accessories: [],
      backgrounds: []
    };
    this.activeFood = 'kibble';
    this.activeToy = 'toy_tennis_ball';
    this.activeBackground = 'grass';

    // Level-unlocked shop catalog
    this.shopItems = [
      { id: 'kibble', name: 'BASIC KIBBLE', price: 10, minLevel: 1, desc: 'Restores +30 Hunger', type: 'FOOD' },
      { id: 'salmon_treat', name: 'SALMON TREAT', price: 20, minLevel: 1, desc: 'Restores +45 Hunger & +15 Mood', type: 'FOOD' },
      { id: 'heart_rug', name: 'Y2K HEART RUG', price: 50, minLevel: 1, desc: 'Cute heart rug for grass field', type: 'FURNITURE', class: 'heart-rug' },
      { id: 'toy_tennis_ball', name: 'TENNIS BALL', price: 15, minLevel: 1, desc: 'A classic bouncy ball', type: 'TOY' },
      { id: 'soft_brush', name: 'PET BRUSH', price: 35, minLevel: 2, desc: 'Unlocks brush step in bath mini-game!', type: 'GROOM', brushStep: true },
      { id: 'rubber_duck', name: 'RUBBER DUCK TOY', price: 45, minLevel: 2, desc: 'Interactive toy for grass field', type: 'TOY' },
      { id: 'flower_box', name: 'FLOWER BED', price: 80, minLevel: 2, desc: 'Pretty flowers for sanctuary', type: 'FURNITURE', class: 'ortho-bed' },
      { id: 'berry_smoothie', name: 'BERRY SMOOTHIE', price: 60, minLevel: 3, desc: 'Restores +60 Hunger & +30 Mood', type: 'FOOD' },
      {
        id: 'dog_bed', name: 'DOG BED', price: 95, minLevel: 3,
        desc: 'Cozy bed for your pug. Choose your color!',
        type: 'FURNITURE', class: 'ortho-bed',
        colors: [
          { id: 'dog_bed_brown',  label: 'Brown',  swatch: '#7B4F2E' },
          { id: 'dog_bed_creme',  label: 'Creme',  swatch: '#F5E6C8' },
          { id: 'dog_bed_green',  label: 'Green',  swatch: '#4A7C3F' },
          { id: 'dog_bed_grey',   label: 'Grey',   swatch: '#8A8A8A' },
          { id: 'dog_bed_purple', label: 'Purple', swatch: '#7B2FBE' },
          { id: 'dog_bed_red',    label: 'Red',    swatch: '#B82020' },
        ]
      },
      { id: 'water_fountain', name: 'FOUNTAIN', price: 120, minLevel: 4, desc: 'Boosts overall sanctuary mood', type: 'FURNITURE', class: 'water-fountain' },
      { id: 'dog_house', name: 'DOG HOUSE', price: 140, minLevel: 5, desc: 'Cozy house for your pugs', type: 'FURNITURE', class: 'dog-house' },
      { id: 'beach', name: 'BEACH BACKGROUND', price: 200, minLevel: 4, desc: 'A sunny beach for your pugs', type: 'BACKGROUND' },
      { id: 'night', name: 'NIGHT SKY BACKGROUND', price: 250, minLevel: 5, desc: 'A peaceful night under the stars', type: 'BACKGROUND' }
    ];

    this.initUI();
    this.loadState();
    this.startLoop();
  }

  initUI() {
    // Window control buttons
    document.getElementById('btn-min').addEventListener('click', () => this.showNotification("WINDOW MINIMIZED"));
    document.getElementById('btn-max').addEventListener('click', () => this.showNotification("WINDOW MAXIMIZED"));
    document.getElementById('btn-close').addEventListener('click', () => {
      if (confirm("Close Pug Sanctuary.exe? Your sanctuary progress is auto-saved.")) {
        this.saveState();
        this.showNotification("SANCTUARY SAVED!");
      }
    });

    // SFX Toggle & Volume Slider
    const sfxBtn = document.getElementById('btn-sfx-toggle');
    const volSlider = document.getElementById('volume-slider');

    sfxBtn.addEventListener('click', () => {
      const enabled = window.sfx.toggle();
      sfxBtn.innerText = enabled ? 'SFX: ON' : 'SFX: OFF';
    });

    if (volSlider) {
      volSlider.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value) / 100;
        window.sfx.setVolume(val);
      });
    }

    // Shop & Other Tabs
    document.querySelectorAll('.y2k-tab').forEach(tab => {
      tab.addEventListener('click', (e) => {
        document.querySelectorAll('.y2k-tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        e.target.classList.add('active');
        document.getElementById(e.target.dataset.tab).classList.add('active');
        if (e.target.dataset.tab === 'tab-shop') {
          this.renderShop();
        }
      });
    });

    // Inventory Modal
    document.getElementById('btn-open-inventory').addEventListener('click', () => {
      this.renderInventory();
      document.getElementById('inventory-modal').classList.add('active');
    });
    document.getElementById('btn-close-inventory').addEventListener('click', () => {
      document.getElementById('inventory-modal').classList.remove('active');
    });

    // Inventory Tabs
    document.querySelectorAll('.inv-tab').forEach(tab => {
      tab.addEventListener('click', (e) => {
        document.querySelectorAll('.inv-tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.inv-content').forEach(c => c.classList.remove('active'));
        e.target.classList.add('active');
        document.getElementById(e.target.dataset.tab).classList.add('active');
      });
    });

    // Field Action Toolbar — toggle on/off on each click, no persistent SELECT state
    document.querySelectorAll('.sanctuary-toolbar .tool-btn').forEach(btn => {
      const tool = btn.getAttribute('data-tool');
      if (tool) {
        btn.addEventListener('click', () => {
          const isActive = btn.classList.contains('active');
          // Deactivate all first
          document.querySelectorAll('.sanctuary-toolbar .tool-btn').forEach(b => b.classList.remove('active'));
          if (!isActive) {
            // Toggle ON this button
            btn.classList.add('active');
            this.sanctuary.activeTool = tool;
          } else {
            // Toggle OFF — clear active tool
            this.sanctuary.activeTool = null;
          }
          if (window.sfx) window.sfx.playClick();
        });
      }
    });

    // Bath button — prompt pug picker if multiple pugs
    document.getElementById('btn-start-bath-active').addEventListener('click', () => {
      if (this.sanctuary.pugs.length === 0) {
        this.showNotification("ADOPT A PUG FIRST BEFORE GIVING A BATH!");
        return;
      }
      this.openPugPicker('BATH', (pug) => this.bathGame.startBath(pug));
    });

    // Walk button — prompt pug picker if multiple pugs
    document.getElementById('btn-start-walk-active').addEventListener('click', () => {
      if (this.sanctuary.pugs.length === 0) {
        this.showNotification("ADOPT A PUG FIRST BEFORE GOING ON A WALK!");
        return;
      }
      this.openPugPicker('WALK', (pug) => this.walkingGame.startWalk(pug));
    });

    // Pug picker close button
    document.getElementById('btn-close-pug-picker').addEventListener('click', () => {
      document.getElementById('pug-picker-modal').classList.remove('active');
    });

    // Adopt Pug selection grid
    document.querySelectorAll('.pug-select-card').forEach(card => {
      card.addEventListener('click', () => {
        document.querySelectorAll('.pug-select-card').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        this.selectedAdoptPose = card.getAttribute('data-pose');
        if (window.sfx) window.sfx.playClick();
      });
    });

    // Confirm Adoption
    document.getElementById('btn-confirm-adopt').addEventListener('click', () => {
      const nameInput = document.getElementById('adopt-name-input');
      const name = nameInput.value.trim() || 'Moku';

      const newPug = this.sanctuary.addPug({
        name: name,
        pose: this.selectedAdoptPose,
        basePose: this.selectedAdoptPose,
        hunger: 85,
        happiness: 75,
        energy: 90,
        hygiene: 85
      });

      this.addExp(25);
      this.showNotification(`ADOPTED NEW PUG: ${name.toUpperCase()}!`);
      if (window.sfx) window.sfx.playLevelUp();

      document.querySelector('[data-tab="tab-sanctuary"]').click();
      this.saveState();
    });

    // Inspector Modal listeners
    document.getElementById('btn-close-inspector').addEventListener('click', () => {
      document.getElementById('inspector-modal').classList.remove('active');
    });

    document.getElementById('inspect-name-input').addEventListener('input', (e) => {
      if (this.activeInspectorPug) {
        this.activeInspectorPug.name = e.target.value || 'Moku';
        if (this.activeInspectorPug.nameBadge) {
          this.activeInspectorPug.nameBadge.innerText = this.activeInspectorPug.name;
        }
        this.saveState();
      }
    });

    document.getElementById('btn-inspect-feed').addEventListener('click', () => {
      if (this.activeInspectorPug) {
        this.activeInspectorPug.feed(35);
        this.updateInspectorUI();
        this.sanctuary.spawnParticle(this.activeInspectorPug.x, this.activeInspectorPug.y - 30, '+Food', 'coin');
        this.saveState();
      }
    });

    document.getElementById('btn-inspect-pet').addEventListener('click', () => {
      if (this.activeInspectorPug) {
        this.activeInspectorPug.pet();
        this.updateInspectorUI();
        this.sanctuary.spawnParticle(this.activeInspectorPug.x, this.activeInspectorPug.y - 30, '+Mood', 'heart');
        this.saveState();
      }
    });

    document.getElementById('btn-inspect-bath').addEventListener('click', () => {
      document.getElementById('inspector-modal').classList.remove('active');
      if (this.activeInspectorPug) {
        this.bathGame.startBath(this.activeInspectorPug);
      }
    });

    document.getElementById('btn-inspect-walk').addEventListener('click', () => {
      document.getElementById('inspector-modal').classList.remove('active');
      if (this.activeInspectorPug) {
        this.walkingGame.startWalk(this.activeInspectorPug);
      }
    });

    // Bath Modal Tool Listeners
    document.getElementById('btn-bath-shampoo').addEventListener('click', () => {
      this.bathGame.setTool('SHAMPOO');
    });

    document.getElementById('btn-bath-shower').addEventListener('click', () => {
      this.bathGame.setTool('SHOWER');
    });

    document.getElementById('btn-close-bath').addEventListener('click', () => {
      this.bathGame.endBath();
    });

    // Close Walk Modal
    document.getElementById('btn-close-walk').addEventListener('click', () => {
      this.walkingGame.endWalk();
    });

    this.renderShop();
    this.updateStatusHeader();
  }

  handlePugClick(pug) {
    this.activeInspectorPug = pug;
    document.getElementById('inspect-name-input').value = pug.name;
    document.getElementById('inspect-img').src = `assets/pugs/${pug.pose}.png`;
    this.updateInspectorUI();
    document.getElementById('inspector-modal').classList.add('active');
  }

  openPugPicker(action, callback) {
    const pugs = this.sanctuary.pugs;
    // If only one pug, skip the picker and go straight to action
    if (pugs.length === 1) {
      callback(pugs[0]);
      return;
    }
    // Build the picker list
    const titleEl = document.getElementById('pug-picker-title');
    titleEl.textContent = action === 'BATH' ? 'WHICH PUG NEEDS A BATH?' : 'WHICH PUG GOES FOR A WALK?';

    const listEl = document.getElementById('pug-picker-list');
    listEl.innerHTML = '';

    pugs.forEach(pug => {
      const row = document.createElement('div');
      row.style.cssText = 'display:flex; align-items:center; gap:12px; padding:8px; border:2px solid #aaa; background:#f5f5f5; cursor:pointer;';
      row.innerHTML = `
        <img src="assets/pugs/${pug.pose}.png" style="width:48px; height:48px; object-fit:contain; image-rendering:pixelated;">
        <div style="flex:1; font-family:monospace; font-size:11px; font-weight:bold;">${pug.name.toUpperCase()}</div>
        <div style="font-family:monospace; font-size:10px; color:#555;">Hunger: ${Math.floor(pug.hunger)}% | Hygiene: ${Math.floor(pug.hygiene)}%</div>
      `;
      row.addEventListener('click', () => {
        document.getElementById('pug-picker-modal').classList.remove('active');
        callback(pug);
      });
      row.addEventListener('mouseenter', () => row.style.background = '#e0e8ff');
      row.addEventListener('mouseleave', () => row.style.background = '#f5f5f5');
      listEl.appendChild(row);
    });

    document.getElementById('pug-picker-modal').classList.add('active');
  }

  updateInspectorUI() {
    if (!this.activeInspectorPug) return;
    const p = this.activeInspectorPug;
    document.getElementById('inspect-val-hunger').innerText = `${Math.floor(p.hunger)}%`;
    document.getElementById('inspect-val-happy').innerText = `${Math.floor(p.happiness)}%`;
    document.getElementById('inspect-val-energy').innerText = `${Math.floor(p.energy)}%`;
    document.getElementById('inspect-val-hygiene').innerText = `${Math.floor(p.hygiene)}%`;
  }

  addCurrency(amount) {
    this.coins += amount;
    this.updateStatusHeader();
    this.saveState();
  }

  addExp(amount) {
    this.exp += amount;
    const newLevel = Math.floor(this.exp / 100) + 1;
    if (newLevel > this.level) {
      this.level = newLevel;
      this.showNotification(`SANCTUARY LEVEL UP! NOW LEVEL ${this.level}`);
      if (window.sfx) window.sfx.playLevelUp();
      this.renderShop();
    }
    this.updateStatusHeader();
    this.saveState();
  }

  updateStatusHeader() {
    document.getElementById('val-level').innerText = this.level;
    document.getElementById('val-coins').innerText = this.coins;

    const expProgress = (this.exp % 100);
    document.getElementById('val-exp-bar').style.width = `${expProgress}%`;

    let avgHygiene = 100;
    if (this.sanctuary.pugs.length > 0) {
      const sum = this.sanctuary.pugs.reduce((acc, p) => acc + p.hygiene, 0);
      avgHygiene = Math.floor(sum / this.sanctuary.pugs.length);
    }
    document.getElementById('val-hygiene').innerText = `${avgHygiene}%`;
  }

  renderInventory() {
    const categories = ['furniture', 'toys', 'food', 'accessories', 'backgrounds'];
    let totalItems = 0;

    categories.forEach(cat => {
      const container = document.getElementById(`inv-${cat}`);
      if (!container) return;
      container.innerHTML = '';
      
      let items = [...(this.inventory[cat] || [])];
      if (cat === 'backgrounds' && !items.includes('grass')) {
        items.unshift('grass');
      }
      totalItems += items.length;

      items.forEach(itemId => {
        // Resolve name — check direct match first, then color variants inside parent items
        let shopItem = this.shopItems.find(i => i.id === itemId);
        if (itemId === 'grass') {
          shopItem = { id: 'grass', name: 'REGULAR GRASS' };
        }
        if (!shopItem) {
          for (const parent of this.shopItems) {
            if (parent.colors) {
              const colorEntry = parent.colors.find(c => c.id === itemId);
              if (colorEntry) {
                shopItem = { id: itemId, name: `${colorEntry.label.toUpperCase()} DOG BED` };
                break;
              }
            }
          }
        }
        if (!shopItem) shopItem = { id: itemId, name: itemId.toUpperCase() };
        
        const card = document.createElement('div');
        card.className = 'inv-item-card';
        
        // Determine if equipped/active
        let isEquipped = false;
        if (cat === 'food' && this.activeFood === itemId) isEquipped = true;
        if (cat === 'toys' && this.activeToy === itemId) isEquipped = true;
        if (cat === 'backgrounds' && this.activeBackground === itemId) isEquipped = true;
        
        if (isEquipped) card.classList.add('equipped');

        const img = document.createElement('img');
        img.className = 'inv-item-img';
        
        // Match image rendering logic
        if (cat === 'backgrounds') {
          img.src = `assets/backgrounds/${itemId}.png`;
        } else {
          // Use the actual PNG for food, toys, and furniture
          img.src = `assets/items/${itemId}.png`;
          img.onerror = () => { img.src = 'assets/items/food_bowl.png'; };
        }
        
        const nameLabel = document.createElement('div');
        nameLabel.className = 'inv-item-name';
        nameLabel.innerText = isEquipped ? `${shopItem.name} (EQ)` : shopItem.name;

        card.appendChild(img);
        card.appendChild(nameLabel);

        card.addEventListener('click', () => {
          if (cat === 'furniture') {
            // Place furniture immediately (simulating drag/drop or random place like before)
            const rx = 180 + Math.random() * 450;
            const ry = 180 + Math.random() * 180;
            this.sanctuary.addFurniture(rx, ry, itemId);
            this.showNotification(`PLACED ${shopItem.name} ON GRASS FIELD!`);
            this.saveState();
          } else if (cat === 'food') {
            this.activeFood = itemId;
            this.showNotification(`EQUIPPED ${shopItem.name}!`);
            this.saveState();
            this.renderInventory();
          } else if (cat === 'toys') {
            this.activeToy = itemId;
            this.showNotification(`EQUIPPED ${shopItem.name}!`);
            this.saveState();
            this.renderInventory();
          } else if (cat === 'backgrounds') {
            this.activeBackground = itemId;
            if (this.sanctuary.wrapper) {
              this.sanctuary.wrapper.style.backgroundImage = `url('assets/backgrounds/${itemId}.png')`;
            }
            this.showNotification(`BACKGROUND CHANGED TO ${shopItem.name}!`);
            this.saveState();
            this.renderInventory();
          }
          if (window.sfx) window.sfx.playClick();
        });

        container.appendChild(card);
      });
    });

    const emptyMsg = document.getElementById('inv-empty-msg');
    if (emptyMsg) {
      emptyMsg.style.display = totalItems === 0 ? 'block' : 'none';
      if (totalItems === 0) emptyMsg.innerText = "YOUR INVENTORY IS EMPTY! BUY ITEMS FROM PUGMART.";
      else emptyMsg.style.display = 'none'; // Individual tab empty state could be handled, but total empty is fine for now
    }
  }

  renderShop() {
    const container = document.getElementById('shop-items-container');
    if (!container) return;
    container.innerHTML = '';

    this.shopItems.forEach(item => {
      const card = document.createElement('div');
      const isLocked = this.level < item.minLevel;
      card.className = `shop-item-card ${isLocked ? 'locked' : ''}`;

      let category = item.type.toLowerCase();
      if (category === 'groom') category = 'accessories';
      if (category === 'background') category = 'backgrounds';
      if (category === 'toy') category = 'toys';

      // Dog Bed with color picker
      if (item.colors) {
        const previewColor = item.colors[0];
        card.dataset.selectedColorId = previewColor.id;

        card.innerHTML = `
          <div style="display: flex; flex-direction: column; align-items: center; text-align: center; gap: 6px; width: 100%;">
            <div class="shop-item-title">${item.name}</div>
            <img src="assets/items/${previewColor.id}.png?v=1" style="width: 48px; height: 48px; object-fit: contain; image-rendering: pixelated;" onerror="this.style.display='none'">
            <div class="shop-item-desc">${item.desc}</div>
            <div class="bed-color-swatches" style="display:flex; gap:5px; flex-wrap:wrap; justify-content:center; margin-top:2px;">
              ${item.colors.map((c, idx) => {
                const owned = this.inventory[category] && this.inventory[category].includes(c.id);
                const isSelected = idx === 0;
                const borderStyle = isSelected ? 'border: 2px solid #ff007f; box-shadow: 0 0 0 2px #fff;' : `border: 2px solid ${owned ? '#00cc44' : '#000'};`;
                return `<div class="bed-swatch ${owned ? 'owned' : ''} ${isSelected ? 'selected' : ''}" data-color-id="${c.id}" title="${c.label}" style="width:18px;height:18px;border-radius:50%;background:${c.swatch};${borderStyle}cursor:pointer;position:relative;" ></div>`;
              }).join('')}
            </div>
            <div class="bed-color-label" style="font-size:9px;color:#666;text-transform:uppercase;">COLOR: ${previewColor.label}</div>
          </div>
          <div class="bed-purchase-container" style="display: flex; flex-direction: column; justify-content: flex-end; width: 100%; margin-top: 8px;">
          </div>
        `;

        const updateBedCardBuyArea = () => {
          const selectedColorId = card.dataset.selectedColorId;
          const colorInfo = item.colors.find(c => c.id === selectedColorId);
          const alreadyOwned = this.inventory[category] && this.inventory[category].includes(selectedColorId);
          const purchaseContainer = card.querySelector('.bed-purchase-container');
          if (!purchaseContainer) return;

          if (alreadyOwned) {
            purchaseContainer.innerHTML = `
              <div style="font-size: 9px; color: var(--accent-green); text-align: center; margin-top: 4px; font-weight: bold;">OWNED</div>
            `;
          } else {
            purchaseContainer.innerHTML = `
              <div class="shop-item-price" style="text-align: center; font-size: 11px; font-weight: bold; margin-bottom: 4px;">${item.price} P$</div>
              <button class="tool-btn buy-bed-btn" style="width: 100%; font-size: 9px;" ${isLocked ? 'disabled' : ''}>
                ${isLocked ? `UNLOCKS AT LVL ${item.minLevel}` : 'BUY ITEM'}
              </button>
            `;
            const buyBtn = purchaseContainer.querySelector('.buy-bed-btn');
            if (buyBtn && !isLocked) {
              buyBtn.addEventListener('click', () => {
                if (this.coins < item.price) {
                  this.showNotification("NOT ENOUGH PUGBUCKS!");
                  return;
                }
                this.coins -= item.price;
                this.updateStatusHeader();
                if (window.sfx) window.sfx.playCoin();
                this.inventory[category].push(selectedColorId);
                this.showNotification(`UNLOCKED ${colorInfo.label.toUpperCase()} DOG BED!`);
                this.saveState();
                
                // Mark swatch as owned in UI
                card.querySelectorAll('.bed-swatch').forEach(sw => {
                  if (sw.dataset.colorId === selectedColorId) {
                    sw.classList.add('owned');
                  }
                });
                
                updateBedCardBuyArea();

                if (document.getElementById('inventory-modal')?.classList.contains('active')) {
                  this.renderInventory();
                }
              });
            }
          }
        };

        // Swatch click handlers
        card.querySelectorAll('.bed-swatch').forEach(swatch => {
          swatch.addEventListener('click', (e) => {
            e.stopPropagation();
            const colorId = swatch.dataset.colorId;
            const colorInfo = item.colors.find(c => c.id === colorId);
            if (!colorInfo) return;

            card.dataset.selectedColorId = colorId;
            const previewImg = card.querySelector('img');
            if (previewImg) previewImg.src = `assets/items/${colorId}.png?v=1`;

            const colorLabel = card.querySelector('.bed-color-label');
            if (colorLabel) colorLabel.innerText = `COLOR: ${colorInfo.label.toUpperCase()}`;

            // Update styles of swatches to show selection
            card.querySelectorAll('.bed-swatch').forEach(sw => {
              const owned = this.inventory[category] && this.inventory[category].includes(sw.dataset.colorId);
              const isSel = sw.dataset.colorId === colorId;
              if (isSel) {
                sw.style.cssText = `width:18px;height:18px;border-radius:50%;background:${sw.style.backgroundColor};border:2px solid #ff007f;box-shadow:0 0 0 2px #fff;cursor:pointer;position:relative;`;
              } else {
                sw.style.cssText = `width:18px;height:18px;border-radius:50%;background:${sw.style.backgroundColor};border:2px solid ${owned ? '#00cc44' : '#000'};cursor:pointer;position:relative;`;
              }
            });

            updateBedCardBuyArea();
            if (window.sfx) window.sfx.playClick();
          });
        });

        updateBedCardBuyArea();
        container.appendChild(card);
        return;
      }

      const isOwned = this.inventory[category] && this.inventory[category].includes(item.id);

      card.innerHTML = `
        <div style="display: flex; flex-direction: column; align-items: center; text-align: center; gap: 8px;">
          <div class="shop-item-title">${item.name}</div>
          <img src="assets/items/${item.id}.png?v=8" style="width: 48px; height: 48px; object-fit: contain; image-rendering: pixelated; display: block;" onerror="this.style.display='none'">
          <div class="shop-item-desc">${item.desc}</div>
        </div>
        <div style="display: flex; flex-direction: column; justify-content: flex-end;">
          ${!isOwned ? `<div class="shop-item-price">${item.price} P$</div>` : ''}
          ${!isOwned ? `
            <button class="tool-btn" style="width: 100%; font-size: 9px;" ${isLocked ? 'disabled' : ''}>
              ${isLocked ? `UNLOCKS AT LVL ${item.minLevel}` : 'BUY ITEM'}
            </button>
          ` : `
            <div style="font-size: 9px; color: var(--accent-green); text-align: center; margin-top: 4px; font-weight: bold;">OWNED</div>
          `}
        </div>
      `;

      if (!isLocked && !isOwned) {
        card.querySelector('button').addEventListener('click', () => this.buyShopItem(item));
      }

      container.appendChild(card);
    });
  }

  buyShopItem(item) {
    if (this.coins < item.price) {
      this.showNotification("NOT ENOUGH PUGBUCKS!");
      return;
    }

    // Check if already owned (except GROOM items which might still be consumable, or we can make them permanent tools too)
    // For now, let's assume GROOM is consumable or unlocked. The user said furniture, toys, food, and accessories.
    let category = item.type.toLowerCase();
    if (category === 'groom') category = 'accessories';
    if (category === 'background') category = 'backgrounds';
    if (category === 'toy') category = 'toys';
    
    // Check if already in inventory
    if (this.inventory[category] && this.inventory[category].includes(item.id)) {
      this.showNotification("ALREADY OWNED!");
      return;
    }

    this.coins -= item.price;
    this.updateStatusHeader();
    if (window.sfx) window.sfx.playCoin();

    // Add to inventory
    if (this.inventory[category]) {
      this.inventory[category].push(item.id);
    }

    this.showNotification(`UNLOCKED ${item.name} IN INVENTORY!`);
    
    // If it's food or toy, optionally auto-equip it? 
    // Or just let them equip it from the inventory.
    
    this.saveState();
    
    // If the inventory modal is open, re-render it
    if (document.getElementById('inventory-modal')?.classList.contains('active')) {
      this.renderInventory();
    }
  }

  showNotification(msg) {
    const statusMsg = document.getElementById('status-message');
    if (statusMsg) {
      statusMsg.innerText = msg;
    }
  }

  startLoop() {
    let lastTime = performance.now();

    const loop = (now) => {
      const dt = (now - lastTime) / 1000;
      lastTime = now;

      this.sanctuary.update(dt * 60);
      this.updateStatusHeader();

      requestAnimationFrame(loop);
    };

    requestAnimationFrame(loop);
  }

  // Save state – if logged in use Firestore, otherwise fallback to localStorage
  saveState() {
    const data = this.getGameState();
    if (window.auth && window.auth.user) {
      window.auth.saveState(data);
    } else {
      localStorage.setItem('pug_sanctuary_save', JSON.stringify(data));
    }
  }

  // Load state – try Firestore first if logged in, fallback to localStorage
  loadState() {
    const tryLocal = () => {
      const raw = localStorage.getItem('pug_sanctuary_save');
      if (raw) {
        try {
          const data = JSON.parse(raw);
          this.applyLoadedState(data);
          return true;
        } catch (e) {
          console.error('Local load error:', e);
        }
      }
      return false;
    };
    if (window.auth && window.auth.user) {
      window.auth.loadState().then(state => {
        if (state) {
          this.applyLoadedState(state);
        } else if (!tryLocal()) {
          this.applyLoadedState({});
        }
      }).catch(err => {
        console.error('Auth load error:', err);
        if (!tryLocal()) this.applyLoadedState({});
      });
    } else {
      if (!tryLocal()) this.applyLoadedState({});
    }
    this.renderShop();
    this.updateStatusHeader();
  }

  applyLoadedState(state) {
    // Clear existing sanctuary objects to avoid duplicates on login/load state changes
    if (this.sanctuary && typeof this.sanctuary.clearSanctuary === 'function') {
      this.sanctuary.clearSanctuary();
    }
    
    // Reset active inspector reference and close inspector/picker modals
    this.activeInspectorPug = null;
    const inspectorModal = document.getElementById('inspector-modal');
    if (inspectorModal) inspectorModal.classList.remove('active');
    const pickerModal = document.getElementById('pug-picker-modal');
    if (pickerModal) pickerModal.classList.remove('active');

    this.coins = state.coins || 100;
    this.exp = state.exp || 0;
    this.level = state.level || 1;
    
    // Restore Inventory & Active Items
    this.inventory = state.inventory || { furniture: [], toys: [], food: [], accessories: [], backgrounds: [] };
    if (!this.inventory.furniture) this.inventory.furniture = [];

    // Migration: remove stale ortho_bed items that were renamed to dog_bed_*
    this.inventory.furniture = this.inventory.furniture.filter(id => !id.startsWith('ortho_bed'));

    // Build the full set of valid item IDs (including color variants)
    const validIds = new Set();
    this.shopItems.forEach(item => {
      validIds.add(item.id);
      if (item.colors) item.colors.forEach(c => validIds.add(c.id));
    });
    // Strip any furniture IDs that don't exist in the shop catalog
    this.inventory.furniture = this.inventory.furniture.filter(id => validIds.has(id));
    
    // Ensure default items exist
    if (!this.inventory.toys) this.inventory.toys = [];
    if (!this.inventory.toys.includes('toy_tennis_ball')) {
      this.inventory.toys.push('toy_tennis_ball');
    }
    if (!this.inventory.food) this.inventory.food = [];
    if (!this.inventory.food.includes('kibble')) {
      this.inventory.food.push('kibble');
    }
    
    this.activeFood = state.activeFood || 'kibble';
    this.activeToy = state.activeToy || 'toy_tennis_ball';
    
    // Safety check: if active items aren't actually owned, revert to defaults
    if (!this.inventory.toys.includes(this.activeToy)) {
      this.activeToy = 'toy_tennis_ball';
    }
    if (!this.inventory.food.includes(this.activeFood)) {
      this.activeFood = 'kibble';
    }
    
    this.activeBackground = state.activeBackground || 'grass';
    
    // Apply background
    if (this.activeBackground && this.sanctuary.wrapper) {
      this.sanctuary.wrapper.style.backgroundImage = `url('assets/backgrounds/${this.activeBackground}.png')`;
    }

    if (Array.isArray(state.pugs) && state.pugs.length > 0) {
      state.pugs.forEach(pData => this.sanctuary.addPug(pData));
    } else {
      this.initDefaultPug();
    }
    
    // Restore Placed Items
    if (Array.isArray(state.placedToys)) {
      state.placedToys.forEach(t => this.sanctuary.addToy(t.x, t.y, t.id));
    }
    if (Array.isArray(state.placedFurniture)) {
      state.placedFurniture.forEach(f => this.sanctuary.addFurniture(f.x, f.y, f.id, f.scale, f.angle));
    }

    this.renderInventory();
    this.renderShop();
    this.updateStatusHeader();
  }

  // Initialize a default pug when no saved data exists
  initDefaultPug() {
    this.sanctuary.addPug({ name: 'Moku', pose: 'moku_3', basePose: 'moku_3' });
  }

  // Expose current game state for auth saving
  getGameState() {
    return {
      coins: this.coins,
      exp: this.exp,
      level: this.level,
      pugs: this.sanctuary.pugs.map(p => p.toJSON()),
      inventory: this.inventory,
      activeFood: this.activeFood,
      activeToy: this.activeToy,
      activeBackground: this.activeBackground,
      placedToys: this.sanctuary.toyItems.map(t => ({x: t.x, y: t.y, id: t.id})),
      placedFurniture: this.sanctuary.furnitureItems.map(f => ({x: f.x, y: f.y, id: f.id, scale: f.scale, angle: f.angle}))
    };
  }

  // Load a full game state (used after auth login)
  loadGameState(state) {
    if (!state) return;
    this.applyLoadedState(state);
  }
}

window.addEventListener('DOMContentLoaded', () => {
  window.app = new PugSanctuaryApp();
});
