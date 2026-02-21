export const PEG_COLORS = {
  blue:   { base: '#1a4499', rim: '#3366cc', lit: '#aaccff', glow: '#4488ff' },
  orange: { base: '#993300', rim: '#cc5500', lit: '#ffcc44', glow: '#ff8800' },
  green:  { base: '#1a5522', rim: '#228833', lit: '#aaffaa', glow: '#44dd44' },
  purple: { base: '#661188', rim: '#882299', lit: '#ee88ff', glow: '#cc44ff' },
};

export class Peg {
  constructor(x, y, type = 'blue') {
    this.pos = { x, y };
    this.radius = 10;
    this.type = type;
    this.lit = false;
    this.removed = false;
    this.removing = false;   // fade-out animation in progress
    this.removeTimer = 0;    // counts down from REMOVE_FRAMES to 0
    this.hitCooldown = 0;    // prevents multi-hit jitter
  }
}

export const REMOVE_FRAMES = 30;
