import { Game }    from './core/Game.js';
import { VERSION } from './version.js';

const canvas = document.getElementById('game-canvas');
const game = new Game(canvas, VERSION);
game.start();
