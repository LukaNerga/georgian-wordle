# 🇬🇪 Georgian Wordle

A Georgian version of the popular word puzzle game inspired by Wordle.
Guess the daily 5-letter Georgian word in 6 tries.

---

## 🎮 Features

* 🇬🇪 Fully Georgian language support
* 📅 One word per day (same for all users)
* 🟩🟨⬛ Color feedback system:

  * Green → correct letter & position
  * Yellow → correct letter, wrong position
  * Gray → letter not in word
* ⌨️ Physical + on-screen keyboard support
* 💾 Progress saved using localStorage
* 🔒 Cannot replay the same day’s puzzle
* 📤 Share results (like Wordle)
* 🌙 Dark mode UI (Wordle-style)

---

## 📅 Date Format

The game displays dates in Georgian format:

Example:
28 აპრილი

---

## 🧠 How It Works

* A fixed start date is used (Jan 1, 2024)
* Each day maps to a word from the list
* Formula:

```
index = days_since_start % total_words
```

* This ensures:

  * Same word for everyone
  * Automatic daily change
  * No backend required

---

## 📁 Project Structure

```
georgian-wordle/
│── index.html
│── style.css
│── script.js
│── words.js
```

---

## 🚀 Deployment (GitHub Pages)

This project is designed to run as a static site using GitHub Pages.

### Steps:

1. Create a repository
2. Upload all project files
3. Go to **Settings → Pages**
4. Select:

   * Branch: `main`
   * Folder: `/root`
5. Save

Your site will be live at:

```
https://yourusername.github.io/georgian-wordle/
```

---

## 🛠️ Tech Stack

* HTML
* CSS
* JavaScript (Vanilla)
* LocalStorage (for saving progress)

---

## ⭐ Future Improvements

* Animations (tile flip)
* Better mobile responsiveness
* Statistics (win rate, streaks)
* Dictionary validation for guesses
* Sound effects

---

## 📌 Inspiration

Inspired by the original Wordle game.

---

## 📄 License

This project is open-source and available under the MIT License.

---

## 🙌 Author

Made by Luka Nergadze
