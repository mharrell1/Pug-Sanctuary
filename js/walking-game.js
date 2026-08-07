// Pixel Park Walking Game — Continuous platformer movement

class WalkingMiniGame {
  constructor() {
    this.active = false;
    this.pug    = null;

    this.wrapper = document.getElementById('walk-stage-wrapper');
    this.canvas  = document.getElementById('walk-canvas');
    this.ctx     = this.canvas ? this.canvas.getContext('2d') : null;

    this.distanceCovered = 0;
    this.targetDistance  = 1200;
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
    this.pugImg     = null;
    this.boneImg    = null;
    this.bgImg      = null;
    this.hydrantImg = null;

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

    this.hydrantImg = new Image();
    this.hydrantImg.src = 'assets/items/fire_hydrant.png';

    this.heartFilledImg = new Image();
    this.heartFilledImg.src = 'assets/items/heart_filled.png?v=2';

    this.heartEmptyImg = new Image();
    this.heartEmptyImg.src = 'assets/items/heart_empty.png';
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
    this.lives           = 3;
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
    const isHydrant = Math.random() > 0.8;
    const type = isHydrant ? 'HYDRANT' : 'BONE';
    
    // Fire hydrants only spawn on the ground (pugMaxY). Bones spawn randomly in the air or ground.
    const spawnY = isHydrant ? this.pugMaxY : (this.pugMinY + Math.random() * (this.pugMaxY - this.pugMinY));
    
    this.items.push({
      x:    cw + 50,
      y:    spawnY,
      type: type,
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
      
      // Generous hitbox — counts if pug is standing over or overlapping the item
      const hitX = item.type === 'BONE' ? 90 : 48;
      const hitY = item.type === 'BONE' ? 70 : 36;

      if (Math.abs(item.x - this.pugX) < hitX && Math.abs(item.y - this.pugY) < hitY) {
        item.done = true;
        if (item.type === 'BONE') {
          this.bonesCollected++;
          this.coinsEarned += 20;
          if (window.sfx) window.sfx.playCoin();
          if (window.app) window.app.showNotification('+BONE! +20 P$');
        } else {
          if (window.sfx) window.sfx.playScoop(); // Play a thud or scoop sound
          if (window.app) window.app.showNotification(`HIT A HYDRANT! -1 HEART!`);
          if (this.pug) this.pug.energy = Math.max(0, this.pug.energy - 10);
          this.lives--;
          if (this.lives <= 0) {
            this.endWalk();
          }
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
      const offset  = this.bgScrollX % (scaledW * 2); // Modulo by 2 widths to keep the alternating pattern consistent

      // Tile enough copies to fill the canvas width
      for (let i = -1; i <= Math.ceil(cw / scaledW) + 1; i++) {
        const xPos = i * scaledW - offset;
        ctx.save();
        if (Math.abs(i) % 2 === 1) {
          ctx.translate(xPos + scaledW, 0);
          ctx.scale(-1, 1);
          ctx.drawImage(this.bgImg, 0, 0, scaledW, ch);
        } else {
          ctx.drawImage(this.bgImg, xPos, 0, scaledW, ch);
        }
        ctx.restore();
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
        // Fire Hydrant
        if (this.hydrantImg && this.hydrantImg.complete && this.hydrantImg.naturalWidth > 0) {
          const hH = 56; // 25% larger than 45
          const hW = Math.round(hH * this.hydrantImg.naturalWidth / this.hydrantImg.naturalHeight);
          
          // Shadow on the ground
          ctx.fillStyle = 'rgba(0,0,0,0.3)';
          ctx.beginPath();
          ctx.ellipse(sx, sy, 14, 4, 0, 0, Math.PI * 2);
          ctx.fill();

          // Draw hydrant anchored at the bottom (sy)
          ctx.drawImage(this.hydrantImg, sx - hW / 2, sy - hH, hW, hH);
        } else {
          // Fallback simple red block
          ctx.fillStyle = '#cc0000';
          ctx.fillRect(sx - 10, sy - 28, 20, 28);
        }
      }
    });

    // ── 3. Leash ──
    const leashEndX = this.pugX + 20;
    const leashEndY = pugDrawY - 45;
    const handX = this.pugX + 80;
    const handY = pugDrawY - 90;

    ctx.beginPath();
    ctx.moveTo(handX, handY);
    ctx.quadraticCurveTo(this.pugX + 50, pugDrawY - 60, leashEndX, leashEndY);
    ctx.strokeStyle = '#cc2200'; ctx.lineWidth = 2; ctx.stroke();

    ctx.fillStyle = '#881100';
    ctx.beginPath(); ctx.ellipse(handX, handY, 6, 4, 0, 0, Math.PI * 2); ctx.fill();

    // ── 5. Hearts (Lives) & Bones ──
    const heartW = 24;
    const heartH = 24;
    
    // We want hearts + bones text centered together. 
    // Hearts total width is ~92px. Text width is ~80px. Total ~180px.
    const blockWidth = (3 * heartW + 20) + 90;
    const startX = (cw / 2) - (blockWidth / 2);
    
    for (let i = 0; i < 3; i++) {
      const img = i < this.lives ? this.heartFilledImg : this.heartEmptyImg;
      if (img && img.complete && img.naturalWidth > 0) {
        ctx.drawImage(img, startX + i * (heartW + 10), 55, heartW, heartH);
      }
    }
    
    // Draw bones count next to hearts
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 16px monospace';
    ctx.textAlign = 'left';
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#000';
    
    const boneTextX = startX + 3 * (heartW + 10) + 10;
    const boneTextY = 72; // Align vertically with hearts
    ctx.strokeText(`BONES: ${this.bonesCollected}`, boneTextX, boneTextY);
    ctx.fillText(`BONES: ${this.bonesCollected}`, boneTextX, boneTextY);

    // ── 6. Pug sprite ──
    const pugW = 110, pugH = 110;
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
  }
}

window.WalkingMiniGame = WalkingMiniGame;
