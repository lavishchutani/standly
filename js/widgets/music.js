// Music widget. Songs are files you pick with the "+" button (your own,
// non-DRM audio — this can't touch Apple Music's downloaded tracks, see
// the project notes). Files are stored as raw bytes in IndexedDB so they
// survive a reload — a plain Object URL alone would die on refresh.

const MusicDB = {
  _db: null,

  open() {
    if (this._db) return Promise.resolve(this._db);
    return new Promise((resolve, reject) => {
      const req = indexedDB.open("dash-music", 1);
      req.onupgradeneeded = () => {
        req.result.createObjectStore("tracks", { keyPath: "id" });
      };
      req.onsuccess = () => {
        this._db = req.result;
        resolve(this._db);
      };
      req.onerror = () => reject(req.error);
    });
  },

  async addFile(file) {
    const db = await this.open();
    const track = {
      id: crypto.randomUUID(),
      name: file.name.replace(/\.[^/.]+$/, ""), // strip extension for display
      blob: file
    };
    return new Promise((resolve, reject) => {
      const tx = db.transaction("tracks", "readwrite");
      tx.objectStore("tracks").add(track);
      tx.oncomplete = () => resolve(track);
      tx.onerror = () => reject(tx.error);
    });
  },

  async getAll() {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction("tracks", "readonly");
      const req = tx.objectStore("tracks").getAll();
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }
};

const MusicWidget = {
  id: "music",
  template: "tpl-music",

  async init(el) {
    const audio = el.querySelector("#music-audio");
    const titleEl = el.querySelector("#music-title");
    const artistEl = el.querySelector("#music-artist");
    const playBtn = el.querySelector("#music-play");
    const fileInput = el.querySelector("#music-file-input");

    let tracks = await MusicDB.getAll();
    let index = 0;

    const loadTrack = (i, autoplay) => {
      if (!tracks.length) return;
      index = ((i % tracks.length) + tracks.length) % tracks.length;
      const track = tracks[index];
      audio.src = URL.createObjectURL(track.blob);
      titleEl.textContent = track.name;
      artistEl.textContent = "Local file";

      // Publish metadata so iOS shows it on the Lock Screen / Control Center
      if ("mediaSession" in navigator) {
        navigator.mediaSession.metadata = new MediaMetadata({
          title: track.name,
          artist: "Standly"
        });
      }
      if (autoplay) audio.play();
    };

    const updatePlayIcon = () => {
      playBtn.textContent = audio.paused ? "▶" : "⏸";
      if ("mediaSession" in navigator) {
        navigator.mediaSession.playbackState = audio.paused ? "paused" : "playing";
      }
    };

    el.querySelector("#music-add").addEventListener("click", () => fileInput.click());

    fileInput.addEventListener("change", async (e) => {
      for (const file of e.target.files) {
        const track = await MusicDB.addFile(file);
        tracks.push(track);
      }
      if (tracks.length === e.target.files.length) loadTrack(0, false);
      fileInput.value = "";
    });

    playBtn.addEventListener("click", () => {
      if (!tracks.length) return fileInput.click();
      audio.paused ? audio.play() : audio.pause();
    });

    el.querySelector("#music-next").addEventListener("click", () => loadTrack(index + 1, true));
    el.querySelector("#music-prev").addEventListener("click", () => loadTrack(index - 1, true));

    audio.addEventListener("play", updatePlayIcon);
    audio.addEventListener("pause", updatePlayIcon);
    audio.addEventListener("ended", () => loadTrack(index + 1, true));

    // Lock-screen / Control Center buttons call back into the same logic
    if ("mediaSession" in navigator) {
      navigator.mediaSession.setActionHandler("play", () => audio.play());
      navigator.mediaSession.setActionHandler("pause", () => audio.pause());
      navigator.mediaSession.setActionHandler("previoustrack", () => loadTrack(index - 1, true));
      navigator.mediaSession.setActionHandler("nexttrack", () => loadTrack(index + 1, true));
    }

    if (tracks.length) loadTrack(0, false);
  }
};
