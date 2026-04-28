const ROWS = 6;
const COLS = 5;

let currentRow = 0;
let currentCol = 0;
let gameOver = false;

let WORDS = [];
let DAILY_WORDS = [];
let word = "";

// LOAD WORDS FROM TXT
async function loadWords() {
const res = await fetch("words.txt");
const text = await res.text();

WORDS = text.split("\n")
.map(w => w.trim())
.filter(w => w.length === 5);

DAILY_WORDS = WORDS.slice(0, 200); // first 200 words as daily pool

startGame();
}

loadWords();

function startGame() {
word = getWordOfTheDay();

document.getElementById("date").innerText = getGeorgianDate();

const board = document.getElementById("board");

// create board
for (let r = 0; r < ROWS; r++) {
const row = document.createElement("div");
row.className = "row";

```
for (let c = 0; c < COLS; c++) {
  const tile = document.createElement("div");
  tile.className = "tile";
  row.appendChild(tile);
}

board.appendChild(row);
```

}

createKeyboard();
}

// KEYBOARD
function createKeyboard() {
const keys = [
["ქ","წ","ე","რ","ტ","ყ","უ","ი","ო","პ"],
["ა","ს","დ","ფ","გ","ჰ","ჯ","კ","ლ"],
["Enter","ზ","ხ","ც","ვ","ბ","ნ","მ","⌫"]
];

const keyboard = document.getElementById("keyboard");

keys.forEach(row => {
const div = document.createElement("div");
div.className = "key-row";

```
row.forEach(k => {
  const key = document.createElement("div");
  key.className = "key";
  key.innerText = k;

  key.onclick = () => handleKey(k);
  div.appendChild(key);
});

keyboard.appendChild(div);
```

});
}

// PHYSICAL KEYBOARD
document.addEventListener("keydown", (e) => {
if (e.key === "Enter") handleKey("Enter");
else if (e.key === "Backspace") handleKey("⌫");
else {
const letter = e.key.toLowerCase();
if (/^[ა-ჰ]$/.test(letter)) handleKey(letter);
}
});

function handleKey(key) {
if (gameOver) return;

const board = document.getElementById("board");

if (key === "⌫") {
if (currentCol > 0) {
currentCol--;
board.children[currentRow].children[currentCol].innerText = "";
}
return;
}

if (key === "Enter") {
if (currentCol < COLS) return;
checkRow();
return;
}

if (currentCol < COLS) {
board.children[currentRow].children[currentCol].innerText = key;
currentCol++;
}
}

function checkRow() {
const board = document.getElementById("board");
let guess = "";

for (let i = 0; i < COLS; i++) {
guess += board.children[currentRow].children[i].innerText;
}

if (!WORDS.includes(guess)) {
alert("არასწორი სიტყვა");
return;
}

let wordArr = word.split("");

for (let i = 0; i < COLS; i++) {
const tile = board.children[currentRow].children[i];

```
if (guess[i] === word[i]) {
  tile.classList.add("correct");
  wordArr[i] = null;
}
```

}

for (let i = 0; i < COLS; i++) {
const tile = board.children[currentRow].children[i];

```
if (!tile.classList.contains("correct")) {
  const index = wordArr.indexOf(guess[i]);

  if (index > -1) {
    tile.classList.add("present");
    wordArr[index] = null;
  } else {
    tile.classList.add("absent");
  }
}
```

}

if (guess === word) {
gameOver = true;
setTimeout(() => alert("გილოცავ!"), 100);
return;
}

currentRow++;
currentCol = 0;

if (currentRow === ROWS) {
gameOver = true;
setTimeout(() => alert("სიტყვა იყო: " + word), 100);
}
}

// DAILY WORD
function getWordOfTheDay() {
const start = new Date(2024, 0, 1);
const today = new Date();

const diff = Math.floor((today - start) / (1000 * 60 * 60 * 24));

return DAILY_WORDS[diff % DAILY_WORDS.length];
}

// DATE FORMAT
function getGeorgianDate() {
const months = [
"იანვარი","თებერვალი","მარტი","აპრილი","მაისი","ივნისი",
"ივლისი","აგვისტო","სექტემბერი","ოქტომბერი","ნოემბერი","დეკემბერი"
];

const d = new Date();
return `${d.getDate()} ${months[d.getMonth()]}`;
}
