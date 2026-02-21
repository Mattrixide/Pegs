import { Peg, REMOVE_FRAMES } from '../entities/Peg.js';
import { levels } from '../data/levels.js';

export class LevelSystem {
  constructor() {
    this.currentIndex = 0;
    this.pegs = [];
    this.totalOrange = 0;
    this.orangeRemaining = 0;
  }

  get currentLevel() { return levels[this.currentIndex]; }
  get hasNextLevel()  { return this.currentIndex < levels.length - 1; }
  get totalLevels()   { return levels.length; }

  load(index) {
    this.currentIndex = index;
    const data = levels[index];
    this.pegs = data.pegs.map(p => new Peg(p.x, p.y, p.type));
    this.totalOrange = this.pegs.filter(p => p.type === 'orange').length;
    this.orangeRemaining = this.totalOrange;
    return data;
  }

  // Returns all pegs that should be tested for physics
  getActivePegs() {
    return this.pegs.filter(p => !p.removed && !p.removing);
  }

  // Returns all pegs that should be rendered (including removing ones)
  getRenderPegs() {
    return this.pegs.filter(p => !p.removed);
  }

  // Begin the fade-out animation for all lit pegs after a ball exits
  startRemovingLitPegs() {
    let orangeCleared = 0;
    this.pegs.forEach(p => {
      if (p.lit) {
        p.lit = false;
        p.removing = true;
        p.removeTimer = REMOVE_FRAMES;
        if (p.type === 'orange') orangeCleared++;
      }
    });
    this.orangeRemaining -= orangeCleared;
    this._relocatePurple();
    return orangeCleared;
  }

  // Called each frame during ROUND_END to tick peg removal animation
  updateRemoving() {
    this.pegs.forEach(p => {
      if (p.removing) {
        p.removeTimer--;
        if (p.removeTimer <= 0) {
          p.removing = false;
          p.removed = true;
        }
      }
    });
  }

  _relocatePurple() {
    // Move purple designation to a random blue peg (Peggle's roving bonus peg)
    const cur = this.pegs.find(p => p.type === 'purple' && !p.removed && !p.removing);
    const candidates = this.pegs.filter(p => p.type === 'blue' && !p.removed && !p.removing);
    if (cur && candidates.length > 0) {
      cur.type = 'blue';
      candidates[Math.floor(Math.random() * candidates.length)].type = 'purple';
    }
  }
}
