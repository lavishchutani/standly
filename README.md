# Standly — v1

A StandBy-inspired personal dashboard: clock, local music player (own files,
Media Session lock-screen controls), and a to-do list. No build step —
just HTML/CSS/JS, runs on any machine with a code editor and a browser. The
visual direction uses a low-light charcoal canvas, warm amber clock, and
subtle tactile panels designed for an iPhone home-screen install.

## What's here

```
index.html        Shell: grid container + widget HTML templates
manifest.json      PWA install config (name, icon, display mode)
sw.js              Service worker: offline caching + push notification hook
css/core.css       Design tokens, StandBy-style glass tiles, safe-area handling
css/widgets.css    Per-widget styling
js/core.js         Grid init, widget registry, edit-mode toggle, wake lock
js/storage.js      localStorage wrapper
js/widgets/        One file per widget (clock.js, music.js, notes.js)
icons/             Placeholder app icons (replace with your own anytime)
```

## Test on your computer first

From this folder, run a local server (needed because service workers
require `http://` not `file://`):

```
python3 -m http.server 8000
```

Then open `http://localhost:8000` in a browser. Try the edit button
(bottom-right ⠿) to drag/resize tiles, add a to-do, and add a song via
the music widget's `+`.

## Install it on your iPhone

iOS Safari requires **HTTPS** (not plain HTTP) to install a PWA with a
working service worker — `http://localhost` only counts as secure on the
same machine, not from your phone over Wi-Fi. Free HTTPS hosting options:

- **GitHub Pages** — push this folder to a GitHub repo, enable Pages in
  repo settings, you get a free `https://yourname.github.io/...` URL.
- **Netlify** or **Vercel** — drag-and-drop deploy, also free, also HTTPS.

Once it's live on an HTTPS URL:
1. Open that URL in Safari on your iPhone.
2. Tap the Share button → **Add to Home Screen**.
3. Open it from the home screen icon — it launches full-screen, no Safari
   address bar.

## Known limitations (by design, not bugs)

- **Music widget only plays files you add yourself** — it cannot read or
  control Apple Music's downloaded (DRM-protected) tracks. That needs a
  native app using `MPMusicPlayerController`, which is the planned next
  phase once you have Mac/Xcode access.
- **No true system notification mirroring** — the to-do/notes widget is
  local-only for now; wiring real push notifications needs a small backend
  to send pushes (out of scope for v1, the service worker is ready for it).
- **Orientation isn't lockable** — iOS doesn't support the manifest's
  `orientation` field, so the layout is just built to look right in both.

## Next steps / ideas for v2

- ID3 tag reading for real song/artist/artwork instead of filename only
- Weather widget
- Real push notifications (needs a small backend — e.g. a free
  Cloudflare Worker or Netlify Function to send the push)
- Eventually: port widget-by-widget into SwiftUI once you have Xcode
  access, starting with the clock (simplest) and music (biggest payoff,
  since native unlocks real Apple Music remote control)
