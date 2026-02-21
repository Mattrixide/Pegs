const KEY = 'pegs-highscores';
const MAX = 10;

const SEED = [
  { score: 847200, initials: 'ACE', date: '11/04/24' },
  { score: 712500, initials: 'ZAP', date: '09/17/24' },
  { score: 634800, initials: 'MJK', date: '01/02/25' },
  { score: 591000, initials: 'RXL', date: '12/25/24' },
  { score: 488400, initials: 'SKY', date: '10/31/24' },
  { score: 415700, initials: 'VHS', date: '08/14/24' },
  { score: 367200, initials: 'PIX', date: '11/22/24' },
  { score: 298500, initials: 'DRX', date: '07/04/24' },
  { score: 214300, initials: 'BOB', date: '02/14/25' },
  { score: 152800, initials: 'J T', date: '03/08/25' },
];

export function loadHighScores() {
  try {
    const stored = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (!stored || stored.length === 0) {
      localStorage.setItem(KEY, JSON.stringify(SEED));
      return [...SEED];
    }
    return stored;
  } catch { return [...SEED]; }
}

export function saveHighScore(score, initials = '???') {
  const list = loadHighScores();
  const d    = new Date();
  const date = `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}/${String(d.getFullYear()).slice(-2)}`;
  list.push({ score, initials, date });
  list.sort((a, b) => b.score - a.score);
  list.splice(MAX);
  localStorage.setItem(KEY, JSON.stringify(list));
  return list;
}
