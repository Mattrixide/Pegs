export class ParticleSystem {
  constructor() {
    this.particles = [];
  }

  spawnPegHit(x, y, color) {
    for (let i = 0; i < 8; i++) {
      const angle = (Math.PI * 2 / 8) * i + (Math.random() - 0.5) * 0.6;
      const speed = 1.5 + Math.random() * 3;
      this._add({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: 2.5 + Math.random() * 2,
        color,
        maxLife: 35 + Math.random() * 20,
        gravity: 0.08,
      });
    }
  }

  spawnFirework(x, y) {
    const palette = ['#ff4444', '#ff8800', '#ffff44', '#44ff88', '#44aaff', '#ff44ff', '#ffffff'];
    const color = palette[Math.floor(Math.random() * palette.length)];
    for (let i = 0; i < 28; i++) {
      const angle = (Math.PI * 2 / 28) * i;
      const speed = 2.5 + Math.random() * 7;
      this._add({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1,
        radius: 3 + Math.random() * 4,
        color,
        maxLife: 70 + Math.random() * 50,
        gravity: 0.12,
        drag: 0.97,
      });
    }
  }

  spawnBucketCatch(x, y) {
    for (let i = 0; i < 14; i++) {
      const angle = -Math.PI + Math.random() * Math.PI;
      const speed = 2 + Math.random() * 5;
      this._add({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 3,
        radius: 4,
        color: '#ffffaa',
        maxLife: 45,
        gravity: 0.15,
      });
    }
  }

  spawnFountain(x, y) {
    const colors = ['#ffcc44', '#ffaa22', '#ffee88', '#ff8800', '#fff0aa'];
    for (let i = 0; i < 4; i++) {
      const angle = -Math.PI / 2 + (Math.random() - 0.5) * 1.2; // upward ±35°
      const speed = 5 + Math.random() * 9;
      this._add({
        x: x + (Math.random() - 0.5) * 18,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: 2 + Math.random() * 3,
        color: colors[Math.floor(Math.random() * colors.length)],
        maxLife: 45 + Math.random() * 45,
        gravity: 0.22,
        drag: 0.97,
      });
    }
  }

  spawnOrangeClear(x, y) {
    // Extra burst for clearing last orange peg
    for (let i = 0; i < 20; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 3 + Math.random() * 8;
      this._add({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: 4 + Math.random() * 5,
        color: '#ffcc44',
        maxLife: 80 + Math.random() * 40,
        gravity: 0.1,
        drag: 0.97,
      });
    }
  }

  _add(cfg) {
    this.particles.push({
      x: cfg.x, y: cfg.y,
      vx: cfg.vx, vy: cfg.vy,
      radius: cfg.radius,
      color: cfg.color,
      life: cfg.maxLife,
      maxLife: cfg.maxLife,
      gravity: cfg.gravity || 0,
      drag: cfg.drag || 0.99,
    });
  }

  update() {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.vy += p.gravity;
      p.vx *= p.drag;
      p.vy *= p.drag;
      p.x += p.vx;
      p.y += p.vy;
      p.life--;
      if (p.life <= 0) this.particles.splice(i, 1);
    }
  }

  clear() {
    this.particles = [];
  }
}
