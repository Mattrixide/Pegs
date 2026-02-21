export class Bucket {
  constructor(canvasWidth, canvasHeight) {
    this.topWidth    = 88;
    this.bottomWidth = 160;
    this.height      = 22;
    this.y     = canvasHeight - 28;
    this.x     = canvasWidth / 2;
    this.speed = 2.8;
    this.dir   = 1;
    this.minX  = 55;
    this.maxX  = canvasWidth - 55;
    this.visible = true;
  }

  update() {
    this.x += this.speed * this.dir;
    if (this.x >= this.maxX || this.x <= this.minX) this.dir *= -1;
  }

  get left()       { return this.x - this.topWidth / 2; }
  get right()      { return this.x + this.topWidth / 2; }
  get top()        { return this.y - this.height / 2; }
  get bottom()     { return this.y + this.height / 2; }
  get innerLeft()  { return this.x - this.bottomWidth / 2; }
  get innerRight() { return this.x + this.bottomWidth / 2; }

  // Returns { nx, ny, overlap } if ball overlaps a ramp edge, else null
  // prevX/prevY are the ball's position before physics.update() — used for swept tunneling test
  checkRamp(ball, prevX = ball.pos.x, prevY = ball.pos.y) {
    const pathMinY = Math.min(ball.pos.y, prevY);
    const pathMaxY = Math.max(ball.pos.y, prevY);
    if (pathMaxY + ball.radius < this.top || pathMinY - ball.radius > this.bottom) return null;

    const p1L = { x: this.left,       y: this.top };
    const p2L = { x: this.innerLeft,  y: this.bottom };
    const p1R = { x: this.right,      y: this.top };
    const p2R = { x: this.innerRight, y: this.bottom };

    // Static test at current position
    const hit = this._segCollision(ball, p1L, p2L) || this._segCollision(ball, p1R, p2R);
    if (hit) return hit;

    // Swept substeps: test 3 intermediate positions between prev and current
    for (let i = 1; i <= 3; i++) {
      const t = i / 4;
      const probe = {
        pos:    { x: prevX + t * (ball.pos.x - prevX), y: prevY + t * (ball.pos.y - prevY) },
        radius: ball.radius,
      };
      if (probe.pos.y + ball.radius < this.top || probe.pos.y - ball.radius > this.bottom) continue;
      const swept = this._segCollision(probe, p1L, p2L) || this._segCollision(probe, p1R, p2R);
      if (swept) return { nx: swept.nx, ny: swept.ny, overlap: ball.radius + 2 };
    }

    return null;
  }

  _segCollision(ball, p1, p2) {
    const sdx = p2.x - p1.x, sdy = p2.y - p1.y;
    const len2 = sdx * sdx + sdy * sdy;
    if (len2 === 0) return null;
    const t = Math.max(0, Math.min(1,
      ((ball.pos.x - p1.x) * sdx + (ball.pos.y - p1.y) * sdy) / len2
    ));
    const cx = p1.x + t * sdx, cy = p1.y + t * sdy;
    const dx = ball.pos.x - cx, dy = ball.pos.y - cy;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > 0 && dist < ball.radius) {
      return { nx: dx / dist, ny: dy / dist, overlap: ball.radius - dist };
    }
    return null;
  }

  // Returns true if ball center is inside bucket opening
  catches(ball) {
    return (
      ball.pos.x >= this.left &&
      ball.pos.x <= this.right &&
      ball.pos.y + ball.radius >= this.top &&
      ball.pos.y - ball.radius <= this.bottom + 6
    );
  }
}
