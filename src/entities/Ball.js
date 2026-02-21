export class Ball {
  constructor(x, y, vx, vy) {
    this.pos     = { x, y };
    this.prevPos = { x, y };
    this.vel = { x: vx, y: vy };
    this.radius = 8;
    this.trail = [];
    this.active = true;
    this.frameCount = 0;
  }

  update() {
    this.trail.push({ x: this.pos.x, y: this.pos.y });
    if (this.trail.length > 14) this.trail.shift();
    this.frameCount++;
  }

  get speed() {
    return Math.sqrt(this.vel.x ** 2 + this.vel.y ** 2);
  }
}
