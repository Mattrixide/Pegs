
import { loadHighScores, saveHighScore } from '../core/HighScores.js';

export class Screens {
  constructor(game) {
    this.game = game;
    this.ctx  = game.ctx;
    this._titlePegs   = null;
    this._menuBall    = null;
    this._showHelp    = false;
    this._highScores      = loadHighScores();
    this._hsScrollIdx     = 0;
    this._crawlY          = 10 * 40;    // put all 10 scores in view immediately
    this._crawlStartTime  = performance.now(); // for framerate-independent time
  }

  addScore(score, initials = '???') {
    this._highScores     = saveHighScore(score, initials);
    this._hsScrollIdx    = 0;
    this._crawlY         = 10 * 40;
    this._crawlStartTime = performance.now();
  }

  // ── Initial entry ──────────────────────────────────────────────────────────

  initInitialEntry(score, isVictory) {
    this._ieScore     = score;
    this._ieVictory   = isVictory;
    this._initials    = ['A', 'A', 'A'];
    this._initialsPos = 0;
    this._ieBlink     = 0;
    // Rank this score would achieve against current board
    const higher  = this._highScores.filter(e => e.score > score).length;
    const rank    = higher + 1;
    this._ieRank  = (rank <= 10) ? rank : null;
  }

  tickInitialEntry() {
    this._ieBlink = (this._ieBlink + 1) % 60;
  }

  // Returns up/down arrow hit-test rects for each of the 3 initial slots
  getInitialEntryRects(width, height) {
    const SLOT_X = [width / 2 - 100, width / 2, width / 2 + 100];
    const boxTop = Math.round(height / 2) - 32;
    const boxH   = 80;
    return SLOT_X.map(cx => ({
      up:   { x: cx - 20, y: boxTop - 36, w: 40, h: 28 },
      down: { x: cx - 20, y: boxTop + boxH + 8,  w: 40, h: 28 },
    }));
  }

  drawInitialEntry(stars) {
    const { ctx, game } = this;
    const { width, height } = game.canvas;
    const cx     = width / 2;
    const CHARS  = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const SLOT_X = [cx - 100, cx, cx + 100];
    const boxTop = Math.round(height / 2) - 32;
    const boxH   = 80;
    const t      = Date.now();

    // Background
    const grad = ctx.createLinearGradient(0, 0, 0, height);
    grad.addColorStop(0, '#060018');
    grad.addColorStop(1, '#0e0030');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // Stars
    stars.forEach(s => {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,255,255,${s.alpha})`;
      ctx.fill();
    });

    // Scanlines
    ctx.globalAlpha = 0.045;
    ctx.fillStyle = '#000';
    for (let y = 0; y < height; y += 3) ctx.fillRect(0, y, width, 1);
    ctx.globalAlpha = 1;

    ctx.save();
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';

    // Result header
    const pulse = 0.8 + 0.2 * Math.sin(t / 280);
    if (this._ieVictory) {
      ctx.shadowColor = `rgba(255,200,0,${pulse * 0.9})`;
      ctx.shadowBlur  = 22;
      ctx.fillStyle   = `rgba(255,228,60,${pulse})`;
      ctx.font        = 'bold 20px monospace';
      ctx.fillText('ALL LEVELS COMPLETE!', cx, height / 2 - 205);
    } else {
      ctx.shadowColor = `rgba(255,50,50,${pulse * 0.8})`;
      ctx.shadowBlur  = 22;
      ctx.fillStyle   = `rgba(255,90,90,${pulse})`;
      ctx.font        = 'bold 20px monospace';
      ctx.fillText('GAME OVER', cx, height / 2 - 205);
    }

    // "ENTER YOUR INITIALS" title
    ctx.shadowColor = `rgba(255,200,0,${pulse * 0.6})`;
    ctx.shadowBlur  = 14;
    ctx.fillStyle   = `rgba(255,215,50,${pulse})`;
    ctx.font        = 'bold 16px monospace';
    ctx.fillText('\u2500\u2500 ENTER YOUR INITIALS \u2500\u2500', cx, height / 2 - 174);

    // Score
    ctx.shadowColor = '#00ccff';
    ctx.shadowBlur  = 12;
    ctx.fillStyle   = 'rgba(160,210,255,0.85)';
    ctx.font        = 'bold 11px monospace';
    ctx.fillText('SCORE', cx, height / 2 - 142);
    ctx.shadowColor = '#00eeff';
    ctx.shadowBlur  = 16;
    ctx.fillStyle   = '#00eeff';
    ctx.font        = 'bold 26px monospace';
    ctx.fillText(this._ieScore.toLocaleString(), cx, height / 2 - 112);

    // Rank badge
    if (this._ieRank !== null) {
      const isTop = this._ieRank === 1;
      ctx.shadowColor = isTop ? '#ffdd00' : '#ff88ff';
      ctx.shadowBlur  = 16;
      ctx.fillStyle   = isTop ? '#ffe040' : '#ff88ff';
      ctx.font        = `bold 13px monospace`;
      const label = isTop ? '\u2605 NEW HIGH SCORE \u2605' : `RANK  #${this._ieRank}  \u2014  TOP 10`;
      ctx.fillText(label, cx, height / 2 - 76);
    }

    ctx.shadowBlur = 0;

    // Character slots
    SLOT_X.forEach((sx, si) => {
      const isActive = si === this._initialsPos;
      const isDone   = si < this._initialsPos;
      const char     = this._initials[si];
      const blink    = this._ieBlink < 30;
      const arrowA   = isActive ? 1.0 : 0.28;

      // Up arrow
      ctx.globalAlpha  = arrowA;
      ctx.shadowColor  = isActive ? '#00eeff' : 'transparent';
      ctx.shadowBlur   = isActive ? 8 : 0;
      ctx.fillStyle    = isActive ? '#00eeff' : '#2a4870';
      ctx.font         = 'bold 18px monospace';
      ctx.fillText('\u25b2', sx, boxTop - 22);
      ctx.globalAlpha  = 1;
      ctx.shadowBlur   = 0;

      // Box
      ctx.shadowColor = isActive ? '#00eeff' : 'transparent';
      ctx.shadowBlur  = isActive ? 20 : 0;
      ctx.strokeStyle = isActive ? '#00eeff' : (isDone ? '#2a5580' : '#162240');
      ctx.lineWidth   = isActive ? 2.5 : 1.5;
      ctx.fillStyle   = 'rgba(0,8,28,0.88)';
      ctx.beginPath();
      ctx.roundRect(sx - 34, boxTop, 68, boxH, 5);
      ctx.fill();
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Letter — blinks on active slot
      if (!isActive || blink) {
        ctx.shadowColor = isActive ? '#00ffff' : (isDone ? '#336688' : '#1a2a44');
        ctx.shadowBlur  = isActive ? 18 : 5;
        ctx.fillStyle   = isActive ? '#ffffff' : (isDone ? '#7aadcc' : '#243650');
        ctx.font        = 'bold 42px monospace';
        ctx.fillText(char, sx, boxTop + boxH / 2 + 2);
        ctx.shadowBlur  = 0;
      }

      // Down arrow
      ctx.globalAlpha = arrowA;
      ctx.shadowColor = isActive ? '#00eeff' : 'transparent';
      ctx.shadowBlur  = isActive ? 8 : 0;
      ctx.fillStyle   = isActive ? '#00eeff' : '#2a4870';
      ctx.font        = 'bold 18px monospace';
      ctx.fillText('\u25bc', sx, boxTop + boxH + 22);
      ctx.globalAlpha = 1;
      ctx.shadowBlur  = 0;
    });

    // Controls hint
    ctx.fillStyle = 'rgba(60,90,160,0.65)';
    ctx.font      = '10px monospace';
    ctx.fillText('\u25b2\u25bc CHANGE    \u25c4\u25ba MOVE    ENTER / CLICK TO CONFIRM', cx, boxTop + boxH + 72);

    ctx.restore();
  }

  // ── Menu ──────────────────────────────────────────────────────────────────

  // Physics-only update for the menu ball — called from the fixed-timestep
  // accumulator in Game._update() so it runs at exactly 60 steps/second
  // regardless of display refresh rate.
  updateMenu() {
    const { game } = this;
    const { width, height } = game.canvas;
    const cy = height * 0.38;

    if (!this._titlePegs) this._titlePegs = this._buildTitlePegs(width, cy - 20);

    const b = this._menuBall;
    if (!b || b.y - b.r > height || b._fadeOut >= 30) {
      this._menuBall = {
        x: width / 2 + (Math.random() - 0.5) * 160,
        y: -10, vx: (Math.random() - 0.5) * 3, vy: 1.5,
        r: 7, trail: [], _stuckFrames: 0, _fadeOut: 0,
      };
    }
    const ball = this._menuBall;

    const speed = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy);
    if (speed < 0.4) ball._stuckFrames++;
    else             ball._stuckFrames = 0;
    if (ball._stuckFrames >= 90) ball._fadeOut++;

    ball.trail.push({ x: ball.x, y: ball.y });
    if (ball.trail.length > 10) ball.trail.shift();
    ball.vy += 0.22;
    ball.x  += ball.vx;
    ball.y  += ball.vy;
    if (ball.x - ball.r < 0)     { ball.x = ball.r;         ball.vx =  Math.abs(ball.vx); }
    if (ball.x + ball.r > width) { ball.x = width - ball.r; ball.vx = -Math.abs(ball.vx); }
    for (const peg of this._titlePegs) {
      const dx = ball.x - peg.x, dy = ball.y - peg.y;
      const d  = Math.sqrt(dx * dx + dy * dy);
      const minD = ball.r + peg.r;
      if (d < minD && d > 0) {
        const nx = dx / d, ny = dy / d;
        ball.x = peg.x + nx * (minD + 0.5);
        ball.y = peg.y + ny * (minD + 0.5);
        const dot = ball.vx * nx + ball.vy * ny;
        if (dot < 0) {
          ball.vx -= 2 * dot * nx;
          ball.vy -= 2 * dot * ny;
          ball.vx *= 0.75;
          ball.vy *= 0.75;
        }
      }
    }
  }

  drawMenu(stars) {
    const { ctx, game } = this;
    const { width, height } = game.canvas;
    const cy = height * 0.38;

    // Stars
    stars.forEach(s => {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,255,255,${s.alpha})`;
      ctx.fill();
    });

    // ── Animated PEGS title + bouncing ball ─────────────────────────────
    if (!this._titlePegs) this._titlePegs = this._buildTitlePegs(width, cy - 20);

    const ball = this._menuBall;
    if (!ball) return;

    const ballAlpha = ball._fadeOut > 0 ? Math.max(0, 1 - ball._fadeOut / 30) : 1;

    ctx.save();
    ctx.globalAlpha = ballAlpha;
    ball.trail.forEach((pos, i) => {
      const t = (i + 1) / ball.trail.length;
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, ball.r * 0.85 * t, 0, Math.PI * 2);
      ctx.fillStyle = `hsla(210,70%,65%,${(t * 0.45).toFixed(2)})`;
      ctx.fill();
    });
    ctx.restore();

    for (const peg of this._titlePegs) this._drawMenuPeg(peg.x, peg.y, peg.r, peg.type);

    ctx.save();
    ctx.globalAlpha = ballAlpha;
    this._drawMenuBall(ball.x, ball.y, ball.r);
    ctx.restore();

    ctx.save();

    // ── Play button (pulsating glow) ─────────────────────────────────────
    const playBlur = 10 + 16 * (0.5 + 0.5 * Math.sin(Date.now() / 480));
    this._drawMenuButton(width / 2, cy + 108, 200, 44, 'PLAY', '#5599ff', '#2244cc', playBlur);

    // ── High score list ───────────────────────────────────────────────────
    this._drawHighScores(width, height);

    // ── Corner icon buttons ───────────────────────────────────────────────
    const iconR = 18;
    this._drawGearButton(width - 30, height - 30, iconR);
    this._drawHelpButton(width - 66, height - 30, iconR);

    ctx.restore();

    // ── Version number (lower-left) ───────────────────────────────────────
    ctx.save();
    ctx.font         = '11px monospace';
    ctx.fillStyle    = 'rgba(180,180,220,0.45)';
    ctx.textAlign    = 'left';
    ctx.textBaseline = 'bottom';
    ctx.fillText(`v${game.version}`, 10, height - 8);
    ctx.restore();

    if (this._showHelp) this._drawHelpOverlay(width, height);
  }

  // Returns hit-test rects for menu buttons
  getMenuButtonRects(width, height) {
    const cy = height * 0.38;
    return {
      play: { x: width / 2 - 100, y: cy + 86,  w: 200, h: 44 },
      gear: { x: width - 48, y: height - 48, w: 36, h: 36 },
      help: { x: width - 84, y: height - 48, w: 36, h: 36 },
    };
  }

  // Returns hit-test rects for 4 skill buttons (2×2 grid)
  getSkillButtonRects(width, height) {
    const cy    = height * 0.38;
    const row1Y = cy + 218;   // top of row 1
    const row2Y = cy + 256;   // top of row 2
    const bw    = 168, bh = 32;
    const cx    = width / 2;
    return [
      { skill: 'superGuide', x: cx - bw - 4, y: row1Y, w: bw, h: bh },
      { skill: 'spookyBall', x: cx + 4,       y: row1Y, w: bw, h: bh },
      { skill: 'lightning',  x: cx - bw - 4, y: row2Y, w: bw, h: bh },
      { skill: 'multiball',  x: cx + 4,       y: row2Y, w: bw, h: bh },
    ];
  }

  _buildCrawlLines(scores) {
    const lines = [];
    lines.push(''); // 1 leading blank
    if (scores.length === 0) {
      lines.push({ text: 'NO SCORES YET',      type: 'sub' });
      lines.push({ text: 'PLAY TO CLAIM A SPOT', type: 'sub' });
      lines.push('', '');
    } else {
      scores.forEach((entry, i) => {
        const num   = String(i + 1);
        const inits = (entry.initials ?? '---').toUpperCase();
        const score = entry.score.toLocaleString();
        const type  = i === 0 ? 'top' : i < 3 ? 'hi' : 'normal';
        lines.push({ text: `${num}  ${inits}  ${score}`, type });
      });
      lines.push('', '', '', '', '', ''); // trailing gap — ~7.5s pause before loop
    }
    // Normalise: bare strings → blank entries
    return lines.map(l => typeof l === 'string' ? { text: '', type: 'gap' } : l);
  }

  _drawHighScores(width, height) {
    const { ctx } = this;
    const cy   = height * 0.38;
    const vpX  = width / 2;

    // Crawl region — no box, floats directly over the starfield
    const PW           = 360;
    const px           = (width - PW) / 2;
    const CRAWL_TOP    = cy + 148;
    const CRAWL_BOTTOM = height - 56; // just above gear/help buttons
    const CRAWL_H      = CRAWL_BOTTOM - CRAWL_TOP;

    // Time-based position — completely independent of framerate
    const SPEED        = 0.032; // world units per ms ≈ 32 wu/sec (very slow)
    const scrollOff    = (performance.now() - this._crawlStartTime) * SPEED + this._crawlY;

    const FOCAL        = 350; // higher = gentler perspective, more lines readable
    const LINE_H_WORLD = 40;  // compact spacing so all scores are close together

    const contentLines = this._buildCrawlLines(this._highScores);
    const totalWorldH  = contentLines.length * LINE_H_WORLD;

    ctx.save();
    ctx.beginPath();
    ctx.rect(px, CRAWL_TOP, PW, CRAWL_H);
    ctx.clip();

    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';

    contentLines.forEach((line, i) => {
      if (!line.text) return;

      const rawZ = scrollOff - i * LINE_H_WORLD;
      const z    = ((rawZ % totalWorldH) + totalWorldH) % totalWorldH;

      const scale = FOCAL / (z + FOCAL);
      if (scale < 0.03) return;

      const screenY = CRAWL_BOTTOM - (z / (z + FOCAL)) * CRAWL_H;
      if (screenY < CRAWL_TOP || screenY > CRAWL_BOTTOM) return;

      // Fade near vanishing point
      const fadeTop = Math.min(1, (screenY - CRAWL_TOP) / (CRAWL_H * 0.30));
      const alpha   = fadeTop * Math.min(1, (scale - 0.03) / 0.05);
      if (alpha <= 0) return;

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(vpX, screenY);
      // scaleX = perspective narrowing; scaleY * 0.52 = tilted-plane illusion
      ctx.scale(scale, scale * 0.52);

      switch (line.type) {
        case 'top':
          ctx.shadowColor = 'rgba(160,200,255,0.55)';
          ctx.shadowBlur  = 10;
          ctx.fillStyle   = 'rgba(210,228,255,0.97)';
          ctx.font        = 'bold 28px monospace';
          break;
        case 'hi':
          ctx.fillStyle = 'rgba(158,185,238,0.93)';
          ctx.font      = 'bold 26px monospace';
          break;
        case 'date':
          ctx.fillStyle = 'rgba(80,108,168,0.82)';
          ctx.font      = '20px monospace';
          break;
        case 'sub':
          ctx.fillStyle = 'rgba(95,122,178,0.80)';
          ctx.font      = '24px monospace';
          break;
        default:
          ctx.fillStyle = 'rgba(118,146,205,0.90)';
          ctx.font      = 'bold 26px monospace';
      }
      ctx.fillText(line.text, 0, 0);
      ctx.restore();
    });

    ctx.restore(); // end clip

    // Fade overlay at top — text dissolves into the vanishing point
    const topFade = ctx.createLinearGradient(0, CRAWL_TOP, 0, CRAWL_TOP + CRAWL_H * 0.18);
    topFade.addColorStop(0, 'rgba(4,0,15,1)');
    topFade.addColorStop(1, 'rgba(4,0,15,0)');
    ctx.fillStyle = topFade;
    ctx.fillRect(px, CRAWL_TOP, PW, CRAWL_H * 0.18);

    // Fade overlay at bottom — text rises in smoothly
    const botFade = ctx.createLinearGradient(0, CRAWL_BOTTOM - CRAWL_H * 0.08, 0, CRAWL_BOTTOM);
    botFade.addColorStop(0, 'rgba(4,0,15,0)');
    botFade.addColorStop(1, 'rgba(4,0,15,1)');
    ctx.fillStyle = botFade;
    ctx.fillRect(px, CRAWL_BOTTOM - CRAWL_H * 0.08, PW, CRAWL_H * 0.08);
  }

  _buildTitlePegs(width, titleCY) {
    const cs = 20, rs = 20, pegR = 7, la = 100;
    const letterColors = { P: 'orange', E: 'blue', G: 'green', S: 'purple' };
    const data = {
      P: [[1,1,1,0],[1,0,0,1],[1,1,1,0],[1,0,0,0],[1,0,0,0]],
      E: [[1,1,1,1],[1,0,0,0],[1,1,1,0],[1,0,0,0],[1,1,1,1]],
      G: [[0,1,1,0],[1,0,0,0],[1,0,0,0],[1,0,1,1],[0,1,1,0]],
      S: [[0,1,1,1],[1,0,0,0],[0,1,1,0],[0,0,0,1],[1,1,1,0]],
    };
    const letters = ['P','E','G','S'];
    const totalW  = (letters.length - 1) * la + 3 * cs;
    const startX  = width / 2 - totalW / 2;
    const startY  = titleCY - 2 * rs;
    const pegs = [];
    for (let li = 0; li < letters.length; li++) {
      const ch = letters[li], grid = data[ch], ox = startX + li * la;
      for (let row = 0; row < grid.length; row++)
        for (let col = 0; col < grid[row].length; col++)
          if (grid[row][col])
            pegs.push({ x: ox + col * cs, y: startY + row * rs, r: pegR, type: letterColors[ch] });
    }
    return pegs;
  }

  _drawMenuPeg(x, y, r, type) {
    const { ctx } = this;
    const C = {
      blue:   { dark: '#0e2766', mid: '#2255cc', bright: '#4499ff', glow: '#55aaff', spec: '#e0f0ff' },
      orange: { dark: '#551500', mid: '#bb3300', bright: '#ee6600', glow: '#ff8800', spec: '#fff0cc' },
      green:  { dark: '#0d3311', mid: '#1e7722', bright: '#33cc44', glow: '#44ee55', spec: '#ccffcc' },
      purple: { dark: '#2d0a44', mid: '#7711aa', bright: '#bb33dd', glow: '#dd44ff', spec: '#f0ddff' },
    }[type];
    const hx = x - r * 0.32, hy = y - r * 0.38;
    ctx.save();
    ctx.shadowColor = C.glow;
    ctx.shadowBlur  = 10;
    const g = ctx.createRadialGradient(hx, hy, r * 0.04, x, y, r);
    g.addColorStop(0.00, C.spec);
    g.addColorStop(0.35, C.bright);
    g.addColorStop(0.75, C.mid);
    g.addColorStop(1.00, C.dark);
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = g;
    ctx.fill();
    ctx.shadowBlur  = 0;
    ctx.strokeStyle = C.bright + '88';
    ctx.lineWidth   = 0.8;
    ctx.stroke();
    const sg = ctx.createRadialGradient(hx, hy, 0, hx, hy, r * 0.5);
    sg.addColorStop(0, 'rgba(255,255,255,0.6)');
    sg.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.beginPath();
    ctx.arc(hx, hy, r * 0.5, 0, Math.PI * 2);
    ctx.fillStyle = sg;
    ctx.fill();
    ctx.restore();
  }

  _drawMenuBall(x, y, r) {
    const { ctx } = this;
    const hx = x - r * 0.28, hy = y - r * 0.38;
    ctx.save();
    ctx.shadowColor = '#88aaff';
    ctx.shadowBlur  = 20;
    const g = ctx.createRadialGradient(hx, hy, r * 0.04, x, y, r);
    g.addColorStop(0.00, '#ddeeff');
    g.addColorStop(0.25, '#99bbee');
    g.addColorStop(0.65, '#4466aa');
    g.addColorStop(1.00, '#0e1e44');
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = g;
    ctx.fill();
    ctx.shadowBlur = 0;
    const sg = ctx.createRadialGradient(hx, hy, 0, hx, hy, r * 0.48);
    sg.addColorStop(0,   'rgba(255,255,255,0.95)');
    sg.addColorStop(0.4, 'rgba(255,255,255,0.30)');
    sg.addColorStop(1,   'rgba(255,255,255,0)');
    ctx.beginPath();
    ctx.arc(hx, hy, r * 0.48, 0, Math.PI * 2);
    ctx.fillStyle = sg;
    ctx.fill();
    ctx.restore();
  }

  _drawMenuButton(cx, cy, w, h, label, color, glow, blur = 16) {
    const { ctx } = this;
    const x = cx - w / 2;
    const y = cy - h / 2;
    ctx.save();
    ctx.shadowColor  = glow;
    ctx.shadowBlur   = blur;
    ctx.strokeStyle  = color;
    ctx.lineWidth    = 2;
    ctx.fillStyle    = 'rgba(0,0,20,0.7)';
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, 8);
    ctx.fill();
    ctx.stroke();
    ctx.shadowBlur   = blur * 0.35;
    ctx.fillStyle    = color;
    ctx.font         = 'bold 16px Arial';
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, cx, cy);
    ctx.restore();
  }

  _drawGearButton(cx, cy, r) {
    const { ctx } = this;
    ctx.save();
    // Background
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(12, 18, 48, 0.80)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(60, 80, 140, 0.45)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    // Gear path: alternating outer (tooth) and inner (valley) arcs
    const gr = r * 0.60, vr = r * 0.42, ir = r * 0.20;
    const teeth = 7, step = Math.PI * 2 / teeth, hw = step * 0.27;
    ctx.fillStyle = 'rgba(95, 120, 180, 0.62)';
    ctx.beginPath();
    for (let i = 0; i < teeth; i++) {
      const base = step * i - Math.PI / 2;
      ctx.arc(cx, cy, gr, base - hw, base + hw);        // tooth top
      ctx.arc(cx, cy, vr, base + hw, base + step - hw); // valley
    }
    ctx.closePath();
    ctx.fill();
    // Center hub hole (same color as bg)
    ctx.beginPath();
    ctx.arc(cx, cy, ir, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(12, 18, 48, 0.80)';
    ctx.fill();
    ctx.restore();
  }

  _drawHelpButton(cx, cy, r) {
    const { ctx } = this;
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(12, 18, 48, 0.80)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(60, 80, 140, 0.45)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.fillStyle = 'rgba(95, 120, 180, 0.70)';
    ctx.font = `bold ${Math.round(r * 1.05)}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('?', cx, cy + 1);
    ctx.restore();
  }

  _drawHelpOverlay(width, height) {
    const { ctx } = this;
    const pw = 420, ph = 480;
    const px = width / 2 - pw / 2, py = height / 2 - ph / 2;
    ctx.save();
    // Dim
    ctx.fillStyle = 'rgba(0, 0, 12, 0.78)';
    ctx.fillRect(0, 0, width, height);
    // Panel
    ctx.fillStyle   = 'rgba(8, 12, 38, 0.97)';
    ctx.strokeStyle = 'rgba(70, 100, 190, 0.50)';
    ctx.lineWidth   = 1.5;
    ctx.beginPath();
    ctx.roundRect(px, py, pw, ph, 10);
    ctx.fill();
    ctx.stroke();
    // Title
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'top';
    ctx.fillStyle    = '#99aadd';
    ctx.font         = 'bold 16px Arial';
    ctx.fillText('HOW TO PLAY', width / 2, py + 16);
    // Divider
    ctx.strokeStyle = 'rgba(70, 100, 190, 0.30)';
    ctx.lineWidth   = 1;
    ctx.beginPath();
    ctx.moveTo(px + 24, py + 40);
    ctx.lineTo(px + pw - 24, py + 40);
    ctx.stroke();
    // Instruction rows
    const rows = [
      ['AIM',    'Move the mouse to aim the cannon'],
      ['FIRE',   'Click to launch the ball'],
      ['WIN',    'Clear all orange pegs to complete the level'],
      ['BUCKET', 'Catch the ball in the bucket for a free ball'],
      ['BLUE',   '+10 pts per peg hit'],
      ['ORANGE', '+100 pts per peg hit'],
      ['PURPLE', '+500 pts per peg hit'],
      ['GREEN',  'Activates your selected skill power'],
    ];
    ctx.textBaseline = 'middle';
    ctx.textAlign    = 'left';
    const lx = px + 24, labelW = 68;
    rows.forEach(([label, desc], i) => {
      const ry = py + 54 + i * 24;
      ctx.fillStyle = 'rgba(90, 125, 210, 0.80)';
      ctx.font      = 'bold 10px Arial';
      ctx.fillText(label, lx, ry);
      ctx.fillStyle = 'rgba(185, 200, 235, 0.82)';
      ctx.font      = '12px Arial';
      ctx.fillText(desc, lx + labelW, ry);
    });
    // Skills divider
    const skillDivY = py + 54 + rows.length * 24 + 6;
    ctx.strokeStyle = 'rgba(70, 100, 190, 0.30)';
    ctx.lineWidth   = 1;
    ctx.beginPath();
    ctx.moveTo(px + 24, skillDivY);
    ctx.lineTo(px + pw - 24, skillDivY);
    ctx.stroke();
    // Skills header
    ctx.textAlign = 'center';
    ctx.fillStyle = '#99aadd';
    ctx.font      = 'bold 13px Arial';
    ctx.fillText('SKILLS', width / 2, skillDivY + 14);
    ctx.textAlign = 'left';
    ctx.fillStyle = 'rgba(140,160,210,0.60)';
    ctx.font      = '10px Arial';
    ctx.fillText('Click the ball counter to switch skills', lx, skillDivY + 30);
    // Skill rows
    const skillRows = [
      { label: 'SUPER GUIDE',  color: '#44ff88', desc: 'Shows extended aim trajectory' },
      { label: 'SPOOKY BALL',  color: '#cc88ff', desc: 'Ball returns from the top when it falls' },
      { label: 'LIGHTNING',    color: '#ffff44', desc: 'Green peg zaps nearby pegs' },
      { label: 'MULTI BALL',   color: '#ff8844', desc: 'Green peg spawns 2 extra balls' },
    ];
    skillRows.forEach((s, i) => {
      const ry = skillDivY + 46 + i * 24;
      ctx.fillStyle = s.color;
      ctx.font      = 'bold 10px Arial';
      ctx.fillText(s.label, lx, ry);
      ctx.fillStyle = 'rgba(185, 200, 235, 0.82)';
      ctx.font      = '12px Arial';
      ctx.fillText(s.desc, lx + 90, ry);
    });
    // Dismiss hint
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(100, 120, 175, 0.45)';
    ctx.font      = '11px Arial';
    ctx.fillText('click anywhere to close', width / 2, py + ph - 14);
    ctx.restore();
  }

  _drawPegLegend(cx, y) {
    const { ctx } = this;
    const items = [
      { color: '#2255bb', glow: '#4488ff', label: 'Blue  +10'    },
      { color: '#cc5500', glow: '#ff8800', label: 'Orange +100'  },
      { color: '#226622', glow: '#44dd44', label: 'Green  power' },
      { color: '#882299', glow: '#cc44ff', label: 'Purple +500'  },
    ];
    const spacing = 150;
    const startX  = cx - spacing * 1.5;
    items.forEach((item, i) => {
      const x = startX + i * spacing;
      ctx.save();
      ctx.shadowColor = item.glow;
      ctx.shadowBlur  = 10;
      ctx.beginPath();
      ctx.arc(x - 40, y, 8, 0, Math.PI * 2);
      ctx.fillStyle = item.color;
      ctx.fill();
      ctx.strokeStyle = item.glow;
      ctx.lineWidth   = 1.5;
      ctx.stroke();
      ctx.restore();

      ctx.fillStyle = 'rgba(210,220,255,0.8)';
      ctx.font      = '12px Arial';
      ctx.textAlign = 'left';
      ctx.fillText(item.label, x - 28, y + 4);
    });
  }

  // ── Game Over / Victory ───────────────────────────────────────────────────

  drawGameOver() {
    const { ctx, game } = this;
    const { width, height } = game.canvas;

    ctx.save();
    ctx.fillStyle = 'rgba(0,0,5,0.72)';
    ctx.fillRect(0, 0, width, height);

    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';

    ctx.shadowColor = '#ff4444';
    ctx.shadowBlur  = 25;
    ctx.fillStyle   = '#ff8888';
    ctx.font        = 'bold 58px Arial';
    ctx.fillText('GAME OVER', width / 2, height / 2 - 55);

    ctx.shadowBlur = 0;
    ctx.fillStyle  = '#ddddff';
    ctx.font       = 'bold 26px Arial';
    ctx.fillText(`Final Score: ${game.score.totalScore.toLocaleString()}`, width / 2, height / 2 + 5);

    ctx.fillStyle = 'rgba(180,190,255,0.75)';
    ctx.font      = '17px Arial';
    ctx.fillText('Click to return to menu', width / 2, height / 2 + 55);
    ctx.restore();
  }

  // ── Level Clear ───────────────────────────────────────────────────────────

  drawLevelClear(nextLevelName) {
    const { ctx, game } = this;
    const { width, height } = game.canvas;

    ctx.save();
    ctx.fillStyle    = 'rgba(0,0,10,0.55)';
    ctx.fillRect(0, 0, width, height);
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';

    ctx.shadowColor = '#ffcc00';
    ctx.shadowBlur  = 30;
    ctx.fillStyle   = '#ffdd44';
    ctx.font        = 'bold 52px Arial';
    ctx.fillText('LEVEL CLEAR!', width / 2, height / 2 - 40);

    ctx.shadowBlur = 0;
    ctx.fillStyle  = '#aaccff';
    ctx.font       = '20px Arial';
    ctx.fillText(`Score: ${game.score.totalScore.toLocaleString()}`, width / 2, height / 2 + 15);

    if (nextLevelName) {
      ctx.fillStyle = 'rgba(200,220,255,0.7)';
      ctx.font      = '15px Arial';
      ctx.fillText(`Next: ${nextLevelName}`, width / 2, height / 2 + 48);
    }
    ctx.restore();
  }

  // ── Victory (all levels done) ─────────────────────────────────────────────

  drawVictory() {
    const { ctx, game } = this;
    const { width, height } = game.canvas;

    ctx.save();
    ctx.fillStyle    = 'rgba(0,0,10,0.65)';
    ctx.fillRect(0, 0, width, height);
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';

    ctx.shadowColor = '#ffcc00';
    ctx.shadowBlur  = 40;
    ctx.fillStyle   = '#ffee66';
    ctx.font        = 'bold 62px Arial';
    ctx.fillText('YOU WIN!', width / 2, height / 2 - 60);

    ctx.shadowColor = '#44ff88';
    ctx.shadowBlur  = 20;
    ctx.fillStyle   = '#88ffcc';
    ctx.font        = 'bold 26px Arial';
    ctx.fillText('All levels complete!', width / 2, height / 2);

    ctx.shadowBlur = 0;
    ctx.fillStyle  = '#ddddff';
    ctx.font       = '22px Arial';
    ctx.fillText(`Final Score: ${game.score.totalScore.toLocaleString()}`, width / 2, height / 2 + 48);

    ctx.fillStyle = 'rgba(180,190,255,0.75)';
    ctx.font      = '17px Arial';
    ctx.fillText('Click to play again', width / 2, height / 2 + 90);
    ctx.restore();
  }
}
