const ROWS = 6;
const COLS = 5;

let board = [];
let currentRow = 0;
let currentCol = 0;
let currentGuess = "";
let targetWord = "";
let wordList = [];
let gameEnded = false;

const grid = document.getElementById("grid");
const keyboard = document.getElementById("keyboard");
const message = document.getElementById("message");

/* Alphabetical Georgian keyboard layout */
const georgianLayout = [
  ["ა", "ბ", "გ", "დ", "ე", "ვ", "ზ"],
  ["თ", "ი", "კ", "ლ", "მ", "ნ", "ო"],
  ["პ", "ჟ", "რ", "ს", "ტ", "უ", "ფ"],
  ["ქ", "ღ", "ყ", "შ", "ჩ", "ც", "ძ"],
  ["⏎", "წ", "ჭ", "ხ", "ჯ", "ჰ", "⌫"]
];

/* ---------------- LOAD WORDS ---------------- */
async function loadWords() {
  try {
    const res = await fetch("./words.txt");
    if (!res.ok) {
      throw new Error("words.txt ვერ ჩაიტვირთა");
    }

    const text = await res.text();

    wordList = text
      .split("\n")
      .map(word => word.trim())
      .filter(word => word.length === 5);

    if (wordList.length === 0) {
      throw new Error("words.txt-ში 5-ასოიანი სიტყვები ვერ მოიძებნა");
    }

    targetWord = wordList[Math.floor(Math.random() * wordList.length)];
    console.log("Target word:", targetWord);
  } catch (error) {
    showMessage("სიტყვების ჩატვირთვა ვერ მოხერხდა");
    console.error(error);
  }
}

/* ---------------- CREATE GRID ---------------- */
function createGrid() {
  grid.innerHTML = "";
  board = [];

  for (let r = 0; r < ROWS; r++) {
    board[r] = [];

    for (let c = 0; c < COLS; c++) {
      const tile = document.createElement("div");
      tile.className = "tile";
      grid.appendChild(tile);
      board[r][c] = tile;
    }
  }
}

/* ---------------- CREATE KEYBOARD ---------------- */
function createKeyboard() {
  keyboard.innerHTML = "";

  georgianLayout.forEach(row => {
    const rowDiv = document.createElement("div");
    rowDiv.className = "key-row";

    row.forEach(keyValue => {
      const key = document.createElement("button");
      key.className = "key";
      key.textContent = keyValue;
      key.dataset.key = keyValue;

      if (keyValue === "⏎" || keyValue === "⌫") {
        key.classList.add("large");
      }

      key.addEventListener("click", () => handleInput(keyValue));
      rowDiv.appendChild(key);
    });

    keyboard.appendChild(rowDiv);
  });
}

/* ---------------- HELPERS ---------------- */
function showMessage(text) {
  message.textContent = text;
}

function clearMessage() {
  message.textContent = "";
}

function getTile(row, col) {
  return board[row][col];
}

function paintKey(letter, state) {
  const key = document.querySelector(`.key[data-key="${letter}"]`);
  if (!key) return;

  if (key.classList.contains("correct")) return;
  if (key.classList.contains("present") && state === "absent") return;

  key.classList.remove("correct", "present", "absent");
  key.classList.add(state);
}

function shakeRow(row) {
  for (let c = 0; c < COLS; c++) {
    const tile = getTile(row, c);
    tile.classList.add("shake");
    tile.addEventListener(
      "animationend",
      () => tile.classList.remove("shake"),
      { once: true }
    );
  }
}

/* ---------------- INPUT ---------------- */
function handleInput(key) {
  if (gameEnded || !targetWord) return;

  clearMessage();

  if (key === "⌫") {
    removeLetter();
    return;
  }

  if (key === "⏎") {
    submitGuess();
    return;
  }

  addLetter(key);
}

function addLetter(letter) {
  if (currentCol >= COLS) return;

  const tile = getTile(currentRow, currentCol);
  tile.textContent = letter;
  tile.classList.add("filled");

  currentGuess += letter;
  currentCol++;
}

function removeLetter() {
  if (currentCol <= 0) return;

  currentCol--;
  currentGuess = currentGuess.slice(0, -1);

  const tile = getTile(currentRow, currentCol);
  tile.textContent = "";
  tile.classList.remove("filled");
}

/* ---------------- EVALUATE GUESS ---------------- */
function evaluateGuess(guess, answer) {
  const result = Array(COLS).fill("absent");
  const answerChars = answer.split("");
  const guessChars = guess.split("");

  /* First pass: correct letters */
  for (let i = 0; i < COLS; i++) {
    if (guessChars[i] === answerChars[i]) {
      result[i] = "correct";
      answerChars[i] = null;
      guessChars[i] = null;
    }
  }

  /* Second pass: present letters */
  for (let i = 0; i < COLS; i++) {
    if (guessChars[i] === null) continue;

    const foundIndex = answerChars.indexOf(guessChars[i]);
    if (foundIndex !== -1) {
      result[i] = "present";
      answerChars[foundIndex] = null;
    }
  }

  return result;
}

/* ---------------- SUBMIT ---------------- */
function submitGuess() {
  if (currentGuess.length !== 5) {
    showMessage("შეიყვანე 5 ასო");
    shakeRow(currentRow);
    return;
  }

  if (!wordList.includes(currentGuess)) {
    showMessage("ასეთი სიტყვა სიაში არ არის");
    shakeRow(currentRow);
    return;
  }

  const evaluation = evaluateGuess(currentGuess, targetWord);

  evaluation.forEach((state, i) => {
    const tile = getTile(currentRow, i);
    const letter = currentGuess[i];

    setTimeout(() => {
      tile.classList.add("flip");
      tile.classList.add(state);
      paintKey(letter, state);
    }, i * 260);
  });

  const submittedGuess = currentGuess;

  if (submittedGuess === targetWord) {
    gameEnded = true;
    setTimeout(() => {
      showMessage(`გილოცავ! სიტყვა იყო: ${targetWord}`);
    }, 1500);
    return;
  }

  currentRow++;
  currentCol = 0;
  currentGuess = "";

  if (currentRow === ROWS) {
    gameEnded = true;
    setTimeout(() => {
      showMessage(`თამაში დასრულდა. სიტყვა იყო: ${targetWord}`);
    }, 1500);
  }
}

/* ---------------- OPTIONAL PHYSICAL KEYBOARD ---------------- */
document.addEventListener("keydown", (event) => {
  if (gameEnded) return;

  const key = event.key;

  if (key === "Backspace") {
    handleInput("⌫");
    return;
  }

  if (key === "Enter") {
    handleInput("⏎");
    return;
  }

  if (key.length === 1 && /[აბგდევზთიკლმნოპჟრსტუფქღყშჩცძწჭხჯჰ]/.test(key)) {
    handleInput(key);
  }
});

/* ---------------- INIT ---------------- */
async function init() {
  createGrid();
  createKeyboard();
  await loadWords();
}

init();
