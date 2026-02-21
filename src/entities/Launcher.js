export class Launcher {
  constructor(canvasWidth) {
    this.pos = { x: canvasWidth / 2, y: 28 };
    this.angle = Math.PI / 2;          // straight down
    this.minAngle = Math.PI * 0.03;    // nearly horizontal right
    this.maxAngle = Math.PI * 0.97;    // nearly horizontal left
    this.barrelLength = 38;
    this.FIRE_SPEED = 16;
  }

  setAngleFromMouse(mx, my) {
    const dx = mx - this.pos.x;
    const dy = my - this.pos.y;
    let a = Math.atan2(dy, dx);
    // Wrap negative angles (pointing upward) to keep in [0, 2PI] range
    if (a < 0) a += Math.PI * 2;
    // If mouse is above launcher, snap to nearest downward extreme
    if (a > Math.PI) {
      a = a >= Math.PI * 1.5 ? this.minAngle : this.maxAngle;
    }
    this.angle = Math.max(this.minAngle, Math.min(this.maxAngle, a));
  }

  getBarrelTip() {
    return {
      x: this.pos.x + Math.cos(this.angle) * this.barrelLength,
      y: this.pos.y + Math.sin(this.angle) * this.barrelLength,
    };
  }

  fire() {
    const tip = this.getBarrelTip();
    return {
      x: tip.x,
      y: tip.y,
      vx: Math.cos(this.angle) * this.FIRE_SPEED,
      vy: Math.sin(this.angle) * this.FIRE_SPEED,
    };
  }
}
