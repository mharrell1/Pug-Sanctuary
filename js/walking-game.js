// Pixel Park Walking Game — Continuous platformer movement

class WalkingMiniGame {
  constructor() {
    this.active = false;
    this.pug    = null;

    this.wrapper = document.getElementById('walk-stage-wrapper');
    this.canvas  = document.getElementById('walk-canvas');
    this.ctx     = this.canvas ? this.canvas.getContext('2d') : null;

    this.distanceCovered = 0;
    this.targetDistance  = 400;
    this.coinsEarned     = 0;
    this.bonesCollected  = 0;

    // Pug position — continuous free movement
    this.pugX       = 160;
    this.pugY       = 0;
    this.pugVY      = 0;   // vertical velocity
    this.pugBob     = 0;
    this.walkCycle  = 0;
    this.pugMinY    = 0;   // set on start
    this.pugMaxY    = 0;   // set on start
    this.MOVE_SPEED = 3.5; // pixels per frame vertical

    // Incoming items
    this.items      = [];
    this.itemTimer  = 80;
    this.ITEM_SPEED = 3.5;

    // Scroll
    this.bgScrollX = 0;
    this.BG_SPEED  = 2.8;

    // Images
    this.pugImg  = null;
    this.boneImg = null;
    this.bgImg   = null;

    this._upHeld   = false;
    this._downHeld = false;

    this.initCanvas();
    this.initEvents();
    this.loadAssets();
  }

  initCanvas() {
    if (!this.canvas || !this.wrapper) return;
    this.canvas.width  = this.wrapper.clientWidth  || 880;
    this.canvas.height = this.wrapper.clientHeight || 400;
  }

  loadAssets() {
    this.bgImg = new Image();
    this.bgImg.src = 'assets/backgrounds/walk_path.jpg';

    this.boneImg = new Image();
    this.boneImg.src = 'assets/items/walk_bone.png';
  }

  initEvents() {
    this._onKeyDown = (e) => {
      if (!this.active) return;
      if (e.key === 'ArrowUp')   { e.preventDefault(); this._upHeld   = true; }
      if (e.key === 'ArrowDown') { e.preventDefault(); this._downHeld = true; }
    };
    this._onKeyUp = (e) => {
      if (e.key === 'ArrowUp')   this._upHeld   = false;
      if (e.key === 'ArrowDown') this._downHeld = false;
    };
    document.addEventListener('keydown', this._onKeyDown);
    document.addEventListener('keyup',   this._onKeyUp);
  }

  startWalk(pug) {
    this.pug = pug;
    this.active = true;
    this.distanceCovered = 0;
    this.coinsEarned     = 0;
    this.bonesCollected  = 0;
    this.bgScrollX       = 0;
    this.itemTimer       = 80;
    this.items           = [];
    this._upHeld      = false;
    this._downHeld    = false;

    this.initCanvas();
    const ch = this.canvas.height;

    // Vertical play area: from just below the trees to the very bottom of the canvas
    this.pugMinY = ch * 0.60;
    this.pugMaxY = ch * 0.92;

    this.pugX      = 160;
    this.pugY      = ch * 0.76;  // start mid-height
    this.pugVY     = 0;
    this.walkCycle = 0;
    this.pugBob    = 0;

    this.pugImg = new Image();
    this.pugImg.src = `assets/pugs/${pug.pose}.png?v=` + Date.now();

    document.getElementById('walk-modal').classList.add('active');
    if (window.app) window.app.showNotification('UP / DOWN ARROWS TO COLLECT BONES!');
    this.loop();
  }

  endWalk() {
    this.active = false;
    document.removeEventListener('keydown', this._onKeyDown);
    document.removeEventListener('keyup',   this._onKeyUp);
    document.getElementById('walk-modal').classList.remove('active');

    if (this.pug) {
      this.pug.hunger    = Math.min(100, this.pug.hunger    + this.bonesCollected * 8);
      this.pug.happiness = Math.min(100, this.pug.happiness + 30);
      this.pug.energy    = Math.max(10,  this.pug.energy    - 15);
      this.pug.updateSpriteSrc();
    }

    if (window.app) {
      const expReward = 25 + this.bonesCollected * 10;
      window.app.addCurrency(this.coinsEarned + 20);
      window.app.addExp(expReward);
      window.app.showNotification(`WALK DONE! ${this.bonesCollected} BONES, +${this.coinsEarned + 20} P$!`);
    }
    if (window.sfx) window.sfx.playLevelUp();
  }

  loop() {
    if (!this.active) return;
    this.update();
    this.render();
    requestAnimationFrame(() => this.loop());
  }

  spawnItem() {
    const cw = this.canvas.width;
    // Spawn at a random Y across the full vertical play range
    const spawnY = this.pugMinY + Math.random() * (this.pugMaxY - this.pugMinY);
    this.items.push({
      x:    cw + 50,
      y:    spawnY,
      type: Math.random() < 0.8 ? 'BONE' : 'DOG',
      name: ['Barnaby','Biscuit','Cheddar'][Math.floor(Math.random() * 3)],
      done: false,
    });
  }

  update() {
    // Scroll background continuously
    this.bgScrollX       += this.BG_SPEED;
    this.distanceCovered += this.BG_SPEED * 0.2;

    // Spawn bones / dogs
    if (--this.itemTimer <= 0) {
      this.spawnItem();
      this.itemTimer = 70 + Math.floor(Math.random() * 70);
    }

    // Move items left
    this.items.forEach(item => { item.x -= this.ITEM_SPEED; });
    this.items = this.items.filter(item => item.x > -60);

    // Continuous vertical movement — hold up/down to move
    if (this._upHeld)   this.pugY -= this.MOVE_SPEED;
    if (this._downHeld) this.pugY += this.MOVE_SPEED;
    this.pugY = Math.max(this.pugMinY, Math.min(this.pugY, this.pugMaxY));

    // Walk bob
    this.walkCycle += 0.18;
    this.pugBob = Math.abs(Math.sin(this.walkCycle)) * 5;

    // Collision
    this.items.forEach(item => {
      if (item.done) return;
      if (Math.abs(item.x - this.pugX) < 42 && Math.abs(item.y - this.pugY) < 28) {
        item.done = true;
        if (item.type === 'BONE') {
          this.bonesCollected++;
          this.coinsEarned += 20;
          if (window.sfx) window.sfx.playCoin();
          if (window.app) window.app.showNotification('+BONE! +20 P$');
        } else {
          if (window.sfx) window.sfx.playBark();
          if (window.app) window.app.showNotification(`MET ${item.name.toUpperCase()}!`);
          this.coinsEarned += 5;
        }
      }
    });

    const distEl = document.getElementById('walk-dist-val');
    const coinEl = document.getElementById('walk-coin-val');
    if (distEl) distEl.innerText = `${Math.floor(this.distanceCovered)} / ${this.targetDistance} m`;
    if (coinEl) coinEl.innerText = `${this.bonesCollected} bones`;

    if (this.distanceCovered >= this.targetDistance) this.endWalk();
  }

  render() {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const cw  = this.canvas.width;
    const ch  = this.canvas.height;

    ctx.clearRect(0, 0, cw, ch);

    // ── 1. Seamlessly tiling park background ──
    if (this.bgImg && this.bgImg.complete && this.bgImg.naturalWidth > 0) {
      const nw = this.bgImg.naturalWidth;
      const nh = this.bgImg.naturalHeight;
      const scale   = ch / nh;
      const scaledW = nw * scale;
      const offset  = this.bgScrollX % scaledW;

      // Tile enough copies to fill the canvas width
      for (let i = -1; i <= Math.ceil(cw / scaledW) + 1; i++) {
        ctx.drawImage(this.bgImg, i * scaledW - offset, 0, scaledW, ch);
      }
    } else {
      ctx.fillStyle = '#5ec8e5'; ctx.fillRect(0, 0, cw, ch * 0.55);
      ctx.fillStyle = '#5aad3a'; ctx.fillRect(0, ch * 0.55, cw, ch);
    }

    const pugDrawY = this.pugY - this.pugBob;

    // ── 2. Items ──
    this.items.forEach(item => {
      if (item.done) return;
      const sx = item.x, sy = item.y;

      if (item.type === 'BONE') {
        if (this.boneImg && this.boneImg.complete && this.boneImg.naturalWidth > 0) {
          const bH = 28;
          const bW = Math.round(bH * this.boneImg.naturalWidth / this.boneImg.naturalHeight);
          ctx.drawImage(this.boneImg, sx - bW / 2, sy - bH / 2, bW, bH);
        } else {
          ctx.fillStyle = '#f0ece0';
          ctx.fillRect(sx - 14, sy - 5, 28, 10);
          ctx.beginPath(); ctx.arc(sx - 14, sy, 7, 0, Math.PI * 2); ctx.fill();
          ctx.beginPath(); ctx.arc(sx + 14, sy, 7, 0, Math.PI * 2); ctx.fill();
        }
      } else {
        // Dog — simple golden silhouette
        ctx.fillStyle = '#e8a04a';
        ctx.fillRect(sx - 18, sy - 24, 36, 24);
        ctx.beginPath(); ctx.ellipse(sx + 18, sy - 16, 9, 7, 0, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#553300'; ctx.lineWidth = 1.5;
        ctx.strokeRect(sx - 18, sy - 24, 36, 24);
        ctx.fillStyle = '#fff'; ctx.font = 'bold 7px monospace'; ctx.textAlign = 'center';
        ctx.fillText(item.name, sx, sy - 28);
      }
    });

    // ── 3. Leash ──
    const leashEndX = this.pugX + 12;
    const leashEndY = pugDrawY - 26;
    const handX = this.pugX + 52;
    const handY = pugDrawY - 72;

    ctx.beginPath();
    ctx.moveTo(handX, handY);
    ctx.quadraticCurveTo(this.pugX + 38, pugDrawY - 46, leashEndX, leashEndY);
    ctx.strokeStyle = '#cc2200'; ctx.lineWidth = 2; ctx.stroke();

    ctx.fillStyle = '#881100';
    ctx.beginPath(); ctx.ellipse(handX, handY, 6, 4, 0, 0, Math.PI * 2); ctx.fill();

    // ── 4. Pug sprite ──
    const pugW = 64, pugH = 64;
    if (this.pugImg && this.pugImg.complete && this.pugImg.naturalWidth > 0) {
      ctx.save();
      ctx.translate(this.pugX, pugDrawY);
      ctx.drawImage(this.pugImg, -pugW / 2, -pugH, pugW, pugH);
      ctx.restore();
    } else {
      ctx.fillStyle = '#222';
      ctx.fillRect(this.pugX - 22, pugDrawY - 44, 44, 44);
    }

    // (Lane dots removed)

    // ── 6. Progress bar ──
    const progress = Math.min(this.distanceCovered / this.targetDistance, 1);
    ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.fillRect(10, ch - 14, cw - 20, 8);
    ctx.fillStyle = '#44ee88';          ctx.fillRect(10, ch - 14, (cw - 20) * progress, 8);
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 1;
    ctx.strokeRect(10, ch - 14, cw - 20, 8);

    // ── 7. Controls hint ──
    ctx.fillStyle = 'rgba(0,10,40,0.65)'; ctx.fillRect(cw / 2 - 140, 5, 280, 18);
    ctx.fillStyle = '#fff'; ctx.font = 'bold 9px monospace'; ctx.textAlign = 'center';
    ctx.fillText('UP / DOWN ARROWS TO SWITCH LANES', cw / 2, 17);
  }
}

window.WalkingMiniGame = WalkingMiniGame;
