const ROWS = 6;
const COLS = 5;

let board = [];
let currentRow = 0;
let currentCol = 0;
let targetWord = "";
let wordList = [];

const grid = document.getElementById("grid");
const keyboard = document.getElementById("keyboard");
const message = document.getElementById("message");

/* ---------------- LOAD WORDS ---------------- */
async function loadWords() {
  const res = await fetch("./words.txt");
  const text = await res.text();
  wordList = text.split("\n").map(w => w.trim()).filter(w => w.length === 5);

  targetWord = wordList[Math.floor(Math.random() * wordList.length)];
  console.log("Target:", targetWord); // debug
}

/* ---------------- CREATE GRID ---------------- */
function createGrid() {
  for (let r = 0; r < ROWS; r++) {
    board[r] = [];
    for (let c = 0; c < COLS; c++) {
      const tile = document.createElement("div");
      tile.classList.add("tile");
      grid.appendChild(tile);
      board[r][c] = tile;
    }
  }
}

/* ---------------- KEYBOARD ---------------- */
const georgianLayout = [
  ["წ","ე","რ","ტ","ყ","უ","ი","ო","პ"],
  ["ა","ს","დ","ფ","გ","ჰ","ჯ","კ","ლ"],
  ["⏎","ზ","ხ","ც","ვ","ბ","ნ","მ","⌫"]
];

function createKeyboard() {
  georgianLayout.forEach(row => {
    const rowDiv = document.createElement("div");
    rowDiv.classList.add("key-row");

    row.forEach(key => {
      const btn = document.createElement("button");
      btn.textContent = key;
      btn.classList.add("key");

      if (key === "⏎" || key === "⌫") {
        btn.classList.add("large");
      }

      btn.addEventListener("click", () => handleInput(key));
      rowDiv.appendChild(btn);
    });

    keyboard.appendChild(rowDiv);
  });
}

/* ---------------- INPUT ---------------- */
let currentGuess = "";

function handleInput(key) {
  if (message.textContent !== "") return;

  if (key === "⌫") {
    if (currentCol > 0) {
      currentCol--;
      currentGuess = currentGuess.slice(0, -1);
      board[currentRow][currentCol].textContent = "";
    }
  } else if (key === "⏎") {
    submitGuess();
  } else {
    if (currentCol < COLS) {
      board[currentRow][currentCol].textContent = key;
      currentGuess += key;
      currentCol++;
    }
  }
}

/* ---------------- SUBMIT ---------------- */
function submitGuess() {
  if (currentGuess.length !== 5) return;

  if (!wordList.includes(currentGuess)) {
    message.textContent = "სიტყვა არ არსებობს!";
    setTimeout(() => message.textContent = "", 1500);
    return;
  }

  let guessArray = currentGuess.split("");
  let targetArray = targetWord.split("");

  guessArray.forEach((letter, i) => {
    const tile = board[currentRow][i];

    setTimeout(() => {
      tile.classList.add("flip");

      if (letter === targetArray[i]) {
        tile.classList.add("correct");
      } else if (targetArray.includes(letter)) {
        tile.classList.add("present");
      } else {
        tile.classList.add("absent");
      }
    }, i * 300);
  });

  if (currentGuess === targetWord) {
    setTimeout(() => {
      message.textContent = "გილოცავ! 🎉";
    }, 1800);
    return;
  }

  currentRow++;
  currentCol = 0;
  currentGuess = "";

  if (currentRow === ROWS) {
    setTimeout(() => {
      message.textContent = `დამარცხდი 😢 სიტყვა იყო: ${targetWord}`;
    }, 1800);
  }
}

/* ---------------- INIT ---------------- */
async function init() {
  await loadWords();
  createGrid();
  createKeyboard();
}

init();
