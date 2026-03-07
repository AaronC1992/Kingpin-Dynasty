// miniGames.js — Mini-games module (TTT engine, Number Guessing, RPS, Memory, Snake, Quick Draw)
// Extracted from game.js for structural clarity.

import { player } from './player.js';

// ── Dependencies (injected from game.js via initMiniGames) ───────────
let _hideAllScreens, _updateUI, _alert, _logAction, _updateStatistic;

export function initMiniGames({ hideAllScreens, updateUI, alert, logAction, updateStatistic }) {
  _hideAllScreens = hideAllScreens;
  _updateUI = updateUI;
  _alert = alert;
  _logAction = logAction;
  _updateStatistic = updateStatistic;
}

// ═══════════════════════════════════════════════════════════════════════
// UNIFIED TIKTAKTOE ENGINE
// Single game engine used by both jail and mini-games screens.
// Each context holds its own state, DOM selectors, and reward callbacks.
// ═══════════════════════════════════════════════════════════════════════

const TTT_WIN_PATTERNS = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
  [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
  [0, 4, 8], [2, 4, 6]              // Diagonals
];

const tttContexts = {
  jail: {
    board: ['', '', '', '', '', '', '', '', ''],
    currentPlayer: 'X',
    active: false,
    cellSelector: '.tiktaktoe-cell',
    startId: 'tiktaktoe-start',
    gameId: 'tiktaktoe-game',
    playerLabelId: 'current-player',
    statusId: 'game-status',
    opponentName: 'Cellmate',
    onStart: () => {
      _logAction(`You challenge a cellmate to TikTakToe. Time to see who has the sharper mind in this concrete jungle!`);
    },
    onWin: () => {
      const timeReduction = Math.min(10, Math.floor(player.jailTime * 0.2));
      player.jailTime -= timeReduction;
      if (!player.gangRespect) player.gangRespect = 0;
      player.gangRespect = Math.min(100, player.gangRespect + 2);
      const msg = `Victory! You outsmarted your cellmate with superior strategy. Word spreads fast - your sentence is reduced by ${timeReduction} seconds and you gain +2 Gang Respect!`;
      _logAction(`TikTakToe victory! You proved your mental superiority over your cellmate. Sentence reduced by ${timeReduction}s. Gang Respect +2. Even in confinement, the criminal mastermind shines.`);
      return msg;
    },
    onLose: () => {
      const msg = `Defeat! Your cellmate outplayed you this time. Sometimes the student becomes the teacher.`;
      _logAction(`TikTakToe defeat! Your cellmate's cunning exceeded your own this round. A humbling reminder that every criminal has something to learn.`);
      return msg;
    },
    onTie: () => {
      if (!player.gangRespect) player.gangRespect = 0;
      player.gangRespect = Math.min(100, player.gangRespect + 1);
      const msg = `Stalemate! Neither you nor your cellmate could claim victory. Respect earned on both sides (+1 Gang Respect).`;
      _logAction(`TikTakToe stalemate! Both players showed equal skill in this battle of wits. Gang Respect +1. Honor among thieves indeed.`);
      return msg;
    },
    onQuit: () => {
      _alert(`You forfeit the game and walk away. Your cellmate chuckles at your strategic retreat.`);
      _logAction(`You quit the TikTakToe game mid-match. Sometimes knowing when to fold is the mark of a true strategist.`);
    }
  },
  minigame: {
    board: ['', '', '', '', '', '', '', '', ''],
    currentPlayer: 'X',
    active: false,
    cellSelector: '.mg-tiktaktoe-cell',
    startId: 'mg-tiktaktoe-start',
    gameId: 'mg-tiktaktoe-game',
    playerLabelId: 'mg-current-player',
    statusId: 'mg-game-status',
    opponentName: 'AI',
    onStart: () => {},
    onWin: () => {
      player.money += 100;
      _updateStatistic('miniGamesWon');
      _updateStatistic('totalMoneyEarned', 100);
      _updateUI();
      const msg = `Victory! You've proven your strategic superiority and earned $100! Your mind is as sharp as your criminal instincts!`;
      _logAction(`TikTakToe victory! Your strategic thinking pays off with $100 earned.`);
      return msg;
    },
    onLose: () => {
      const msg = `Defeat! The AI outmaneuvered you this time. Even master criminals can learn from failure.`;
      _logAction(`TikTakToe defeat! The AI proves its worth, but every loss is a lesson learned.`);
      return msg;
    },
    onTie: () => {
      const msg = `Stalemate! Neither player could claim victory. A battle of equals!`;
      _logAction(`TikTakToe stalemate! Sometimes the greatest victories are knowing when to call it even.`);
      return msg;
    },
    onQuit: () => {}
  }
};

// --- Core TikTakToe engine (context-based, zero duplication) ---

function tttStart(ctx) {
  ctx.board = ['', '', '', '', '', '', '', '', ''];
  ctx.currentPlayer = 'X';
  ctx.active = true;
  document.getElementById(ctx.startId).style.display = 'none';
  document.getElementById(ctx.gameId).style.display = 'block';
  tttUpdateDisplay(ctx);
  const cells = document.querySelectorAll(ctx.cellSelector);
  cells.forEach(cell => {
    cell.textContent = '';
    cell.disabled = false;
    cell.style.background = '#1a1610';
  });
  ctx.onStart();
}

function tttMakeMove(ctx, cellIndex) {
  if (!ctx.active || ctx.board[cellIndex] !== '') return;
  ctx.board[cellIndex] = 'X';
  const cell = document.querySelectorAll(ctx.cellSelector)[cellIndex];
  cell.textContent = 'X';
  cell.style.color = '#8a9a6a';
  cell.disabled = true;
  const result = tttCheckWinner(ctx);
  if (result) { tttEnd(ctx, result); return; }
  ctx.currentPlayer = 'O';
  tttUpdateDisplay(ctx);
  setTimeout(() => tttMakeAIMove(ctx), 500);
}

function tttMakeAIMove(ctx) {
  if (!ctx.active) return;
  const aiMove = tttFindBestMove(ctx);
  if (aiMove === -1) return;
  ctx.board[aiMove] = 'O';
  const cell = document.querySelectorAll(ctx.cellSelector)[aiMove];
  cell.textContent = 'O';
  cell.style.color = '#8b3a3a';
  cell.disabled = true;
  const result = tttCheckWinner(ctx);
  if (result) { tttEnd(ctx, result); return; }
  ctx.currentPlayer = 'X';
  tttUpdateDisplay(ctx);
}

function tttFindBestMove(ctx) {
  for (let i = 0; i < 9; i++) {
    if (ctx.board[i] === '') {
      ctx.board[i] = 'O';
      if (tttCheckWinningMove(ctx, 'O')) { ctx.board[i] = ''; return i; }
      ctx.board[i] = '';
    }
  }
  for (let i = 0; i < 9; i++) {
    if (ctx.board[i] === '') {
      ctx.board[i] = 'X';
      if (tttCheckWinningMove(ctx, 'X')) { ctx.board[i] = ''; return i; }
      ctx.board[i] = '';
    }
  }
  if (ctx.board[4] === '') return 4;
  for (const c of [0, 2, 6, 8]) { if (ctx.board[c] === '') return c; }
  for (let i = 0; i < 9; i++) { if (ctx.board[i] === '') return i; }
  return -1;
}

function tttCheckWinningMove(ctx, mark) {
  return TTT_WIN_PATTERNS.some(p => p.every(i => ctx.board[i] === mark));
}

function tttCheckWinner(ctx) {
  for (const [a, b, c] of TTT_WIN_PATTERNS) {
    if (ctx.board[a] && ctx.board[a] === ctx.board[b] && ctx.board[a] === ctx.board[c]) {
      return ctx.board[a];
    }
  }
  if (ctx.board.every(cell => cell !== '')) return 'tie';
  return null;
}

function tttEnd(ctx, result) {
  ctx.active = false;
  let message;
  if (result === 'X') message = ctx.onWin();
  else if (result === 'O') message = ctx.onLose();
  else message = ctx.onTie();
  _alert(message);
  document.querySelectorAll(ctx.cellSelector).forEach(cell => { cell.disabled = true; });
  setTimeout(() => tttReset(ctx), 3000);
}

function tttUpdateDisplay(ctx) {
  const label = document.getElementById(ctx.playerLabelId);
  const status = document.getElementById(ctx.statusId);
  if (ctx.currentPlayer === 'X') {
    label.textContent = 'Your turn (X)';
    label.style.color = '#8a9a6a';
    status.textContent = 'Make your move!';
  } else {
    label.textContent = `${ctx.opponentName}'s turn (O)`;
    label.style.color = '#8b3a3a';
    status.textContent = `Waiting for ${ctx.opponentName.toLowerCase()}...`;
  }
}

function tttQuit(ctx) {
  if (ctx.active) ctx.onQuit();
  tttReset(ctx);
}

function tttReset(ctx) {
  ctx.active = false;
  ctx.board = ['', '', '', '', '', '', '', '', ''];
  ctx.currentPlayer = 'X';
  document.getElementById(ctx.startId).style.display = 'block';
  document.getElementById(ctx.gameId).style.display = 'none';
  const cells = document.querySelectorAll(ctx.cellSelector);
  cells.forEach(cell => {
    cell.textContent = '';
    cell.disabled = false;
    cell.style.background = '#1a1610';
    cell.style.color = 'white';
  });
}

// --- Public API wrappers (Jail TikTakToe — called from index.html) ---
export function startTikTakToe()       { tttStart(tttContexts.jail); }
export function makeMove(cellIndex)    { tttMakeMove(tttContexts.jail, cellIndex); }
export function makeAIMove()           { tttMakeAIMove(tttContexts.jail); }
export function quitTikTakToe()        { tttQuit(tttContexts.jail); }
export function resetTikTakToe()       { tttReset(tttContexts.jail); }

// ═══════════════════════════════════════════════════════════════════════
// MINI-GAME STATE & TRACKING
// ═══════════════════════════════════════════════════════════════════════

let currentMiniGame = null;

// Per-game state variables
let numberGuessingTarget = 0;
let numberGuessingAttempts = 0;
let rpsPlayerScore = 0;
let rpsAIScore = 0;
let rpsRoundsPlayed = 0;
let memoryCards = [];
let memoryFlippedCards = [];
let memoryMatchedPairs = 0;
let memoryStartTime = 0;
let memoryPersonalBest = null;
let snakeGame = null;
function snakeMouseEnter() { if (snakeGame) snakeGame.mouseInCanvas = true; }
function snakeMouseLeave() { if (snakeGame) snakeGame.mouseInCanvas = false; }
let quickDrawStartTime = 0;
let quickDrawWaiting = false;
let quickDrawPersonalBest = null;

// Cooldown & daily limit tracking
let miniGameCooldowns = {
  memory: 0,
  quickDraw: 0,
  snake: 0,
  tiktaktoe: 0,
  tiktaktoeJail: 0
};
const MINIGAME_COOLDOWN_MS = 5 * 60 * 1000; // 5 minutes
const DAILY_GAME_LIMIT = 10;
let miniGameDailyPlays = {
  memory: { count: 0, lastReset: Date.now() },
  quickDraw: { count: 0, lastReset: Date.now() },
  snake: { count: 0, lastReset: Date.now() },
  tiktaktoe: { count: 0, lastReset: Date.now() },
  tiktaktoeJail: { count: 0, lastReset: Date.now() }
};

export function checkDailyReset(gameType) {
  const now = Date.now();
  const dayInMs = 24 * 60 * 60 * 1000;
  if (now - miniGameDailyPlays[gameType].lastReset > dayInMs) {
    miniGameDailyPlays[gameType].count = 0;
    miniGameDailyPlays[gameType].lastReset = now;
  }
}

export function canPlayMiniGame(gameType) {
  checkDailyReset(gameType);
  const now = Date.now();
  if (miniGameCooldowns[gameType] > now) {
    const remaining = Math.ceil((miniGameCooldowns[gameType] - now) / 1000 / 60);
    _alert(`Cool down! You need to wait ${remaining} more minute(s) before playing this again.`);
    return false;
  }
  if (miniGameDailyPlays[gameType].count >= DAILY_GAME_LIMIT) {
    _alert(`Daily limit reached! You've played this game ${DAILY_GAME_LIMIT} times today. Come back tomorrow!`);
    return false;
  }
  return true;
}

export function trackMiniGamePlay(gameType) {
  miniGameCooldowns[gameType] = Date.now() + MINIGAME_COOLDOWN_MS;
  miniGameDailyPlays[gameType].count++;
}

// ═══════════════════════════════════════════════════════════════════════
// MINI-GAMES SCREEN & IMPLEMENTATIONS
// ═══════════════════════════════════════════════════════════════════════

export function showMiniGames() {
  // Mini Games are now a tab inside the Gambling screen
  window.showCasino('minigames');
}

export function backToMiniGamesList() {
  if (currentMiniGame) {
    resetCurrentMiniGame();
  }

  document.getElementById("minigame-tiktaktoe").style.display = "none";
  document.getElementById("other-minigames").style.display = "none";

  setTimeout(() => {
    const target = document.getElementById("panel-minigames") || document.getElementById("casino-screen");
    if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, 100);

  currentMiniGame = null;
}

export function resetCurrentMiniGame() {
  switch(currentMiniGame) {
    case 'tiktaktoe':
      mgResetTikTakToe();
      break;
    case 'number-guessing':
      break;
    case 'rps':
      rpsPlayerScore = 0;
      rpsAIScore = 0;
      rpsRoundsPlayed = 0;
      break;
    case 'memory':
      memoryCards = [];
      memoryFlippedCards = [];
      memoryMatchedPairs = 0;
      if (window.memoryTimerInterval) {
        clearInterval(window.memoryTimerInterval);
        window.memoryTimerInterval = null;
      }
      break;
    case 'snake':
      if (snakeGame) {
        clearInterval(snakeGame.gameLoop);
        document.removeEventListener('keydown', handleSnakeControls);
        if (snakeGame.canvas) {
          snakeGame.canvas.removeEventListener('mousemove', handleSnakeMouseMove);
          snakeGame.canvas.removeEventListener('mouseenter', snakeMouseEnter);
          snakeGame.canvas.removeEventListener('mouseleave', snakeMouseLeave);
        }
        snakeGame = null;
      }
      break;
    case 'quick-draw':
      quickDrawWaiting = false;
      break;
  }
}

// --- TikTakToe mini-game wrappers ---

export function startMiniGameTikTakToe() {
  currentMiniGame = 'tiktaktoe';
  document.getElementById("minigame-tiktaktoe").style.display = "block";
  mgResetTikTakToe();
  setTimeout(() => {
    document.getElementById("minigame-tiktaktoe").scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, 100);
  _logAction("You sit down for a strategic game of TikTakToe. Time to prove your tactical superiority!");
}

export function mgStartTikTakToe()          { tttStart(tttContexts.minigame); }
export function mgMakeMove(cellIndex)       { tttMakeMove(tttContexts.minigame, cellIndex); }
export function mgMakeAIMove()              { tttMakeAIMove(tttContexts.minigame); }
export function mgQuitTikTakToe()           { tttReset(tttContexts.minigame); }
export function mgResetTikTakToe()          { tttReset(tttContexts.minigame); }

// --- Number Guessing Game ---

export function startNumberGuessing() {
  currentMiniGame = 'number-guessing';
  document.getElementById("other-minigames").style.display = "block";

  numberGuessingTarget = Math.floor(Math.random() * 100) + 1;
  numberGuessingAttempts = 0;

  document.getElementById("minigame-content").innerHTML = `
    <h3 style="color: #8a9a6a; text-align: center; margin-bottom: 20px;">Number Hunter</h3>
    <div style="text-align: center;">
      <p style="font-size: 1.2em; margin-bottom: 20px;">I'm thinking of a number between 1 and 100!</p>
      <p>Attempts: <span id="guess-attempts">0</span></p>
      <div style="margin: 20px 0;">
        <input type="number" id="guess-input" min="1" max="100" placeholder="Enter your guess..."
            style="padding: 10px; font-size: 16px; border-radius: 5px; border: 2px solid #8a9a6a; width: 150px; text-align: center;"
            onkeypress="if(event.key==='Enter') makeGuess()">
        <button onclick="makeGuess()" style="background: #8a9a6a; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer; margin-left: 10px;">
          Guess!
        </button>
      </div>
      <div id="guess-feedback" style="font-size: 1.1em; margin-top: 20px; min-height: 30px;"></div>
    </div>
  `;

  setTimeout(() => {
    document.getElementById("other-minigames").scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });
    document.getElementById("guess-input").focus();
  }, 100);

  _logAction("You challenge yourself to a game of Number Hunter. Can your intuition guide you to victory?");
}

export function makeGuess() {
  const input = document.getElementById('guess-input');
  const guess = parseInt(input.value);

  if (isNaN(guess) || guess < 1 || guess > 100) {
    document.getElementById('guess-feedback').innerHTML = '<span style="color: #8b3a3a;">Please enter a number between 1 and 100!</span>';
    return;
  }

  numberGuessingAttempts++;
  document.getElementById('guess-attempts').textContent = numberGuessingAttempts;

  if (guess === numberGuessingTarget) {
    const baseReward = 100 + (player.level * 50);
    const attemptBonus = Math.max(0, (10 - numberGuessingAttempts) * Math.floor(baseReward * 0.1));
    const totalReward = baseReward + attemptBonus;
    player.money += totalReward;

    _updateStatistic('miniGamesWon');
    _updateStatistic('totalMoneyEarned', totalReward);

    _updateUI();
    document.getElementById('guess-feedback').innerHTML = `<span style="color: #8a9a6a;">Correct! You found ${numberGuessingTarget} in ${numberGuessingAttempts} attempts and earned $${totalReward.toLocaleString()}!</span>`;
    _logAction(`Number Hunter victory! Found the target ${numberGuessingTarget} in ${numberGuessingAttempts} attempts and earned $${totalReward.toLocaleString()}. Your intuition is razor-sharp.`);
    setTimeout(() => startNumberGuessing(), 3000);
  } else if (guess < numberGuessingTarget) {
    document.getElementById('guess-feedback').innerHTML = '<span style="color: #c0a040;">Too low! Go higher!</span>';
  } else {
    document.getElementById('guess-feedback').innerHTML = '<span style="color: #c0a040;">Too high! Go lower!</span>';
  }

  input.value = '';
  input.focus();
}

// --- Rock Paper Scissors ---

export function startRockPaperScissors() {
  currentMiniGame = 'rps';
  document.getElementById("other-minigames").style.display = "block";

  rpsPlayerScore = 0;
  rpsAIScore = 0;
  rpsRoundsPlayed = 0;

  updateRPSDisplay();

  setTimeout(() => {
    document.getElementById("other-minigames").scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });
  }, 100);

  _logAction("You challenge the AI to Rock Paper Scissors. Best of 5 rounds - may the best strategist win!");
}

export function updateRPSDisplay() {
  document.getElementById("minigame-content").innerHTML = `
    <h3 style="color: #8b3a3a; text-align: center; margin-bottom: 20px;">Rock Paper Scissors</h3>
    <div style="text-align: center;">
      <p style="font-size: 1.2em; margin-bottom: 20px;">Best of 5 Rounds</p>
      <div style="display: flex; justify-content: space-around; margin: 20px 0;">
        <div>
          <h4>You</h4>
          <p style="font-size: 2em;">${rpsPlayerScore}</p>
        </div>
        <div>
          <h4>Round</h4>
          <p style="font-size: 1.5em;">${rpsRoundsPlayed + 1}/5</p>
        </div>
        <div>
          <h4>AI</h4>
          <p style="font-size: 2em;">${rpsAIScore}</p>
        </div>
      </div>
      ${rpsPlayerScore < 3 && rpsAIScore < 3 ? `
        <div style="display: flex; justify-content: center; gap: 20px; margin: 30px 0;">
          <button onclick="playRPS('rock')" style="background: #8a7a5a; color: white; padding: 20px; border: none; border-radius: 10px; cursor: pointer; font-size: 24px;">
            Rock
          </button>
          <button onclick="playRPS('paper')" style="background: #c0a062; color: white; padding: 20px; border: none; border-radius: 10px; cursor: pointer; font-size: 24px;">
            Paper
          </button>
          <button onclick="playRPS('scissors')" style="background: #8b3a3a; color: white; padding: 20px; border: none; border-radius: 10px; cursor: pointer; font-size: 24px;">
            Scissors
          </button>
        </div>
      ` : `
        <div style="margin: 30px 0;">
          <h3>${rpsPlayerScore > rpsAIScore ? 'You Won the Match! +$' + (100 + (player.level * 50)).toLocaleString() : 'AI Won the Match!'}</h3>
          <button onclick="startRockPaperScissors()" style="background: #8a9a6a; color: white; padding: 15px 25px; border: none; border-radius: 8px; cursor: pointer; margin-top: 15px;">
            Play Again
          </button>
        </div>
      `}
      <div id="rps-result" style="font-size: 1.2em; margin-top: 20px; min-height: 40px;"></div>
    </div>
  `;
}

export function playRPS(playerChoice) {
  const choices = ['rock', 'paper', 'scissors'];
  const aiChoice = choices[Math.floor(Math.random() * 3)];

  const choiceEmojis = { rock: '', paper: '', scissors: '' };

  let result = '';
  if (playerChoice === aiChoice) {
    result = `Tie! Both chose ${choiceEmojis[playerChoice]}`;
  } else if (
    (playerChoice === 'rock' && aiChoice === 'scissors') ||
    (playerChoice === 'paper' && aiChoice === 'rock') ||
    (playerChoice === 'scissors' && aiChoice === 'paper')
  ) {
    result = `You win! ${choiceEmojis[playerChoice]} beats ${choiceEmojis[aiChoice]}`;
    rpsPlayerScore++;
  } else {
    result = `AI wins! ${choiceEmojis[aiChoice]} beats ${choiceEmojis[playerChoice]}`;
    rpsAIScore++;
  }

  document.getElementById('rps-result').innerHTML = result;
  rpsRoundsPlayed++;

  setTimeout(() => {
    updateRPSDisplay();
    if (rpsPlayerScore >= 3) {
      const rpsReward = 100 + (player.level * 50);
      player.money += rpsReward;
      _updateUI();
      _logAction(`Rock Paper Scissors champion! Your tactical mind proves superior in this classic game of psychology and earned $${rpsReward.toLocaleString()}.`);
    } else if (rpsAIScore >= 3) {
      _logAction("The AI outplays you in Rock Paper Scissors. Sometimes the algorithms know best.");
    }
  }, 1500);
}

// --- Memory Match ---

export function startMemoryMatch() {
  if (!canPlayMiniGame('memory')) return;

  currentMiniGame = 'memory';
  document.getElementById("other-minigames").style.display = "block";

  const symbols = ['[X]', '[$]', '[!]', '[V]', '[D]', '[G]', '[B]', '[Z]'];
  memoryCards = [...symbols, ...symbols].sort(() => Math.random() - 0.5);
  memoryFlippedCards = [];
  memoryMatchedPairs = 0;
  memoryStartTime = Date.now();

  const bestTimeText = memoryPersonalBest ? `Personal Best: ${memoryPersonalBest}s` : 'No personal best yet';

  let cardHTML = '<h3 style="color: #c0a040; text-align: center; margin-bottom: 20px;">Memory Match</h3>';
  cardHTML += '<p style="text-align: center; margin-bottom: 10px;">Find all pairs in under 60s for $100! Beat your best time for $500!</p>';
  cardHTML += '<p style="text-align: center; margin-bottom: 5px; color: #8b6a4a; font-weight: bold;">Rewards: Cash bonuses for speed & personal bests</p>';
  cardHTML += `<p style="text-align: center; margin-bottom: 10px; color: #c0a040; font-weight: bold;">${bestTimeText}</p>`;
  cardHTML += '<p style="text-align: center; margin-bottom: 20px;">Time: <span id="memory-timer" style="color: #8b3a3a; font-weight: bold;">60</span>s | Pairs: <span id="memory-score">0</span>/8</p>';
  cardHTML += '<div style="display: grid; grid-template-columns: repeat(4, 80px); gap: 10px; justify-content: center; margin: 20px auto;">';

  for (let i = 0; i < 16; i++) {
    cardHTML += `
      <button id="memory-card-${i}" onclick="flipMemoryCard(${i})"
          style="width: 80px; height: 80px; font-size: 32px; background: #1a1610; color: white;
              border: 2px solid #6a5a3a; border-radius: 8px; cursor: pointer;">
        ?
      </button>
    `;
  }

  cardHTML += '</div>';

  document.getElementById("minigame-content").innerHTML = cardHTML;

  // Start timer
  const timerInterval = setInterval(() => {
    const elapsed = Math.floor((Date.now() - memoryStartTime) / 1000);
    const remaining = Math.max(0, 60 - elapsed);
    document.getElementById('memory-timer').textContent = remaining;

    if (remaining <= 0 && memoryMatchedPairs < 8) {
      clearInterval(timerInterval);
      _alert('Time\'s up! Try again for the bonuses.');
      _logAction("Memory Match: Time ran out! Practice makes perfect in the criminal mind game.");
      setTimeout(() => startMemoryMatch(), 2000);
    }
  }, 1000);

  window.memoryTimerInterval = timerInterval;

  setTimeout(() => {
    document.getElementById("other-minigames").scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });
  }, 100);

  _logAction("You test your memory with a challenging card matching game. Beat the clock and your records for maximum rewards!");
}

export function flipMemoryCard(index) {
  if (memoryFlippedCards.length >= 2 || memoryFlippedCards.includes(index)) return;

  const card = document.getElementById(`memory-card-${index}`);
  card.textContent = memoryCards[index];
  card.style.background = '#c0a062';
  card.disabled = true;

  memoryFlippedCards.push(index);

  if (memoryFlippedCards.length === 2) {
    setTimeout(() => {
      const [first, second] = memoryFlippedCards;
      if (memoryCards[first] === memoryCards[second]) {
        memoryMatchedPairs++;
        document.getElementById('memory-score').textContent = memoryMatchedPairs;

        if (memoryMatchedPairs === 8) {
          if (window.memoryTimerInterval) {
            clearInterval(window.memoryTimerInterval);
          }

          const totalTime = Math.floor((Date.now() - memoryStartTime) / 1000);
          let bonusMessage = '';
          let earnedTimeBonus = false;
          let earnedPersonalBest = false;
          let totalEarned = 0;

          const memoryBaseReward = 200 + (player.level * 100);

          if (memoryPersonalBest === null || totalTime < memoryPersonalBest) {
            memoryPersonalBest = totalTime;
            earnedPersonalBest = true;
            const bestBonus = Math.floor(memoryBaseReward * 2.5);
            totalEarned += bestBonus;
            player.money += bestBonus;
          }

          if (totalTime <= 60) {
            earnedTimeBonus = true;
            totalEarned += memoryBaseReward;
            player.money += memoryBaseReward;
          }

          if (totalEarned > 0) {
            _updateUI();
          }

          trackMiniGamePlay('memory');

          if (earnedPersonalBest && earnedTimeBonus) {
            bonusMessage = ` NEW PERSONAL BEST! You earned $600 total ($500 + $100)!`;
            _logAction(`Memory Match master! New personal best of ${totalTime}s under the time limit, earning you $600 total for exceptional memory skills!`);
          } else if (earnedPersonalBest) {
            bonusMessage = ` NEW PERSONAL BEST! You earned $500!`;
            _logAction(`Memory Match: New personal best of ${totalTime}s! Your improving memory earned you $500!`);
          } else if (earnedTimeBonus) {
            bonusMessage = ` You completed it in time and earned $100!`;
            _logAction(`Memory Match completed in ${totalTime}s under the time limit, earning you $100 for your sharp criminal intellect!`);
          } else {
            _logAction(`Memory Match completed in ${totalTime}s. Good memory, but you needed to be faster for bonuses.`);
          }

          _alert(`All pairs found in ${totalTime} seconds!${bonusMessage}\nPersonal Best: ${memoryPersonalBest}s`);
          setTimeout(() => startMemoryMatch(), 2000);
        }
      } else {
        document.getElementById(`memory-card-${first}`).textContent = '?';
        document.getElementById(`memory-card-${first}`).style.background = '#1a1610';
        document.getElementById(`memory-card-${first}`).disabled = false;
        document.getElementById(`memory-card-${second}`).textContent = '?';
        document.getElementById(`memory-card-${second}`).style.background = '#1a1610';
        document.getElementById(`memory-card-${second}`).disabled = false;
      }
      memoryFlippedCards = [];
    }, 1000);
  }
}

// --- Snake Game ---

export function startSnakeGame() {
  if (!canPlayMiniGame('snake')) return;

  currentMiniGame = 'snake';
  document.getElementById("other-minigames").style.display = "block";

  document.getElementById("minigame-content").innerHTML = `
    <h3 style="color: #8b6a4a; text-align: center; margin-bottom: 20px;">Snake</h3>
    <div style="text-align: center;">
      <p style="margin-bottom: 5px; color: #7a8a5a; font-weight: bold;">Rewards: Cash & Stamina boost</p>
      <p>Score: <span id="snake-score">0</span></p>
      <canvas id="snake-canvas" width="400" height="400"
          style="border: 2px solid #8b6a4a; background: #14120a; margin: 20px auto; display: block; cursor: crosshair;"></canvas>
      <p style="margin-top: 10px; color: #f5e6c8;">
        <strong>Controls:</strong> Use WASD keys or move your mouse in the canvas to start and guide the snake<br>
        <small>W = Up, A = Left, S = Down, D = Right | Game starts when you give input</small>
      </p>
      <button onclick="restartSnake()" style="background: #8b6a4a; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer;">
        Restart Game
      </button>
    </div>
  `;

  setTimeout(() => {
    document.getElementById("other-minigames").scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });
  }, 100);

  initSnakeGame();
  _logAction("You start a classic game of Snake. Precision and planning will keep you alive and growing!");
}

export function initSnakeGame() {
  const canvas = document.getElementById('snake-canvas');
  const ctx = canvas.getContext('2d');

  document.removeEventListener('keydown', handleSnakeControls);

  snakeGame = {
    canvas: canvas,
    ctx: ctx,
    gridSize: 20,
    snake: [{x: 200, y: 200}],
    direction: {x: 0, y: 0},
    food: {x: 0, y: 0},
    score: 0,
    gameLoop: null,
    mousePos: {x: 0, y: 0},
    lastDirection: {x: 0, y: 0},
    gameStarted: false
  };

  generateFood();
  drawSnake();

  document.addEventListener('keydown', handleSnakeControls);

  canvas.addEventListener('mousemove', handleSnakeMouseMove);
  canvas.addEventListener('mouseenter', snakeMouseEnter);
  canvas.addEventListener('mouseleave', snakeMouseLeave);
}

export function generateFood() {
  snakeGame.food = {
    x: Math.floor(Math.random() * (snakeGame.canvas.width / snakeGame.gridSize)) * snakeGame.gridSize,
    y: Math.floor(Math.random() * (snakeGame.canvas.height / snakeGame.gridSize)) * snakeGame.gridSize
  };
}

export function handleSnakeControls(e) {
  if (currentMiniGame !== 'snake') return;

  let newDirection = null;

  switch(e.key.toLowerCase()) {
    case 'w':
      if (snakeGame.direction.y === 0) {
        newDirection = {x: 0, y: -snakeGame.gridSize};
      }
      break;
    case 's':
      if (snakeGame.direction.y === 0) {
        newDirection = {x: 0, y: snakeGame.gridSize};
      }
      break;
    case 'a':
      if (snakeGame.direction.x === 0) {
        newDirection = {x: -snakeGame.gridSize, y: 0};
      }
      break;
    case 'd':
      if (snakeGame.direction.x === 0) {
        newDirection = {x: snakeGame.gridSize, y: 0};
      }
      break;
  }

  if (newDirection) {
    snakeGame.direction = newDirection;
    snakeGame.lastDirection = newDirection;

    if (!snakeGame.gameStarted) {
      snakeGame.gameStarted = true;
      snakeGame.gameLoop = setInterval(updateSnake, 150);
    }
  }
}

export function handleSnakeMouseMove(e) {
  if (currentMiniGame !== 'snake') return;

  const rect = snakeGame.canvas.getBoundingClientRect();
  snakeGame.mousePos = {
    x: e.clientX - rect.left,
    y: e.clientY - rect.top
  };

  if (snakeGame.mouseInCanvas && (snakeGame.direction.x !== 0 || snakeGame.direction.y !== 0 || !snakeGame.gameStarted)) {
    const head = snakeGame.snake[0];
    const deltaX = snakeGame.mousePos.x - (head.x + snakeGame.gridSize / 2);
    const deltaY = snakeGame.mousePos.y - (head.y + snakeGame.gridSize / 2);

    let newDirection = null;

    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      if (deltaX > 0 && snakeGame.direction.x === 0) {
        newDirection = {x: snakeGame.gridSize, y: 0};
      } else if (deltaX < 0 && snakeGame.direction.x === 0) {
        newDirection = {x: -snakeGame.gridSize, y: 0};
      }
    } else {
      if (deltaY > 0 && snakeGame.direction.y === 0) {
        newDirection = {x: 0, y: snakeGame.gridSize};
      } else if (deltaY < 0 && snakeGame.direction.y === 0) {
        newDirection = {x: 0, y: -snakeGame.gridSize};
      }
    }

    if (newDirection) {
      snakeGame.direction = newDirection;

      if (!snakeGame.gameStarted) {
        snakeGame.gameStarted = true;
        snakeGame.gameLoop = setInterval(updateSnake, 150);
      }
    }
  }
}

export function updateSnake() {
  const head = {x: snakeGame.snake[0].x + snakeGame.direction.x, y: snakeGame.snake[0].y + snakeGame.direction.y};

  if (head.x < 0 || head.x >= snakeGame.canvas.width || head.y < 0 || head.y >= snakeGame.canvas.height) {
    gameOverSnake();
    return;
  }

  for (let segment of snakeGame.snake) {
    if (head.x === segment.x && head.y === segment.y) {
      gameOverSnake();
      return;
    }
  }

  snakeGame.snake.unshift(head);

  if (head.x === snakeGame.food.x && head.y === snakeGame.food.y) {
    snakeGame.score++;
    document.getElementById('snake-score').textContent = snakeGame.score;
    generateFood();
  } else {
    snakeGame.snake.pop();
  }

  drawSnake();
}

export function drawSnake() {
  snakeGame.ctx.clearRect(0, 0, snakeGame.canvas.width, snakeGame.canvas.height);

  snakeGame.ctx.fillStyle = '#8a9a6a';
  for (let segment of snakeGame.snake) {
    snakeGame.ctx.fillRect(segment.x, segment.y, snakeGame.gridSize, snakeGame.gridSize);
  }

  snakeGame.ctx.fillStyle = '#8b3a3a';
  snakeGame.ctx.fillRect(snakeGame.food.x, snakeGame.food.y, snakeGame.gridSize, snakeGame.gridSize);
}

export function gameOverSnake() {
  clearInterval(snakeGame.gameLoop);

  document.removeEventListener('keydown', handleSnakeControls);
  if (snakeGame.canvas) {
    snakeGame.canvas.removeEventListener('mousemove', handleSnakeMouseMove);
    snakeGame.canvas.removeEventListener('mouseenter', snakeMouseEnter);
    snakeGame.canvas.removeEventListener('mouseleave', snakeMouseLeave);
  }

  const perFoodReward = 50 + (player.level * 25);
  let earnings = snakeGame.score * perFoodReward;
  let bonusMessage = '';

  if (snakeGame.score > 0) {
    player.money += earnings;
    _updateUI();
    bonusMessage = ` You earned $${earnings.toLocaleString()} ($${perFoodReward} per food)!`;
    _logAction(`Snake game over! Final score: ${snakeGame.score}. Your reflexes earned you $${earnings.toLocaleString()}!`);
  } else {
    _logAction(`Snake game over! Final score: ${snakeGame.score}. Your reflexes were tested and measured.`);
  }

  trackMiniGamePlay('snake');

  _alert(`Game Over! Final Score: ${snakeGame.score}${bonusMessage}`);
}

export function restartSnake() {
  if (snakeGame && snakeGame.gameLoop) {
    clearInterval(snakeGame.gameLoop);
    document.removeEventListener('keydown', handleSnakeControls);
    if (snakeGame.canvas) {
      snakeGame.canvas.removeEventListener('mousemove', handleSnakeMouseMove);
      snakeGame.canvas.removeEventListener('mouseenter', snakeMouseEnter);
      snakeGame.canvas.removeEventListener('mouseleave', snakeMouseLeave);
    }
  }
  initSnakeGame();
}

// --- Quick Draw Reaction Game ---

export function startQuickDraw() {
  if (!canPlayMiniGame('quickDraw')) return;

  currentMiniGame = 'quick-draw';
  document.getElementById("other-minigames").style.display = "block";

  const bestTimeText = quickDrawPersonalBest ? `Personal Best: ${quickDrawPersonalBest}ms` : 'No personal best yet';

  document.getElementById("minigame-content").innerHTML = `
    <h3 style="color: #1abc9c; text-align: center; margin-bottom: 20px;">Quick Draw</h3>
    <div style="text-align: center;">
      <p style="margin-bottom: 10px;">React under 300ms for cash | Beat your best time for bonus!</p>
      <p style="margin-bottom: 5px; color: #8b0000; font-weight: bold;">Rewards: Combat Reflex boost (better violent job success)</p>
      <p style="margin-bottom: 20px; color: #c0a040; font-weight: bold;">${bestTimeText}</p>
      <div id="reaction-area" onclick="handleReactionClick()"
         style="width: 300px; height: 200px; margin: 20px auto; border: 3px solid #1abc9c;
            border-radius: 10px; background: #8b3a3a; display: flex; align-items: center;
            justify-content: center; cursor: pointer; font-size: 24px; color: white;">
        Click when GREEN!
      </div>
      <p id="reaction-instruction">Wait for the area to turn green, then click as fast as you can!</p>
      <p id="reaction-result" style="font-size: 1.2em; margin-top: 20px; min-height: 30px;"></p>
      <button onclick="startReactionTest()" style="background: #1abc9c; color: white; padding: 12px 25px; border: none; border-radius: 8px; cursor: pointer;">
        Start Test
      </button>
    </div>
  `;

  setTimeout(() => {
    document.getElementById("other-minigames").scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });
  }, 100);

  _logAction("You prepare for a Quick Draw test. Lightning reflexes and personal records await the truly skilled!");
}

export function startReactionTest() {
  const area = document.getElementById('reaction-area');
  const instruction = document.getElementById('reaction-instruction');
  const result = document.getElementById('reaction-result');

  quickDrawWaiting = false;
  area.style.background = '#8b3a3a';
  area.textContent = 'Wait...';
  instruction.textContent = 'Get ready...';
  result.textContent = '';

  const delay = Math.random() * 4000 + 1000;

  setTimeout(() => {
    if (currentMiniGame === 'quick-draw') {
      area.style.background = '#8a9a6a';
      area.textContent = 'CLICK NOW!';
      instruction.textContent = 'CLICK THE GREEN AREA!';
      quickDrawStartTime = Date.now();
      quickDrawWaiting = true;
    }
  }, delay);
}

export function handleReactionClick() {
  if (!quickDrawWaiting) {
    document.getElementById('reaction-result').innerHTML = '<span style="color: #8b3a3a;">Too early! Wait for green!</span>';
    return;
  }

  const reactionTime = Date.now() - quickDrawStartTime;
  quickDrawWaiting = false;

  const area = document.getElementById('reaction-area');
  area.style.background = '#8a7a5a';
  area.textContent = 'Click when GREEN!';

  let message = '';
  let color = '';
  let earnedMoney = false;
  let personalBestBonus = false;
  let totalEarned = 0;

  const qdBaseReward = 100 + (player.level * 50);

  if (quickDrawPersonalBest === null || reactionTime < quickDrawPersonalBest) {
    quickDrawPersonalBest = reactionTime;
    personalBestBonus = true;
    const bestBonus = Math.floor(qdBaseReward * 3);
    totalEarned += bestBonus;
    player.money += bestBonus;
  }

  if (reactionTime < 300) {
    earnedMoney = true;
    totalEarned += qdBaseReward;
    player.money += qdBaseReward;

    if (reactionTime < 200) {
      message = 'Lightning fast!';
      color = '#8a9a6a';
    } else {
      message = 'Excellent reflexes!';
      color = '#c0a062';
    }
  } else if (reactionTime < 500) {
    message = 'Good reaction time!';
    color = '#c0a040';
  } else {
    message = 'Could be faster...';
    color = '#8b3a3a';
  }

  if (!player.combatReflexBonus) player.combatReflexBonus = 0;
  const reflexBonus = reactionTime < 200 ? 3 : (reactionTime < 300 ? 2 : 1);
  player.combatReflexBonus = Math.min(20, player.combatReflexBonus + reflexBonus);

  if (totalEarned > 0) {
    _updateUI();
  }

  trackMiniGamePlay('quickDraw');

  let bonusText = '';
  if (personalBestBonus && earnedMoney) {
    bonusText = `<br><span style="color: #8a9a6a;">NEW PERSONAL BEST! +$500!</span><br><span style="color: #8a9a6a;">Sub-300ms reflexes! +$100!</span><br><span style="color: #c0a040;">Total earned: $${totalEarned}</span>`;
  } else if (personalBestBonus) {
    bonusText = `<br><span style="color: #8a9a6a;">NEW PERSONAL BEST! +$500!</span>`;
  } else if (earnedMoney) {
    bonusText = `<br><span style="color: #8a9a6a;">Sub-300ms reflexes! +$100!</span>`;
  }

  document.getElementById('reaction-result').innerHTML =
    `<span style="color: ${color};">${message}</span><br>Reaction Time: ${reactionTime}ms<br>Personal Best: ${quickDrawPersonalBest}ms${bonusText}`;

  if (personalBestBonus && earnedMoney) {
    _logAction(`Quick Draw: ${reactionTime}ms - NEW PERSONAL BEST! Lightning reflexes earned you $600 total + Combat Reflex boost!`);
  } else if (personalBestBonus) {
    _logAction(`Quick Draw: ${reactionTime}ms - NEW PERSONAL BEST! You earned $500 + Combat Reflex boost!`);
  } else if (earnedMoney) {
    _logAction(`Quick Draw: ${reactionTime}ms - Sub-300ms reflexes earned you $100 + Combat Reflex boost!`);
  } else {
    _logAction(`Quick Draw: ${reactionTime}ms - ${message.replace(/[]/g, '').trim()} Combat Reflex improved slightly.`);
  }
}
