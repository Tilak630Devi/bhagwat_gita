# 📖 Bhagavad Gita Audio Player

A simple web-based **Bhagavad Gita Adhyay (Chapter) Audio Player** built using **HTML, CSS, and JavaScript**.  
This project allows users to listen to audio recitations of Bhagavad Gita chapters through a clean and minimal UI.

🔗 **Live Demo:** https://bhagawadgeeta.netlify.app/

---

## ✨ Features

- 🎧 Audio player for Bhagavad Gita chapters
- 📜 Dynamic loading of audio files
- ▶️ Play / Pause functionality
- ⏱️ Duration and current time display
- 🎨 Clean and minimal user interface
- 🌐 Fully static, deployable on Netlify / GitHub Pages

---

## 🗂️ Project Structure

```

bhagwat_gita/
│
├── index.html          # Main HTML file
├── style.css           # Styling for the UI
├── app.js              # JavaScript logic for audio player
├── audio-manifest.js   # Metadata/configuration for audio files
├── All_Audio/          # Folder containing audio files (MP3)
└── README.md           # Project documentation

```

---

## 🚀 How It Works

1. Audio files are stored inside the `All_Audio/` directory.
2. `audio-manifest.js` contains references (names & paths) to those audio files.
3. `app.js` dynamically reads the manifest and initializes the audio player.
4. The UI is rendered via `index.html` and styled using `style.css`.

⚠️ **Note:**  
If the `All_Audio` folder is empty or audio paths are incorrect, the player will show **“No Audio Files Found”**.

---

## 📥 Adding Audio Files

1. Add your `.mp3` files inside the `All_Audio/` folder  
   Example:
```

All_Audio/
├── Chapter_1.mp3
├── Chapter_2.mp3

````

2. Update `audio-manifest.js`:
```js
const audioList = [
  {
    title: "Chapter 1 - Arjuna Vishada Yoga",
    src: "All_Audio/Chapter_1.mp3"
  },
  {
    title: "Chapter 2 - Sankhya Yoga",
    src: "All_Audio/Chapter_2.mp3"
  }
];
````

3. Reload the page — the tracks will appear automatically 🎶

---

## 🛠️ Technologies Used

* **HTML5**
* **CSS3**
* **Vanilla JavaScript**
* **Netlify** (for deployment)

---

## 🌐 Deployment

This project is deployed using **Netlify**.
https://bhagawadgeeta.netlify.app/
---

## 📌 Future Improvements

* 📖 Display chapter verses alongside audio
* 🌍 Add Hindi / English translations
* 📱 Improve mobile responsiveness
* 🔁 Playlist & chapter navigation
* 🌙 Dark mode

---

## 🙏 Acknowledgement

Inspired by the teachings of **Shrimad Bhagavad Gita**.

---

### ✨ Author

**Tilak630Devi**
GitHub: [https://github.com/Tilak630Devi](https://github.com/Tilak630Devi)

```