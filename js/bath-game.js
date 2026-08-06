// Frog Self-Care Inspired Bathing Mini-Game Engine

class BathMiniGame {
  constructor() {
    this.active = false;
    this.pug = null;

    this.wrapper = document.getElementById('bath-stage-wrapper');
    this.canvas = document.getElementById('bath-canvas');
    this.ctx = this.canvas ? this.canvas.getContext('2d') : null;

    this.tool = 'SHAMPOO'; // SHAMPOO or SHOWER
    this.soapProgress = 0; // 0 - 100
    this.rinseProgress = 0; // 0 - 100

    this.bubbles = []; // Overlay bubble positions { x, y, size, rotation }
    this.waterParticles = [];

    this.mouseX = 300;
    this.mouseY = 200;
    this.isDragging = false;

    // Load tool & bubble images
    this.shampooImg = new Image();
    this.shampooImg.src = 'assets/items/shampoo.png';

    this.showerImg = new Image();
    this.showerImg.src = 'assets/items/showerhead.png';

    this.bubbleImg = new Image();
    this.bubbleImg.src = 'assets/items/bubble.png';

    this.initEvents();
  }

  initCanvas() {
    if (!this.canvas) return;
    this.canvas.width = this.wrapper.clientWidth || 800;
    this.canvas.height = this.wrapper.clientHeight || 420;
  }

  initEvents() {
    if (!this.wrapper) return;

    this.wrapper.addEventListener('mousemove', (e) => {
      if (!this.active) return;
      const rect = this.wrapper.getBoundingClientRect();
      this.mouseX = e.clientX - rect.left;
      this.mouseY = e.clientY - rect.top;

      if (this.isDragging) {
        this.applyToolAction();
      }
    });

    this.wrapper.addEventListener('mousedown', () => {
      if (!this.active) return;
      this.isDragging = true;
      this.applyToolAction();
    });

    window.addEventListener('mouseup', () => {
      this.isDragging = false;
    });
  }

  startBath(pug) {
    this.pug = pug;
    this.active = true;
    this.tool = 'SHAMPOO';
    this.soapProgress = 0;
    this.rinseProgress = 0;
    this.bubbles = [];
    this.waterParticles = [];

    this.initCanvas();
    document.getElementById('bath-modal').classList.add('active');
    this.updateHUD();
    this.loop();
  }

  endBath() {
    this.active = false;
    document.getElementById('bath-modal').classList.remove('active');

    if (this.pug) {
      this.pug.hygiene = 100;
      this.pug.happiness = Math.min(100, this.pug.happiness + 30);
      this.pug.isSparkling = true; // Make pug extra bright & shiny after bath!
      this.pug.updateSpriteSrc();
    }

    if (window.app) {
      window.app.addCurrency(35);
      window.app.addExp(25);
      window.app.showNotification("BATH COMPLETE! PUG IS SPARKLING CLEAN!");
    }

    if (window.sfx) window.sfx.playLevelUp();
  }

  setTool(newTool) {
    this.tool = newTool;
    if (window.sfx) window.sfx.playClick();
  }

  applyToolAction() {
    const pugX = this.canvas.width / 2;
    const pugY = 280;

    const dx = this.mouseX - pugX;
    const dy = this.mouseY - pugY;

    if (Math.abs(dx) < 130 && Math.abs(dy) < 110) {
      if (this.tool === 'SHAMPOO' && this.soapProgress < 100) {
        this.soapProgress = Math.min(100, this.soapProgress + 1.5);

        // Spawn overlay transparent bubble on pug
        if (Math.random() < 0.7 && this.bubbles.length < 24) {
          this.bubbles.push({
            x: pugX + (Math.random() - 0.5) * 140,
            y: pugY + (Math.random() - 0.5) * 100,
            size: 35 + Math.random() * 45,
            rotation: Math.random() * Math.PI * 2
          });
        }
        if (window.sfx && Math.random() < 0.15) window.sfx.playCrunch();
      } else if (this.tool === 'SHOWER' && this.soapProgress >= 80 && this.rinseProgress < 100) {
        this.rinseProgress = Math.min(100, this.rinseProgress + 1.8);

        // Wash away bubbles
        if (this.bubbles.length > 0) {
          this.bubbles.splice(0, 2);
        }

        // Water spray particles
        for (let i = 0; i < 4; i++) {
          this.waterParticles.push({
            x: this.mouseX + (Math.random() - 0.5) * 24,
            y: this.mouseY,
            vy: 7 + Math.random() * 5,
            life: 18
          });
        }
        if (window.sfx && Math.random() < 0.15) window.sfx.playScoop();
      }

      this.updateHUD();

      if (this.soapProgress >= 100 && this.rinseProgress >= 100) {
        this.endBath();
      }
    }
  }

  updateHUD() {
    const soapEl = document.getElementById('bath-soap-bar');
    const rinseEl = document.getElementById('bath-rinse-bar');
    const instructionEl = document.getElementById('bath-instruction');

    if (soapEl) soapEl.style.width = `${Math.floor(this.soapProgress)}%`;
    if (rinseEl) rinseEl.style.width = `${Math.floor(this.rinseProgress)}%`;

    if (instructionEl) {
      if (this.soapProgress < 100) {
        instructionEl.innerText = "STEP 1: LATHER PUG WITH SHAMPOO BOTTLE!";
      } else if (this.rinseProgress < 100) {
        instructionEl.innerText = "STEP 2: RINSE SOAP WITH SHOWER HEAD!";
      } else {
        instructionEl.innerText = "BATH COMPLETE! PERFECTLY CLEAN!";
      }
    }
  }

  loop() {
    if (!this.active) return;

    this.update();
    this.render();

    requestAnimationFrame(() => this.loop());
  }

  update() {
    this.waterParticles.forEach((p, idx) => {
      p.y += p.vy;
      p.life--;
      if (p.life <= 0) {
        this.waterParticles.splice(idx, 1);
      }
    });
  }

  render() {
    if (!this.ctx) return;
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    const pugX = this.canvas.width / 2;
    const pugY = 280;

    // 1. Render Pug in Shower (Brighter filter during/after bath)
    if (this.pug && this.pug.imgElement) {
      this.ctx.save();
      this.ctx.translate(pugX, pugY);
      
      // Make pug progressively brighter during rinse!
      const brightFactor = 1 + (this.rinseProgress / 100) * 0.25;
      this.ctx.filter = `brightness(${brightFactor}) contrast(1.05)`;
      
      this.ctx.drawImage(this.pug.imgElement, -70, -70, 140, 140);
      this.ctx.restore();
    }

    // 2. Render Overlay Iridescent Soap Bubble PNGs over Pug
    if (this.bubbleImg.complete) {
      this.bubbles.forEach(b => {
        this.ctx.save();
        this.ctx.translate(b.x, b.y);
        this.ctx.rotate(b.rotation);
        this.ctx.drawImage(this.bubbleImg, -b.size / 2, -b.size / 2, b.size, b.size);
        this.ctx.restore();
      });
    }

    // 3. Render Water Spray Stream Particles
    this.ctx.fillStyle = '#00f0ff';
    this.waterParticles.forEach(w => {
      this.ctx.fillRect(w.x, w.y, 4, 10);
    });

    // 4. Render Transparent Active Tool (Shampoo bottle or Shower head)
    const activeImg = this.tool === 'SHAMPOO' ? this.shampooImg : this.showerImg;
    if (activeImg.complete) {
      this.ctx.drawImage(activeImg, this.mouseX - 35, this.mouseY - 35, 70, 70);
    }
  }
}

window.BathMiniGame = BathMiniGame;
