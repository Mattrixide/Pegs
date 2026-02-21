import { REMOVE_FRAMES } from '../entities/Peg.js';

// Peggle-style peg colours — bright, saturated, glass-ball look
const PEG_COLORS = {
  blue:   { dark: '#0e2766', mid: '#2255cc', bright: '#4499ff', lit: '#bbddff', glow: '#55aaff', spec: '#e0f0ff' },
  orange: { dark: '#551500', mid: '#bb3300', bright: '#ee6600', lit: '#ffcc33', glow: '#ff8800', spec: '#fff0cc' },
  green:  { dark: '#0d3311', mid: '#1e7722', bright: '#33cc44', lit: '#aaffaa', glow: '#44ee55', spec: '#ccffcc' },
  purple: { dark: '#2d0a44', mid: '#7711aa', bright: '#bb33dd', lit: '#ee99ff', glow: '#dd44ff', spec: '#f0ddff' },
};

const FEVER_HOLE_VALUES = [10000, 50000, 100000, 50000, 10000];

export class RenderSystem {
  constructor(game) {
    this.game = game;
    this.ctx = game.ctx;
    this.stars = this._genStars(160);
    this._rainbowProgress = 0;
  }

  // ─────────────────────────────────────────────────────────────────────────
  //  Main render dispatch
  // ─────────────────────────────────────────────────────────────────────────

  render(alpha = 1) {
    this._alpha = alpha;
    const { ctx, game } = this;
    const { width, height } = game.canvas;
    ctx.clearRect(0, 0, width, height);

    // Always tick stars so menu twinkle works too
    this._tickStars();

    if (game.state === 'MENU') {
      game.screens.drawMenu(this.stars);
      return;
    }

    if (game.state === 'ENTER_INITIALS') {
      game.screens.drawInitialEntry(this.stars);
      return;
    }

    this._drawBackground();
    this._drawPegs();
    this._drawBall();
    this._drawLightning();

    if (game.state === 'FINAL_CATCH') {
      this._drawFinalBuckets();
    } else if (game.state === 'FEVER') {
      this._drawRainbow();
      if (game.finalBucketsActive) this._drawFinalBuckets();
    } else if (game.state === 'LEVEL_CLEAR') {
      this._drawRainbow();
    } else {
      this._drawBucket();
    }

    this._drawParticles();
    this._drawFloatingTexts();

    if (game.state === 'AIMING') this._drawTrajectory();
    this._drawLauncher();

    game.hud.draw();

    if (game.state === 'GAME_OVER')   game.screens.drawGameOver();
    if (game.state === 'VICTORY')     game.screens.drawVictory();
    if (game.state === 'LEVEL_CLEAR') {
      const next = game.levelSystem.hasNextLevel
        ? game.levelSystem.currentLevel.name
        : null;
      game.screens.drawLevelClear(next);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  //  Background dispatcher — picks per-level scene
  // ─────────────────────────────────────────────────────────────────────────

  _drawBackground() {
    const levelId = this.game.bgOverride ?? this.game.levelSystem.currentLevel?.id ?? 1;
    switch (levelId) {
      case 2:  this._drawBgTropical(); break;
      case 3:  this._drawBgVolcano(); break;
      case 4:  this._drawBgVolcano();  break;
      case 5:  this._drawBgOcean();    break;
      case 6:  this._drawBgGarden();   break;
      case 7:  this._drawBgGalaxy();   break;
      case 8:  this._drawBgWinter();   break;
      case 9:  this._drawBgTropical(); break;
      default: this._drawBgMeadow();   break;
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  //  Background 1 — "Meadow" · twilight mountains & lake
  // ─────────────────────────────────────────────────────────────────────────

  _drawBgMeadow() {
    const { ctx, game } = this;
    const { width, height } = game.canvas;

    // Sky — twilight blue-purple
    const sky = ctx.createLinearGradient(0, 0, 0, height * 0.65);
    sky.addColorStop(0,    '#131444');
    sky.addColorStop(0.3,  '#1c3a88');
    sky.addColorStop(0.7,  '#2255aa');
    sky.addColorStop(1,    '#1a3f77');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, width, height);

    // Horizon purple-pink glow
    const hGlow = ctx.createRadialGradient(width / 2, height * 0.52, 0, width / 2, height * 0.52, width * 0.65);
    hGlow.addColorStop(0, 'rgba(120, 60, 200, 0.22)');
    hGlow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = hGlow;
    ctx.fillRect(0, 0, width, height);

    // Far mountain range — back layer
    ctx.fillStyle = '#1a2d55';
    ctx.beginPath();
    ctx.moveTo(0, height * 0.72);
    ctx.lineTo(width * 0.08, height * 0.45);
    ctx.lineTo(width * 0.22, height * 0.56);
    ctx.lineTo(width * 0.36, height * 0.30);
    ctx.lineTo(width * 0.50, height * 0.46);
    ctx.lineTo(width * 0.63, height * 0.22);
    ctx.lineTo(width * 0.78, height * 0.40);
    ctx.lineTo(width * 0.90, height * 0.50);
    ctx.lineTo(width,        height * 0.38);
    ctx.lineTo(width,        height);
    ctx.lineTo(0,            height);
    ctx.closePath();
    ctx.fill();

    // Snow caps — semi-transparent white over mountain peaks
    ctx.fillStyle = 'rgba(215, 230, 255, 0.72)';
    ctx.beginPath();
    ctx.moveTo(width * 0.36, height * 0.30);
    ctx.lineTo(width * 0.29, height * 0.42);
    ctx.lineTo(width * 0.43, height * 0.41);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(width * 0.63, height * 0.22);
    ctx.lineTo(width * 0.56, height * 0.35);
    ctx.lineTo(width * 0.70, height * 0.34);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = 'rgba(215, 230, 255, 0.45)';
    ctx.beginPath();
    ctx.moveTo(width,        height * 0.38);
    ctx.lineTo(width * 0.93, height * 0.47);
    ctx.lineTo(width,        height * 0.47);
    ctx.closePath();
    ctx.fill();

    // Castle silhouette
    this._drawCastle(width * 0.19, height * 0.50);

    // Lake / water
    const water = ctx.createLinearGradient(0, height * 0.58, 0, height);
    water.addColorStop(0,   'rgba(25, 60, 140, 0.72)');
    water.addColorStop(0.5, 'rgba(14, 35, 90, 0.85)');
    water.addColorStop(1,   'rgba(6, 16, 52, 0.92)');
    ctx.fillStyle = water;
    ctx.fillRect(0, height * 0.58, width, height * 0.42);

    // Water shimmer lines
    ctx.save();
    for (let i = 0; i < 10; i++) {
      const y   = height * 0.62 + i * 9;
      const amp = Math.sin(i * 1.4) * 28;
      ctx.strokeStyle = `rgba(90,150,255,${0.07 + 0.04 * (i % 2)})`;
      ctx.lineWidth   = 0.8;
      ctx.beginPath();
      ctx.moveTo(width * 0.04 + amp, y);
      ctx.lineTo(width * 0.96 - amp, y);
      ctx.stroke();
    }
    ctx.restore();
  }

  _drawCastle(cx, baseY) {
    const { ctx } = this;
    const s = 0.38;
    ctx.save();
    ctx.fillStyle   = 'rgba(8, 12, 30, 0.55)';
    ctx.strokeStyle = 'rgba(20, 40, 90, 0.30)';
    ctx.lineWidth   = 0.5;
    const r = (x, y, w, h) => { ctx.fillRect(cx + x * s, baseY + y * s, w * s, h * s); };
    r(-14, -60,  28, 60);
    r(-14, -72,   8, 14);
    r(-4,  -72,   8, 14);
    r(6,   -72,   8, 14);
    r(-32, -44,  18, 44);
    r(-34, -54,   6, 12);
    r(-26, -54,   6, 12);
    r(14,  -38,  18, 38);
    r(14,  -47,   6, 10);
    r(22,  -47,   6, 10);
    ctx.restore();
  }

  // ─────────────────────────────────────────────────────────────────────────
  //  Background 2 — "Arches" · Egyptian pyramids at sunset
  //  Inspired by Peggle's Kat Tut stages & the Giza plateau
  // ─────────────────────────────────────────────────────────────────────────

  _drawBgArches() {
    const { ctx, game } = this;
    const { width, height } = game.canvas;

    // Sky — warm desert sunset
    const sky = ctx.createLinearGradient(0, 0, 0, height * 0.65);
    sky.addColorStop(0,    '#0e0522');
    sky.addColorStop(0.15, '#2a0e44');
    sky.addColorStop(0.35, '#882222');
    sky.addColorStop(0.55, '#cc6622');
    sky.addColorStop(0.8,  '#eea833');
    sky.addColorStop(1,    '#ffdd66');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, width, height);

    // Sun — large, sitting on the horizon
    const sunX = width * 0.50, sunY = height * 0.48;
    const sunGlow = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, width * 0.40);
    sunGlow.addColorStop(0,   'rgba(255,240,180,0.50)');
    sunGlow.addColorStop(0.2, 'rgba(255,180,80,0.25)');
    sunGlow.addColorStop(0.5, 'rgba(255,120,40,0.10)');
    sunGlow.addColorStop(1,   'rgba(0,0,0,0)');
    ctx.fillStyle = sunGlow;
    ctx.fillRect(0, 0, width, height);
    // Sun disc
    ctx.beginPath();
    ctx.arc(sunX, sunY, 38, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,235,170,0.65)';
    ctx.fill();

    // Desert floor base
    ctx.fillStyle = '#44280e';
    ctx.fillRect(0, height * 0.56, width, height * 0.44);

    // Far dunes — soft rolling shapes
    ctx.fillStyle = '#5a3515';
    ctx.beginPath();
    ctx.moveTo(0, height * 0.60);
    ctx.quadraticCurveTo(width * 0.12, height * 0.50, width * 0.25, height * 0.56);
    ctx.quadraticCurveTo(width * 0.40, height * 0.48, width * 0.55, height * 0.54);
    ctx.quadraticCurveTo(width * 0.70, height * 0.46, width * 0.85, height * 0.52);
    ctx.quadraticCurveTo(width * 0.95, height * 0.48, width, height * 0.53);
    ctx.lineTo(width, height);
    ctx.lineTo(0, height);
    ctx.closePath();
    ctx.fill();

    // ── Great Pyramid (centre, largest) ─────────────────────────
    this._drawPyramid(width * 0.48, height * 0.56, width * 0.28, height * 0.28, 0.22);

    // ── Second Pyramid (left, medium) ───────────────────────────
    this._drawPyramid(width * 0.22, height * 0.58, width * 0.20, height * 0.20, 0.18);

    // ── Third Pyramid (right-centre, smaller) ───────────────────
    this._drawPyramid(width * 0.70, height * 0.57, width * 0.16, height * 0.16, 0.15);

    // ── Small distant pyramids on horizon ───────────────────────
    this._drawPyramid(width * 0.88, height * 0.54, width * 0.08, height * 0.07, 0.10);
    this._drawPyramid(width * 0.06, height * 0.57, width * 0.07, height * 0.06, 0.08);

    // Near dunes — foreground
    ctx.fillStyle = '#33200a';
    ctx.beginPath();
    ctx.moveTo(0, height * 0.72);
    ctx.quadraticCurveTo(width * 0.18, height * 0.64, width * 0.35, height * 0.70);
    ctx.quadraticCurveTo(width * 0.50, height * 0.63, width * 0.65, height * 0.68);
    ctx.quadraticCurveTo(width * 0.82, height * 0.61, width, height * 0.66);
    ctx.lineTo(width, height);
    ctx.lineTo(0, height);
    ctx.closePath();
    ctx.fill();

    // Sand texture gradient overlay
    const sand = ctx.createLinearGradient(0, height * 0.65, 0, height);
    sand.addColorStop(0, 'rgba(50,30,10,0.40)');
    sand.addColorStop(1, 'rgba(15,8,2,0.85)');
    ctx.fillStyle = sand;
    ctx.fillRect(0, height * 0.65, width, height * 0.35);

    // Heat haze shimmer lines
    ctx.save();
    for (let i = 0; i < 8; i++) {
      const y = height * 0.68 + i * 10;
      ctx.strokeStyle = `rgba(255,200,100,${0.03 + 0.02 * (i % 3)})`;
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(width * 0.03, y);
      ctx.lineTo(width * 0.97, y);
      ctx.stroke();
    }
    ctx.restore();
  }

  _drawPyramid(cx, baseY, w, h, highlightAlpha) {
    const { ctx } = this;
    const halfW = w / 2;

    // Shadow face (left)
    ctx.fillStyle = 'rgba(50,28,8,0.80)';
    ctx.beginPath();
    ctx.moveTo(cx, baseY - h);
    ctx.lineTo(cx - halfW, baseY);
    ctx.lineTo(cx, baseY);
    ctx.closePath();
    ctx.fill();

    // Lit face (right) — sun catches this side
    ctx.fillStyle = 'rgba(180,130,55,0.55)';
    ctx.beginPath();
    ctx.moveTo(cx, baseY - h);
    ctx.lineTo(cx + halfW, baseY);
    ctx.lineTo(cx, baseY);
    ctx.closePath();
    ctx.fill();

    // Edge highlight — sunlit ridge line
    ctx.strokeStyle = `rgba(255,220,130,${highlightAlpha})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cx, baseY - h);
    ctx.lineTo(cx + halfW, baseY);
    ctx.stroke();

    // Capstone glow
    const capGlow = ctx.createRadialGradient(cx, baseY - h, 0, cx, baseY - h, h * 0.15);
    capGlow.addColorStop(0, `rgba(255,230,160,${highlightAlpha * 0.8})`);
    capGlow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = capGlow;
    ctx.fillRect(cx - h * 0.15, baseY - h - h * 0.15, h * 0.3, h * 0.3);

    // Horizontal stone course lines
    ctx.strokeStyle = 'rgba(0,0,0,0.08)';
    ctx.lineWidth = 0.5;
    const courses = 6;
    for (let i = 1; i < courses; i++) {
      const t = i / courses;
      const ly = baseY - h + t * h;
      const lw = halfW * t;
      ctx.beginPath();
      ctx.moveTo(cx - lw, ly);
      ctx.lineTo(cx + lw, ly);
      ctx.stroke();
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  //  Background 3 — "Forest" · enchanted moonlit forest
  //  Inspired by Peggle's Renfield/Warren mystical woodland stages
  // ─────────────────────────────────────────────────────────────────────────

  _drawBgForest() {
    const { ctx, game } = this;
    const { width, height } = game.canvas;

    // Sky — deep blue-green night
    const sky = ctx.createLinearGradient(0, 0, 0, height * 0.55);
    sky.addColorStop(0,    '#060d18');
    sky.addColorStop(0.3,  '#0c1a2a');
    sky.addColorStop(0.6,  '#122838');
    sky.addColorStop(1,    '#1a3040');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, width, height);

    // Moon
    const mx = width * 0.75, my = height * 0.14;
    const moonGlow = ctx.createRadialGradient(mx, my, 0, mx, my, 80);
    moonGlow.addColorStop(0,   'rgba(180,200,230,0.30)');
    moonGlow.addColorStop(0.3, 'rgba(120,150,200,0.10)');
    moonGlow.addColorStop(1,   'rgba(0,0,0,0)');
    ctx.fillStyle = moonGlow;
    ctx.fillRect(0, 0, width, height);
    ctx.beginPath();
    ctx.arc(mx, my, 18, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(220,230,245,0.75)';
    ctx.fill();

    // Stars — sparse in sky
    ctx.save();
    for (let i = 0; i < 50; i++) {
      const sx = ((i * 7919 + 17) % 1000) / 1000 * width;
      const sy = ((i * 6271 + 17) % 1000) / 1000 * height * 0.40;
      const alpha = 0.2 + ((i * 3571) % 100) / 200;
      ctx.fillStyle = `rgba(200,215,255,${alpha})`;
      ctx.fillRect(sx, sy, 0.8, 0.8);
    }
    ctx.restore();

    // Misty forest floor base
    ctx.fillStyle = '#0a1a12';
    ctx.fillRect(0, height * 0.40, width, height * 0.60);

    // Far tree line — silhouette layer (back)
    ctx.fillStyle = '#0d1f18';
    ctx.beginPath();
    ctx.moveTo(0, height * 0.50);
    for (let i = 0; i <= 16; i++) {
      const tx = (i / 16) * width;
      const vary = Math.sin(i * 2.3) * 20 + Math.sin(i * 5.1) * 10;
      const ty = height * 0.38 + vary;
      // Pointy tree tops
      if (i % 2 === 0) {
        ctx.lineTo(tx, ty - 15);
      } else {
        ctx.lineTo(tx, ty + 5);
      }
    }
    ctx.lineTo(width, height);
    ctx.lineTo(0, height);
    ctx.closePath();
    ctx.fill();

    // Mid tree line
    ctx.fillStyle = '#0a1610';
    ctx.beginPath();
    ctx.moveTo(0, height * 0.55);
    for (let i = 0; i <= 12; i++) {
      const tx = (i / 12) * width;
      const vary = Math.sin(i * 1.8 + 1) * 25 + Math.sin(i * 4.3) * 12;
      const ty = height * 0.45 + vary;
      if (i % 2 === 1) {
        ctx.lineTo(tx, ty - 20);
      } else {
        ctx.lineTo(tx, ty + 8);
      }
    }
    ctx.lineTo(width, height);
    ctx.lineTo(0, height);
    ctx.closePath();
    ctx.fill();

    // Large foreground trees — trunks and canopy
    this._drawTree(width * 0.08, height * 0.85, 0.9);
    this._drawTree(width * 0.30, height * 0.90, 0.7);
    this._drawTree(width * 0.62, height * 0.88, 0.8);
    this._drawTree(width * 0.85, height * 0.86, 1.0);
    this._drawTree(width * 0.48, height * 0.92, 0.6);

    // Fog / mist layers
    const fog1 = ctx.createLinearGradient(0, height * 0.50, 0, height * 0.65);
    fog1.addColorStop(0, 'rgba(100,140,120,0.00)');
    fog1.addColorStop(0.5, 'rgba(100,140,120,0.08)');
    fog1.addColorStop(1, 'rgba(100,140,120,0.00)');
    ctx.fillStyle = fog1;
    ctx.fillRect(0, height * 0.50, width, height * 0.15);

    const fog2 = ctx.createLinearGradient(0, height * 0.70, 0, height * 0.85);
    fog2.addColorStop(0, 'rgba(80,120,100,0.00)');
    fog2.addColorStop(0.5, 'rgba(80,120,100,0.06)');
    fog2.addColorStop(1, 'rgba(80,120,100,0.00)');
    ctx.fillStyle = fog2;
    ctx.fillRect(0, height * 0.70, width, height * 0.15);

    // Ground gradient
    const ground = ctx.createLinearGradient(0, height * 0.75, 0, height);
    ground.addColorStop(0, 'rgba(8,18,10,0.50)');
    ground.addColorStop(1, 'rgba(4,10,6,0.90)');
    ctx.fillStyle = ground;
    ctx.fillRect(0, height * 0.75, width, height * 0.25);

    // Fireflies — small glowing dots scattered in the forest
    ctx.save();
    const fireflies = [
      { x: 0.15, y: 0.52 }, { x: 0.28, y: 0.60 }, { x: 0.42, y: 0.48 },
      { x: 0.55, y: 0.55 }, { x: 0.68, y: 0.50 }, { x: 0.78, y: 0.62 },
      { x: 0.20, y: 0.70 }, { x: 0.50, y: 0.68 }, { x: 0.72, y: 0.72 },
      { x: 0.35, y: 0.44 }, { x: 0.88, y: 0.52 }, { x: 0.10, y: 0.64 },
    ];
    for (const ff of fireflies) {
      const fx = ff.x * width;
      const fy = ff.y * height;
      const glow = ctx.createRadialGradient(fx, fy, 0, fx, fy, 6);
      glow.addColorStop(0, 'rgba(180,255,120,0.40)');
      glow.addColorStop(0.4, 'rgba(120,220,80,0.15)');
      glow.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = glow;
      ctx.fillRect(fx - 6, fy - 6, 12, 12);
      ctx.beginPath();
      ctx.arc(fx, fy, 1.2, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(200,255,150,0.70)';
      ctx.fill();
    }
    ctx.restore();

    // Moonlight rays filtering through canopy
    ctx.save();
    ctx.globalAlpha = 0.04;
    for (let i = 0; i < 5; i++) {
      const rx = width * 0.55 + i * 45;
      ctx.fillStyle = '#aaccdd';
      ctx.beginPath();
      ctx.moveTo(rx, 0);
      ctx.lineTo(rx + 25, height * 0.65);
      ctx.lineTo(rx - 15, height * 0.65);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }

  _drawTree(x, baseY, scale) {
    const { ctx } = this;
    const s = scale;

    // Trunk
    ctx.fillStyle = 'rgba(20,12,8,0.85)';
    ctx.fillRect(x - 5 * s, baseY - 80 * s, 10 * s, 80 * s);

    // Branches — gnarled look
    ctx.strokeStyle = 'rgba(20,12,8,0.70)';
    ctx.lineWidth = 3 * s;
    // Left branch
    ctx.beginPath();
    ctx.moveTo(x - 2 * s, baseY - 55 * s);
    ctx.quadraticCurveTo(x - 30 * s, baseY - 70 * s, x - 40 * s, baseY - 60 * s);
    ctx.stroke();
    // Right branch
    ctx.beginPath();
    ctx.moveTo(x + 2 * s, baseY - 50 * s);
    ctx.quadraticCurveTo(x + 28 * s, baseY - 65 * s, x + 38 * s, baseY - 55 * s);
    ctx.stroke();

    // Canopy — overlapping dark circles
    const canopy = [
      { dx: 0,   dy: -85, r: 28 },
      { dx: -18, dy: -72, r: 22 },
      { dx: 18,  dy: -70, r: 24 },
      { dx: -30, dy: -58, r: 18 },
      { dx: 30,  dy: -56, r: 20 },
      { dx: -10, dy: -65, r: 20 },
      { dx: 12,  dy: -62, r: 22 },
    ];
    ctx.fillStyle = 'rgba(10,22,14,0.80)';
    for (const c of canopy) {
      ctx.beginPath();
      ctx.arc(x + c.dx * s, baseY + c.dy * s, c.r * s, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  //  Background 4 — "Volcano" · fiery volcanic landscape
  //  Inspired by Peggle's Lord Cinderbottom stages
  // ─────────────────────────────────────────────────────────────────────────

  _drawBgVolcano() {
    const { ctx, game } = this;
    const { width, height } = game.canvas;

    // Sky — smoky red-black
    const sky = ctx.createLinearGradient(0, 0, 0, height * 0.6);
    sky.addColorStop(0,    '#0a0204');
    sky.addColorStop(0.3,  '#1a0808');
    sky.addColorStop(0.6,  '#331108');
    sky.addColorStop(1,    '#55200a');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, width, height);

    // Volcanic glow on horizon
    const glow = ctx.createRadialGradient(width * 0.45, height * 0.45, 0, width * 0.45, height * 0.45, width * 0.5);
    glow.addColorStop(0,   'rgba(255,80,20,0.18)');
    glow.addColorStop(0.4, 'rgba(200,40,10,0.08)');
    glow.addColorStop(1,   'rgba(0,0,0,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, width, height);

    // Far volcanic mountains
    ctx.fillStyle = '#1a0a06';
    ctx.beginPath();
    ctx.moveTo(0, height * 0.65);
    ctx.lineTo(width * 0.10, height * 0.45);
    ctx.lineTo(width * 0.20, height * 0.52);
    ctx.lineTo(width * 0.35, height * 0.30);  // main volcano peak
    ctx.lineTo(width * 0.50, height * 0.50);
    ctx.lineTo(width * 0.65, height * 0.42);
    ctx.lineTo(width * 0.80, height * 0.35);  // second volcano
    ctx.lineTo(width * 0.90, height * 0.48);
    ctx.lineTo(width, height * 0.44);
    ctx.lineTo(width, height);
    ctx.lineTo(0, height);
    ctx.closePath();
    ctx.fill();

    // Lava glow from main volcano crater
    const craterX = width * 0.35, craterY = height * 0.30;
    const lavaGlow = ctx.createRadialGradient(craterX, craterY, 0, craterX, craterY, 60);
    lavaGlow.addColorStop(0,   'rgba(255,120,20,0.35)');
    lavaGlow.addColorStop(0.5, 'rgba(255,60,10,0.12)');
    lavaGlow.addColorStop(1,   'rgba(0,0,0,0)');
    ctx.fillStyle = lavaGlow;
    ctx.fillRect(craterX - 60, craterY - 60, 120, 120);

    // Second volcano glow
    const c2x = width * 0.80, c2y = height * 0.35;
    const g2 = ctx.createRadialGradient(c2x, c2y, 0, c2x, c2y, 40);
    g2.addColorStop(0,   'rgba(255,100,20,0.25)');
    g2.addColorStop(1,   'rgba(0,0,0,0)');
    ctx.fillStyle = g2;
    ctx.fillRect(c2x - 40, c2y - 40, 80, 80);

    // Lava rivers
    ctx.save();
    ctx.strokeStyle = 'rgba(255,80,10,0.40)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(craterX, craterY + 10);
    ctx.quadraticCurveTo(craterX - 30, height * 0.50, craterX - 60, height * 0.70);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255,100,20,0.30)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(craterX + 5, craterY + 15);
    ctx.quadraticCurveTo(craterX + 40, height * 0.55, craterX + 20, height * 0.75);
    ctx.stroke();
    // From second volcano
    ctx.strokeStyle = 'rgba(255,70,10,0.25)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(c2x, c2y + 10);
    ctx.quadraticCurveTo(c2x + 20, height * 0.55, c2x - 10, height * 0.72);
    ctx.stroke();
    ctx.restore();

    // Dark rocky ground
    ctx.fillStyle = '#110604';
    ctx.beginPath();
    ctx.moveTo(0, height * 0.68);
    ctx.quadraticCurveTo(width * 0.25, height * 0.62, width * 0.50, height * 0.66);
    ctx.quadraticCurveTo(width * 0.75, height * 0.60, width, height * 0.64);
    ctx.lineTo(width, height);
    ctx.lineTo(0, height);
    ctx.closePath();
    ctx.fill();

    // Lava pools in foreground
    const pools = [
      { x: 0.20, y: 0.78, rx: 40, ry: 8 },
      { x: 0.60, y: 0.82, rx: 35, ry: 6 },
      { x: 0.85, y: 0.76, rx: 28, ry: 5 },
    ];
    for (const p of pools) {
      const px = p.x * width, py = p.y * height;
      const pg = ctx.createRadialGradient(px, py, 0, px, py, p.rx);
      pg.addColorStop(0,   'rgba(255,160,40,0.30)');
      pg.addColorStop(0.5, 'rgba(255,80,10,0.18)');
      pg.addColorStop(1,   'rgba(0,0,0,0)');
      ctx.fillStyle = pg;
      ctx.beginPath();
      ctx.ellipse(px, py, p.rx, p.ry, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // Ember particles — static dots
    ctx.save();
    for (let i = 0; i < 30; i++) {
      const ex = ((i * 7919 + 31) % 1000) / 1000 * width;
      const ey = ((i * 4271 + 31) % 1000) / 1000 * height * 0.7;
      const alpha = 0.2 + ((i * 3571) % 100) / 250;
      ctx.fillStyle = `rgba(255,${100 + (i * 37 % 80)},20,${alpha})`;
      ctx.fillRect(ex, ey, 1.2, 1.2);
    }
    ctx.restore();

    // Smoke haze
    const smoke = ctx.createLinearGradient(0, 0, 0, height * 0.3);
    smoke.addColorStop(0, 'rgba(40,20,10,0.15)');
    smoke.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = smoke;
    ctx.fillRect(0, 0, width, height * 0.3);
  }

  // ─────────────────────────────────────────────────────────────────────────
  //  Background 5 — "Ocean" · deep underwater scene
  //  Inspired by Peggle's Claude Lobster / Marina stages
  // ─────────────────────────────────────────────────────────────────────────

  _drawBgOcean() {
    const { ctx, game } = this;
    const { width, height } = game.canvas;

    // Water gradient — light to deep
    const water = ctx.createLinearGradient(0, 0, 0, height);
    water.addColorStop(0,    '#0a4466');
    water.addColorStop(0.15, '#083855');
    water.addColorStop(0.4,  '#062d44');
    water.addColorStop(0.7,  '#041e30');
    water.addColorStop(1,    '#02101c');
    ctx.fillStyle = water;
    ctx.fillRect(0, 0, width, height);

    // Surface light rays
    ctx.save();
    ctx.globalAlpha = 0.06;
    for (let i = 0; i < 7; i++) {
      const rx = width * 0.10 + i * width * 0.12;
      const rw = 20 + (i % 3) * 10;
      ctx.fillStyle = '#88ccff';
      ctx.beginPath();
      ctx.moveTo(rx, 0);
      ctx.lineTo(rx + rw, 0);
      ctx.lineTo(rx + rw * 0.6 + 15, height * 0.7);
      ctx.lineTo(rx + rw * 0.4 - 10, height * 0.7);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();

    // Light caustic pattern at top
    const caustic = ctx.createRadialGradient(width * 0.5, 0, 0, width * 0.5, 0, width * 0.6);
    caustic.addColorStop(0,   'rgba(100,200,255,0.10)');
    caustic.addColorStop(0.5, 'rgba(60,140,200,0.04)');
    caustic.addColorStop(1,   'rgba(0,0,0,0)');
    ctx.fillStyle = caustic;
    ctx.fillRect(0, 0, width, height * 0.4);

    // Coral reef — bottom
    // Back coral mounds
    const coralColors = ['#553344', '#443355', '#335544', '#554433'];
    const coralMounds = [
      { x: 0.05, y: 0.88, w: 0.15, h: 0.10 },
      { x: 0.18, y: 0.85, w: 0.12, h: 0.13 },
      { x: 0.35, y: 0.90, w: 0.10, h: 0.08 },
      { x: 0.50, y: 0.86, w: 0.14, h: 0.12 },
      { x: 0.68, y: 0.88, w: 0.11, h: 0.10 },
      { x: 0.80, y: 0.84, w: 0.13, h: 0.14 },
      { x: 0.92, y: 0.89, w: 0.10, h: 0.09 },
    ];
    coralMounds.forEach((m, i) => {
      const cx = m.x * width, cy = m.y * height;
      const cw = m.w * width, ch = m.h * height;
      ctx.fillStyle = coralColors[i % coralColors.length];
      ctx.beginPath();
      ctx.ellipse(cx + cw / 2, cy + ch * 0.3, cw / 2, ch, 0, Math.PI, 0);
      ctx.fill();
    });

    // Sandy ocean floor
    const floor = ctx.createLinearGradient(0, height * 0.88, 0, height);
    floor.addColorStop(0, 'rgba(30,50,40,0.40)');
    floor.addColorStop(1, 'rgba(10,25,18,0.80)');
    ctx.fillStyle = floor;
    ctx.fillRect(0, height * 0.88, width, height * 0.12);

    // Seaweed strands
    ctx.save();
    ctx.strokeStyle = 'rgba(30,100,50,0.35)';
    ctx.lineWidth = 3;
    const weeds = [0.12, 0.28, 0.44, 0.58, 0.74, 0.90];
    weeds.forEach((wx, i) => {
      const bx = wx * width;
      ctx.beginPath();
      ctx.moveTo(bx, height);
      ctx.quadraticCurveTo(bx + (i % 2 ? 12 : -12), height * 0.82, bx + (i % 2 ? -5 : 8), height * 0.72);
      ctx.stroke();
    });
    ctx.restore();

    // Bubbles
    ctx.save();
    const bubbles = [
      { x: 0.15, y: 0.30, r: 4 }, { x: 0.25, y: 0.50, r: 3 },
      { x: 0.40, y: 0.25, r: 5 }, { x: 0.55, y: 0.45, r: 3.5 },
      { x: 0.65, y: 0.35, r: 4 }, { x: 0.78, y: 0.55, r: 3 },
      { x: 0.88, y: 0.20, r: 4.5 }, { x: 0.32, y: 0.65, r: 2.5 },
      { x: 0.70, y: 0.70, r: 3 }, { x: 0.48, y: 0.60, r: 2 },
    ];
    for (const b of bubbles) {
      const bx = b.x * width, by = b.y * height;
      ctx.beginPath();
      ctx.arc(bx, by, b.r, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(150,220,255,0.25)';
      ctx.lineWidth = 0.8;
      ctx.stroke();
      // Highlight
      ctx.beginPath();
      ctx.arc(bx - b.r * 0.3, by - b.r * 0.3, b.r * 0.3, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(200,240,255,0.20)';
      ctx.fill();
    }
    ctx.restore();

    // Fish silhouettes
    ctx.save();
    ctx.fillStyle = 'rgba(20,60,80,0.25)';
    const fishPos = [
      { x: 0.20, y: 0.40, s: 1, flip: false },
      { x: 0.70, y: 0.55, s: 0.8, flip: true },
      { x: 0.45, y: 0.35, s: 0.6, flip: false },
    ];
    for (const f of fishPos) {
      const fx = f.x * width, fy = f.y * height;
      ctx.save();
      ctx.translate(fx, fy);
      if (f.flip) ctx.scale(-1, 1);
      ctx.scale(f.s, f.s);
      ctx.beginPath();
      ctx.ellipse(0, 0, 14, 6, 0, 0, Math.PI * 2);
      ctx.fill();
      // Tail
      ctx.beginPath();
      ctx.moveTo(-14, 0);
      ctx.lineTo(-22, -6);
      ctx.lineTo(-22, 6);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
    ctx.restore();
  }

  // ─────────────────────────────────────────────────────────────────────────
  //  Background 6 — "Garden" · sunny flower garden
  //  Inspired by Peggle's Tula Sunflower stages
  // ─────────────────────────────────────────────────────────────────────────

  _drawBgGarden() {
    const { ctx, game } = this;
    const { width, height } = game.canvas;

    // Sky — bright blue
    const sky = ctx.createLinearGradient(0, 0, 0, height * 0.55);
    sky.addColorStop(0,    '#1a55aa');
    sky.addColorStop(0.4,  '#3388cc');
    sky.addColorStop(0.8,  '#66bbdd');
    sky.addColorStop(1,    '#88ccee');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, width, height);

    // Sun — upper right
    const sx = width * 0.80, sy = height * 0.10;
    const sunGlow = ctx.createRadialGradient(sx, sy, 0, sx, sy, 100);
    sunGlow.addColorStop(0,   'rgba(255,240,180,0.40)');
    sunGlow.addColorStop(0.3, 'rgba(255,220,120,0.15)');
    sunGlow.addColorStop(1,   'rgba(0,0,0,0)');
    ctx.fillStyle = sunGlow;
    ctx.fillRect(0, 0, width, height * 0.4);
    ctx.beginPath();
    ctx.arc(sx, sy, 22, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,245,200,0.80)';
    ctx.fill();

    // Clouds
    const clouds = [
      { x: 0.15, y: 0.08, s: 1.0 },
      { x: 0.50, y: 0.14, s: 0.8 },
      { x: 0.35, y: 0.22, s: 0.6 },
    ];
    for (const c of clouds) {
      const cx = c.x * width, cy = c.y * height;
      ctx.fillStyle = 'rgba(255,255,255,0.18)';
      ctx.beginPath();
      ctx.ellipse(cx, cy, 40 * c.s, 14 * c.s, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(cx + 25 * c.s, cy + 3, 30 * c.s, 12 * c.s, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(cx - 20 * c.s, cy + 2, 28 * c.s, 11 * c.s, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // Rolling green hills — back
    ctx.fillStyle = '#2a8833';
    ctx.beginPath();
    ctx.moveTo(0, height * 0.55);
    ctx.quadraticCurveTo(width * 0.20, height * 0.42, width * 0.40, height * 0.50);
    ctx.quadraticCurveTo(width * 0.60, height * 0.40, width * 0.80, height * 0.48);
    ctx.quadraticCurveTo(width * 0.95, height * 0.42, width, height * 0.50);
    ctx.lineTo(width, height);
    ctx.lineTo(0, height);
    ctx.closePath();
    ctx.fill();

    // Mid hills
    ctx.fillStyle = '#228830';
    ctx.beginPath();
    ctx.moveTo(0, height * 0.60);
    ctx.quadraticCurveTo(width * 0.15, height * 0.52, width * 0.30, height * 0.58);
    ctx.quadraticCurveTo(width * 0.50, height * 0.48, width * 0.70, height * 0.56);
    ctx.quadraticCurveTo(width * 0.90, height * 0.50, width, height * 0.55);
    ctx.lineTo(width, height);
    ctx.lineTo(0, height);
    ctx.closePath();
    ctx.fill();

    // Near ground
    ctx.fillStyle = '#1d7728';
    ctx.fillRect(0, height * 0.62, width, height * 0.38);

    // Flower patches — simple colourful dots
    ctx.save();
    const flowers = [
      { x: 0.08, y: 0.58, c: '#ff5577' }, { x: 0.15, y: 0.62, c: '#ffaa33' },
      { x: 0.22, y: 0.56, c: '#ff66aa' }, { x: 0.30, y: 0.64, c: '#ffdd44' },
      { x: 0.38, y: 0.60, c: '#ff5577' }, { x: 0.48, y: 0.55, c: '#aa66ff' },
      { x: 0.55, y: 0.63, c: '#ffaa33' }, { x: 0.62, y: 0.58, c: '#ff66aa' },
      { x: 0.72, y: 0.62, c: '#ffdd44' }, { x: 0.80, y: 0.56, c: '#ff5577' },
      { x: 0.88, y: 0.60, c: '#aa66ff' }, { x: 0.95, y: 0.57, c: '#ffaa33' },
      { x: 0.12, y: 0.70, c: '#ffdd44' }, { x: 0.35, y: 0.72, c: '#ff66aa' },
      { x: 0.58, y: 0.70, c: '#ff5577' }, { x: 0.82, y: 0.68, c: '#aa66ff' },
    ];
    for (const f of flowers) {
      const fx = f.x * width, fy = f.y * height;
      // Stem
      ctx.strokeStyle = 'rgba(30,100,30,0.40)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(fx, fy);
      ctx.lineTo(fx, fy + 8);
      ctx.stroke();
      // Petals
      for (let p = 0; p < 5; p++) {
        const a = (p / 5) * Math.PI * 2;
        ctx.beginPath();
        ctx.arc(fx + Math.cos(a) * 3, fy + Math.sin(a) * 3, 2.2, 0, Math.PI * 2);
        ctx.fillStyle = f.c;
        ctx.globalAlpha = 0.55;
        ctx.fill();
      }
      // Centre
      ctx.globalAlpha = 0.70;
      ctx.beginPath();
      ctx.arc(fx, fy, 1.5, 0, Math.PI * 2);
      ctx.fillStyle = '#ffee88';
      ctx.fill();
      ctx.globalAlpha = 1;
    }
    ctx.restore();

    // Sunflowers — larger, behind the pegs
    this._drawSunflower(width * 0.18, height * 0.50, 1.0);
    this._drawSunflower(width * 0.75, height * 0.48, 0.9);
    this._drawSunflower(width * 0.50, height * 0.52, 0.7);

    // Ground gradient
    const ground = ctx.createLinearGradient(0, height * 0.72, 0, height);
    ground.addColorStop(0, 'rgba(15,60,20,0.30)');
    ground.addColorStop(1, 'rgba(8,35,12,0.70)');
    ctx.fillStyle = ground;
    ctx.fillRect(0, height * 0.72, width, height * 0.28);
  }

  _drawSunflower(x, baseY, scale) {
    const { ctx } = this;
    const s = scale;
    // Stem
    ctx.strokeStyle = 'rgba(40,110,30,0.50)';
    ctx.lineWidth = 3 * s;
    ctx.beginPath();
    ctx.moveTo(x, baseY);
    ctx.lineTo(x + 3 * s, baseY + 50 * s);
    ctx.stroke();
    // Leaf
    ctx.fillStyle = 'rgba(50,130,40,0.35)';
    ctx.beginPath();
    ctx.ellipse(x + 10 * s, baseY + 25 * s, 10 * s, 4 * s, 0.4, 0, Math.PI * 2);
    ctx.fill();
    // Petals
    ctx.fillStyle = 'rgba(255,200,30,0.45)';
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2;
      ctx.beginPath();
      ctx.ellipse(
        x + Math.cos(a) * 10 * s,
        baseY + Math.sin(a) * 10 * s,
        6 * s, 3 * s, a, 0, Math.PI * 2
      );
      ctx.fill();
    }
    // Centre
    ctx.beginPath();
    ctx.arc(x, baseY, 7 * s, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(80,50,10,0.55)';
    ctx.fill();
  }

  // ─────────────────────────────────────────────────────────────────────────
  //  Background 7 — "Galaxy" · deep space nebula
  //  Inspired by Peggle's Splork alien/space stages
  // ─────────────────────────────────────────────────────────────────────────

  _drawBgGalaxy() {
    const { ctx, game } = this;
    const { width, height } = game.canvas;

    // Deep space
    const space = ctx.createLinearGradient(0, 0, width * 0.3, height);
    space.addColorStop(0,    '#050510');
    space.addColorStop(0.3,  '#0a0820');
    space.addColorStop(0.6,  '#0d0a28');
    space.addColorStop(1,    '#060412');
    ctx.fillStyle = space;
    ctx.fillRect(0, 0, width, height);

    // Nebula clouds
    const nebulae = [
      { x: 0.70, y: 0.25, r: 0.45, c: [120,30,160] },
      { x: 0.20, y: 0.70, r: 0.50, c: [20,100,140] },
      { x: 0.45, y: 0.45, r: 0.30, c: [160,40,80] },
    ];
    for (const n of nebulae) {
      const nx = n.x * width, ny = n.y * height, nr = n.r * width;
      const ng = ctx.createRadialGradient(nx, ny, 0, nx, ny, nr);
      ng.addColorStop(0,   `rgba(${n.c.join(',')},0.20)`);
      ng.addColorStop(0.5, `rgba(${n.c.join(',')},0.06)`);
      ng.addColorStop(1,   'rgba(0,0,0,0)');
      ctx.fillStyle = ng;
      ctx.fillRect(0, 0, width, height);
    }

    // Star field
    ctx.save();
    for (let i = 0; i < 120; i++) {
      const sx = ((i * 7919 + 42) % 1000) / 1000 * width;
      const sy = ((i * 6271 + 42) % 1000) / 1000 * height;
      const sr = ((i * 3571 + 42) % 100) / 100;
      ctx.fillStyle = `rgba(200,210,255,${0.3 + sr * 0.5})`;
      ctx.fillRect(sx, sy, 0.4 + sr * 1.2, 0.4 + sr * 1.2);
    }

    // Bright stars with glow
    const brightStars = [
      { x: 0.12, y: 0.15, s: 2.0 }, { x: 0.85, y: 0.10, s: 1.8 },
      { x: 0.60, y: 0.35, s: 1.5 }, { x: 0.25, y: 0.55, s: 1.6 },
      { x: 0.90, y: 0.60, s: 1.4 }, { x: 0.50, y: 0.80, s: 1.3 },
      { x: 0.08, y: 0.85, s: 1.7 },
    ];
    for (const st of brightStars) {
      const bx = st.x * width, by = st.y * height;
      const glow = ctx.createRadialGradient(bx, by, 0, bx, by, st.s * 8);
      glow.addColorStop(0, 'rgba(180,200,255,0.25)');
      glow.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = glow;
      ctx.fillRect(bx - st.s * 8, by - st.s * 8, st.s * 16, st.s * 16);
      ctx.beginPath();
      ctx.arc(bx, by, st.s, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(220,230,255,0.85)';
      ctx.fill();
    }
    ctx.restore();

    // Spiral galaxy
    ctx.save();
    ctx.translate(width * 0.35, height * 0.40);
    ctx.rotate(-0.4);
    const galGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, 80);
    galGrad.addColorStop(0,   'rgba(200,180,255,0.12)');
    galGrad.addColorStop(0.3, 'rgba(140,120,200,0.06)');
    galGrad.addColorStop(1,   'rgba(0,0,0,0)');
    ctx.fillStyle = galGrad;
    ctx.beginPath();
    ctx.ellipse(0, 0, 80, 30, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Planet with ring
    ctx.save();
    const px = width * 0.82, py = height * 0.75, pr = 28;
    const plGrad = ctx.createRadialGradient(px - 8, py - 8, 2, px, py, pr);
    plGrad.addColorStop(0,   'rgba(80,120,160,0.35)');
    plGrad.addColorStop(0.6, 'rgba(30,50,80,0.25)');
    plGrad.addColorStop(1,   'rgba(5,10,20,0.30)');
    ctx.beginPath();
    ctx.arc(px, py, pr, 0, Math.PI * 2);
    ctx.fillStyle = plGrad;
    ctx.fill();
    ctx.strokeStyle = 'rgba(140,160,200,0.15)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.ellipse(px, py, pr * 1.8, pr * 0.3, -0.2, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  // ─────────────────────────────────────────────────────────────────────────
  //  Background 8 — "Winter" · snowy winter wonderland
  //  Inspired by Peggle 2's "Winter Blunderland"
  // ─────────────────────────────────────────────────────────────────────────

  _drawBgWinter() {
    const { ctx, game } = this;
    const { width, height } = game.canvas;

    // Sky — pale winter blue fading to white
    const sky = ctx.createLinearGradient(0, 0, 0, height * 0.6);
    sky.addColorStop(0,    '#1a2a44');
    sky.addColorStop(0.3,  '#335577');
    sky.addColorStop(0.6,  '#6688aa');
    sky.addColorStop(1,    '#99bbcc');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, width, height);

    // Pale horizon glow
    const hGlow = ctx.createRadialGradient(width * 0.5, height * 0.5, 0, width * 0.5, height * 0.5, width * 0.5);
    hGlow.addColorStop(0, 'rgba(200,220,240,0.12)');
    hGlow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = hGlow;
    ctx.fillRect(0, 0, width, height);

    // Snowy mountains — back
    ctx.fillStyle = '#446677';
    ctx.beginPath();
    ctx.moveTo(0, height * 0.60);
    ctx.lineTo(width * 0.12, height * 0.38);
    ctx.lineTo(width * 0.25, height * 0.48);
    ctx.lineTo(width * 0.40, height * 0.28);
    ctx.lineTo(width * 0.55, height * 0.42);
    ctx.lineTo(width * 0.70, height * 0.32);
    ctx.lineTo(width * 0.85, height * 0.44);
    ctx.lineTo(width, height * 0.36);
    ctx.lineTo(width, height);
    ctx.lineTo(0, height);
    ctx.closePath();
    ctx.fill();

    // Snow on peaks
    ctx.fillStyle = 'rgba(220,235,250,0.65)';
    const peaks = [
      { px: 0.12, py: 0.38, lx: 0.06, ly: 0.46, rx: 0.18, ry: 0.46 },
      { px: 0.40, py: 0.28, lx: 0.32, ly: 0.40, rx: 0.48, ry: 0.38 },
      { px: 0.70, py: 0.32, lx: 0.63, ly: 0.42, rx: 0.77, ry: 0.40 },
      { px: 1.00, py: 0.36, lx: 0.93, ly: 0.44, rx: 1.00, ry: 0.44 },
    ];
    for (const p of peaks) {
      ctx.beginPath();
      ctx.moveTo(p.px * width, p.py * height);
      ctx.lineTo(p.lx * width, p.ly * height);
      ctx.lineTo(p.rx * width, p.ry * height);
      ctx.closePath();
      ctx.fill();
    }

    // Snow-covered hills — foreground
    ctx.fillStyle = '#aabbcc';
    ctx.beginPath();
    ctx.moveTo(0, height * 0.65);
    ctx.quadraticCurveTo(width * 0.15, height * 0.55, width * 0.30, height * 0.62);
    ctx.quadraticCurveTo(width * 0.50, height * 0.52, width * 0.70, height * 0.60);
    ctx.quadraticCurveTo(width * 0.90, height * 0.54, width, height * 0.58);
    ctx.lineTo(width, height);
    ctx.lineTo(0, height);
    ctx.closePath();
    ctx.fill();

    // Snow ground
    ctx.fillStyle = '#bbccdd';
    ctx.fillRect(0, height * 0.68, width, height * 0.32);

    // Pine trees
    this._drawPineTree(width * 0.10, height * 0.64, 0.8);
    this._drawPineTree(width * 0.25, height * 0.60, 1.0);
    this._drawPineTree(width * 0.42, height * 0.66, 0.6);
    this._drawPineTree(width * 0.60, height * 0.62, 0.9);
    this._drawPineTree(width * 0.78, height * 0.58, 1.1);
    this._drawPineTree(width * 0.92, height * 0.64, 0.7);

    // Snow particles — static
    ctx.save();
    for (let i = 0; i < 60; i++) {
      const sx = ((i * 7919 + 53) % 1000) / 1000 * width;
      const sy = ((i * 6271 + 53) % 1000) / 1000 * height;
      const sr = 1 + ((i * 3571) % 100) / 60;
      ctx.fillStyle = `rgba(230,240,250,${0.15 + ((i * 41) % 100) / 300})`;
      ctx.beginPath();
      ctx.arc(sx, sy, sr, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // Ground shadow
    const gnd = ctx.createLinearGradient(0, height * 0.78, 0, height);
    gnd.addColorStop(0, 'rgba(60,80,100,0.15)');
    gnd.addColorStop(1, 'rgba(30,50,70,0.40)');
    ctx.fillStyle = gnd;
    ctx.fillRect(0, height * 0.78, width, height * 0.22);
  }

  _drawPineTree(x, baseY, scale) {
    const { ctx } = this;
    const s = scale;
    // Trunk
    ctx.fillStyle = 'rgba(50,35,20,0.60)';
    ctx.fillRect(x - 3 * s, baseY, 6 * s, 20 * s);
    // Three tiers of branches
    const tiers = [
      { dy: -5,  w: 18, h: 18 },
      { dy: -18, w: 14, h: 16 },
      { dy: -28, w: 10, h: 14 },
    ];
    for (const t of tiers) {
      ctx.fillStyle = 'rgba(25,55,35,0.70)';
      ctx.beginPath();
      ctx.moveTo(x, baseY + t.dy * s - t.h * s);
      ctx.lineTo(x - t.w * s, baseY + t.dy * s);
      ctx.lineTo(x + t.w * s, baseY + t.dy * s);
      ctx.closePath();
      ctx.fill();
      // Snow on branches
      ctx.fillStyle = 'rgba(220,235,250,0.35)';
      ctx.beginPath();
      ctx.moveTo(x, baseY + t.dy * s - t.h * s);
      ctx.lineTo(x - t.w * 0.5 * s, baseY + (t.dy - t.h * 0.3) * s);
      ctx.lineTo(x + t.w * 0.5 * s, baseY + (t.dy - t.h * 0.3) * s);
      ctx.closePath();
      ctx.fill();
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  //  Background 9 — "Tropical" · sunset beach with palm trees
  // ─────────────────────────────────────────────────────────────────────────

  _drawBgTropical() {
    const { ctx, game } = this;
    const { width, height } = game.canvas;

    // Sky — warm tropical sunset
    const sky = ctx.createLinearGradient(0, 0, 0, height * 0.55);
    sky.addColorStop(0,    '#1a1044');
    sky.addColorStop(0.2,  '#442266');
    sky.addColorStop(0.45, '#cc4455');
    sky.addColorStop(0.7,  '#ee8844');
    sky.addColorStop(1,    '#ffcc66');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, width, height);

    // Sun glow
    const sx = width * 0.50, sy = height * 0.42;
    const sunGlow = ctx.createRadialGradient(sx, sy, 0, sx, sy, width * 0.35);
    sunGlow.addColorStop(0,   'rgba(255,220,140,0.45)');
    sunGlow.addColorStop(0.3, 'rgba(255,160,80,0.18)');
    sunGlow.addColorStop(1,   'rgba(0,0,0,0)');
    ctx.fillStyle = sunGlow;
    ctx.fillRect(0, 0, width, height);
    // Sun disc
    ctx.beginPath();
    ctx.arc(sx, sy, 35, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,230,160,0.60)';
    ctx.fill();

    // Ocean — horizon to bottom
    const ocean = ctx.createLinearGradient(0, height * 0.52, 0, height);
    ocean.addColorStop(0,   'rgba(20,80,120,0.70)');
    ocean.addColorStop(0.3, 'rgba(15,60,100,0.80)');
    ocean.addColorStop(1,   'rgba(8,30,55,0.90)');
    ctx.fillStyle = ocean;
    ctx.fillRect(0, height * 0.52, width, height * 0.48);

    // Sun reflection on water
    const ref = ctx.createRadialGradient(sx, height * 0.55, 0, sx, height * 0.55, 80);
    ref.addColorStop(0, 'rgba(255,180,80,0.15)');
    ref.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = ref;
    ctx.fillRect(sx - 80, height * 0.52, 160, 60);

    // Water shimmer lines
    ctx.save();
    for (let i = 0; i < 8; i++) {
      const y = height * 0.56 + i * 10;
      ctx.strokeStyle = `rgba(255,200,120,${0.03 + 0.02 * (i % 2)})`;
      ctx.lineWidth = 0.6;
      ctx.beginPath();
      ctx.moveTo(width * 0.05, y);
      ctx.lineTo(width * 0.95, y);
      ctx.stroke();
    }
    ctx.restore();

    // Beach / sand
    ctx.fillStyle = '#55401a';
    ctx.beginPath();
    ctx.moveTo(0, height * 0.72);
    ctx.quadraticCurveTo(width * 0.25, height * 0.68, width * 0.50, height * 0.71);
    ctx.quadraticCurveTo(width * 0.75, height * 0.67, width, height * 0.70);
    ctx.lineTo(width, height);
    ctx.lineTo(0, height);
    ctx.closePath();
    ctx.fill();

    // Sand gradient
    const sand = ctx.createLinearGradient(0, height * 0.70, 0, height);
    sand.addColorStop(0, 'rgba(70,55,25,0.50)');
    sand.addColorStop(1, 'rgba(30,22,10,0.85)');
    ctx.fillStyle = sand;
    ctx.fillRect(0, height * 0.70, width, height * 0.30);

    // Palm trees
    this._drawPalmTree(width * 0.15, height * 0.70, 1.0, false);
    this._drawPalmTree(width * 0.82, height * 0.68, 0.9, true);
    this._drawPalmTree(width * 0.55, height * 0.72, 0.6, false);

    // Distant islands
    ctx.fillStyle = 'rgba(20,40,30,0.35)';
    ctx.beginPath();
    ctx.ellipse(width * 0.25, height * 0.53, 30, 6, 0, Math.PI, 0);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(width * 0.78, height * 0.54, 22, 4, 0, Math.PI, 0);
    ctx.fill();
  }

  _drawPalmTree(x, baseY, scale, lean) {
    const { ctx } = this;
    const s = scale;
    const dir = lean ? -1 : 1;
    // Trunk — curved
    ctx.strokeStyle = 'rgba(50,35,15,0.70)';
    ctx.lineWidth = 5 * s;
    ctx.beginPath();
    ctx.moveTo(x, baseY);
    ctx.quadraticCurveTo(x + dir * 15 * s, baseY - 40 * s, x + dir * 10 * s, baseY - 80 * s);
    ctx.stroke();
    // Fronds
    const topX = x + dir * 10 * s, topY = baseY - 80 * s;
    ctx.strokeStyle = 'rgba(30,80,25,0.50)';
    ctx.lineWidth = 2 * s;
    const fronds = [
      { a: -0.8, l: 35 }, { a: -0.3, l: 40 }, { a: 0.2, l: 38 },
      { a: 0.7, l: 32 }, { a: -1.2, l: 28 }, { a: 1.1, l: 26 },
    ];
    for (const f of fronds) {
      const ex = topX + Math.cos(f.a) * f.l * s;
      const ey = topY + Math.sin(f.a) * f.l * s * 0.6 + f.l * s * 0.3;
      ctx.beginPath();
      ctx.moveTo(topX, topY);
      ctx.quadraticCurveTo(
        topX + Math.cos(f.a) * f.l * s * 0.5,
        topY + Math.sin(f.a) * f.l * s * 0.2 - 5 * s,
        ex, ey
      );
      ctx.stroke();
    }
  }

  _tickStars() {
    const t = Date.now() / 1000;
    this.stars.forEach(s => {
      s.alpha = s.baseAlpha * (0.55 + 0.45 * Math.sin(t * s.speed + s.phase));
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  //  Pegs — 3D glass-ball sphere with specular glint
  // ─────────────────────────────────────────────────────────────────────────

  _drawPegs() {
    const { ctx, game } = this;
    const pegs  = game.levelSystem.getRenderPegs();
    const pulse = 0.75 + 0.25 * Math.sin(Date.now() / 160);

    for (const peg of pegs) {
      const colors = PEG_COLORS[peg.type];
      if (!colors) continue;

      let alpha = 1;
      if (peg.removing) alpha = peg.removeTimer / REMOVE_FRAMES;

      const isLit = peg.lit || peg.removing;
      const r  = peg.radius;
      const hx = peg.pos.x - r * 0.32; // highlight x
      const hy = peg.pos.y - r * 0.38; // highlight y

      ctx.save();
      ctx.globalAlpha = alpha;

      // Outer glow — pulses when lit
      ctx.shadowColor = colors.glow;
      ctx.shadowBlur  = isLit ? 28 * pulse : 6;

      // 3D radial gradient — focal point at top-left highlight
      const sphGrad = ctx.createRadialGradient(hx, hy, r * 0.04, peg.pos.x, peg.pos.y, r);
      if (isLit) {
        sphGrad.addColorStop(0.00, colors.spec);
        sphGrad.addColorStop(0.28, colors.lit);
        sphGrad.addColorStop(0.65, colors.bright);
        sphGrad.addColorStop(1.00, colors.dark);
      } else {
        sphGrad.addColorStop(0.00, colors.bright + 'bb');
        sphGrad.addColorStop(0.35, colors.mid);
        sphGrad.addColorStop(0.82, colors.dark);
        sphGrad.addColorStop(1.00, '#000008');
      }
      ctx.beginPath();
      ctx.arc(peg.pos.x, peg.pos.y, r, 0, Math.PI * 2);
      ctx.fillStyle = sphGrad;
      ctx.fill();

      // Rim
      ctx.shadowBlur  = 0;
      ctx.strokeStyle = isLit ? colors.lit + 'cc' : colors.bright + '55';
      ctx.lineWidth   = isLit ? 1.5 : 0.8;
      ctx.stroke();

      // Specular glint — soft white radial at highlight position
      const specGrad = ctx.createRadialGradient(hx, hy, 0, hx, hy, r * 0.52);
      specGrad.addColorStop(0,   isLit ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.55)');
      specGrad.addColorStop(0.5, isLit ? 'rgba(255,255,255,0.30)' : 'rgba(255,255,255,0.12)');
      specGrad.addColorStop(1,   'rgba(255,255,255,0)');
      ctx.beginPath();
      ctx.arc(hx, hy, r * 0.52, 0, Math.PI * 2);
      ctx.fillStyle = specGrad;
      ctx.fill();

      ctx.restore();
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  //  Ball — polished sphere with specular and colored trail (all active balls)
  // ─────────────────────────────────────────────────────────────────────────

  _drawBall() {
    const { ctx, game } = this;
    for (const ball of game.balls) {
      if (!ball.active) continue;
      this._renderOneBall(ctx, ball);
    }
  }

  _renderOneBall(ctx, ball) {
    const r  = ball.radius;
    // Interpolate between the previous and current physics positions so the
    // ball renders smoothly at any display refresh rate.
    const a  = this._alpha ?? 1;
    const bx = ball.prevPos.x + (ball.pos.x - ball.prevPos.x) * a;
    const by = ball.prevPos.y + (ball.pos.y - ball.prevPos.y) * a;
    const hx = bx - r * 0.28;
    const hy = by - r * 0.38;

    // Trail — hue matches skill colour; normal ball gets a neutral grey trail
    const SKILL_HUE = { superGuide: 145, spookyBall: 280, lightning: 210, multiball: 25 };
    const trailHue  = SKILL_HUE[this.game.currentBallSkill] ?? 0;
    const trailSat = this.game.currentBallSkill ? 70 : 0;
    ball.trail.forEach((pos, i) => {
      const t  = (i + 1) / ball.trail.length;
      const tr = r * 0.85 * t;
      const L  = 55 + 20 * t;
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, tr, 0, Math.PI * 2);
      ctx.fillStyle = `hsla(${trailHue},${trailSat}%,${L}%,${(t * 0.45).toFixed(2)})`;
      ctx.fill();
    });

    // Skill-specific sphere colours (normal ball = silver)
    const SKILL_SPHERE = {
      superGuide: { glow:'#44ff88', c0:'#ccffee', c1:'#44ff88', c2:'#29aa55', c3:'#0d3318' },
      spookyBall: { glow:'#aa00ff', c0:'#e8bbff', c1:'#aa00ff', c2:'#7700dd', c3:'#2a0066' },
      lightning:  { glow:'#44aaff', c0:'#e0f0ff', c1:'#44aaff', c2:'#0055cc', c3:'#001133' },
      multiball:  { glow:'#ff8844', c0:'#fff0e0', c1:'#ff8844', c2:'#cc5500', c3:'#2c0e00' },
    };
    const sk = SKILL_SPHERE[this.game.currentBallSkill] ?? null;

    ctx.save();
    ctx.shadowColor = sk ? sk.glow : '#aaaaaa';
    ctx.shadowBlur  = 22;

    // Sphere body
    const sphGrad = ctx.createRadialGradient(hx, hy, r * 0.04, bx, by, r);
    if (sk) {
      sphGrad.addColorStop(0.00, sk.c0);
      sphGrad.addColorStop(0.25, sk.c1);
      sphGrad.addColorStop(0.65, sk.c2);
      sphGrad.addColorStop(1.00, sk.c3);
    } else {
      // Normal ball — silver
      sphGrad.addColorStop(0.00, '#f0f0f0');
      sphGrad.addColorStop(0.25, '#cccccc');
      sphGrad.addColorStop(0.65, '#707070');
      sphGrad.addColorStop(1.00, '#1a1a1a');
    }
    ctx.beginPath();
    ctx.arc(bx, by, r, 0, Math.PI * 2);
    ctx.fillStyle = sphGrad;
    ctx.fill();

    // Specular glint
    ctx.shadowBlur = 0;
    const specGrad = ctx.createRadialGradient(hx, hy, 0, hx, hy, r * 0.48);
    specGrad.addColorStop(0,   'rgba(255,255,255,0.95)');
    specGrad.addColorStop(0.4, 'rgba(255,255,255,0.30)');
    specGrad.addColorStop(1,   'rgba(255,255,255,0)');
    ctx.beginPath();
    ctx.arc(hx, hy, r * 0.48, 0, Math.PI * 2);
    ctx.fillStyle = specGrad;
    ctx.fill();

    ctx.restore();
  }

  // ─────────────────────────────────────────────────────────────────────────
  //  Lightning — jagged arcs from green peg to chain-hit pegs
  // ─────────────────────────────────────────────────────────────────────────

  _drawLightning() {
    const { ctx, game } = this;
    if (!game.lightningData) return;
    const { source, targets, timer, maxTimer } = game.lightningData;
    const alpha = timer / maxTimer;

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.lineWidth   = 1.5 + alpha;
    ctx.shadowColor = '#ccddff';
    ctx.shadowBlur  = 14;

    targets.forEach(target => {
      const dx   = target.x - source.x;
      const dy   = target.y - source.y;
      const len  = Math.sqrt(dx * dx + dy * dy) || 1;
      const px   = -dy / len;  // perpendicular unit vector
      const py   =  dx / len;
      const steps = 5;

      ctx.strokeStyle = `rgba(180,210,255,${alpha})`;
      ctx.beginPath();
      ctx.moveTo(source.x, source.y);
      for (let i = 1; i < steps; i++) {
        const t      = i / steps;
        const jitter = (Math.random() - 0.5) * 30 * Math.sin(t * Math.PI);
        ctx.lineTo(
          source.x + dx * t + px * jitter,
          source.y + dy * t + py * jitter
        );
      }
      ctx.lineTo(target.x, target.y);
      ctx.stroke();

      // Bright core
      ctx.strokeStyle = `rgba(255,255,255,${alpha * 0.6})`;
      ctx.lineWidth   = 0.8;
      ctx.beginPath();
      ctx.moveTo(source.x, source.y);
      ctx.lineTo(target.x, target.y);
      ctx.stroke();
    });

    ctx.restore();
  }

  // ─────────────────────────────────────────────────────────────────────────
  //  Bucket — gradient fill + rim highlight
  // ─────────────────────────────────────────────────────────────────────────

  _drawBucket() {
    const { ctx, game } = this;
    const b = game.bucket;
    if (!b.visible) return;

    ctx.save();
    ctx.shadowColor = '#ffcc44';
    ctx.shadowBlur  = 12;

    // Trapezoid: wide top, narrow bottom
    ctx.beginPath();
    ctx.moveTo(b.left,       b.top);
    ctx.lineTo(b.right,      b.top);
    ctx.lineTo(b.innerRight, b.bottom);
    ctx.lineTo(b.innerLeft,  b.bottom);
    ctx.closePath();

    const bGrad = ctx.createLinearGradient(b.left, b.top, b.left, b.bottom);
    bGrad.addColorStop(0,   '#8b6200');
    bGrad.addColorStop(0.4, '#6b4a00');
    bGrad.addColorStop(1,   '#3a2600');
    ctx.fillStyle = bGrad;
    ctx.fill();

    ctx.strokeStyle = '#ffcc44';
    ctx.lineWidth   = 2;
    ctx.stroke();

    // Top rim highlight
    ctx.shadowBlur  = 0;
    ctx.strokeStyle = 'rgba(255,240,180,0.55)';
    ctx.lineWidth   = 1;
    ctx.beginPath();
    ctx.moveTo(b.left + 5,  b.top + 2);
    ctx.lineTo(b.right - 5, b.top + 2);
    ctx.stroke();

    ctx.fillStyle    = '#fff0aa';
    ctx.font         = 'bold 8px Arial';
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('FREE BALL', b.x, b.y);
    ctx.restore();
  }

  // ─────────────────────────────────────────────────────────────────────────
  //  Fever holes (legacy — not called from main render path)
  // ─────────────────────────────────────────────────────────────────────────

  _drawFeverHoles() {
    const { ctx, game } = this;
    const { width } = game.canvas;
    const y       = game.canvas.height - 28;
    const spacing = width / (FEVER_HOLE_VALUES.length + 1);

    FEVER_HOLE_VALUES.forEach((val, i) => {
      const x  = spacing * (i + 1);
      const hw = 52, hh = 22;
      ctx.save();
      ctx.shadowColor = '#ffcc00';
      ctx.shadowBlur  = 14;
      ctx.fillStyle   = '#3a2900';
      ctx.beginPath();
      this._roundRect(x - hw / 2, y - hh / 2, hw, hh, 5);
      ctx.fill();
      ctx.strokeStyle = '#ffcc00';
      ctx.lineWidth   = 2;
      ctx.stroke();
      ctx.shadowBlur   = 0;
      ctx.fillStyle    = '#ffdd44';
      ctx.font         = 'bold 10px Arial';
      ctx.textAlign    = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(val >= 1000 ? `${val / 1000}K` : `${val}`, x, y);
      ctx.restore();
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  //  Fever rainbow
  // ─────────────────────────────────────────────────────────────────────────

  _drawRainbow() {
    const { ctx, game } = this;
    const { width, height } = game.canvas;
    const feverTimer = game.feverTimer;
    if (feverTimer <= 0) return;

    // Sweep right→left over 60 frames (~1 s at 60 fps physics)
    const sweepProgress = Math.min(feverTimer / 60, 1);

    // Fade out only in the final 40 frames of fever (280 total)
    const fadeOut = feverTimer > 240 ? Math.max(0, 1 - (feverTimer - 240) / 40) : 1;

    ctx.save();
    ctx.globalAlpha = fadeOut * 0.75;

    // Clip to the revealed portion (expands from right to left)
    ctx.beginPath();
    ctx.rect(width * (1 - sweepProgress), 0, sweepProgress * width, height);
    ctx.clip();

    const cx    = width / 2;
    const cy    = height + 80;
    const bands = ['#ff0000', '#ff8800', '#ffff00', '#00ff00', '#0088ff', '#8800ff'];
    bands.forEach((color, i) => {
      const r = 560 - i * 18;
      ctx.beginPath();
      ctx.arc(cx, cy, r, Math.PI, Math.PI * 2);
      ctx.strokeStyle = color;
      ctx.lineWidth   = 16;
      ctx.stroke();
    });
    ctx.restore();
  }

  // ─────────────────────────────────────────────────────────────────────────
  //  Trajectory preview
  // ─────────────────────────────────────────────────────────────────────────

  _drawTrajectory() {
    const { ctx, game } = this;
    const { angle }  = game.launcher;
    const tip        = game.launcher.getBarrelTip();
    const speed      = game.launcher.FIRE_SPEED;
    const extended   = game.superGuideActive;

    // Super Guide: pass pegs so trajectory simulates actual peg collisions
    const pegs = extended ? game.levelSystem.pegs : null;

    const { points, hitPegs } = game.physics.simulateTrajectory(
      tip.x, tip.y,
      Math.cos(angle) * speed,
      Math.sin(angle) * speed,
      game.canvas, extended ? 55 : 12, extended, pegs
    );

    if (points.length < 2) return;

    if (extended) {
      // ── Super Guide: glowing green beam ──────────────────────────────────
      ctx.save();
      ctx.lineCap  = 'round';
      ctx.lineJoin = 'round';

      const p0   = points[0];
      const pEnd = points[points.length - 1];

      const buildPath = () => {
        ctx.beginPath();
        ctx.moveTo(p0.x, p0.y);
        // Quadratic Bezier through midpoints — smooth arc instead of line segments
        for (let i = 0; i < points.length - 1; i++) {
          const mx = (points[i].x + points[i + 1].x) / 2;
          const my = (points[i].y + points[i + 1].y) / 2;
          ctx.quadraticCurveTo(points[i].x, points[i].y, mx, my);
        }
        ctx.lineTo(pEnd.x, pEnd.y);
      };

      const makeGrad = (r, g, b, alphaStart, alphaEnd) => {
        const gr = ctx.createLinearGradient(p0.x, p0.y, pEnd.x, pEnd.y);
        gr.addColorStop(0, `rgba(${r},${g},${b},${alphaStart})`);
        gr.addColorStop(1, `rgba(${r},${g},${b},${alphaEnd})`);
        return gr;
      };

      // Wide ball-body sweep — fades out along trajectory
      ctx.shadowColor = '#44ff88';
      ctx.shadowBlur  = 14;
      ctx.strokeStyle = makeGrad(60, 220, 110, 0.28, 0);
      ctx.lineWidth   = 16;
      buildPath(); ctx.stroke();

      // Medium glow ring
      ctx.shadowBlur  = 8;
      ctx.strokeStyle = makeGrad(80, 255, 140, 0.50, 0);
      ctx.lineWidth   = 6;
      buildPath(); ctx.stroke();

      // Bright core
      ctx.shadowBlur  = 0;
      ctx.strokeStyle = makeGrad(200, 255, 220, 0.95, 0);
      ctx.lineWidth   = 1.5;
      buildPath(); ctx.stroke();

      // Pulsating white glow rings on pegs the beam will hit
      const pulse = 0.55 + 0.45 * Math.sin(Date.now() / 180);
      hitPegs.forEach(peg => {
        ctx.shadowColor = '#ffffff';
        ctx.shadowBlur  = 12 * pulse;
        ctx.strokeStyle = `rgba(255,255,255,${0.55 + 0.35 * pulse})`;
        ctx.lineWidth   = 1.2;
        ctx.beginPath();
        ctx.arc(peg.pos.x, peg.pos.y, peg.radius + 3, 0, Math.PI * 2);
        ctx.stroke();
      });

      ctx.restore();
    } else {
      // ── Normal aim: subtle blue dots ────────────────────────────────────
      points.forEach((p, i) => {
        const t = 1 - i / points.length;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 3.5 * t + 0.5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(190,215,255,${t * 0.7})`;
        ctx.fill();
      });
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  //  Launcher cannon — cylindrical gradient barrel + metallic base
  // ─────────────────────────────────────────────────────────────────────────

  _drawLauncher() {
    const { ctx, game } = this;
    const { pos, angle, barrelLength } = game.launcher;
    const bw = 14;

    ctx.save();
    ctx.translate(pos.x, pos.y);
    ctx.rotate(angle);

    // Barrel — linear gradient simulates cylindrical shading
    ctx.shadowColor = '#8899cc';
    ctx.shadowBlur  = 14;
    const barGrad = ctx.createLinearGradient(0, -bw, 0, bw);
    barGrad.addColorStop(0.00, '#aabbdd');
    barGrad.addColorStop(0.28, '#ffffff');
    barGrad.addColorStop(0.55, '#778899');
    barGrad.addColorStop(1.00, '#2a3344');
    ctx.fillStyle = barGrad;
    ctx.beginPath();
    ctx.roundRect(2, -bw, barrelLength - 2, bw * 2, 4);
    ctx.fill();

    // Reinforcement band near base
    ctx.shadowBlur = 0;
    ctx.fillStyle  = '#556677';
    ctx.fillRect(4, -bw - 2, 12, bw * 2 + 4);
    ctx.fillStyle  = '#aabbcc';
    ctx.fillRect(5, -bw - 1, 10, 2);

    // Base pivot — coloured by the next/active ball's skill
    const PIVOT_COLORS = {
      superGuide: { hi:'#ccffee', mid:'#29aa55', dark:'#0d3318', glow:'#44ff88', rim:'#44ff88' },
      spookyBall: { hi:'#e8bbff', mid:'#7700dd', dark:'#2a0066', glow:'#aa00ff', rim:'#aa00ff' },
      lightning:  { hi:'#e0f0ff', mid:'#0055cc', dark:'#001133', glow:'#44aaff', rim:'#44aaff' },
      multiball:  { hi:'#fff0e0', mid:'#cc5500', dark:'#2c0e00', glow:'#ff8844', rim:'#ff8844' },
    };
    // During aiming show next ball's slot; during shooting show current ball
    const pivotSkillId = game.state === 'SHOOTING'
      ? game.currentBallSkill
      : (game.ballSlots[10 - game.ballCount] ?? null);
    const pc = PIVOT_COLORS[pivotSkillId] ?? { hi:'#e0e0e0', mid:'#888888', dark:'#1a1a1a', glow:'#aaaaaa', rim:'#cccccc' };

    const baseGrad = ctx.createRadialGradient(-5, -5, 2, 0, 0, 17);
    baseGrad.addColorStop(0,   pc.hi);
    baseGrad.addColorStop(0.4, pc.mid);
    baseGrad.addColorStop(1,   pc.dark);
    ctx.shadowColor = pc.glow;
    ctx.shadowBlur  = 18;
    ctx.beginPath();
    ctx.arc(0, 0, 17, 0, Math.PI * 2);
    ctx.fillStyle = baseGrad;
    ctx.fill();
    ctx.strokeStyle = pc.rim + '99';
    ctx.lineWidth   = 1.5;
    ctx.stroke();

    ctx.restore();
  }

  // ─────────────────────────────────────────────────────────────────────────
  //  Particles — radial gradient sparkle (white core → color → transparent)
  // ─────────────────────────────────────────────────────────────────────────

  _drawParticles() {
    const { ctx, game } = this;
    for (const p of game.particles.particles) {
      const alpha = p.life / p.maxLife;
      const r     = p.radius * (0.4 + alpha * 0.6);

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.shadowColor = p.color;
      ctx.shadowBlur  = 12;

      const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r);
      grad.addColorStop(0,    '#ffffff');
      grad.addColorStop(0.35, p.color);
      grad.addColorStop(1,    p.color + '00');
      ctx.beginPath();
      ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();

      ctx.restore();
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  //  Floating score texts — drop shadow + color glow
  // ─────────────────────────────────────────────────────────────────────────

  _drawFloatingTexts() {
    const { ctx, game } = this;
    for (const ft of game.score.floatingTexts) {
      ctx.save();
      ctx.globalAlpha  = ft.alpha;
      ctx.font         = `bold ${Math.round(14 * (ft.scale || 1))}px Arial`;
      ctx.textAlign    = 'center';
      ctx.textBaseline = 'middle';

      // Drop shadow for legibility over background
      ctx.shadowColor = '#000000';
      ctx.shadowBlur  = 3;
      ctx.fillStyle   = 'rgba(0,0,0,0.55)';
      ctx.fillText(ft.text, ft.x + 1, ft.y + 1);

      // Colored glow
      ctx.shadowColor = ft.color;
      ctx.shadowBlur  = 10;
      ctx.fillStyle   = ft.color;
      ctx.fillText(ft.text, ft.x, ft.y);

      ctx.restore();
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  //  Final catch buckets — gradient slots with metallic dividers
  // ─────────────────────────────────────────────────────────────────────────

  _drawFinalBuckets() {
    const { ctx, game } = this;
    const { width, height } = game.canvas;
    const slotValues = [10000, 50000, 100000, 50000, 10000];
    const slotCount  = slotValues.length;
    const slotW      = width / slotCount;
    const bucketTop  = 618;
    const bucketH    = height - bucketTop;

    // Gold tier per slot value: 100K = bright, 50K = medium, 10K = muted
    const tierMap = {
      100000: { rim: '#ffcc44', glow: 'rgba(255,180,0,0.65)',  text: '#ffcc44', blur: 16, fill0: 'rgba(28,16,0,0.92)',  fill1: 'rgba(10,6,0,0.96)',  font: 13 },
       50000: { rim: '#c89830', glow: 'rgba(190,130,0,0.50)',  text: '#c89830', blur: 10, fill0: 'rgba(20,12,0,0.92)',  fill1: 'rgba(8,5,0,0.96)',   font: 12 },
       10000: { rim: '#7a6020', glow: 'rgba(110,85,0,0.40)',   text: '#8a7030', blur:  6, fill0: 'rgba(14,10,0,0.92)',  fill1: 'rgba(6,4,0,0.96)',   font: 11 },
    };

    for (let i = 0; i < slotCount; i++) {
      const x    = i * slotW;
      const tier = tierMap[slotValues[i]];

      ctx.save();
      ctx.shadowColor = tier.glow;
      ctx.shadowBlur  = tier.blur;

      const slotGrad = ctx.createLinearGradient(x, bucketTop, x, height);
      slotGrad.addColorStop(0, tier.fill0);
      slotGrad.addColorStop(1, tier.fill1);
      ctx.fillStyle = slotGrad;
      ctx.fillRect(x, bucketTop, slotW, bucketH);

      ctx.strokeStyle = tier.rim;
      ctx.lineWidth   = 1.5;
      ctx.strokeRect(x + 0.75, bucketTop + 0.75, slotW - 1.5, bucketH - 1.5);
      ctx.shadowBlur  = 0;

      ctx.shadowColor  = tier.glow;
      ctx.shadowBlur   = tier.blur / 2;
      ctx.fillStyle    = tier.text;
      ctx.font         = `bold ${tier.font}px Arial`;
      ctx.textAlign    = 'center';
      ctx.textBaseline = 'middle';
      const label = slotValues[i] >= 1000 ? `${slotValues[i] / 1000}K` : `${slotValues[i]}`;
      ctx.fillText(label, x + slotW / 2, bucketTop + bucketH / 2);
      ctx.restore();
    }

    // Dividers — blue-tinted metallic, matching HUD border palette
    for (let i = 1; i < slotCount; i++) {
      ctx.save();
      const divX    = i * slotW;
      const divGrad = ctx.createLinearGradient(divX - 3, 0, divX + 3, 0);
      divGrad.addColorStop(0,   'rgba(10,18,50,0.8)');
      divGrad.addColorStop(0.5, 'rgba(110,140,230,0.9)');
      divGrad.addColorStop(1,   'rgba(10,18,50,0.8)');
      ctx.fillStyle   = divGrad;
      ctx.shadowColor = 'rgba(80,120,255,0.45)';
      ctx.shadowBlur  = 4;
      ctx.fillRect(divX - 3, bucketTop - 2, 6, bucketH + 2);
      ctx.restore();
    }

    // Top rim — matches HUD panel bottom border
    ctx.save();
    ctx.strokeStyle = 'rgba(80,100,180,0.6)';
    ctx.lineWidth   = 1.5;
    ctx.shadowColor = 'rgba(80,120,255,0.4)';
    ctx.shadowBlur  = 6;
    ctx.beginPath();
    ctx.moveTo(0, bucketTop);
    ctx.lineTo(width, bucketTop);
    ctx.stroke();
    ctx.restore();
  }

  // ─────────────────────────────────────────────────────────────────────────
  //  Helpers
  // ─────────────────────────────────────────────────────────────────────────

  _roundRect(x, y, w, h, r) {
    const ctx = this.ctx;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  _genStars(count) {
    return Array.from({ length: count }, () => {
      const baseAlpha = Math.random() * 0.55 + 0.15;
      return {
        x:         Math.random() * 780,
        y:         Math.random() * 640,
        r:         Math.random() * 1.6 + 0.2,
        baseAlpha,
        alpha:     baseAlpha,  // start visible, not at 0
        phase:     Math.random() * Math.PI * 2,
        speed:     0.4 + Math.random() * 1.2,
      };
    });
  }
}
