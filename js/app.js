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

    // Level-unlocked shop catalog
    this.shopItems = [
      { id: 'kibble', name: 'BASIC KIBBLE', price: 10, minLevel: 1, desc: 'Restores +30 Hunger', type: 'FOOD' },
      { id: 'salmon_treat', name: 'SALMON TREAT', price: 20, minLevel: 1, desc: 'Restores +45 Hunger & +15 Mood', type: 'FOOD' },
      { id: 'heart_rug', name: 'Y2K HEART RUG', price: 50, minLevel: 1, desc: 'Cute heart rug for grass field', type: 'FURNITURE', class: 'heart-rug' },
      { id: 'soft_brush', name: 'GROOMING BRUSH', price: 35, minLevel: 2, desc: 'Restores +50 Hygiene', type: 'GROOM' },
      { id: 'rubber_duck', name: 'RUBBER DUCK TOY', price: 45, minLevel: 2, desc: 'Interactive toy for grass field', type: 'TOY' },
      { id: 'flower_box', name: 'FLOWER GARDEN BOX', price: 80, minLevel: 2, desc: 'Pretty flowers for sanctuary', type: 'FURNITURE', class: 'ortho-bed' },
      { id: 'berry_smoothie', name: 'BERRY SMOOTHIE', price: 60, minLevel: 3, desc: 'Restores +60 Hunger & +30 Mood', type: 'FOOD' },
      { id: 'ortho_bed', name: 'ORTHOPEDIC BED', price: 95, minLevel: 3, desc: 'Restful bed for grass field', type: 'FURNITURE', class: 'ortho-bed' },
      { id: 'water_fountain', name: 'SOLAR FOUNTAIN', price: 120, minLevel: 4, desc: 'Boosts overall sanctuary mood', type: 'FURNITURE', class: 'water-fountain' },
      { id: 'dog_house', name: 'COZY DOG HOUSE', price: 140, minLevel: 5, desc: 'Cozy house for your pugs', type: 'FURNITURE', class: 'dog-house' }
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

    // Tab switcher
    document.querySelectorAll('.y2k-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.y2k-tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

        tab.classList.add('active');
        const targetId = tab.getAttribute('data-tab');
        document.getElementById(targetId).classList.add('active');

        if (targetId === 'tab-shop') {
          this.renderShop();
        }

        if (window.sfx) window.sfx.playClick();
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

  renderShop() {
    const container = document.getElementById('shop-items-container');
    if (!container) return;
    container.innerHTML = '';

    this.shopItems.forEach(item => {
      const card = document.createElement('div');
      const isLocked = this.level < item.minLevel;
      card.className = `shop-item-card ${isLocked ? 'locked' : ''}`;

      card.innerHTML = `
        <div>
          <div class="shop-item-title">${item.name}</div>
          <div class="shop-item-desc">${item.desc}</div>
        </div>
        <div>
          <div class="shop-item-price">${item.price} P$</div>
          <button class="tool-btn" style="width: 100%; font-size: 9px;" ${isLocked ? 'disabled' : ''}>
            ${isLocked ? `UNLOCKS AT LVL ${item.minLevel}` : 'BUY ITEM'}
          </button>
        </div>
      `;

      if (!isLocked) {
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

    this.coins -= item.price;
    this.updateStatusHeader();
    if (window.sfx) window.sfx.playCoin();

    if (item.type === 'FOOD') {
      if (this.sanctuary.pugs.length > 0) {
        this.sanctuary.pugs.forEach(p => p.feed(40));
        this.showNotification(`PURCHASED ${item.name}! ALL PUGS FED!`);
      }
    } else if (item.type === 'GROOM') {
      if (this.sanctuary.pugs.length > 0) {
        this.sanctuary.pugs.forEach(p => p.groom());
        this.showNotification(`PURCHASED ${item.name}! PUGS GROOMED!`);
      }
    } else if (item.type === 'TOY') {
      this.sanctuary.addToy(200 + Math.random() * 400, 200 + Math.random() * 150);
      this.showNotification(`PLACED ${item.name} ON GRASS FIELD!`);
    } else if (item.type === 'FURNITURE') {
      const rx = 180 + Math.random() * 450;
      const ry = 180 + Math.random() * 180;
      this.sanctuary.addFurniture(rx, ry, item.name, item.class || 'ortho-bed');
      this.showNotification(`PLACED ${item.name} ON GRASS FIELD!`);
    }

    this.saveState();
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
    const data = {
      coins: this.coins,
      exp: this.exp,
      level: this.level,
      pugs: this.sanctuary.pugs.map(p => p.toJSON())
    };
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
          this.initDefaultPug();
        }
      }).catch(err => {
        console.error('Auth load error:', err);
        if (!tryLocal()) this.initDefaultPug();
      });
    } else {
      if (!tryLocal()) this.initDefaultPug();
    }
    this.renderShop();
    this.updateStatusHeader();
  }

  // Helper to apply a loaded state object
  applyLoadedState(state) {
    this.coins = state.coins || 100;
    this.exp = state.exp || 0;
    this.level = state.level || 1;
    if (Array.isArray(state.pugs) && state.pugs.length > 0) {
      state.pugs.forEach(pData => this.sanctuary.addPug(pData));
    } else {
      this.initDefaultPug();
    }
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
      pugs: this.sanctuary.pugs.map(p => p.toJSON())
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
