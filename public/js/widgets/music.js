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
  id: "music", template: "tpl-music",
  async init(el) {
    const audio = el.querySelector('#music-audio');
    const input = el.querySelector('#music-file-input');
    const dialog = el.querySelector('.music-sheet');
    const seek = el.querySelector('#music-seek');
    const art = el.querySelector('#music-art');
    const queue = el.querySelector('.music-queue');
    let tracks = [], index = 0, objectURL, coverURL, generation = 0, importing = false;
    const text = (selector, value) => el.querySelector(selector).textContent = value;
    const time = value => { const s = Math.max(0, Math.floor(value || 0)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };
    const message = value => { text('#music-artist', value); text('.player-artist', value); };
    const setCover = (picture) => {
      if (coverURL) URL.revokeObjectURL(coverURL);
      coverURL = null;
      if (picture && /^(image\/)?(jpeg|jpg|png|webp)$/i.test(picture.format) && picture.data?.length <= 8 * 1024 * 1024) {
        const type = picture.format.startsWith('image/') ? picture.format : `image/${picture.format}`;
        coverURL = URL.createObjectURL(new Blob([new Uint8Array(picture.data)], { type }));
      }
      el.classList.toggle('has-cover', !!coverURL);
      el.querySelectorAll('.cover-image').forEach(img => {
        img.hidden = !coverURL;
        if (coverURL) img.src = coverURL; else img.removeAttribute('src');
        img.onerror = () => { img.hidden = true; el.classList.remove('has-cover'); };
      });
    };
    const renderQueue = () => {
      queue.replaceChildren();
      tracks.forEach((track, i) => {
        const li = document.createElement('li');
        const button = document.createElement('button');
        button.type = 'button';
        button.textContent = `${String(i + 1).padStart(2, '0')}   ${track.title || track.name}`;
        if (i === index) button.setAttribute('aria-current', 'true');
        button.onclick = () => loadTrack(i, true);
        li.append(button); queue.append(li);
      });
      el.querySelectorAll('#music-prev, #music-next, [data-action=previous], [data-action=next]').forEach(b => b.disabled = !tracks.length);
    };
    const publishMetadata = track => {
      if (!('mediaSession' in navigator) || !('MediaMetadata' in window)) return;
      navigator.mediaSession.metadata = new MediaMetadata({ title: track.title || track.name, artist: track.artist || 'Local audio', album: track.album || '', artwork: coverURL ? [{ src: coverURL }] : [] });
    };
    const updateProgress = () => {
      const duration = Number.isFinite(audio.duration) ? audio.duration : 0;
      seek.disabled = duration <= 0;
      seek.max = duration || 100;
      seek.value = audio.currentTime || 0;
      text('.elapsed', time(audio.currentTime)); text('.duration', time(duration));
      seek.setAttribute('aria-valuetext', `${time(audio.currentTime)} of ${time(duration)}`);
      if (duration && navigator.mediaSession?.setPositionState) {
        try { navigator.mediaSession.setPositionState({ duration, playbackRate: audio.playbackRate, position: Math.min(audio.currentTime, duration) }); } catch {}
      }
    };
    const play = () => audio.play().catch(() => message('Unable to play. Try another audio file.'));
    const updatePlay = () => {
      const paused = audio.paused;
      el.classList.toggle('is-playing', !paused);
      const icon = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${paused ? 'M6 3v18l15-9Z' : 'M5 4h5v16H5zM14 4h5v16h-5z'}"/></svg>`;
      el.querySelectorAll('#music-play, [data-action=play]').forEach(b => { b.innerHTML = icon; b.setAttribute('aria-label', !tracks.length ? 'Add songs to play' : paused ? 'Play' : 'Pause'); });
      if ('mediaSession' in navigator) navigator.mediaSession.playbackState = paused ? 'paused' : 'playing';
    };
    const loadTrack = (i, autoplay = false) => {
      if (!tracks.length) return;
      const request = ++generation;
      audio.pause();
      index = (i + tracks.length) % tracks.length;
      const track = tracks[index];
      if (objectURL) URL.revokeObjectURL(objectURL);
      objectURL = URL.createObjectURL(track.blob);
      audio.src = objectURL;
      setCover(null);
      const showDetails = () => {
        text('#music-title', track.title || track.name); text('.player-title', track.title || track.name);
        message(audio.error ? 'Unsupported audio. Choose another file.' : track.artist || 'Local audio'); text('.player-album', track.album || '');
        renderQueue(); publishMetadata(track);
      };
      showDetails(); updateProgress(); updatePlay();
      // Read tags from the existing file; metadata and artwork need no separate store.
      if (window.jsmediatags) {
        try { window.jsmediatags.read(track.blob, { onSuccess: ({ tags }) => {
          if (request !== generation) return;
          for (const key of ['title', 'artist', 'album']) if (typeof tags[key] === 'string') track[key] = tags[key].slice(0, 500);
          setCover(tags.picture); showDetails();
        }, onError: () => {} }); } catch { /* Untagged files keep their filenames and original artwork. */ }
      }
      if (autoplay) play();
    };
    const toggle = () => { if (!tracks.length) input.click(); else audio.paused ? play() : audio.pause(); };
    const previous = () => { if (audio.currentTime > 3) audio.currentTime = 0; else loadTrack(index - 1, true); };
    const next = () => loadTrack(index + 1, true);
    const ready = MusicDB.getAll().then(saved => { tracks = saved; if (tracks.length) loadTrack(0); renderQueue(); updatePlay(); }).catch(() => { message('Storage unavailable · files play this session'); });
    el.querySelector('#music-add').onclick = () => input.click();
    el.querySelector('#music-play').onclick = toggle;
    el.querySelector('#music-prev').onclick = previous;
    el.querySelector('#music-next').onclick = next;
    art.onclick = () => dialog.showModal();
    el.querySelector('.music-meta').onclick = () => dialog.showModal();
    dialog.addEventListener('click', e => { if (e.target === dialog) dialog.close(); });
    const actions = { play: toggle, previous, next, add: () => input.click() };
    dialog.querySelectorAll('[data-action]').forEach(b => b.onclick = actions[b.dataset.action]);
    // Reuse the familiar transport symbols in both player sizes.
    dialog.querySelector('[data-action=previous]').innerHTML = el.querySelector('#music-prev').innerHTML;
    dialog.querySelector('[data-action=next]').innerHTML = el.querySelector('#music-next').innerHTML;
    input.addEventListener('change', async () => {
      if (importing) return;
      const files = [...input.files];
      if (!files.length) return;
      importing = true;
      await ready;
      const wasEmpty = !tracks.length;
      message('Adding songs…');
      try {
        for (const file of files) {
          let track;
          try { track = await MusicDB.addFile(file); }
          catch { track = { id: crypto.randomUUID(), name: file.name.replace(/\.[^/.]+$/, ''), blob: file }; text('#music-artist', 'Files available this session'); document.getElementById('app-status').textContent = 'Storage unavailable · new music lasts this session'; }
          tracks.push(track);
        }
        if (wasEmpty) loadTrack(0); else message(tracks[index].artist || 'Local audio');
        renderQueue(); updatePlay();
      } finally { importing = false; input.value = ''; }
    });
    seek.oninput = () => { if (Number.isFinite(audio.duration)) { audio.currentTime = Number(seek.value); updateProgress(); } };
    ['timeupdate', 'loadedmetadata', 'durationchange', 'emptied'].forEach(event => audio.addEventListener(event, updateProgress));
    ['play', 'pause', 'ended'].forEach(event => audio.addEventListener(event, updatePlay));
    audio.addEventListener('ended', next);
    audio.addEventListener('error', () => { message('Unsupported audio. Choose another file.'); seek.disabled = true; });
    if ('mediaSession' in navigator) {
      const handlers = { play: () => tracks.length && play(), pause: () => audio.pause(), previoustrack: previous, nexttrack: next, seekto: detail => { if (Number.isFinite(audio.duration)) audio.currentTime = Math.min(audio.duration, Math.max(0, detail.seekTime)); } };
      for (const [name, handler] of Object.entries(handlers)) { try { navigator.mediaSession.setActionHandler(name, handler); } catch {} }
    }
    renderQueue(); updatePlay();
  }
};
