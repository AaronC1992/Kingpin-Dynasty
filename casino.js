// casino.js — Casino games module (Blackjack, Slots, Roulette, Dice)
// Extracted from game.js for structural clarity.

import { player } from './player.js';

// ── Dependencies (injected from game.js via initCasino) ──────────────
let _hideAllScreens, _updateUI, _alert, _logAction, _showBriefNotification, _checkForNewPerks;

export function initCasino({ hideAllScreens, updateUI, alert, logAction, showBriefNotification, checkForNewPerks }) {
  _hideAllScreens = hideAllScreens;
  _updateUI = updateUI;
  _alert = alert;
  _logAction = logAction;
  _showBriefNotification = showBriefNotification;
  _checkForNewPerks = checkForNewPerks;
}

// ── Casino-session state ─────────────────────────────────────────────
let _casinoWins = 0;
export function getCasinoWins() { return _casinoWins; }
export function resetCasinoWins() { _casinoWins = 0; }

// Game-specific transient state (replaces old window._bjState / window._rouletteState)
let _bjState = null;
let _rouletteState = { bets: [], totalBet: 0 };

// ── Shared helpers ───────────────────────────────────────────────────

function updateCasinoWallet() {
  const walletEl = document.getElementById('casino-wallet');
  if (walletEl) walletEl.textContent = player.money.toLocaleString();
}

function getCasinoBetRange() {
  return { defaultBet: 100 };
}

function getGamblingLuckBonus() {
  let bonus = player.skillTrees.luck.gambling * 0.01;
  if (player.unlockedPerks.includes('fortuneSon')) bonus += 0.05;
  return bonus;
}

function casinoWin(winnings) {
  player.money += winnings;
  player.playstyleStats.gamblingWins = (player.playstyleStats.gamblingWins || 0) + 1;
  _casinoWins++;
  _checkForNewPerks();
  _updateUI();
  updateCasinoWallet();
}

// ── Show Casino ──────────────────────────────────────────────────────

export function showCasino() {
  if (player.inJail) {
    _alert("You can't visit the casino while you're in jail!");
    return;
  }

  _hideAllScreens();
  document.getElementById("casino-screen").style.display = "block";
  updateCasinoWallet();

  // Reset game area and show game select
  const gameArea = document.getElementById('casino-game-area');
  if (gameArea) gameArea.innerHTML = '';
  const gameSelect = document.getElementById('casino-game-select');
  if (gameSelect) gameSelect.style.display = 'block';
}

// ═══════════════════════════════════════════════════════════════════════
// BLACKJACK
// ═══════════════════════════════════════════════════════════════════════

const CARD_SUITS = ['♠', '♥', '♦', '♣'];
const CARD_NAMES = ['A','2','3','4','5','6','7','8','9','10','J','Q','K'];

function bjNewDeck() {
  const deck = [];
  for (const suit of CARD_SUITS) {
    for (let v = 0; v < 13; v++) {
      deck.push({ name: CARD_NAMES[v], suit, value: Math.min(10, v + 1) });
    }
  }
  // Shuffle
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

function bjHandValue(hand) {
  let total = hand.reduce((s, c) => s + c.value, 0);
  let aces = hand.filter(c => c.value === 1).length;
  while (aces > 0 && total + 10 <= 21) { total += 10; aces--; }
  return total;
}

function bjCardHTML(card, hidden) {
  if (hidden) return `<div style="display:inline-block;width:70px;height:100px;background:#2c3e50;border:2px solid #7f8c8d;border-radius:8px;margin:3px;text-align:center;line-height:100px;font-size:1.5em;color:#95a5a6;">?</div>`;
  const color = (card.suit === '♥' || card.suit === '♦') ? '#e74c3c' : '#1a1a2e';
  return `<div style="display:inline-block;width:70px;height:100px;background:linear-gradient(135deg,#fff,#f5f5f5);border:2px solid #444;border-radius:8px;margin:3px;padding:4px;text-align:center;position:relative;box-sizing:border-box;">
    <div style="position:absolute;top:4px;left:6px;font-size:0.9em;color:${color};font-weight:bold;line-height:1;">${card.name}<br>${card.suit}</div>
    <div style="font-size:2em;color:${color};line-height:100px;">${card.suit}</div>
    <div style="position:absolute;bottom:4px;right:6px;font-size:0.9em;color:${color};font-weight:bold;line-height:1;transform:rotate(180deg);">${card.name}<br>${card.suit}</div>
  </div>`;
}

export function startBlackjack() {
  const { defaultBet } = getCasinoBetRange();
  const gameSelect = document.getElementById('casino-game-select');
  if (gameSelect) gameSelect.style.display = 'none';

  const gameArea = document.getElementById('casino-game-area');
  gameArea.innerHTML = `
    <div style="background: rgba(0,80,0,0.5); padding: 25px; border-radius: 15px; border: 2px solid #27ae60; text-align: center;">
      <h3 style="color: #f1c40f; margin-bottom: 15px;">🃏 Blackjack</h3>
      <p style="color: #bdc3c7;">Place your bet:</p>
      <div style="display:flex;justify-content:center;align-items:center;gap:10px;margin:15px 0;">
        <button onclick="document.getElementById('bj-bet-input').value=Math.max(1,parseInt(document.getElementById('bj-bet-input').value||0)-100)" style="background:#e74c3c;color:white;border:none;border-radius:5px;padding:8px 14px;cursor:pointer;font-size:1.1em;">−</button>
        <input id="bj-bet-input" type="number" min="1" value="${defaultBet}" style="width:120px;text-align:center;font-size:1.3em;padding:8px;border-radius:5px;border:2px solid #f1c40f;background:#1a1a1a;color:#f1c40f;" />
        <button onclick="document.getElementById('bj-bet-input').value=parseInt(document.getElementById('bj-bet-input').value||0)+100" style="background:#27ae60;color:white;border:none;border-radius:5px;padding:8px 14px;cursor:pointer;font-size:1.1em;">+</button>
      </div>
      <button onclick="bjDeal()" style="background:linear-gradient(135deg,#27ae60,#2ecc71);color:white;padding:12px 30px;border:none;border-radius:8px;cursor:pointer;font-size:1.2em;font-weight:bold;">Deal Cards</button>
      <button onclick="showCasino()" style="background:#7f8c8d;color:white;padding:12px 20px;border:none;border-radius:8px;cursor:pointer;font-size:1em;margin-left:10px;">Back to Games</button>
    </div>`;
}

export function bjDeal() {
  const betInput = document.getElementById('bj-bet-input');
  let bet = parseInt(betInput.value) || 1;
  bet = Math.max(1, bet);

  if (player.money < bet) {
    _showBriefNotification(`Need $${bet.toLocaleString()} to play!`, 'danger');
    return;
  }

  player.money -= bet;
  _updateUI();
  updateCasinoWallet();

  const deck = bjNewDeck();
  const pHand = [deck.pop(), deck.pop()];
  const dHand = [deck.pop(), deck.pop()];

  _bjState = { deck, pHand, dHand, bet, doubled: false, done: false };

  // Check for natural blackjack
  if (bjHandValue(pHand) === 21) {
    _bjState.done = true;
    bjStand(); // Auto-resolve
    return;
  }

  bjRender();
}

function bjRender() {
  const s = _bjState;
  const gameArea = document.getElementById('casino-game-area');
  const pVal = bjHandValue(s.pHand);
  const canDouble = !s.doubled && s.pHand.length === 2 && player.money >= s.bet;

  let html = `<div style="background: rgba(0,80,0,0.5); padding: 25px; border-radius: 15px; border: 2px solid #27ae60;">`;

  // Dealer
  html += `<div style="text-align:center;margin-bottom:20px;">
    <h4 style="color:#e74c3c;margin-bottom:8px;">Dealer ${s.done ? '(' + bjHandValue(s.dHand) + ')' : ''}</h4>
    <div>${s.dHand.map((c,i) => bjCardHTML(c, !s.done && i > 0)).join('')}</div>
  </div>`;

  // Divider
  html += `<hr style="border-color:rgba(255,255,255,0.1);margin:15px 0;">`;

  // Player
  html += `<div style="text-align:center;margin-bottom:15px;">
    <h4 style="color:#2ecc71;margin-bottom:8px;">Your Hand (${pVal})${pVal > 21 ? ' <span style="color:#e74c3c;">BUST!</span>' : ''}</h4>
    <div>${s.pHand.map(c => bjCardHTML(c, false)).join('')}</div>
  </div>`;

  // Bet info
  html += `<div style="text-align:center;color:#f1c40f;margin-bottom:12px;">Bet: $${(s.bet * (s.doubled ? 2 : 1)).toLocaleString()}</div>`;

  // Actions
  if (!s.done && pVal < 21) {
    html += `<div style="text-align:center;display:flex;justify-content:center;gap:10px;flex-wrap:wrap;">
      <button onclick="bjHit()" style="background:#e67e22;color:white;padding:10px 24px;border:none;border-radius:8px;cursor:pointer;font-weight:bold;font-size:1.1em;">🃏 Hit</button>
      <button onclick="bjStand()" style="background:#2980b9;color:white;padding:10px 24px;border:none;border-radius:8px;cursor:pointer;font-weight:bold;font-size:1.1em;">✋ Stand</button>
      ${canDouble ? `<button onclick="bjDouble()" style="background:#8e44ad;color:white;padding:10px 24px;border:none;border-radius:8px;cursor:pointer;font-weight:bold;font-size:1.1em;">💰 Double Down</button>` : ''}
    </div>`;
  }

  html += `</div>`;
  gameArea.innerHTML = html;
}

export function bjHit() {
  const s = _bjState;
  if (s.done) return;
  s.pHand.push(s.deck.pop());
  if (bjHandValue(s.pHand) >= 21) {
    s.done = true;
    bjResolve();
    return;
  }
  bjRender();
}

export function bjStand() {
  const s = _bjState;
  s.done = true;
  // Dealer draws to 17
  while (bjHandValue(s.dHand) < 17) {
    s.dHand.push(s.deck.pop());
  }
  bjResolve();
}

export function bjDouble() {
  const s = _bjState;
  if (player.money < s.bet) return;
  player.money -= s.bet;
  s.doubled = true;
  _updateUI();
  updateCasinoWallet();
  // Draw exactly one card then stand
  s.pHand.push(s.deck.pop());
  s.done = true;
  while (bjHandValue(s.dHand) < 17) {
    s.dHand.push(s.deck.pop());
  }
  bjResolve();
}

function bjResolve() {
  const s = _bjState;
  s.done = true;
  const pVal = bjHandValue(s.pHand);
  const dVal = bjHandValue(s.dHand);
  const totalBet = s.bet * (s.doubled ? 2 : 1);
  const luckBonus = getGamblingLuckBonus();

  const gameArea = document.getElementById('casino-game-area');
  let html = `<div style="background: rgba(0,80,0,0.5); padding: 25px; border-radius: 15px; border: 2px solid #27ae60;">`;

  // Dealer
  html += `<div style="text-align:center;margin-bottom:20px;">
    <h4 style="color:#e74c3c;margin-bottom:8px;">Dealer (${dVal})${dVal > 21 ? ' <span style="color:#e74c3c;">BUST!</span>' : ''}</h4>
    <div>${s.dHand.map(c => bjCardHTML(c, false)).join('')}</div>
  </div>`;
  html += `<hr style="border-color:rgba(255,255,255,0.1);margin:15px 0;">`;
  html += `<div style="text-align:center;margin-bottom:15px;">
    <h4 style="color:#2ecc71;margin-bottom:8px;">Your Hand (${pVal})${pVal > 21 ? ' <span style="color:#e74c3c;">BUST!</span>' : ''}</h4>
    <div>${s.pHand.map(c => bjCardHTML(c, false)).join('')}</div>
  </div>`;

  let resultMsg = '';
  let resultColor = '';

  if (pVal > 21) {
    resultMsg = `💔 Busted! Lost $${totalBet.toLocaleString()}`;
    resultColor = '#e74c3c';
    _logAction(`🃏 Busted at ${pVal}. Lost $${totalBet.toLocaleString()} at the blackjack table.`);
  } else if (pVal === 21 && s.pHand.length === 2) {
    // Natural blackjack pays 2.5x
    let winnings = Math.floor(totalBet * 2.5);
    winnings += Math.floor(winnings * luckBonus);
    casinoWin(winnings);
    resultMsg = `🎉 BLACKJACK! Won $${winnings.toLocaleString()}!`;
    resultColor = '#f1c40f';
    _logAction(`🃏 Natural Blackjack! Won $${winnings.toLocaleString()}!`);
  } else if (dVal > 21 || pVal > dVal) {
    let winnings = Math.floor(totalBet * 2);
    winnings += Math.floor(winnings * luckBonus);
    casinoWin(winnings);
    resultMsg = `🎉 You win $${winnings.toLocaleString()}!`;
    resultColor = '#2ecc71';
    _logAction(`🃏 Blackjack win! ${pVal} vs dealer ${dVal}. Won $${winnings.toLocaleString()}!`);
  } else if (pVal === dVal) {
    player.money += totalBet;
    _updateUI();
    updateCasinoWallet();
    resultMsg = `🤝 Push! Bet returned.`;
    resultColor = '#f39c12';
    _logAction(`🃏 Blackjack push. ${pVal} tied with dealer.`);
  } else {
    resultMsg = `💔 Dealer wins. Lost $${totalBet.toLocaleString()}`;
    resultColor = '#e74c3c';
    _logAction("🃏 The dealer's hand beats yours. Better luck next time.");
  }

  html += `<div style="text-align:center;margin:15px 0;"><p style="color:${resultColor};font-size:1.4em;font-weight:bold;">${resultMsg}</p></div>`;
  html += `<div style="text-align:center;display:flex;justify-content:center;gap:10px;">
    <button onclick="startBlackjack()" style="background:#27ae60;color:white;padding:10px 24px;border:none;border-radius:8px;cursor:pointer;font-weight:bold;">Play Again</button>
    <button onclick="showCasino()" style="background:#7f8c8d;color:white;padding:10px 20px;border:none;border-radius:8px;cursor:pointer;">Back to Games</button>
  </div>`;
  html += `</div>`;
  gameArea.innerHTML = html;
}

// ═══════════════════════════════════════════════════════════════════════
// SLOTS
// ═══════════════════════════════════════════════════════════════════════

const SLOT_SYMBOLS = ['🍒','🍋','🍊','🍇','💎','7️⃣','🔔','⭐'];
const SLOT_PAYOUTS = { '7️⃣': 10, '💎': 7, '⭐': 5, '🔔': 4, '🍇': 3, '🍊': 2, '🍋': 1.5, '🍒': 1 };

export function startSlots() {
  const { defaultBet } = getCasinoBetRange();
  const gameSelect = document.getElementById('casino-game-select');
  if (gameSelect) gameSelect.style.display = 'none';

  const gameArea = document.getElementById('casino-game-area');
  gameArea.innerHTML = `
    <div style="background: linear-gradient(135deg, rgba(40,20,60,0.8), rgba(80,30,60,0.8)); padding: 25px; border-radius: 15px; border: 2px solid #e67e22; text-align: center;">
      <h3 style="color: #f1c40f; margin-bottom: 15px;">🎰 Slot Machine</h3>
      <div id="slot-reels" style="display:flex;justify-content:center;gap:8px;margin:20px 0;padding:20px;background:rgba(0,0,0,0.4);border-radius:12px;border:3px solid #d4af37;">
        <div class="slot-reel" style="font-size:3em;padding:10px 20px;background:rgba(255,255,255,0.1);border-radius:8px;">❓</div>
        <div class="slot-reel" style="font-size:3em;padding:10px 20px;background:rgba(255,255,255,0.1);border-radius:8px;">❓</div>
        <div class="slot-reel" style="font-size:3em;padding:10px 20px;background:rgba(255,255,255,0.1);border-radius:8px;">❓</div>
      </div>
      <div id="slot-result" style="min-height:30px;margin:10px 0;color:#f1c40f;font-size:1.2em;font-weight:bold;"></div>
      <div style="display:flex;justify-content:center;align-items:center;gap:10px;margin:15px 0;">
        <button onclick="document.getElementById('slot-bet-input').value=Math.max(1,parseInt(document.getElementById('slot-bet-input').value||0)-100)" style="background:#e74c3c;color:white;border:none;border-radius:5px;padding:8px 14px;cursor:pointer;">−</button>
        <input id="slot-bet-input" type="number" min="1" value="${defaultBet}" style="width:120px;text-align:center;font-size:1.2em;padding:8px;border-radius:5px;border:2px solid #f1c40f;background:#1a1a1a;color:#f1c40f;" />
        <button onclick="document.getElementById('slot-bet-input').value=parseInt(document.getElementById('slot-bet-input').value||0)+100" style="background:#27ae60;color:white;border:none;border-radius:5px;padding:8px 14px;cursor:pointer;">+</button>
      </div>
      <button id="slot-spin-btn" onclick="slotSpin()" style="background:linear-gradient(135deg,#e67e22,#f39c12);color:white;padding:14px 40px;border:none;border-radius:10px;cursor:pointer;font-size:1.3em;font-weight:bold;">🎰 SPIN!</button>
      <button onclick="showCasino()" style="background:#7f8c8d;color:white;padding:12px 20px;border:none;border-radius:8px;cursor:pointer;font-size:1em;margin-left:10px;">Back</button>
      <div style="margin-top:15px;color:#7f8c8d;font-size:0.8em;">
        Payouts: 7️⃣=10x | 💎=7x | ⭐=5x | 🔔=4x | 🍇=3x | 2-match=1.5x
      </div>
    </div>`;
}

export function slotSpin() {
  let bet = parseInt(document.getElementById('slot-bet-input').value) || 1;
  bet = Math.max(1, bet);

  if (player.money < bet) {
    _showBriefNotification(`Need $${bet.toLocaleString()} to spin!`, 'danger');
    return;
  }

  player.money -= bet;
  _updateUI();
  updateCasinoWallet();

  const spinBtn = document.getElementById('slot-spin-btn');
  if (spinBtn) spinBtn.disabled = true;

  const reels = document.querySelectorAll('.slot-reel');
  const resultEl = document.getElementById('slot-result');
  resultEl.textContent = '';

  // Pre-determine final symbols
  let winChance = 0.12 + player.skillTrees.luck.gambling * 0.008;
  if (player.unlockedPerks.includes('fortuneSon')) winChance *= 1.5;
  winChance = Math.min(0.30, winChance);

  let finalSymbols;
  if (Math.random() < winChance * 0.4) {
    // Triple match (jackpot)
    const sym = SLOT_SYMBOLS[Math.floor(Math.random() * SLOT_SYMBOLS.length)];
    finalSymbols = [sym, sym, sym];
  } else if (Math.random() < winChance) {
    // Two match
    const sym = SLOT_SYMBOLS[Math.floor(Math.random() * SLOT_SYMBOLS.length)];
    const otherIdx = Math.floor(Math.random() * 3);
    finalSymbols = [sym, sym, sym];
    finalSymbols[otherIdx] = SLOT_SYMBOLS[(SLOT_SYMBOLS.indexOf(sym) + 1 + Math.floor(Math.random() * (SLOT_SYMBOLS.length - 1))) % SLOT_SYMBOLS.length];
  } else {
    // All different
    const shuffled = [...SLOT_SYMBOLS].sort(() => Math.random() - 0.5);
    finalSymbols = [shuffled[0], shuffled[1], shuffled[2]];
  }

  // Animate reels with staggered stops
  let animIntervals = [];
  reels.forEach((reel, i) => {
    let ticks = 0;
    const stopAt = 8 + i * 6; // Stagger: reel 0 stops first
    const interval = setInterval(() => {
      reel.textContent = SLOT_SYMBOLS[Math.floor(Math.random() * SLOT_SYMBOLS.length)];
      ticks++;
      if (ticks >= stopAt) {
        clearInterval(interval);
        reel.textContent = finalSymbols[i];
        reel.style.transform = 'scale(1.1)';
        setTimeout(() => { reel.style.transform = 'scale(1)'; }, 150);

        // Last reel stopped? Resolve
        if (i === 2) {
          setTimeout(() => slotResolve(finalSymbols, bet), 300);
        }
      }
    }, 80);
    animIntervals.push(interval);
  });
}

function slotResolve(symbols, bet) {
  const spinBtn = document.getElementById('slot-spin-btn');
  if (spinBtn) spinBtn.disabled = false;

  const resultEl = document.getElementById('slot-result');
  const luckBonus = getGamblingLuckBonus();

  if (symbols[0] === symbols[1] && symbols[1] === symbols[2]) {
    // Triple match!
    const multiplier = SLOT_PAYOUTS[symbols[0]] || 3;
    let winnings = Math.floor(bet * multiplier);
    winnings += Math.floor(winnings * luckBonus);
    casinoWin(winnings);
    resultEl.innerHTML = `<span style="color:#f1c40f;font-size:1.4em;">🎉 JACKPOT! ${symbols[0]}${symbols[0]}${symbols[0]} — Won $${winnings.toLocaleString()}!</span>`;
    _logAction(`🎰 JACKPOT! Triple ${symbols[0]} on the slots — $${winnings.toLocaleString()} in your pocket!`);
  } else if (symbols[0] === symbols[1] || symbols[1] === symbols[2] || symbols[0] === symbols[2]) {
    // Two match
    let winnings = Math.floor(bet * 1.5);
    winnings += Math.floor(winnings * luckBonus);
    casinoWin(winnings);
    resultEl.innerHTML = `<span style="color:#2ecc71;">Nice! Two match — Won $${winnings.toLocaleString()}</span>`;
    _logAction(`🎰 Two matching symbols! Small win of $${winnings.toLocaleString()} on the slots.`);
  } else {
    resultEl.innerHTML = `<span style="color:#e74c3c;">No match. Lost $${bet.toLocaleString()}</span>`;
    _logAction("🎰 The slots mock you with their silence. Your money disappears into the machine's hungry maw.");
  }
  _updateUI();
  updateCasinoWallet();
}

// ═══════════════════════════════════════════════════════════════════════
// ROULETTE
// ═══════════════════════════════════════════════════════════════════════

const ROULETTE_REDS = [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36];

export function startRoulette() {
  const { defaultBet } = getCasinoBetRange();
  const gameSelect = document.getElementById('casino-game-select');
  if (gameSelect) gameSelect.style.display = 'none';

  _rouletteState = { bets: [], totalBet: 0 };

  const gameArea = document.getElementById('casino-game-area');
  gameArea.innerHTML = `
    <div style="background: linear-gradient(135deg, rgba(100,0,0,0.6), rgba(40,0,0,0.8)); padding: 25px; border-radius: 15px; border: 2px solid #e74c3c;">
      <h3 style="color: #f1c40f; text-align:center; margin-bottom: 15px;">🎡 Roulette</h3>
      <p style="color:#bdc3c7;text-align:center;margin-bottom:10px;">Choose your bet type, set amount, then spin!</p>

      <div style="display:flex;justify-content:center;align-items:center;gap:10px;margin:10px 0;">
        <span style="color:#f1c40f;">Bet Amount:</span>
        <input id="rou-bet-input" type="number" min="1" value="${defaultBet}" style="width:110px;text-align:center;font-size:1.1em;padding:6px;border-radius:5px;border:2px solid #f1c40f;background:#1a1a1a;color:#f1c40f;" />
      </div>

      <div style="margin:15px 0;">
        <div style="color:#d4af37;font-weight:bold;margin-bottom:8px;text-align:center;">Quick Bets (2x payout):</div>
        <div style="display:flex;justify-content:center;gap:8px;flex-wrap:wrap;">
          <button onclick="rouletteAddBet('red')" style="background:#c0392b;color:white;padding:8px 18px;border:none;border-radius:6px;cursor:pointer;font-weight:bold;">🔴 Red</button>
          <button onclick="rouletteAddBet('black')" style="background:#2c3e50;color:white;padding:8px 18px;border:none;border-radius:6px;cursor:pointer;font-weight:bold;">⚫ Black</button>
          <button onclick="rouletteAddBet('odd')" style="background:#8e44ad;color:white;padding:8px 18px;border:none;border-radius:6px;cursor:pointer;font-weight:bold;">Odd</button>
          <button onclick="rouletteAddBet('even')" style="background:#2980b9;color:white;padding:8px 18px;border:none;border-radius:6px;cursor:pointer;font-weight:bold;">Even</button>
          <button onclick="rouletteAddBet('low')" style="background:#27ae60;color:white;padding:8px 18px;border:none;border-radius:6px;cursor:pointer;font-weight:bold;">1-18</button>
          <button onclick="rouletteAddBet('high')" style="background:#e67e22;color:white;padding:8px 18px;border:none;border-radius:6px;cursor:pointer;font-weight:bold;">19-36</button>
        </div>
      </div>

      <div style="margin:15px 0;">
        <div style="color:#d4af37;font-weight:bold;margin-bottom:8px;text-align:center;">Pick a Number (35x payout):</div>
        <div id="roulette-numbers" style="display:flex;flex-wrap:wrap;justify-content:center;gap:4px;max-width:500px;margin:0 auto;">
          <button onclick="rouletteAddBet(0)" style="background:#27ae60;color:white;padding:5px 10px;border:none;border-radius:4px;cursor:pointer;font-size:0.9em;min-width:36px;">0</button>
          ${Array.from({length:36},(_, i) => {
            const n = i+1;
            const isRed = [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36].includes(n);
            return `<button onclick="rouletteAddBet(${n})" style="background:${isRed ? '#c0392b' : '#2c3e50'};color:white;padding:5px 10px;border:none;border-radius:4px;cursor:pointer;font-size:0.9em;min-width:36px;">${n}</button>`;
          }).join('')}
        </div>
      </div>

      <div id="roulette-bets-display" style="background:rgba(0,0,0,0.3);padding:12px;border-radius:8px;margin:15px 0;min-height:40px;text-align:center;color:#bdc3c7;">
        No bets placed yet
      </div>

      <div style="text-align:center;display:flex;justify-content:center;gap:10px;">
        <button onclick="rouletteSpin()" style="background:linear-gradient(135deg,#c0392b,#e74c3c);color:white;padding:14px 35px;border:none;border-radius:10px;cursor:pointer;font-size:1.2em;font-weight:bold;">🎡 SPIN!</button>
        <button onclick="rouletteClear()" style="background:#7f8c8d;color:white;padding:12px 20px;border:none;border-radius:8px;cursor:pointer;">Clear Bets</button>
        <button onclick="showCasino()" style="background:#555;color:white;padding:12px 20px;border:none;border-radius:8px;cursor:pointer;">Back</button>
      </div>
    </div>`;
}

export function rouletteAddBet(type) {
  let amount = parseInt(document.getElementById('rou-bet-input').value) || 1;
  amount = Math.max(1, amount);

  const s = _rouletteState;
  if (s.totalBet + amount > player.money) {
    _showBriefNotification("Not enough money for this bet!", 'danger');
    return;
  }

  s.bets.push({ type, amount });
  s.totalBet += amount;

  // Update display
  const display = document.getElementById('roulette-bets-display');
  const betLabels = s.bets.map(b => `<span style="background:rgba(255,255,255,0.1);padding:3px 8px;border-radius:4px;margin:2px;">${typeof b.type === 'number' ? '#' + b.type : b.type} $${b.amount.toLocaleString()}</span>`);
  display.innerHTML = `<div style="color:#f1c40f;margin-bottom:5px;">Total Wagered: $${s.totalBet.toLocaleString()}</div>` + betLabels.join(' ');
}

export function rouletteClear() {
  _rouletteState = { bets: [], totalBet: 0 };
  const display = document.getElementById('roulette-bets-display');
  if (display) display.innerHTML = 'No bets placed yet';
}

export function rouletteSpin() {
  const s = _rouletteState;
  if (s.bets.length === 0) {
    _showBriefNotification("Place at least one bet first!", 'warning');
    return;
  }
  if (player.money < s.totalBet) {
    _showBriefNotification("Not enough money for your bets!", 'danger');
    return;
  }

  // Deduct total bet
  player.money -= s.totalBet;
  _updateUI();
  updateCasinoWallet();

  // Spin result
  const result = Math.floor(Math.random() * 37); // 0-36
  const isRed = ROULETTE_REDS.includes(result);
  const isBlack = result > 0 && !isRed;
  const luckBonus = getGamblingLuckBonus();

  // Calculate winnings
  let totalWinnings = 0;
  let betResults = [];

  for (const bet of s.bets) {
    let won = false;
    let multiplier = 0;

    if (typeof bet.type === 'number') {
      won = result === bet.type;
      multiplier = 35;
    } else {
      switch(bet.type) {
        case 'red': won = isRed; multiplier = 2; break;
        case 'black': won = isBlack; multiplier = 2; break;
        case 'odd': won = result > 0 && result % 2 === 1; multiplier = 2; break;
        case 'even': won = result > 0 && result % 2 === 0; multiplier = 2; break;
        case 'low': won = result >= 1 && result <= 18; multiplier = 2; break;
        case 'high': won = result >= 19 && result <= 36; multiplier = 2; break;
      }
    }

    if (won) {
      let payout = Math.floor(bet.amount * multiplier);
      payout += Math.floor(payout * luckBonus);
      totalWinnings += payout;
      betResults.push({ ...bet, won: true, payout });
    } else {
      betResults.push({ ...bet, won: false, payout: 0 });
    }
  }

  if (totalWinnings > 0) {
    casinoWin(totalWinnings);
  }

  // Display result
  const resultColor = result === 0 ? '#27ae60' : isRed ? '#e74c3c' : '#ecf0f1';
  const resultLabel = result === 0 ? '0 GREEN' : `${result} ${isRed ? 'RED' : 'BLACK'}`;

  const gameArea = document.getElementById('casino-game-area');
  let html = `<div style="background: linear-gradient(135deg, rgba(100,0,0,0.6), rgba(40,0,0,0.8)); padding: 25px; border-radius: 15px; border: 2px solid #e74c3c; text-align:center;">`;
  html += `<h3 style="color: #f1c40f;">🎡 Roulette Result</h3>`;
  html += `<div style="font-size:3em;margin:20px 0;"><span style="background:${result === 0 ? '#27ae60' : isRed ? '#c0392b' : '#2c3e50'};padding:15px 30px;border-radius:50%;border:4px solid #d4af37;color:white;">${result}</span></div>`;
  html += `<p style="color:${resultColor};font-size:1.3em;font-weight:bold;">${resultLabel}</p>`;

  // Bet breakdown
  html += `<div style="margin:15px 0;text-align:left;max-width:400px;margin:15px auto;">`;
  for (const br of betResults) {
    const label = typeof br.type === 'number' ? `#${br.type}` : br.type;
    html += `<div style="padding:4px 0;color:${br.won ? '#2ecc71' : '#e74c3c'};">${br.won ? '✅' : '❌'} ${label} ($${br.amount.toLocaleString()}) → ${br.won ? `+$${br.payout.toLocaleString()}` : 'Lost'}</div>`;
  }
  html += `</div>`;

  const netResult = totalWinnings - s.totalBet;
  if (netResult > 0) {
    html += `<p style="color:#2ecc71;font-size:1.4em;font-weight:bold;">Net Win: +$${netResult.toLocaleString()}</p>`;
    _logAction(`🎡 Roulette lands on ${result}! Net win of $${netResult.toLocaleString()}!`);
  } else if (netResult === 0) {
    html += `<p style="color:#f39c12;font-size:1.3em;">Break even!</p>`;
  } else {
    html += `<p style="color:#e74c3c;font-size:1.3em;">Net Loss: -$${Math.abs(netResult).toLocaleString()}</p>`;
    _logAction(`🎡 Roulette lands on ${result}. Lost $${Math.abs(netResult).toLocaleString()}.`);
  }

  html += `<div style="margin-top:15px;display:flex;justify-content:center;gap:10px;">
    <button onclick="startRoulette()" style="background:#c0392b;color:white;padding:10px 24px;border:none;border-radius:8px;cursor:pointer;font-weight:bold;">Play Again</button>
    <button onclick="showCasino()" style="background:#7f8c8d;color:white;padding:10px 20px;border:none;border-radius:8px;cursor:pointer;">Back to Games</button>
  </div>`;
  html += `</div>`;
  gameArea.innerHTML = html;

  // Reset state
  _rouletteState = { bets: [], totalBet: 0 };
  _updateUI();
  updateCasinoWallet();
}

// ═══════════════════════════════════════════════════════════════════════
// DICE
// ═══════════════════════════════════════════════════════════════════════

export function startDiceGame() {
  const { defaultBet } = getCasinoBetRange();
  const gameSelect = document.getElementById('casino-game-select');
  if (gameSelect) gameSelect.style.display = 'none';

  const gameArea = document.getElementById('casino-game-area');
  gameArea.innerHTML = `
    <div style="background: linear-gradient(135deg, rgba(0,0,60,0.6), rgba(0,0,100,0.4)); padding: 25px; border-radius: 15px; border: 2px solid #3498db; text-align: center;">
      <h3 style="color: #f1c40f; margin-bottom: 15px;">🎲 Dice Game</h3>
      <p style="color:#bdc3c7;">Roll higher than the dealer to win. Doubles beat everything!</p>

      <div style="display:flex;justify-content:center;align-items:center;gap:10px;margin:15px 0;">
        <button onclick="document.getElementById('dice-bet-input').value=Math.max(1,parseInt(document.getElementById('dice-bet-input').value||0)-100)" style="background:#e74c3c;color:white;border:none;border-radius:5px;padding:8px 14px;cursor:pointer;">−</button>
        <input id="dice-bet-input" type="number" min="1" value="${defaultBet}" style="width:120px;text-align:center;font-size:1.2em;padding:8px;border-radius:5px;border:2px solid #f1c40f;background:#1a1a1a;color:#f1c40f;" />
        <button onclick="document.getElementById('dice-bet-input').value=parseInt(document.getElementById('dice-bet-input').value||0)+100" style="background:#27ae60;color:white;border:none;border-radius:5px;padding:8px 14px;cursor:pointer;">+</button>
      </div>

      <div id="dice-reels" style="display:flex;justify-content:center;gap:30px;margin:20px 0;">
        <div>
          <div style="color:#2ecc71;margin-bottom:8px;font-weight:bold;">Your Dice</div>
          <div style="display:flex;gap:5px;">
            <span id="p-die-1" style="font-size:3em;background:rgba(255,255,255,0.1);padding:10px;border-radius:10px;">🎲</span>
            <span id="p-die-2" style="font-size:3em;background:rgba(255,255,255,0.1);padding:10px;border-radius:10px;">🎲</span>
          </div>
        </div>
        <div style="display:flex;align-items:center;font-size:1.5em;color:#f1c40f;font-weight:bold;">VS</div>
        <div>
          <div style="color:#e74c3c;margin-bottom:8px;font-weight:bold;">Dealer Dice</div>
          <div style="display:flex;gap:5px;">
            <span id="d-die-1" style="font-size:3em;background:rgba(255,255,255,0.1);padding:10px;border-radius:10px;">🎲</span>
            <span id="d-die-2" style="font-size:3em;background:rgba(255,255,255,0.1);padding:10px;border-radius:10px;">🎲</span>
          </div>
        </div>
      </div>
      <div id="dice-result" style="min-height:30px;margin:10px 0;color:#f1c40f;font-size:1.2em;font-weight:bold;"></div>

      <button id="dice-roll-btn" onclick="diceRoll()" style="background:linear-gradient(135deg,#2980b9,#3498db);color:white;padding:14px 35px;border:none;border-radius:10px;cursor:pointer;font-size:1.3em;font-weight:bold;">🎲 ROLL!</button>
      <button onclick="showCasino()" style="background:#7f8c8d;color:white;padding:12px 20px;border:none;border-radius:8px;cursor:pointer;font-size:1em;margin-left:10px;">Back</button>
    </div>`;
}

export function diceRoll() {
  let bet = parseInt(document.getElementById('dice-bet-input').value) || 1;
  bet = Math.max(1, bet);

  if (player.money < bet) {
    _showBriefNotification(`Need $${bet.toLocaleString()} to roll!`, 'danger');
    return;
  }

  player.money -= bet;
  _updateUI();
  updateCasinoWallet();

  const rollBtn = document.getElementById('dice-roll-btn');
  if (rollBtn) rollBtn.disabled = true;

  const resultEl = document.getElementById('dice-result');
  resultEl.textContent = '';

  const DICE_FACES = ['⚀','⚁','⚂','⚃','⚄','⚅'];
  const roll = () => Math.floor(Math.random() * 6) + 1;

  let pDice = [roll(), roll()];
  let dDice = [roll(), roll()];

  // Lucky reroll from gambling skill
  const luckBonus = getGamblingLuckBonus();
  if (Math.random() < luckBonus * 3) {
    const minIdx = pDice[0] <= pDice[1] ? 0 : 1;
    pDice[minIdx] = roll();
  }

  // Animate dice
  let ticks = 0;
  const maxTicks = 15;
  const animInterval = setInterval(() => {
    document.getElementById('p-die-1').textContent = DICE_FACES[Math.floor(Math.random() * 6)];
    document.getElementById('p-die-2').textContent = DICE_FACES[Math.floor(Math.random() * 6)];
    document.getElementById('d-die-1').textContent = DICE_FACES[Math.floor(Math.random() * 6)];
    document.getElementById('d-die-2').textContent = DICE_FACES[Math.floor(Math.random() * 6)];
    ticks++;
    if (ticks >= maxTicks) {
      clearInterval(animInterval);
      // Show final results
      document.getElementById('p-die-1').textContent = DICE_FACES[pDice[0] - 1];
      document.getElementById('p-die-2').textContent = DICE_FACES[pDice[1] - 1];
      document.getElementById('d-die-1').textContent = DICE_FACES[dDice[0] - 1];
      document.getElementById('d-die-2').textContent = DICE_FACES[dDice[1] - 1];

      diceResolve(pDice, dDice, bet);
    }
  }, 80);
}

function diceResolve(pDice, dDice, bet) {
  const rollBtn = document.getElementById('dice-roll-btn');
  if (rollBtn) rollBtn.disabled = false;

  const resultEl = document.getElementById('dice-result');
  const luckBonus = getGamblingLuckBonus();

  const pTotal = pDice[0] + pDice[1];
  const dTotal = dDice[0] + dDice[1];
  const pDoubles = pDice[0] === pDice[1];
  const dDoubles = dDice[0] === dDice[1];

  let won = false;

  if (pDoubles && !dDoubles) {
    let winnings = Math.floor(bet * 3);
    winnings += Math.floor(winnings * luckBonus);
    casinoWin(winnings);
    won = true;
    resultEl.innerHTML = `<span style="color:#f1c40f;font-size:1.3em;">🎯 DOUBLES! (${pTotal} vs ${dTotal}) Won $${winnings.toLocaleString()}!</span>`;
    _logAction(`🎲 Rolled doubles (${pDice[0]}+${pDice[1]})! Won $${winnings.toLocaleString()}!`);
  } else if (pTotal > dTotal && !(dDoubles && !pDoubles)) {
    let winnings = Math.floor(bet * 2);
    winnings += Math.floor(winnings * luckBonus);
    casinoWin(winnings);
    won = true;
    resultEl.innerHTML = `<span style="color:#2ecc71;font-size:1.3em;">🎉 You win! (${pTotal} vs ${dTotal}) +$${winnings.toLocaleString()}</span>`;
    _logAction(`🎲 Your dice beat the dealer! ${pTotal} vs ${dTotal}. Won $${winnings.toLocaleString()}!`);
  } else if (pTotal === dTotal && pDoubles === dDoubles) {
    player.money += bet;
    _updateUI();
    updateCasinoWallet();
    resultEl.innerHTML = `<span style="color:#f39c12;font-size:1.2em;">🤝 Tie! (${pTotal} vs ${dTotal}) Bet returned.</span>`;
    _logAction("🎲 Dice tied. Bet returned.");
  } else {
    resultEl.innerHTML = `<span style="color:#e74c3c;font-size:1.2em;">💔 Dealer wins! (${dTotal}${dDoubles ? ' DOUBLES' : ''} vs ${pTotal}) Lost $${bet.toLocaleString()}</span>`;
    _logAction("🎲 The dice betray you. Dealer's roll wins.");
  }
}

// ═══════════════════════════════════════════════════════════════════════
// HORSE RACING
// ═══════════════════════════════════════════════════════════════════════

const HORSES = [
  { name: 'Midnight Runner',  emoji: '🐴', color: '#e74c3c', odds: 2.0 },
  { name: 'Golden Thunder',   emoji: '🐴', color: '#f1c40f', odds: 3.0 },
  { name: 'Shadow Dancer',    emoji: '🐴', color: '#9b59b6', odds: 4.5 },
  { name: 'Iron Hoof',        emoji: '🐴', color: '#3498db', odds: 5.0 },
  { name: 'Crimson Fury',     emoji: '🐴', color: '#e67e22', odds: 7.0 },
  { name: 'Lucky Longshot',   emoji: '🐴', color: '#2ecc71', odds: 12.0 }
];

let _horseRaceState = null;

export function startHorseRacing() {
  const gameSelect = document.getElementById('casino-game-select');
  if (gameSelect) gameSelect.style.display = 'none';
  const gameArea = document.getElementById('casino-game-area');
  if (!gameArea) return;

  _horseRaceState = { selectedHorse: null, bet: 100, racing: false };

  const horseRows = HORSES.map((h, i) => `
    <div id="horse-row-${i}" onclick="selectHorse(${i})" 
         style="display:flex; align-items:center; gap:10px; padding:10px 12px; margin:4px 0; border-radius:8px; cursor:pointer;
                background:rgba(${i === 0 ? '231,76,60' : '50,50,50'},0.15); border:2px solid ${h.color}40; transition:all 0.2s;"
         onmouseover="this.style.background='rgba(192,160,98,0.15)'" onmouseout="this.style.background='rgba(50,50,50,0.15)'">
      <div style="font-size:1.5em;">${h.emoji}</div>
      <div style="flex:1;">
        <div style="color:${h.color}; font-weight:bold; font-family:Georgia,serif;">${h.name}</div>
        <div style="color:#999; font-size:0.8em;">Odds: ${h.odds}x payout</div>
      </div>
      <div style="color:#c0a062; font-weight:bold; font-size:1.1em;">${h.odds}:1</div>
    </div>
  `).join('');

  gameArea.innerHTML = `
    <div style="background:rgba(0,0,0,0.6); padding:20px; border-radius:12px; border:2px solid #c0a062;">
      <h2 style="text-align:center; color:#c0a062; font-family:Georgia,serif; margin-bottom:5px;">🏇 Horse Racing</h2>
      <p style="text-align:center; color:#999; margin-bottom:15px; font-size:0.9em;">Pick your horse and place a bet</p>
      
      <div style="margin-bottom:15px;">
        ${horseRows}
      </div>

      <div id="horse-bet-controls" style="text-align:center; padding:12px; background:rgba(20,20,20,0.7); border-radius:8px; border:1px solid #555;">
        <div style="color:#ccc; margin-bottom:8px;">Selected: <span id="horse-selected-name" style="color:#c0a062; font-weight:bold;">None</span></div>
        <div style="display:flex; justify-content:center; align-items:center; gap:8px; margin-bottom:10px;">
          <button onclick="horseAdjustBet(-100)" style="background:#333; color:#e74c3c; border:1px solid #e74c3c; padding:5px 12px; border-radius:4px; cursor:pointer;">-100</button>
          <button onclick="horseAdjustBet(-10)" style="background:#333; color:#e74c3c; border:1px solid #e74c3c; padding:5px 10px; border-radius:4px; cursor:pointer;">-10</button>
          <span style="color:#f1c40f; font-size:1.2em; font-weight:bold; min-width:80px;">$<span id="horse-bet-amount">100</span></span>
          <button onclick="horseAdjustBet(10)" style="background:#333; color:#2ecc71; border:1px solid #2ecc71; padding:5px 10px; border-radius:4px; cursor:pointer;">+10</button>
          <button onclick="horseAdjustBet(100)" style="background:#333; color:#2ecc71; border:1px solid #2ecc71; padding:5px 12px; border-radius:4px; cursor:pointer;">+100</button>
        </div>
        <button id="horse-race-btn" onclick="horseStartRace()" disabled
                style="background:linear-gradient(180deg,#8b6914,#5a4400); color:#ffd700; padding:12px 30px; border:2px solid #c0a062; border-radius:8px; font-size:1.1em; font-weight:bold; cursor:pointer; font-family:Georgia,serif; opacity:0.5;">
          🏁 Start Race
        </button>
      </div>

      <div id="horse-track" style="display:none; margin-top:15px; padding:15px; background:rgba(20,20,20,0.8); border-radius:8px; border:1px solid #555;">
      </div>

      <div id="horse-result" style="display:none; margin-top:10px; text-align:center; padding:12px; border-radius:8px;"></div>

      <div style="text-align:center; margin-top:12px;">
        <button onclick="showCasino()" style="background:#333; color:#c0a062; padding:10px 20px; border:1px solid #c0a062; border-radius:6px; cursor:pointer; font-family:Georgia,serif;">Back to Games</button>
      </div>
    </div>
  `;
}

export function selectHorse(index) {
  if (!_horseRaceState || _horseRaceState.racing) return;
  _horseRaceState.selectedHorse = index;

  // Highlight selected
  HORSES.forEach((_, i) => {
    const row = document.getElementById(`horse-row-${i}`);
    if (row) {
      row.style.border = i === index ? `2px solid ${HORSES[i].color}` : `2px solid ${HORSES[i].color}40`;
      row.style.background = i === index ? `rgba(192,160,98,0.2)` : `rgba(50,50,50,0.15)`;
    }
  });

  const nameEl = document.getElementById('horse-selected-name');
  if (nameEl) {
    nameEl.textContent = HORSES[index].name;
    nameEl.style.color = HORSES[index].color;
  }

  const btn = document.getElementById('horse-race-btn');
  if (btn) { btn.disabled = false; btn.style.opacity = '1'; }
}

export function horseAdjustBet(amount) {
  if (!_horseRaceState || _horseRaceState.racing) return;
  _horseRaceState.bet = Math.max(10, Math.min(50000, _horseRaceState.bet + amount));
  const el = document.getElementById('horse-bet-amount');
  if (el) el.textContent = _horseRaceState.bet.toLocaleString();
}

export function horseStartRace() {
  if (!_horseRaceState || _horseRaceState.selectedHorse === null || _horseRaceState.racing) return;

  const bet = _horseRaceState.bet;
  if (player.money < bet) {
    _showBriefNotification("Not enough cash!", "error");
    return;
  }

  player.money -= bet;
  _updateUI();
  updateCasinoWallet();
  _horseRaceState.racing = true;

  const btn = document.getElementById('horse-race-btn');
  if (btn) { btn.disabled = true; btn.textContent = '🏇 Racing...'; }

  // Build track
  const track = document.getElementById('horse-track');
  if (!track) return;
  track.style.display = 'block';

  const resultEl = document.getElementById('horse-result');
  if (resultEl) resultEl.style.display = 'none';

  // Generate horse speeds (weighted by inverse odds — lower odds = more likely faster)
  const positions = HORSES.map((h, i) => ({
    index: i,
    name: h.name,
    color: h.color,
    emoji: h.emoji,
    progress: 0,
    speed: (1 / h.odds) * 2 + Math.random() * 1.5  // base speed from odds + randomness
  }));

  // Render initial track
  function renderTrack() {
    const trackWidth = 100; // percentage
    track.innerHTML = positions.map(p => {
      const pct = Math.min(100, (p.progress / 100) * trackWidth);
      return `
        <div style="display:flex; align-items:center; margin:3px 0; gap:6px;">
          <div style="width:100px; color:${p.color}; font-size:0.75em; font-family:Georgia,serif; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${p.name}</div>
          <div style="flex:1; background:#222; height:22px; border-radius:4px; position:relative; overflow:hidden; border:1px solid #444;">
            <div style="position:absolute; left:0; top:0; height:100%; width:${pct}%; background:linear-gradient(90deg, ${p.color}88, ${p.color}); transition:width 0.15s; border-radius:3px;"></div>
            <div style="position:absolute; left:${Math.max(0, pct - 4)}%; top:0; font-size:14px; line-height:22px;">${p.emoji}</div>
          </div>
        </div>
      `;
    }).join('');
  }

  renderTrack();

  let finished = false;
  const raceInterval = setInterval(() => {
    positions.forEach(p => {
      if (p.progress < 100) {
        // Random burst factor for excitement
        const burst = Math.random() < 0.1 ? (Math.random() * 3) : 0;
        p.progress += p.speed * (0.6 + Math.random() * 0.8) + burst;
        if (p.progress >= 100) p.progress = 100;
      }
    });

    renderTrack();

    // Check for winner
    const finishers = positions.filter(p => p.progress >= 100);
    if (finishers.length > 0 && !finished) {
      finished = true;
      clearInterval(raceInterval);

      // Sort by who crossed first (highest progress = finished)
      // Since multiple could finish same tick, use speed as tiebreaker
      const winner = finishers.sort((a, b) => b.speed - a.speed)[0];

      // Continue animating remaining horses to finish
      const finishUp = setInterval(() => {
        let allDone = true;
        positions.forEach(p => {
          if (p.progress < 100) {
            allDone = false;
            p.progress += p.speed * 1.5;
            if (p.progress >= 100) p.progress = 100;
          }
        });
        renderTrack();
        if (allDone) clearInterval(finishUp);
      }, 80);

      // Show result
      const playerPick = _horseRaceState.selectedHorse;
      const luckBonus = getGamblingLuckBonus();
      
      if (resultEl) {
        resultEl.style.display = 'block';
        if (winner.index === playerPick) {
          let winnings = Math.floor(bet * HORSES[playerPick].odds);
          winnings += Math.floor(winnings * luckBonus);
          casinoWin(winnings);
          resultEl.style.border = '2px solid #2ecc71';
          resultEl.style.background = 'rgba(46,204,113,0.15)';
          resultEl.innerHTML = `<span style="color:#2ecc71; font-size:1.3em; font-weight:bold;">🏆 ${winner.name} wins! +$${winnings.toLocaleString()}</span><br><span style="color:#ccc; font-size:0.9em;">${HORSES[playerPick].odds}x payout on your $${bet.toLocaleString()} bet!</span>`;
          _logAction(`🏇 ${winner.name} won the race! Payout $${winnings.toLocaleString()} (${HORSES[playerPick].odds}x).`);
        } else {
          resultEl.style.border = '2px solid #e74c3c';
          resultEl.style.background = 'rgba(231,76,60,0.15)';
          resultEl.innerHTML = `<span style="color:#e74c3c; font-size:1.3em; font-weight:bold;">💨 ${winner.name} wins!</span><br><span style="color:#999; font-size:0.9em;">Your pick ${HORSES[playerPick].name} didn't make it. Lost $${bet.toLocaleString()}</span>`;
          _logAction(`🏇 Lost $${bet.toLocaleString()} — ${winner.name} beat ${HORSES[playerPick].name}.`);
        }
      }

      // Allow betting again
      _horseRaceState.racing = false;
      _horseRaceState.selectedHorse = null;
      if (btn) { btn.disabled = true; btn.style.opacity = '0.5'; btn.textContent = '🏁 Start Race'; }
      const nameEl = document.getElementById('horse-selected-name');
      if (nameEl) { nameEl.textContent = 'None'; nameEl.style.color = '#c0a062'; }
      HORSES.forEach((_, i) => {
        const row = document.getElementById(`horse-row-${i}`);
        if (row) { row.style.border = `2px solid ${HORSES[i].color}40`; row.style.background = 'rgba(50,50,50,0.15)'; }
      });
      updateCasinoWallet();
    }
  }, 150);
}
