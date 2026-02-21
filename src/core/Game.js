import { EventBus }       from './EventBus.js';
import { Ball }           from '../entities/Ball.js';
import { Launcher }       from '../entities/Launcher.js';
import { Bucket }         from '../entities/Bucket.js';
import { PhysicsSystem }  from '../systems/PhysicsSystem.js';
import { RenderSystem }   from '../systems/RenderSystem.js';
import { ScoreSystem }    from '../systems/ScoreSystem.js';
import { ParticleSystem } from '../systems/ParticleSystem.js';
import { LevelSystem }    from '../systems/LevelSystem.js';
import { TEST_LEVEL_INDEX } from '../data/levels.js';
import { AudioSystem }    from '../systems/AudioSystem.js';
import { HUD }            from '../ui/HUD.js';
import { Screens }        from '../ui/Screens.js';

// ── States ────────────────────────────────────────────────────────────────────
export const STATE = {
  MENU:        'MENU',
  AIMING:      'AIMING',
  SHOOTING:    'SHOOTING',
  ROUND_END:   'ROUND_END',
  FINAL_CATCH: 'FINAL_CATCH',
  FEVER:       'FEVER',
  LEVEL_CLEAR: 'LEVEL_CLEAR',
  GAME_OVER:   'GAME_OVER',
  VICTORY:     'VICTORY',
};

// Final catch bucket layout
const FC_SLOT_VALUES  = [10000, 50000, 100000, 50000, 10000];
const FC_BUCKET_TOP   = 618;
const FC_DIV_HALF     = 5;

const ROUND_END_FRAMES   = 55;
const FEVER_FRAMES       = 280;
const LEVEL_CLEAR_FRAMES = 200;
const FEVER_HOLE_VALUES  = [10000, 50000, 100000, 50000, 10000];

const LIGHTNING_RADIUS = 90; // px — chain hit range

// Exported so Screens / HUD can reference skill metadata
export const SKILLS = [
  { id: 'superGuide', label: 'SUPER GUIDE', color: '#44ff88', desc: 'Extended aim line'      },
  { id: 'spookyBall', label: 'SPOOKY BALL', color: '#cc88ff', desc: 'Ball loops from top'    },
  { id: 'lightning',  label: 'LIGHTNING',   color: '#ffff44', desc: 'Chain-hits nearby pegs' },
  { id: 'multiball',  label: 'MULTI BALL',  color: '#ff8844', desc: 'Spawns 2 extra balls'   },
];

export class Game {
  constructor(canvas, version = '0.0.0') {
    this.version = version;
    this.canvas  = canvas;
    this.ctx     = canvas.getContext('2d');
    this.width   = canvas.width;
    this.height  = canvas.height;

    // Systems
    this.events      = new EventBus();
    this.physics     = new PhysicsSystem();
    this.score       = new ScoreSystem();
    this.particles   = new ParticleSystem();
    this.levelSystem = new LevelSystem();
    this.audio       = new AudioSystem();
    this.renderer    = new RenderSystem(this);

    // Entities
    this.launcher = new Launcher(canvas.width);
    this.bucket   = new Bucket(canvas.width, canvas.height);

    // UI
    this.hud     = new HUD(this);
    this.screens = new Screens(this);

    // Game state
    this.state              = STATE.MENU;
    this.balls              = [];       // all active balls (primary at index 0)
    this.ballCount          = 10;
    this.mouse              = { x: canvas.width / 2, y: canvas.height };
    this.superGuideActive   = false;    // super guide skill active this round
    this.finalBucketsActive = false;
    this.bgOverride         = null;        // test-level background override (level id)
    this.spookyActive       = false;    // spooky ball has been triggered
    this.spookyUsed         = false;    // spooky teleport already used this ball
    this.lightningData      = null;     // { source, targets[], timer, maxTimer }
    this.ballSlots          = [];       // per-ball skill assignments (null = normal)
    this.currentBallSkill   = null;     // skill of the ball currently in play
    this.ballPegHitCount    = 0;        // peg hits this ball (lightning/multiball trigger)

    // Timers
    this.roundEndTimer   = 0;
    this.feverTimer      = 0;
    this.levelClearTimer = 0;
    this._fountainActive = false;
    this._fountainX      = 0;

    this._lastTime     = 0;
    this._physicsAccum = 0;
    this._setupInput();
  }

  get isTestLevel() { return this.levelSystem.currentIndex === TEST_LEVEL_INDEX; }

  // ── Bootstrap ──────────────────────────────────────────────────────────────

  start() {
    this._lastTime = performance.now();
    requestAnimationFrame(t => this._loop(t));
  }

  // ── Level management ───────────────────────────────────────────────────────

  startGame(levelIndex = 0) {
    this.ballCount          = 10;
    this.feverTimer         = 0;
    this.balls              = [];
    this.superGuideActive   = false;
    this.spookyActive       = false;
    this.spookyUsed         = false;
    this.lightningData      = null;
    this.currentBallSkill   = null;
    this.ballPegHitCount    = 0;
    this.bucket.visible     = true;
    this.bucket.x           = this.canvas.width / 2;
    this.score.reset();
    this.particles.clear();
    this.bgOverride = null;
    this.levelSystem.load(levelIndex);
    this._generateBallSlots();
    this._setState(STATE.AIMING);
  }

  _loadNextLevel() {
    this.ballCount          = 10;
    this.feverTimer         = 0;
    this.balls              = [];
    this.superGuideActive   = false;
    this.spookyActive       = false;
    this.spookyUsed         = false;
    this.lightningData      = null;
    this.currentBallSkill   = null;
    this.ballPegHitCount    = 0;
    this.bucket.visible     = true;
    this.bucket.x           = this.canvas.width / 2;
    this.levelSystem.load(this.levelSystem.currentIndex + 1);
    this.particles.clear();
    this._generateBallSlots();
    this._setState(STATE.AIMING);
  }

  _generateBallSlots() {
    const slots    = Array(10).fill(null);
    const skillIds = SKILLS.map(s => s.id);
    // Pick exactly 4 random positions for skill balls
    const positions = [...Array(10).keys()].sort(() => Math.random() - 0.5).slice(0, 4);
    positions.forEach(i => {
      slots[i] = skillIds[Math.floor(Math.random() * skillIds.length)];
    });
    this.ballSlots = slots;
  }

  // ── Main loop ──────────────────────────────────────────────────────────────

  _loop(timestamp) {
    const rawDelta = timestamp - this._lastTime;
    this._lastTime = timestamp;
    const delta = Math.min(rawDelta, 50);

    let timeScale = 1.0;
    if (this.state === STATE.SHOOTING) {
      const lastOrange = this._findLastOrangePeg();
      if (lastOrange && this.balls.length > 0) {
        const dist = Math.min(...this.balls.map(b =>
          Math.hypot(b.pos.x - lastOrange.pos.x, b.pos.y - lastOrange.pos.y)
        ));
        if (dist < 70) timeScale = 0.2;
      }
    } else if (this.state === STATE.FINAL_CATCH) {
      timeScale = 0.55;
    }
    this._physicsAccum += delta * timeScale;
    const stepMs = 16.67;
    while (this._physicsAccum >= stepMs) {
      this._update();
      this._physicsAccum -= stepMs;
    }
    this.renderer.render(this._physicsAccum / stepMs);
    requestAnimationFrame(t => this._loop(t));
  }

  _update() {
    switch (this.state) {
      case STATE.MENU:        this.screens.updateMenu();  break;
      case STATE.AIMING:      this._updateAiming();       break;
      case STATE.SHOOTING:    this._updateShooting();     break;
      case STATE.ROUND_END:   this._updateRoundEnd();     break;
      case STATE.FINAL_CATCH: this._updateFinalCatch();   break;
      case STATE.FEVER:       this._updateFever();        break;
      case STATE.LEVEL_CLEAR: this._updateLevelClear();   break;
    }
    if (this.bucket.visible) this.bucket.update();
    this.particles.update();
    this.score.update();
    if (this.lightningData) {
      this.lightningData.timer--;
      if (this.lightningData.timer <= 0) this.lightningData = null;
    }
  }

  // ── State updates ──────────────────────────────────────────────────────────

  _updateAiming() {
    const nextSlotIdx     = 10 - this.ballCount;
    this.superGuideActive = this.ballSlots[nextSlotIdx] === 'superGuide';
    this.launcher.setAngleFromMouse(this.mouse.x, this.mouse.y);
  }

  _updateShooting() {
    if (this.balls.length === 0) {
      this._beginRoundEnd();
      return;
    }

    let finalCatchTriggered = false;

    for (let bi = this.balls.length - 1; bi >= 0; bi--) {
      const ball = this.balls[bi];
      const prevBallX = ball.pos.x;
      const prevBallY = ball.pos.y;

      const result = this.physics.update(
        ball,
        this.levelSystem.getActivePegs(),
        this.canvas
      );

      if (result && result.hitPegs) {
        result.hitPegs.forEach(peg => {
          const orange = this.levelSystem.orangeRemaining;
          this.score.awardPeg(peg, orange);
          this.particles.spawnPegHit(peg.pos.x, peg.pos.y, this._pegGlow(peg.type));
          this.audio.playPegHit(peg.type);
          if (peg.type === 'green') this._activateSkill(ball, peg);
        });

        // Lightning / Multiball — trigger on every 3rd peg hit this ball
        if (this.currentBallSkill === 'lightning' || this.currentBallSkill === 'multiball') {
          const prev = this.ballPegHitCount;
          this.ballPegHitCount += result.hitPegs.length;
          if (Math.floor(this.ballPegHitCount / 3) > Math.floor(prev / 3)) {
            const src = result.hitPegs[0];
            if (this.currentBallSkill === 'lightning') this._activateLightning(src);
            if (this.currentBallSkill === 'multiball') this._activateMultiball(ball, src);
          }
        }

        // Check if all orange pegs have been hit this step
        if (!finalCatchTriggered) {
          const unlitOrange = this.levelSystem.pegs.filter(
            p => p.type === 'orange' && !p.removed && !p.removing && !p.lit
          ).length;
          if (unlitOrange === 0) {
            finalCatchTriggered = true;
            this._beginFinalCatch();
            return;
          }
        }
      }

      // Bucket ramp bounce + catch
      if (this.bucket.visible) {
        const ramp = this.bucket.checkRamp(ball, prevBallX, prevBallY);
        if (ramp) {
          ball.pos.x += ramp.nx * ramp.overlap;
          ball.pos.y += ramp.ny * ramp.overlap;
          const dot = ball.vel.x * ramp.nx + ball.vel.y * ramp.ny;
          if (dot < 0) {
            ball.vel.x -= 2 * dot * ramp.nx;
            ball.vel.y -= 2 * dot * ramp.ny;
            ball.vel.x *= 0.85;
            ball.vel.y *= 0.85;
          }
        } else {
          const bx = ball.pos.x;
          const inX = bx >= this.bucket.left && bx <= this.bucket.right;
          const crossedTop = prevBallY < this.bucket.top && ball.pos.y >= this.bucket.top;
          if (inX && (crossedTop || this.bucket.catches(ball))) {
            this.score.awardBucketBonus();
            this.particles.spawnBucketCatch(this.bucket.x, this.bucket.y);
            this.audio.playBucketCatch();
            this.ballCount++;
            this.balls.splice(bi, 1);
            if (this.balls.length === 0) {
              this._beginRoundEnd();
              return;
            }
            continue;
          }
        }
      }

      // Spooky ball — teleport from bottom back to top (once per activation)
      if (result === 'exited' &&
          this.currentBallSkill === 'spookyBall' &&
          this.spookyActive && !this.spookyUsed &&
          ball.pos.y > this.canvas.height) {
        ball.pos.y     = 56 + ball.radius;
        ball.vel.y     = Math.abs(ball.vel.y) * 0.4 + 2;
        ball.trail     = [];
        ball.frameCount = 0;
        this.spookyUsed = true;
        continue;
      }

      if (result === 'exited') {
        this.balls.splice(bi, 1);
      }
    }

    if (this.balls.length === 0) {
      this._beginRoundEnd();
    }
  }

  // ── Skill activation ───────────────────────────────────────────────────────

  _activateSkill(ball, greenPeg) {
    switch (this.currentBallSkill) {
      case 'superGuide':
        this.superGuideActive = true;
        break;
      case 'spookyBall':
        this.spookyActive = true;
        break;
      case 'lightning':
        this._activateLightning(greenPeg);
        break;
      case 'multiball':
        this._activateMultiball(ball, greenPeg);
        break;
    }
  }

  _activateLightning(greenPeg) {
    const targets = [];
    this.levelSystem.pegs.forEach(p => {
      if (p.removed || p.removing || p.lit) return;
      const dx = p.pos.x - greenPeg.pos.x;
      const dy = p.pos.y - greenPeg.pos.y;
      if (Math.sqrt(dx * dx + dy * dy) > LIGHTNING_RADIUS) return;
      p.lit = true;
      this.score.awardPeg(p, this.levelSystem.orangeRemaining);
      this.particles.spawnPegHit(p.pos.x, p.pos.y, this._pegGlow(p.type));
      this.audio.playPegHit(p.type);
      targets.push({ x: p.pos.x, y: p.pos.y });
    });
    if (targets.length > 0) {
      this.lightningData = {
        source:   { x: greenPeg.pos.x, y: greenPeg.pos.y },
        targets,
        timer:    18,
        maxTimer: 18,
      };
    }
  }

  _activateMultiball(ball, greenPeg) {
    const angle  = Math.atan2(ball.vel.y, ball.vel.x);
    const speed  = Math.max(5, Math.min(ball.speed, 12));
    const spread = 0.35;
    this.balls.push(
      new Ball(greenPeg.pos.x, greenPeg.pos.y,
               Math.cos(angle + spread) * speed, Math.sin(angle + spread) * speed),
      new Ball(greenPeg.pos.x, greenPeg.pos.y,
               Math.cos(angle - spread) * speed, Math.sin(angle - spread) * speed)
    );
  }

  // ── Final catch ────────────────────────────────────────────────────────────

  _beginFinalCatch() {
    this.bucket.visible     = false;
    this.superGuideActive   = false;
    this.finalBucketsActive = true;
    this.levelSystem.startRemovingLitPegs();
    this._setState(STATE.FINAL_CATCH);
    // this.balls remains populated — all balls continue in final catch
  }

  _updateFinalCatch() {
    this.levelSystem.updateRemoving();

    if (this.balls.length === 0) {
      this.finalBucketsActive = false;
      this._beginFever();
      return;
    }

    const slotW = this.canvas.width / FC_SLOT_VALUES.length;

    for (let bi = this.balls.length - 1; bi >= 0; bi--) {
      const b      = this.balls[bi];
      const result = this.physics.update(b, this.levelSystem.getActivePegs(), this.canvas);

      if (result && result.hitPegs) {
        result.hitPegs.forEach(peg => {
          this.particles.spawnPegHit(peg.pos.x, peg.pos.y, this._pegGlow(peg.type));
          this.audio.playPegHit(peg.type);
        });
      }

      if (b.pos.y + b.radius > FC_BUCKET_TOP) {
        if (bi === 0) {
          // Primary ball gets divider physics and slot catch
          for (let i = 1; i < FC_SLOT_VALUES.length; i++) {
            const divX = slotW * i;
            const dx   = b.pos.x - divX;
            if (Math.abs(dx) < b.radius + FC_DIV_HALF) {
              const overlap = (b.radius + FC_DIV_HALF) - Math.abs(dx);
              b.pos.x += dx >= 0 ? overlap : -overlap;
              b.vel.x  = (dx >= 0 ? 1 : -1) * Math.abs(b.vel.x) * 0.8;
            }
          }
          if (b.pos.y > FC_BUCKET_TOP + b.radius + 12 || result === 'exited') {
            const slotIdx = Math.max(0, Math.min(FC_SLOT_VALUES.length - 1,
              Math.floor(b.pos.x / slotW)));
            this.score.awardFinalCatch(FC_SLOT_VALUES[slotIdx], b.pos.x, FC_BUCKET_TOP);
            this.audio.playBucketCatch();
            this.balls           = [];
            this._fountainX      = slotIdx * slotW + slotW / 2;
            this._fountainActive = true;
            // finalBucketsActive stays true — buckets remain visible through FEVER
            this._beginFever();
            return;
          }
        } else {
          // Extra balls — drop through when they hit the bucket zone
          this.balls.splice(bi, 1);
          continue;
        }
      }

      if (result === 'exited') {
        this.balls.splice(bi, 1);
        if (this.balls.length === 0) {
          this.finalBucketsActive = false;
          this._beginFever();
          return;
        }
      }
    }
  }

  // ── Round end ──────────────────────────────────────────────────────────────

  _beginRoundEnd() {
    this.balls            = [];
    // superGuideActive intentionally kept — persists to next AIMING phase
    this.spookyActive     = false;
    this.spookyUsed       = false;
    this.lightningData    = null;
    this.roundEndTimer    = ROUND_END_FRAMES;
    this._setState(STATE.ROUND_END);
  }

  _updateRoundEnd() {
    this.levelSystem.updateRemoving();
    this.roundEndTimer--;

    if (this.roundEndTimer === Math.floor(ROUND_END_FRAMES * 0.6)) {
      this.levelSystem.startRemovingLitPegs();
      this.audio.playRoundEnd();
    }

    if (this.roundEndTimer <= 0) {
      this._afterRound();
    }
  }

  _afterRound() {
    const allCleared = this.levelSystem.pegs.every(
      p => p.type !== 'orange' || p.removed || p.removing
    );
    if (allCleared) {
      this._beginFever();
    } else if (this.ballCount <= 0) {
      this.audio.playGameOver();
      this._setState(STATE.GAME_OVER);
    } else {
      this._setState(STATE.AIMING);
    }
  }

  // ── Fever ──────────────────────────────────────────────────────────────────

  _beginFever() {
    this.feverTimer     = 0;
    this.bucket.visible = false;
    this.audio.playOdeToJoy();
    this._setState(STATE.FEVER);
    this._fireworkBurst();
  }

  _fireworkBurst() {
    if (this.state !== STATE.FEVER && this.state !== STATE.LEVEL_CLEAR) return;
    this.particles.spawnFirework(
      80 + Math.random() * (this.width - 160),
      60 + Math.random() * 350
    );
    const delay = 280 + Math.random() * 320;
    setTimeout(() => this._fireworkBurst(), delay);
  }

  _updateFever() {
    this.feverTimer++;
    this.levelSystem.updateRemoving();
    if (this._fountainActive) {
      this.particles.spawnFountain(this._fountainX, FC_BUCKET_TOP);
    }
    if (this.feverTimer >= FEVER_FRAMES) {
      this._endFever();
    }
  }

  _endFever() {
    this._fountainActive    = false;
    this.finalBucketsActive = false;
    if (this.ballCount > 0) {
      this.score.awardRemainingBalls(this.ballCount);
      this.ballCount = 0;
      const slotIdx = Math.floor(Math.random() * FEVER_HOLE_VALUES.length);
      this.score.awardFeverHole(FEVER_HOLE_VALUES[slotIdx]);
    }
    this.levelClearTimer = LEVEL_CLEAR_FRAMES;
    this._setState(STATE.LEVEL_CLEAR);
  }

  _updateLevelClear() {
    this.levelClearTimer--;
    if (this.levelClearTimer <= 0) {
      if (this.levelSystem.hasNextLevel) {
        this._loadNextLevel();
      } else {
        this._setState(STATE.VICTORY);
      }
    }
  }

  // ── Input ──────────────────────────────────────────────────────────────────

  _setupInput() {
    this.canvas.addEventListener('mousemove', e => {
      const r = this.canvas.getBoundingClientRect();
      this.mouse.x = (e.clientX - r.left) * (this.canvas.width  / r.width);
      this.mouse.y = (e.clientY - r.top)  * (this.canvas.height / r.height);
    });

    this.canvas.addEventListener('click', () => {
      const mx  = this.mouse.x, my = this.mouse.y;
      const hit = r => mx >= r.x && mx <= r.x + r.w && my >= r.y && my <= r.y + r.h;

      switch (this.state) {
        case STATE.MENU: {
          // Close help overlay on any click
          if (this.screens._showHelp) { this.screens._showHelp = false; return; }

          const rects = this.screens.getMenuButtonRects(this.canvas.width, this.canvas.height);
          if (hit(rects.gear))       this.startGame(TEST_LEVEL_INDEX);
          else if (hit(rects.help))  this.screens._showHelp = true;
          else if (hit(rects.play))  this.startGame(0);
          break;
        }
        case STATE.AIMING: {
          // Test level: background switcher buttons
          if (this.isTestLevel) {
            const bgRects = this.hud.getTestBgButtonRects(this.canvas);
            const hitBg   = bgRects.find(r => hit(r));
            if (hitBg) { this.bgOverride = hitBg.bgId; return; }
          }
          this._fireBall();
          break;
        }
        case STATE.GAME_OVER: this._setState(STATE.MENU); break;
        case STATE.VICTORY:   this.startGame(0);          break;
      }
    });
  }

  _fireBall() {
    if (this.ballCount <= 0) return;
    const slotIdx         = 10 - this.ballCount;
    this.currentBallSkill = this.ballSlots[slotIdx] ?? null;
    this.ballPegHitCount  = 0;
    const launch = this.launcher.fire();
    this.balls        = [new Ball(launch.x, launch.y, launch.vx, launch.vy)];
    this.ballCount--;
    this.superGuideActive = false;
    this.spookyActive     = this.currentBallSkill === 'spookyBall';
    this.spookyUsed       = false;
    this.lightningData    = null;
    this._setState(STATE.SHOOTING);
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  _setState(s) {
    this.state = s;
    this.events.emit('stateChange', s);
  }

  _findLastOrangePeg() {
    const unlitOrange = this.levelSystem.pegs.filter(
      p => p.type === 'orange' && !p.removed && !p.removing && !p.lit
    );
    return unlitOrange.length === 1 ? unlitOrange[0] : null;
  }

  _pegGlow(type) {
    return { blue: '#88bbff', orange: '#ffcc44', green: '#88ff88', purple: '#ee88ff' }[type] || '#ffffff';
  }
}
