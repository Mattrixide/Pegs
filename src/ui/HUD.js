import { SKILLS } from '../core/Game.js';

// Per-ball skill colours used inside the Ball-O-Tron tube
const SKILL_BALL_COLORS = {
  superGuide: { dark:'#1a6632', mid:'#29aa55', bright:'#44ff88', spec:'#ccffee',
                badge:{ hi:'#aaffbb', mid:'#33bb55', dark:'#0d6622', edge:'#041a0a', glow:'0,200,60',  rim:'80,255,120'  }, color:'#44ff88', label:'SUPER GUIDE' },
  spookyBall: { dark:'#2a0066', mid:'#7700dd', bright:'#aa00ff', spec:'#e8bbff',
                badge:{ hi:'#cc88ff', mid:'#7700dd', dark:'#2a0066', edge:'#0d0022', glow:'150,0,255', rim:'170,0,255' }, color:'#aa00ff', label:'SPOOKY BALL' },
  lightning:  { dark:'#001a44', mid:'#0055cc', bright:'#44aaff', spec:'#e0f0ff',
                badge:{ hi:'#aaddff', mid:'#0066cc', dark:'#001a44', edge:'#000a1a', glow:'0,120,255',  rim:'60,160,255'  }, color:'#44aaff', label:'LIGHTNING'   },
  multiball:  { dark:'#6e2a00', mid:'#cc5500', bright:'#ff8844', spec:'#fff0e0',
                badge:{ hi:'#ffddaa', mid:'#dd8833', dark:'#663311', edge:'#1a0a04', glow:'220,130,30', rim:'255,170,60'  }, color:'#ff8844', label:'MULTI BALL'  },
};
const NORMAL_BALL_COLORS = { dark:'#1a1a1a', mid:'#707070', bright:'#cccccc', spec:'#f0f0f0' };
const NORMAL_BADGE = { hi:'#e8e8e8', mid:'#909090', dark:'#404040', edge:'#0a0a0a', glow:'160,160,160', rim:'200,200,200' };

export class HUD {
  constructor(game) {
    this.game = game;
    this.ctx = game.ctx;
    this._feverPrev       = 0;  // last-known fill progress
    this._feverFlash      = 0;  // countdown frames for bar-flash effect
    this._feverFlashStart = 0;  // progress value when flash began
  }

  draw() {
    const { ctx, game } = this;
    const { width } = game.canvas;

    ctx.save();
    ctx.textBaseline = 'middle';

    // ── Score (left) ─────────────────────────────────────────────
    ctx.font      = 'bold 18px Arial';
    ctx.textAlign = 'left';
    const scoreText = game.score.totalScore.toLocaleString();
    const scoreW = ctx.measureText(scoreText).width;
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.beginPath();
    ctx.roundRect(8, 8, scoreW + 12, 28, 6);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = '#4488ff';
    ctx.shadowBlur  = 8;
    ctx.fillText(scoreText, 14, 23);

    // ── Level name (right) ─────────────────────────────────────────
    ctx.font      = '13px Arial';
    ctx.textAlign = 'right';
    ctx.shadowBlur = 0;
    const lvl = game.levelSystem.currentLevel;
    if (lvl) {
      const lvlW = ctx.measureText(lvl.name).width;
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.beginPath();
      ctx.roundRect(width - 10 - lvlW - 6, 10, lvlW + 12, 24, 6);
      ctx.fill();
      ctx.fillStyle = 'rgba(200,210,255,0.9)';
      ctx.fillText(lvl.name, width - 10, 23);
    }

    ctx.restore();

    // ── Side meters — hidden during end-of-level celebration ────────
    const showMeters = game.state !== 'FEVER'
                    && game.state !== 'LEVEL_CLEAR'
                    && game.state !== 'VICTORY'
                    && game.state !== 'GAME_OVER';

    if (showMeters) {
      this._drawBallOTron();
      this._drawFeverMeter();
    }


    // ── Test level buttons ────────────────────────────────────────
    if (showMeters && game.isTestLevel) {
      this._drawTestSkillButtons();
      this._drawTestBgButtons();
    }

  }

  // ── Ball-O-Tron ────────────────────────────────────────────────
  //  Right-side panel styled like original Peggle:
  //  "BALL-O-TRON" label, green count badge, brass tube with
  //  stacked orange ball spheres, green bottom indicator.

  _drawBallOTron() {
    const { ctx, game } = this;
    const { width, height } = game.canvas;

    const count  = game.ballCount;
    const tubeW  = 22;
    const cx     = width - 27;          // tube/panel centre x
    const tubeL  = cx - tubeW / 2;
    const maxVis = 15;
    const ballR  = 6;
    const isLow  = count <= 3;
    const pulse  = 0.78 + 0.22 * Math.sin(Date.now() / 250);

    // Vertical layout: label → badge → tube
    const labelTop = 50;
    const labelH   = 16;
    const badgeR   = 13;
    const badgeCY  = labelTop + labelH + badgeR + 4;
    const tubeTop  = badgeCY + badgeR + 8;
    const tubeH    = 260;
    const ballStep = (tubeH - ballR * 2 - 4) / (maxVis - 1);

    ctx.save();

    // Low-ball pulse factor (shared across all parts)
    const lp = isLow ? 0.5 + 0.5 * Math.sin(Date.now() / 200) : 0;

    // Next-ball slot drives the label + badge colour
    const nextSlotIdx  = 10 - count;
    const nextSkillId  = game.ballSlots[nextSlotIdx] ?? null;
    const nextSkillDef = nextSkillId ? SKILL_BALL_COLORS[nextSkillId] : null;
    const sc           = nextSkillDef ? nextSkillDef.badge : NORMAL_BADGE;
    const labelText    = nextSkillDef ? nextSkillDef.label : 'NORMAL';
    const labelColor   = nextSkillDef ? nextSkillDef.color : '#ffcc66';

    // ── Next-ball label ───────────────────────────────────────────
    ctx.shadowColor  = isLow ? `rgba(255,60,40,${0.5 + 0.5 * lp})` : `rgba(${sc.glow},0.65)`;
    ctx.shadowBlur   = isLow ? 8 : 4;
    ctx.fillStyle    = isLow ? `rgba(255,100,80,${0.7 + 0.3 * lp})` : labelColor;
    ctx.font         = 'bold 8px Arial';
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';
    const words = labelText.split(' ');
    if (words.length >= 2) {
      ctx.fillText(words[0], cx, labelTop + 3);
      ctx.fillText(words.slice(1).join(' '), cx, labelTop + 13);
    } else {
      ctx.fillText(labelText, cx, labelTop + labelH / 2);
    }
    ctx.shadowBlur   = 0;

    // ── Count badge (next-ball colour) ────────────────────────────
    if (isLow) {
      ctx.shadowColor = `rgba(255,50,30,${0.5 + 0.5 * lp})`;
      ctx.shadowBlur  = 12;
    } else {
      ctx.shadowColor = `rgba(${sc.glow},${0.75 * pulse})`;
      ctx.shadowBlur  = 9;
    }
    const bGrad = ctx.createRadialGradient(cx - 3, badgeCY - 3, 1, cx, badgeCY, badgeR);
    if (isLow) {
      bGrad.addColorStop(0,    '#ffaaaa');
      bGrad.addColorStop(0.45, '#cc3333');
      bGrad.addColorStop(0.85, '#661111');
      bGrad.addColorStop(1,    '#1a0505');
    } else {
      bGrad.addColorStop(0,    sc.hi);
      bGrad.addColorStop(0.45, sc.mid);
      bGrad.addColorStop(0.85, sc.dark);
      bGrad.addColorStop(1,    sc.edge);
    }
    ctx.beginPath();
    ctx.arc(cx, badgeCY, badgeR, 0, Math.PI * 2);
    ctx.fillStyle = bGrad;
    ctx.fill();

    // Badge rim
    ctx.shadowBlur  = 0;
    ctx.strokeStyle = isLow ? `rgba(255,80,60,${0.4 + 0.6 * lp})` : `rgba(${sc.rim},0.55)`;
    ctx.lineWidth   = 1.5;
    ctx.beginPath();
    ctx.arc(cx, badgeCY, badgeR, 0, Math.PI * 2);
    ctx.stroke();

    // Count number inside badge
    ctx.shadowColor  = 'rgba(0,0,0,0.4)';
    ctx.shadowBlur   = 2;
    ctx.fillStyle    = '#ffffff';
    ctx.font         = `bold ${count >= 10 ? 9 : 11}px Arial`;
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(count, cx, badgeCY);
    ctx.shadowBlur   = 0;

    // ── Outer metallic brass/gold frame ──────────────────────────
    const fGrad = ctx.createLinearGradient(tubeL - 4, 0, tubeL + tubeW + 4, 0);
    if (isLow) {
      fGrad.addColorStop(0,    '#180000');
      fGrad.addColorStop(0.15, `rgba(200,40,20,${0.6 + 0.4 * lp})`);
      fGrad.addColorStop(0.4,  `rgba(255,70,40,${0.7 + 0.3 * lp})`);
      fGrad.addColorStop(0.6,  `rgba(230,50,30,${0.7 + 0.3 * lp})`);
      fGrad.addColorStop(0.85, `rgba(180,30,15,${0.6 + 0.4 * lp})`);
      fGrad.addColorStop(1,    '#120000');
      ctx.shadowColor = `rgba(255,40,40,${0.4 + 0.6 * lp})`;
      ctx.shadowBlur  = 12;
    } else {
      fGrad.addColorStop(0,    '#180800');
      fGrad.addColorStop(0.15, '#9a6820');
      fGrad.addColorStop(0.4,  '#dca838');
      fGrad.addColorStop(0.6,  '#c09028');
      fGrad.addColorStop(0.85, '#9a6018');
      fGrad.addColorStop(1,    '#120500');
      ctx.shadowColor = '#0a0400';
      ctx.shadowBlur  = 6;
    }
    ctx.fillStyle   = fGrad;
    ctx.beginPath();
    this._roundRect(tubeL - 4, tubeTop - 6, tubeW + 8, tubeH + 12, 7);
    ctx.fill();

    // Top brass cap band
    ctx.shadowBlur = 0;
    const capGrad = ctx.createLinearGradient(tubeL - 4, 0, tubeL + tubeW + 4, 0);
    if (isLow) {
      capGrad.addColorStop(0,   '#120000');
      capGrad.addColorStop(0.5, '#cc3020');
      capGrad.addColorStop(1,   '#120000');
    } else {
      capGrad.addColorStop(0,   '#120500');
      capGrad.addColorStop(0.5, '#c49030');
      capGrad.addColorStop(1,   '#120500');
    }
    ctx.fillStyle = capGrad;
    ctx.fillRect(tubeL - 4, tubeTop - 6, tubeW + 8, 9);

    // Bottom brass cap band
    ctx.fillRect(tubeL - 4, tubeTop + tubeH + 3, tubeW + 8, 9);

    // ── Inner glass tube (dark warm background) ───────────────────
    const tGrad = ctx.createLinearGradient(tubeL, 0, tubeL + tubeW, 0);
    tGrad.addColorStop(0,    '#0e0500');
    tGrad.addColorStop(0.25, '#1c0900');
    tGrad.addColorStop(0.75, '#1e0c00');
    tGrad.addColorStop(1,    '#0e0500');
    ctx.fillStyle = tGrad;
    ctx.beginPath();
    this._roundRect(tubeL, tubeTop, tubeW, tubeH, 3);
    ctx.fill();

    // ── Stacked ball spheres (each coloured by its skill slot) ────
    const visible  = Math.min(count, maxVis);
    // remaining[0] = next to fire (drawn at bottom, i=0)
    const remaining = game.ballSlots.slice(10 - count);

    for (let i = 0; i < visible; i++) {
      const bx = cx;
      const by = tubeTop + tubeH - ballR - 2 - i * ballStep;
      const hx = bx - ballR * 0.3;
      const hy = by - ballR * 0.35;

      const slotSkill = remaining[i] ?? null;
      const bc        = slotSkill ? SKILL_BALL_COLORS[slotSkill] : null;

      ctx.shadowColor = bc ? bc.bright : NORMAL_BALL_COLORS.bright;
      ctx.shadowBlur  = 5;

      const g = ctx.createRadialGradient(hx, hy, ballR * 0.05, bx, by, ballR);
      if (bc) {
        g.addColorStop(0.00, bc.spec);
        g.addColorStop(0.25, bc.bright);
        g.addColorStop(0.65, bc.mid);
        g.addColorStop(1.00, bc.dark);
      } else {
        // Normal ball — silver
        g.addColorStop(0.00, NORMAL_BALL_COLORS.spec);
        g.addColorStop(0.25, NORMAL_BALL_COLORS.bright);
        g.addColorStop(0.65, NORMAL_BALL_COLORS.mid);
        g.addColorStop(1.00, NORMAL_BALL_COLORS.dark);
      }
      ctx.beginPath();
      ctx.arc(bx, by, ballR, 0, Math.PI * 2);
      ctx.fillStyle = g;
      ctx.fill();

      // Specular glint
      ctx.shadowBlur = 0;
      const sg = ctx.createRadialGradient(hx, hy, 0, hx, hy, ballR * 0.4);
      sg.addColorStop(0, 'rgba(255,255,255,0.88)');
      sg.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.beginPath();
      ctx.arc(hx, hy, ballR * 0.4, 0, Math.PI * 2);
      ctx.fillStyle = sg;
      ctx.fill();
    }

    // ── Glass tube left-edge reflection ──────────────────────────
    ctx.shadowBlur = 0;
    const refGrad = ctx.createLinearGradient(tubeL, 0, tubeL + tubeW * 0.55, 0);
    refGrad.addColorStop(0, 'rgba(255,255,255,0.11)');
    refGrad.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = refGrad;
    ctx.beginPath();
    this._roundRect(tubeL, tubeTop, tubeW * 0.38, tubeH, 3);
    ctx.fill();

    // ── Green bottom indicator glow ───────────────────────────────
    const indY = tubeTop + tubeH + 3;
    const indH = 8;
    const indX = tubeL - 4;
    const indW = tubeW + 8;

    const indGrad = ctx.createLinearGradient(indX, 0, indX + indW, 0);
    if (isLow) {
      indGrad.addColorStop(0,    '#220404');
      indGrad.addColorStop(0.25, '#991a1a');
      indGrad.addColorStop(0.5,  '#ff4444');
      indGrad.addColorStop(0.75, '#991a1a');
      indGrad.addColorStop(1,    '#220404');
      ctx.shadowColor = `rgba(255,50,30,${0.5 + 0.5 * lp})`;
      ctx.shadowBlur  = 14;
    } else {
      indGrad.addColorStop(0,    '#042210');
      indGrad.addColorStop(0.25, '#1a9940');
      indGrad.addColorStop(0.5,  '#44ff88');
      indGrad.addColorStop(0.75, '#1a9940');
      indGrad.addColorStop(1,    '#042210');
      ctx.shadowColor = `rgba(0,200,80,${0.85 * pulse})`;
      ctx.shadowBlur  = 10;
    }
    ctx.fillStyle   = indGrad;
    ctx.beginPath();
    this._roundRect(indX, indY, indW, indH, 3);
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.restore();
  }

  // ── Fever meter ────────────────────────────────────────────────
  //  Left-side vertical meter styled after original Peggle:
  //  glowing orb at top, amber fill rising from bottom,
  //  labelled multiplier threshold ticks (×2 → ×10), dark panel bg.

  _drawFeverMeter() {
    const { ctx, game } = this;
    const { height }    = game.canvas;

    // Layout constants
    const barX   = 9;
    const barW   = 14;
    const barCx  = barX + barW / 2;
    const orbY   = 68;
    const orbR   = 13;
    const barTop = orbY + orbR + 7;
    const barH   = 260;
    const lblX   = barX + barW + 5;

    const pegs      = game.levelSystem.pegs;
    const total     = game.levelSystem.totalOrange || 1;
    const hitOrange = pegs.filter(p => p.type === 'orange' && (p.lit || p.removing || p.removed)).length;
    const remaining = total - hitOrange;
    const progress  = Math.max(0, Math.min(1, hitOrange / total));
    const mult      = game.score.getMultiplier(remaining);
    const isFever   = mult === 'FEVER';
    const pulse     = 0.78 + 0.22 * Math.sin(Date.now() / 170);

    // ── Detect when fever is added — trigger flash ────────────────
    if (progress > this._feverPrev + 0.001) {
      this._feverFlashStart = this._feverPrev;
      this._feverFlash = 22;
      game.audio.playFeverUp(progress);
    }
    this._feverPrev = progress;
    if (this._feverFlash > 0) this._feverFlash--;
    const ft = this._feverFlash / 22; // 1→0 fade

    ctx.save();

    // ── Outer metallic/wood bar frame ────────────────────────────
    const frameGrad = ctx.createLinearGradient(barX - 3, 0, barX + barW + 3, 0);
    frameGrad.addColorStop(0,   '#1e0e05');
    frameGrad.addColorStop(0.25,'#7a4a22');
    frameGrad.addColorStop(0.5, '#4a2a10');
    frameGrad.addColorStop(0.75,'#6a3e1c');
    frameGrad.addColorStop(1,   '#150902');
    ctx.shadowColor = ft > 0 ? `rgba(255,180,0,${ft * 0.9})` : '#0a0300';
    ctx.shadowBlur  = ft > 0 ? 28 * ft : 5;
    ctx.fillStyle   = frameGrad;
    ctx.beginPath();
    this._roundRect(barX - 3, barTop - 3, barW + 6, barH + 6, 5);
    ctx.fill();

    // ── Inner dark bar track ──────────────────────────────────────
    ctx.shadowBlur = 0;
    ctx.fillStyle  = '#0c0402';
    ctx.beginPath();
    this._roundRect(barX, barTop, barW, barH, 3);
    ctx.fill();

    // ── Amber fill (rises from bottom) ───────────────────────────
    let fillY = barTop + barH;
    if (progress > 0) {
      const fillH = Math.max(4, barH * progress);
      fillY = barTop + barH - fillH;

      const fillGrad = ctx.createLinearGradient(0, fillY, 0, barTop + barH);
      if (isFever) {
        fillGrad.addColorStop(0,   '#ffffff');
        fillGrad.addColorStop(0.1, '#ffff88');
        fillGrad.addColorStop(0.35,'#ffdd00');
        fillGrad.addColorStop(0.7, '#ff7700');
        fillGrad.addColorStop(1,   '#aa2200');
      } else if (mult >= 10) {
        fillGrad.addColorStop(0,   '#ffee55');
        fillGrad.addColorStop(0.2, '#ff9900');
        fillGrad.addColorStop(0.6, '#dd3300');
        fillGrad.addColorStop(1,   '#7a1200');
      } else if (mult >= 5) {
        fillGrad.addColorStop(0,   '#ffcc44');
        fillGrad.addColorStop(0.4, '#ff6600');
        fillGrad.addColorStop(0.8, '#cc2200');
        fillGrad.addColorStop(1,   '#5c1000');
      } else if (mult >= 3) {
        fillGrad.addColorStop(0,   '#ff9933');
        fillGrad.addColorStop(0.5, '#dd4400');
        fillGrad.addColorStop(1,   '#4a1000');
      } else {
        fillGrad.addColorStop(0,   '#ff6622');
        fillGrad.addColorStop(0.6, '#bb2200');
        fillGrad.addColorStop(1,   '#321000');
      }

      ctx.shadowColor = isFever ? `rgba(255,220,0,${pulse})` : '#ff7700';
      ctx.shadowBlur  = isFever ? 28 * pulse : 14;
      ctx.fillStyle   = fillGrad;
      ctx.beginPath();
      this._roundRect(barX, fillY, barW, fillH, 3);
      ctx.fill();

      // Left-edge inner highlight stripe on fill
      ctx.shadowBlur = 0;
      const stripe = ctx.createLinearGradient(barX, 0, barX + barW * 0.55, 0);
      stripe.addColorStop(0, 'rgba(255,230,120,0.45)');
      stripe.addColorStop(1, 'rgba(255,230,120,0)');
      ctx.fillStyle = stripe;
      ctx.beginPath();
      this._roundRect(barX, fillY, barW * 0.42, fillH, 3);
      ctx.fill();
    }

    // ── FLASH effect when fever added ─────────────────────────────
    if (ft > 0) {
      const fa = ft * ft; // quadratic for snappy fade

      // Whole-bar bright white-orange wash
      ctx.shadowColor = `rgba(255,200,0,${fa})`;
      ctx.shadowBlur  = 40 * fa;
      ctx.fillStyle   = `rgba(255,230,80,${fa * 0.55})`;
      ctx.beginPath();
      this._roundRect(barX, barTop, barW, barH, 3);
      ctx.fill();

      // Scan beam sweeping from fill top upward
      const scanY = fillY - (1 - ft) * barH * 0.6;
      const scanGrad = ctx.createLinearGradient(0, scanY - 18, 0, scanY + 6);
      scanGrad.addColorStop(0, 'rgba(255,255,180,0)');
      scanGrad.addColorStop(0.5, `rgba(255,255,200,${fa * 0.8})`);
      scanGrad.addColorStop(1, 'rgba(255,255,180,0)');
      ctx.shadowBlur = 0;
      ctx.fillStyle  = scanGrad;
      ctx.beginPath();
      this._roundRect(barX, Math.max(barTop, scanY - 18), barW, 24, 2);
      ctx.fill();

      // Expanding ring from fill top
      const ringProgress = 1 - ft;
      const ringR = ringProgress * 22 + 4;
      ctx.strokeStyle = `rgba(255,220,60,${fa * 0.9})`;
      ctx.lineWidth   = 2.5 * ft;
      ctx.shadowColor = `rgba(255,200,0,${fa})`;
      ctx.shadowBlur  = 12 * fa;
      ctx.beginPath();
      ctx.arc(barCx, fillY, ringR, 0, Math.PI * 2);
      ctx.stroke();

      // Second wider ring (offset timing)
      const ringR2 = ringProgress * 38 + 4;
      ctx.strokeStyle = `rgba(255,180,0,${fa * 0.5})`;
      ctx.lineWidth   = 1.5 * ft;
      ctx.beginPath();
      ctx.arc(barCx, fillY, ringR2, 0, Math.PI * 2);
      ctx.stroke();
    }

    // ── Multiplier threshold tick marks + labels ──────────────────
    const thresholds = [
      { label: '×10', maxOrange: 3  },
      { label: '×5',  maxOrange: 6  },
      { label: '×3',  maxOrange: 10 },
      { label: '×2',  maxOrange: 15 },
    ];

    thresholds.forEach(({ label, maxOrange }) => {
      if (maxOrange >= total) return;

      const frac  = 1 - maxOrange / total;
      const tickY = barTop + barH * (1 - frac);
      const lit   = progress >= frac;

      ctx.shadowBlur  = 0;
      ctx.strokeStyle = lit ? 'rgba(255,200,80,0.95)' : 'rgba(160,80,20,0.45)';
      ctx.lineWidth   = lit ? 1.5 : 1;
      ctx.beginPath();
      ctx.moveTo(barX - 2, tickY);
      ctx.lineTo(barX + barW + 2, tickY);
      ctx.stroke();

      ctx.font         = 'bold 9px Arial';
      ctx.textAlign    = 'left';
      ctx.textBaseline = 'middle';
      ctx.shadowColor  = lit ? 'rgba(255,160,0,0.9)' : 'transparent';
      ctx.shadowBlur   = lit ? 6 : 0;
      ctx.fillStyle    = lit ? '#ffdd77' : 'rgba(180,100,40,0.7)';
      ctx.fillText(label, lblX, tickY);
    });

    // ── Glowing orb at top ────────────────────────────────────────
    const orbIntensity = isFever ? 1
      : mult >= 10 ? 0.90
      : mult >= 5  ? 0.70
      : mult >= 3  ? 0.50
      : mult >= 2  ? 0.35
      :              0.20;

    ctx.shadowColor = isFever
      ? `rgba(255,240,80,${pulse})`
      : `rgba(255,120,0,${0.55 + 0.45 * orbIntensity})`;
    ctx.shadowBlur  = isFever ? 30 * pulse : 8 + 20 * orbIntensity;

    // Extra flash bloom on orb during fever add
    if (ft > 0) {
      ctx.shadowColor = `rgba(255,255,100,${ft})`;
      ctx.shadowBlur  = 40 * ft;
    }

    const orbGrad = ctx.createRadialGradient(barCx - 4, orbY - 4, 1, barCx, orbY, orbR);
    if (isFever) {
      orbGrad.addColorStop(0,   '#ffffff');
      orbGrad.addColorStop(0.15,'#ffffcc');
      orbGrad.addColorStop(0.4, '#ffdd00');
      orbGrad.addColorStop(0.7, '#ff6600');
      orbGrad.addColorStop(1,   '#7a1800');
    } else {
      const r1 = Math.round(130 + 125 * orbIntensity);
      const g1 = Math.round(40  + 80  * orbIntensity);
      orbGrad.addColorStop(0,   `rgb(255,${r1},${g1})`);
      orbGrad.addColorStop(0.4, `rgb(${Math.round(200 * orbIntensity)},${Math.round(50 * orbIntensity)},0)`);
      orbGrad.addColorStop(1,   '#180400');
    }

    ctx.beginPath();
    ctx.arc(barCx, orbY, orbR, 0, Math.PI * 2);
    ctx.fillStyle = orbGrad;
    ctx.fill();

    // Orb specular glint
    ctx.shadowBlur = 0;
    const osg = ctx.createRadialGradient(barCx - 4, orbY - 4, 0, barCx - 4, orbY - 4, orbR * 0.52);
    osg.addColorStop(0, 'rgba(255,255,220,0.95)');
    osg.addColorStop(1, 'rgba(255,255,220,0)');
    ctx.beginPath();
    ctx.arc(barCx - 4, orbY - 4, orbR * 0.52, 0, Math.PI * 2);
    ctx.fillStyle = osg;
    ctx.fill();

    // Orb rim
    ctx.strokeStyle = isFever ? 'rgba(255,240,100,0.90)' : `rgba(255,140,20,${0.4 + 0.5 * orbIntensity})`;
    ctx.lineWidth   = 1.5;
    ctx.beginPath();
    ctx.arc(barCx, orbY, orbR, 0, Math.PI * 2);
    ctx.stroke();

    // ── "FEVER METER" label ───────────────────────────────────────
    ctx.shadowColor  = isFever ? `rgba(255,180,0,${pulse})` : 'transparent';
    ctx.shadowBlur   = isFever ? 12 * pulse : 0;
    ctx.fillStyle    = isFever ? '#ffee55' : 'rgba(200,120,45,0.85)';
    ctx.font         = `bold ${isFever ? 8 : 7}px Arial`;
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('FEVER', barCx, barTop + barH + 5);
    ctx.fillText('METER', barCx, barTop + barH + 14);

    ctx.restore();
  }

  // ── Test level skill switcher ──────────────────────────────────
  //  Horizontal row of 4 small buttons at the bottom of the screen.

  _drawTestSkillButtons() {
    const { ctx, game } = this;
    const rects = this.getTestSkillButtonRects(game.canvas);

    rects.forEach(({ skill, x, y, w, h }) => {
      const sd       = SKILLS.find(s => s.id === skill);
      const isActive = game.currentBallSkill === skill;

      ctx.save();
      ctx.shadowColor  = isActive ? sd.color : 'transparent';
      ctx.shadowBlur   = isActive ? 10 : 0;
      ctx.fillStyle    = isActive ? sd.color + '30' : 'rgba(0,0,0,0.65)';
      ctx.strokeStyle  = isActive ? sd.color         : 'rgba(90,100,120,0.55)';
      ctx.lineWidth    = isActive ? 2 : 1;
      ctx.beginPath();
      ctx.roundRect(x, y, w, h, 4);
      ctx.fill();
      ctx.stroke();

      ctx.shadowBlur   = isActive ? 6 : 0;
      ctx.fillStyle    = isActive ? sd.color : 'rgba(170,180,210,0.80)';
      ctx.font         = `bold 8px Arial`;
      ctx.textAlign    = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(sd.label, x + w / 2, y + h / 2);
      ctx.restore();
    });
  }

  getBadgeHitArea(canvas) {
    const width = canvas.width;
    const cx = width - 27;
    const labelTop = 50;
    const labelH = 16;
    const badgeR = 13;
    const badgeCY = labelTop + labelH + badgeR + 4;
    return { cx, cy: badgeCY, r: badgeR + 4 };  // slightly larger hit area
  }

  getTestSkillButtonRects(canvas) {
    const bw  = 76, bh = 18, gap = 5;
    const totalW = SKILLS.length * bw + (SKILLS.length - 1) * gap;
    let x = canvas.width / 2 - totalW / 2;
    const y = canvas.height - 14;
    return SKILLS.map(({ id: skill }) => {
      const rect = { skill, x, y: y - bh / 2, w: bw, h: bh };
      x += bw + gap;
      return rect;
    });
  }

  // ── Test level background switcher ────────────────────────────

  static BG_OPTIONS = [
    { id: 1, label: 'Meadow',   color: '#55aaff' },
    { id: 2, label: 'Pyramids', color: '#ee8833' },
    { id: 3, label: 'Forest',   color: '#55cc77' },
    { id: 4, label: 'Volcano',  color: '#ff4422' },
    { id: 5, label: 'Ocean',    color: '#33aadd' },
    { id: 6, label: 'Garden',   color: '#88cc33' },
    { id: 7, label: 'Galaxy',   color: '#bb55ee' },
    { id: 8, label: 'Winter',   color: '#aaccee' },
    { id: 9, label: 'Tropical', color: '#ffaa44' },
  ];

  _drawTestBgButtons() {
    const { ctx, game } = this;
    const rects = this.getTestBgButtonRects(game.canvas);
    const currentBg = game.bgOverride ?? game.levelSystem.currentLevel?.id ?? 1;

    rects.forEach(({ bgId, label, color, x, y, w, h }) => {
      const isActive = currentBg === bgId;

      ctx.save();
      ctx.shadowColor  = isActive ? color : 'transparent';
      ctx.shadowBlur   = isActive ? 10 : 0;
      ctx.fillStyle    = isActive ? color + '30' : 'rgba(0,0,0,0.65)';
      ctx.strokeStyle  = isActive ? color         : 'rgba(90,100,120,0.55)';
      ctx.lineWidth    = isActive ? 2 : 1;
      ctx.beginPath();
      ctx.roundRect(x, y, w, h, 4);
      ctx.fill();
      ctx.stroke();

      ctx.shadowBlur   = isActive ? 6 : 0;
      ctx.fillStyle    = isActive ? color : 'rgba(170,180,210,0.80)';
      ctx.font         = 'bold 7px Arial';
      ctx.textAlign    = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(label, x + w / 2, y + h / 2);
      ctx.restore();
    });
  }

  getTestBgButtonRects(canvas) {
    const opts = HUD.BG_OPTIONS;
    const cols = 5;
    const bw = 62, bh = 16, gapX = 4, gapY = 3;
    const rows = Math.ceil(opts.length / cols);
    const totalW = cols * bw + (cols - 1) * gapX;
    const startX = canvas.width / 2 - totalW / 2;
    const startY = canvas.height - 28 - (rows - 1) * (bh + gapY);
    return opts.map(({ id: bgId, label, color }, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = startX + col * (bw + gapX);
      const y = startY + row * (bh + gapY);
      return { bgId, label, color, x, y, w: bw, h: bh };
    });
  }

  // ── Low ball warning ───────────────────────────────────────────


  // ── Helpers ────────────────────────────────────────────────────

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
}
