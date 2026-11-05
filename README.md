# Standly

An iPhone-focused, StandBy-inspired clock and personal dashboard. Original CSS and SVG artwork, the iOS system font stack, and a quiet black canvas keep the time in focus.

## Stack and deployment

Plain HTML, CSS, and JavaScript; no framework, package manifest, or build step. Three small widgets do not need a framework, routing, or a bundler. A locally bundled jsmediatags 3.9.7 reader extracts embedded track metadata and artwork; its license is included beside the script, and it requires no remote CDN. The empty, dependency-free lockfile was removed.

Netlify publishes **`public/`**, as configured in `netlify.toml`. The original six HEIC screenshots remain in `references/` for design review and are excluded from published files by that directory boundary. Nothing needs to be compiled. Connected repository changes use Netlify's normal deploy workflow.

Run with Netlify CLI:

```sh
netlify dev --port 8889
```

Alternatively, for static-only development:

```sh
python -m http.server 4173 --directory public
```

Open the corresponding localhost URL. HTTPS or localhost is required for service workers. For manual deployment with an authenticated CLI, use `netlify deploy --dir public` for a preview or add `--prod` for production. No build command is needed.

## Features

- Four distinct faces: large blue Digital, pink Rose/Bloom, detailed Analog, and a location-aware dotted World map. Digital, Rose, and Analog use device time; World uses the network location’s IANA time zone, including daylight-saving changes.
- Swipe the clock or use the face dots to switch faces. The top-right Time & Type sheet controls five system font styles, weight, size, 12/24-hour format, seconds, leading zero, AM/PM, date style, accent, and reference cities. Font availability varies by device. Rose keeps its own gradient.
- Manual night mode from the moon button or Time & Type dims and warms the entire dashboard. Preferences retain their existing local storage keys.
- Focus list with inline entry, completion, deletion, a remaining-item badge, completion progress, clear-completed action, keyboard support, and existing local persistence. Empty lists are intentionally empty, with no invented reminders.
- User-selected audio files, play/pause, previous/next, automatic advance, and Media Session controls where supported. Tap the artwork or track details to open a larger player with seeking and a selectable queue. Embedded title, artist, album, and JPEG/PNG/WebP covers are read from supported tagged files (including MP3 and M4A); untagged files use their filenames and an original abstract cover. Reading tags does not guarantee that the browser supports the audio codec. Playback begins with a user tap; no Apple developer account is needed. Existing IndexedDB music is preserved. Playback failures are visible, object URLs are released when tracks change, and storage failures allow temporary session playback with a warning.
- Portrait stacks the clock above compact widgets; landscape pairs it with the widgets. Safe-area padding, 44px primary controls, zoom support, and reduced-motion behavior accommodate iPhone use.
- Screen Wake Lock is requested when supported and while visible; the browser can deny or release it.

## Offline and installation

Visit once online to cache the app shell, including icons. On iPhone, open the HTTPS site in Safari, choose **Share → Add to Home Screen**, then launch Standly from that icon. The service worker caches only the app shell, removes only older Standly caches, and activates updates after existing app windows close. After an update, close all Standly windows and reopen to use the new shell. No push integration is installed.

Settings and reminders retain their existing browser-local storage; music retains its existing IndexedDB store. Data is device- and origin-specific, does not sync, and can be removed by clearing website data or by browser storage eviction. Preview URLs have separate storage from production. Offline music works only for files successfully retained by the browser. No account or remote data storage was added.

## Limits

Standly cannot mirror iOS notifications, access Apple Music's protected library or observe/control playback in the separate Apple Music app, provide WidgetKit widgets, or launch automatically on a stand. World uses Netlify edge geolocation to estimate a city and time zone; VPNs and network routing can affect accuracy. The GPS button requests browser permission and pins coordinates, but uses the device’s time zone and does not reverse-geocode a city. GPS is requested only by an explicit action in the current session. Location coordinates are not persisted. Offline or unavailable network lookup falls back to the device zone and representative coordinates. Day/night shading is approximate; a coral pulsing pin marks the displayed location (stationary with reduced motion enabled). Map land data derives from public-domain Natural Earth via world-atlas. Audio codecs, background playback, Media Session, Wake Lock, and installation behavior depend on the browser and iOS. Safari controls orientation. Physical iPhone testing remains necessary for audio interruption behavior, installation, notch insets, and lock-screen controls.

## Structure

- `public/index.html`: app shell and widget templates
- `public/css/`: layout, settings, and widget styling
- `public/js/widgets/`: clock, music, and focus interactions
- `netlify/edge-functions/locate.ts`: uncached approximate visitor location, with no third-party API or server storage
- `public/js/world-data.js`: dot-map land mask and reference coordinates
- `public/js/storage.js`: existing local preferences/list storage wrapper
- `public/js/core.js`: mounting, service worker, and Wake Lock
- `public/sw.js`, `public/manifest.json`, `public/icons/`: offline and installation assets
- `references/`: original visual references, never published
- `netlify.toml`: publish directory, local server, and response headers
