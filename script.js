// ==========================================
//  ქართული ვორდლი — script.js
//  Full game logic: daily word, board,
//  keyboard, animations, localStorage
// ==========================================

'use strict';

// ──────────────────────────────────────────
//  CONSTANTS
// ──────────────────────────────────────────

const WORD_LENGTH   = 5;
const MAX_GUESSES   = 6;
const START_DATE    = new Date('2024-01-01T00:00:00Z');

const STORAGE_KEY   = 'kartuli-wordle-state';

const STATE = {
  CORRECT: 'correct',
  PRESENT: 'present',
  ABSENT:  'absent',
  TBD:     'tbd',
  EMPTY:   '',
};

const GEO_MONTHS = [
  'იანვარი','თებერვალი','მარტი','აპრილი',
  'მაისი','ივნისი','ივლისი','აგვისტო',
  'სექტემბერი','ოქტომბერი','ნოემბერი','დეკემბერი',
];

const WIN_MESSAGES = [
  'გენიალური! 🧠',
  'შესანიშნავი! ⭐',
  'ბრავო! 🎉',
  'კარგი! 👏',
  'ფუ, ძლივს! 😅',
  'კარგად! 😤',
];

const EMOJI = {
  [STATE.CORRECT]: '🟩',
  [STATE.PRESENT]: '🟨',
  [STATE.ABSENT]:  '⬛',
};

// ──────────────────────────────────────────
//  DOM REFERENCES
// ──────────────────────────────────────────

const boardEl        = document.getElementById('board');
const keyboardEl     = document.getElementById('keyboard');
const dateEl         = document.getElementById('current-date');
const notifEl        = document.getElementById('notification');
const modalOverlay   = document.getElementById('modal-overlay');
const modalIcon      = document.getElementById('modal-icon');
const modalTitle     = document.getElementById('modal-title');
const modalSubtitle  = document.getElementById('modal-subtitle');
const modalWordEl    = document.getElementById('modal-word');
const modalResult    = document.getElementById('modal-result');
const modalShareBtn  = document.getElementById('modal-share-btn');
const modalCloseBtn  = document.getElementById('modal-close-btn');

// ──────────────────────────────────────────
//  GAME STATE
// ──────────────────────────────────────────

let targetWord   = '';
let guesses      = [];      // Array of submitted words (strings)
let currentInput = [];      // Array of chars being typed (current row)
let gameOver     = false;
let gameWon      = false;
let dayIndex     = 0;

// Tile DOM references: tiles[row][col]
let tiles = [];
// Key DOM references: keysMap[char] = buttonEl
let keysMap = {};

// ──────────────────────────────────────────
//  INIT
// ──────────────────────────────────────────

function init() {
  dayIndex    = getDayIndex();
  targetWord  = getDailyWord();

  displayDate();
  buildBoard();
  buildKeyMap();
  restoreState();
  attachListeners();
}

// ──────────────────────────────────────────
//  DATE & WORD SELECTION
// ──────────────────────────────────────────

function getDayIndex() {
  const now       = new Date();
  const utcNow    = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  const utcStart  = Date.UTC(
    START_DATE.getFullYear(),
    START_DATE.getMonth(),
    START_DATE.getDate()
  );
  return Math.floor((utcNow - utcStart) / 86400000);
}

function getDailyWord() {
  const pool = typeof DAILY_WORDS !== 'undefined' ? DAILY_WORDS : WORDS;
  return pool[dayIndex % pool.length];
}

function displayDate() {
  const now  = new Date();
  const day  = now.getDate();
  const mon  = GEO_MONTHS[now.getMonth()];
  dateEl.textContent = `${day} ${mon}`;
}

// ──────────────────────────────────────────
//  BUILD DOM
// ──────────────────────────────────────────

function buildBoard() {
  boardEl.innerHTML = '';
  tiles = [];
  for (let r = 0; r < MAX_GUESSES; r++) {
    const rowTiles = [];
    const rowEl = document.createElement('div');
    rowEl.className = 'board-row';
    rowEl.setAttribute('data-row', r);

    for (let c = 0; c < WORD_LENGTH; c++) {
      const tile = document.createElement('div');
      tile.className = 'tile';
      tile.setAttribute('data-row', r);
      tile.setAttribute('data-col', c);
      rowEl.appendChild(tile);
      rowTiles.push(tile);
    }

    boardEl.appendChild(rowEl);
    tiles.push(rowTiles);
  }
}

function buildKeyMap() {
  keysMap = {};
  document.querySelectorAll('.key[data-key]').forEach(btn => {
    const key = btn.getAttribute('data-key');
    if (key && key.length === 1) {
      keysMap[key] = btn;
    }
  });
}

// ──────────────────────────────────────────
//  GEORGIAN CHARACTER UTILITIES
// ──────────────────────────────────────────

function isGeorgianChar(ch) {
  if (!ch || ch.length !== 1) return false;
  const code = ch.codePointAt(0);
  return code >= 0x10D0 && code <= 0x10FF;
}

function georgianLength(str) {
  return [...str].filter(isGeorgianChar).length;
}

// ──────────────────────────────────────────
//  INPUT HANDLING
// ──────────────────────────────────────────

function handleKey(key) {
  if (gameOver) return;

  if (key === 'Enter') {
    submitGuess();
    return;
  }

  if (key === 'Backspace' || key === 'Delete') {
    deleteLetter();
    return;
  }

  if (isGeorgianChar(key)) {
    addLetter(key);
  }
}

function addLetter(ch) {
  if (currentInput.length >= WORD_LENGTH) return;
  currentInput.push(ch);
  updateCurrentRow();
}

function deleteLetter() {
  if (currentInput.length === 0) return;
  currentInput.pop();
  updateCurrentRow();
}

function updateCurrentRow() {
  const row = guesses.length;
  if (row >= MAX_GUESSES) return;

  for (let c = 0; c < WORD_LENGTH; c++) {
    const tile = tiles[row][c];
    const ch   = currentInput[c] || '';
    tile.textContent = ch;
    tile.setAttribute('data-state', ch ? STATE.TBD : STATE.EMPTY);
  }
}

// ──────────────────────────────────────────
//  SUBMIT GUESS
// ──────────────────────────────────────────

function submitGuess() {
  if (currentInput.length < WORD_LENGTH) {
    showNotification('სიტყვა არ არის სრული');
    shakeCurrentRow();
    return;
  }

  const guessWord = currentInput.join('');

  // Validate word exists in word list
  const allWords = typeof WORDS !== 'undefined' ? WORDS : [];
  const dailyWords = typeof DAILY_WORDS !== 'undefined' ? DAILY_WORDS : [];
  const combined = [...new Set([...allWords, ...dailyWords, targetWord])];
  
  if (!combined.includes(guessWord)) {
    showNotification('სიტყვა არ მოიძებნა');
    shakeCurrentRow();
    return;
  }

  const row       = guesses.length;
  const result    = evaluateGuess(guessWord, targetWord);

  // Animate tiles
  revealRow(row, guessWord, result);

  guesses.push(guessWord);
  currentInput = [];

  const won = result.every(r => r === STATE.CORRECT);

  if (won) {
    gameWon  = true;
    gameOver = true;
    saveState();
    const delay = WORD_LENGTH * 80 + 600;
    setTimeout(() => {
      bounceWinRow(row);
      setTimeout(() => showModal(true), 500);
    }, delay);
    return;
  }

  if (guesses.length >= MAX_GUESSES) {
    gameOver = true;
    saveState();
    const delay = WORD_LENGTH * 80 + 600;
    setTimeout(() => showModal(false), delay);
    return;
  }

  saveState();
}

// ──────────────────────────────────────────
//  GUESS EVALUATION
// ──────────────────────────────────────────

function evaluateGuess(guess, target) {
  const result    = new Array(WORD_LENGTH).fill(STATE.ABSENT);
  const targetArr = [...target];
  const guessArr  = [...guess];

  // First pass: correct positions
  for (let i = 0; i < WORD_LENGTH; i++) {
    if (guessArr[i] === targetArr[i]) {
      result[i]    = STATE.CORRECT;
      targetArr[i] = null;   // consume
      guessArr[i]  = null;
    }
  }

  // Second pass: present letters
  for (let i = 0; i < WORD_LENGTH; i++) {
    if (guessArr[i] === null) continue;
    const idx = targetArr.indexOf(guessArr[i]);
    if (idx !== -1) {
      result[i]    = STATE.PRESENT;
      targetArr[idx] = null; // consume
    }
  }

  return result;
}

// ──────────────────────────────────────────
//  ROW ANIMATIONS
// ──────────────────────────────────────────

function revealRow(row, word, result) {
  const chars = [...word];

  chars.forEach((ch, col) => {
    const tile  = tiles[row][col];
    const state = result[col];
    const delay = col * 80;

    setTimeout(() => {
      tile.setAttribute('data-state', state);
      tile.textContent = ch;
    }, delay);

    // Update keyboard after flip
    setTimeout(() => {
      updateKeyState(ch, state);
    }, delay + 300);
  });
}

function shakeCurrentRow() {
  const row = guesses.length;
  if (row >= MAX_GUESSES) return;
  const rowEl = boardEl.querySelector(`.board-row[data-row="${row}"]`);
  if (!rowEl) return;
  rowEl.classList.remove('shake');
  void rowEl.offsetWidth; // reflow
  rowEl.classList.add('shake');
  rowEl.addEventListener('animationend', () => rowEl.classList.remove('shake'), { once: true });
}

function bounceWinRow(row) {
  const rowEl = boardEl.querySelector(`.board-row[data-row="${row}"]`);
  if (!rowEl) return;
  rowEl.classList.add('win');
}

// ──────────────────────────────────────────
//  KEYBOARD STATE
// ──────────────────────────────────────────

function updateKeyState(ch, newState) {
  const btn = keysMap[ch];
  if (!btn) return;

  const current = btn.getAttribute('data-state');
  // Priority: correct > present > absent
  const priority = { [STATE.CORRECT]: 3, [STATE.PRESENT]: 2, [STATE.ABSENT]: 1, '': 0 };
  if ((priority[newState] || 0) > (priority[current] || 0)) {
    btn.setAttribute('data-state', newState);
  }
}

function rebuildKeyboardStates() {
  // Reset all keys
  document.querySelectorAll('.key[data-key]').forEach(btn => {
    btn.removeAttribute('data-state');
  });

  // Replay all guesses
  guesses.forEach(word => {
    const result = evaluateGuess(word, targetWord);
    [...word].forEach((ch, i) => {
      updateKeyState(ch, result[i]);
    });
  });
}

// ──────────────────────────────────────────
//  NOTIFICATIONS
// ──────────────────────────────────────────

let notifTimer = null;

function showNotification(msg, duration = 1800) {
  clearTimeout(notifTimer);
  notifEl.textContent = msg;
  notifEl.classList.add('show');
  notifTimer = setTimeout(() => notifEl.classList.remove('show'), duration);
}

// ──────────────────────────────────────────
//  MODAL
// ──────────────────────────────────────────

function showModal(won) {
  const attemptCount = guesses.length;

  if (won) {
    modalIcon.textContent    = '🎉';
    modalTitle.textContent   = WIN_MESSAGES[Math.min(attemptCount - 1, WIN_MESSAGES.length - 1)];
    modalSubtitle.textContent = `გამოიცანი ${attemptCount}/${MAX_GUESSES} ცდაში`;
  } else {
    modalIcon.textContent    = '😔';
    modalTitle.textContent   = 'სცადე ხვალ!';
    modalSubtitle.textContent = 'სიტყვა იყო:';
  }

  modalWordEl.textContent = targetWord.toUpperCase();
  modalResult.textContent = buildShareText(false);

  modalOverlay.classList.add('show');
}

function hideModal() {
  modalOverlay.classList.remove('show');
}

// ──────────────────────────────────────────
//  SHARE / COPY
// ──────────────────────────────────────────

function buildShareText(includeHeader = true) {
  const lines = guesses.map(word => {
    const result = evaluateGuess(word, targetWord);
    return result.map(r => EMOJI[r] || '⬛').join('');
  });

  if (includeHeader) {
    const now = new Date();
    const dateStr = `${now.getDate()} ${GEO_MONTHS[now.getMonth()]}`;
    return `ქართული ვორდლი #${dayIndex + 1} — ${dateStr}\n${guesses.length}/${MAX_GUESSES}\n\n${lines.join('\n')}`;
  }
  return lines.join('\n');
}

function copyResult() {
  const text = buildShareText(true);
  if (navigator.clipboard) {
    navigator.clipboard.writeText(text).then(() => {
      showNotification('შედეგი დაკოპირდა! 📋', 2000);
    }).catch(() => fallbackCopy(text));
  } else {
    fallbackCopy(text);
  }
}

function fallbackCopy(text) {
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.style.cssText = 'position:fixed;opacity:0;top:0;left:0';
  document.body.appendChild(ta);
  ta.select();
  try {
    document.execCommand('copy');
    showNotification('შედეგი დაკოპირდა! 📋', 2000);
  } catch (e) {
    showNotification('ვერ დაკოპირდა', 2000);
  }
  document.body.removeChild(ta);
}

// ──────────────────────────────────────────
//  LOCAL STORAGE
// ──────────────────────────────────────────

function saveState() {
  const state = {
    dayIndex,
    guesses,
    gameOver,
    gameWon,
  };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    // Storage might be disabled
  }
}

function restoreState() {
  let saved;
  try {
    saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
  } catch (e) {
    saved = null;
  }

  if (!saved || saved.dayIndex !== dayIndex) {
    // New day or no save — fresh start
    return;
  }

  // Restore guesses
  guesses  = saved.guesses  || [];
  gameOver = saved.gameOver || false;
  gameWon  = saved.gameWon  || false;

  // Render all previous guesses instantly
  guesses.forEach((word, row) => {
    const result = evaluateGuess(word, targetWord);
    const chars  = [...word];
    chars.forEach((ch, col) => {
      const tile = tiles[row][col];
      tile.textContent = ch;
      tile.setAttribute('data-state', result[col]);
    });
  });

  // Rebuild keyboard colors
  rebuildKeyboardStates();

  // If game is already over, show modal
  if (gameOver) {
    setTimeout(() => showModal(gameWon), 600);
  }
}

// ──────────────────────────────────────────
//  EVENT LISTENERS
// ──────────────────────────────────────────

function attachListeners() {
  // Physical keyboard
  document.addEventListener('keydown', e => {
    if (e.ctrlKey || e.altKey || e.metaKey) return;

    if (e.key === 'Enter')     { handleKey('Enter');     return; }
    if (e.key === 'Backspace') { handleKey('Backspace'); return; }

    // Single Georgian character
    if (e.key.length === 1 && isGeorgianChar(e.key)) {
      handleKey(e.key);
    }
  });

  // On-screen keyboard
  keyboardEl.addEventListener('click', e => {
    const btn = e.target.closest('.key');
    if (!btn) return;
    const key = btn.getAttribute('data-key');
    if (key) handleKey(key);
  });

  // Modal buttons
  modalShareBtn.addEventListener('click', copyResult);
  modalCloseBtn.addEventListener('click', hideModal);

  // Close modal on overlay click
  modalOverlay.addEventListener('click', e => {
    if (e.target === modalOverlay) hideModal();
  });

  // Close modal on Escape
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') hideModal();
  });
}

// ──────────────────────────────────────────
//  BOOT
// ──────────────────────────────────────────

document.addEventListener('DOMContentLoaded', init);
