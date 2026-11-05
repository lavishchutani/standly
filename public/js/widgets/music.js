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
      addedAt: Date.now(),
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
      req.onsuccess = () => resolve(req.result.sort((a, b) => (a.addedAt || 0) - (b.addedAt || 0) || a.name.localeCompare(b.name)));
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

    let tracks = [];
    try { tracks = await MusicDB.getAll(); } catch { artistEl.textContent = "Storage unavailable · files play this session"; }
    let objectURL;
    const play = () => audio.play().catch(() => { artistEl.textContent = "Unable to play. Try another audio file."; artistEl.classList.add("music-error"); });
    let index = 0;

    const loadTrack = (i, autoplay) => {
      if (!tracks.length) return;
      index = ((i % tracks.length) + tracks.length) % tracks.length;
      const track = tracks[index];
      if (objectURL) URL.revokeObjectURL(objectURL);
      objectURL = URL.createObjectURL(track.blob);
      audio.src = objectURL;
      artistEl.classList.remove("music-error");
      titleEl.textContent = track.name;
      artistEl.textContent = "Local file";

      // Publish metadata so iOS shows it on the Lock Screen / Control Center
      if ("mediaSession" in navigator) {
        navigator.mediaSession.metadata = new MediaMetadata({
          title: track.name,
          artist: "Standly"
        });
      }
      if (autoplay) play();
    };

    const updatePlayIcon = () => {
      playBtn.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${audio.paused ? "M6 3v18l15-9Z" : "M5 4h5v16H5zM14 4h5v16h-5z"}"/></svg>`;
      playBtn.setAttribute("aria-label", audio.paused ? "Play" : "Pause");
      if ("mediaSession" in navigator) {
        navigator.mediaSession.playbackState = audio.paused ? "paused" : "playing";
      }
    };

    el.querySelector("#music-add").addEventListener("click", () => fileInput.click());

    fileInput.addEventListener("change", async (e) => {
      for (const file of e.target.files) {
        let track;
        try { track = await MusicDB.addFile(file); } catch {
          track = { id: crypto.randomUUID(), name: file.name, blob: file };
          document.getElementById("app-status").textContent = "Storage full or unavailable · new music lasts this session";
        }
        tracks.push(track);
      }
      if (tracks.length === e.target.files.length) loadTrack(0, false);
      fileInput.value = "";
    });

    playBtn.addEventListener("click", () => {
      if (!tracks.length) return fileInput.click();
      audio.paused ? play() : audio.pause();
    });

    el.querySelector("#music-next").addEventListener("click", () => loadTrack(index + 1, true));
    el.querySelector("#music-prev").addEventListener("click", () => loadTrack(index - 1, true));

    audio.addEventListener("play", updatePlayIcon);
    audio.addEventListener("pause", updatePlayIcon);
    audio.addEventListener("error", () => { artistEl.textContent = "Unsupported audio. Try another file."; artistEl.classList.add("music-error"); });
    audio.addEventListener("ended", () => loadTrack(index + 1, true));

    // Lock-screen / Control Center buttons call back into the same logic
    if ("mediaSession" in navigator) {
      try { navigator.mediaSession.setActionHandler("play", () => play()); } catch {}
      try { navigator.mediaSession.setActionHandler("pause", () => audio.pause()); } catch {}
      try { navigator.mediaSession.setActionHandler("previoustrack", () => loadTrack(index - 1, true)); } catch {}
      try { navigator.mediaSession.setActionHandler("nexttrack", () => loadTrack(index + 1, true)); } catch {}
    }

    if (tracks.length) loadTrack(0, false);
  }
};
