// Fever multiplier thresholds (orange pegs remaining → multiplier)
const MULT_TABLE = [
  { max: 0,  mult: 'FEVER' },
  { max: 3,  mult: 10 },
  { max: 6,  mult: 5 },
  { max: 10, mult: 3 },
  { max: 15, mult: 2 },
  { max: 999, mult: 1 },
];

const PEG_BASE_VALUE = { blue: 10, orange: 100, green: 10, purple: 500 };

const FLOAT_COLOR = {
  blue:   '#88aaff',
  orange: '#ffaa44',
  green:  '#88ff88',
  purple: '#ee88ff',
};

export class ScoreSystem {
  constructor() {
    this.totalScore = 0;
    this.floatingTexts = [];
  }

  getMultiplier(orangeRemaining) {
    for (const { max, mult } of MULT_TABLE) {
      if (orangeRemaining <= max) return mult;
    }
    return 1;
  }

  // Called when a peg is hit mid-flight; awards points immediately
  awardPeg(peg, orangeRemaining) {
    const mult = this.getMultiplier(orangeRemaining);
    if (mult === 'FEVER') return 0;
    const value = PEG_BASE_VALUE[peg.type] * mult;
    this.totalScore += value;

    this.floatingTexts.push({
      x: peg.pos.x,
      y: peg.pos.y,
      text: `+${value}`,
      alpha: 1,
      vy: -1.8,
      color: FLOAT_COLOR[peg.type] || '#ffffff',
      scale: 1,
    });

    return value;
  }

  awardBucketBonus() {
    const value = 5000;
    this.totalScore += value;
    this.floatingTexts.push({
      x: 400, y: 580,
      text: 'FREE BALL! +5000',
      alpha: 1, vy: -1.5,
      color: '#ffffaa', scale: 1.3,
    });
  }

  awardRemainingBalls(count) {
    const bonus = count * 10000;
    this.totalScore += bonus;
    return bonus;
  }

  awardFinalCatch(value, x, bucketTop) {
    this.totalScore += value;
    this.floatingTexts.push({
      x,
      y: bucketTop - 10,
      text: `+${value >= 1000 ? value / 1000 + 'K' : value} FINAL CATCH!`,
      alpha: 1,
      vy: -1.8,
      color: '#ffee44',
      scale: 1.6,
    });
  }

  awardFeverHole(value) {
    this.totalScore += value;
    this.floatingTexts.push({
      x: 400, y: 560,
      text: `+${(value / 1000).toFixed(0)}K FEVER BONUS`,
      alpha: 1, vy: -1.2,
      color: '#ffdd44', scale: 1.4,
    });
  }

  update() {
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.y += ft.vy;
      ft.alpha -= 0.016;
      if (ft.alpha <= 0) this.floatingTexts.splice(i, 1);
    }
  }

  reset() {
    this.totalScore = 0;
    this.floatingTexts = [];
  }
}
