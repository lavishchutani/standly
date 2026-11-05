# Standly

Standly is an iPhone-focused, StandBy-inspired dashboard built as a Progressive Web App (PWA). It brings a large clock face and a small set of personal widgets into a calm, glanceable screen. The app is designed for portrait use and a two-column StandBy layout in landscape.

## What is implemented

- **Four clock faces:** oversized blue digital, rose digital with a soft atmospheric background, an animated analog dial, and a dotted world-map face.
- **Clock controls:** swipe horizontally across the clock to change faces, or open the clock options to select a face and color. Choices are saved locally.
- **Night mode:** an optional red-tinted display for low light, with its setting saved on the device.
- **Focus list:** add, complete, and remove local reminders.
- **Music player:** add personal audio files, play and skip tracks, and expose playback controls through the browser's Media Session API where supported. Audio files are stored in IndexedDB.
- **Offline app shell:** a service worker caches the HTML, CSS, and JavaScript needed to reopen the dashboard without a network connection.
- **Responsive layout:** landscape places the clock beside music and reminders; portrait places the clock above the widgets. Safe-area insets support iPhone displays.

## How it is built

Standly uses plain HTML, CSS, and JavaScript with no build step or runtime framework. The layout and clock artwork are drawn with CSS and inline SVG, so the dashboard does not need a remote component library or downloaded font to render. The system font stack lets iOS use its own interface font.

Widget code is kept in small modules under `js/widgets/`. `js/core.js` mounts those widgets into the responsive layout, `js/storage.js` wraps local storage, and `css/` contains the shared layout and widget styles. The clock's analog hands and digital time update from the device's local time. The world face currently uses a decorative dotted map and a Mumbai label; it is not a live world clock or geographic map.

The `references/` folder contains iPhone screenshots used to guide the visual direction. They are design references and are not loaded by the app.

## Run locally

From this folder, start a static server:

```powershell
python -m http.server 4173
```

Open [http://localhost:4173](http://localhost:4173) on the same computer. The service worker requires HTTP or HTTPS; opening `index.html` directly as a `file://` URL will not enable offline caching.

## Install on iPhone

To add Standly to an iPhone Home Screen, host the folder at an HTTPS URL, open it in Safari, tap **Share**, then choose **Add to Home Screen**. Localhost on the computer is not reachable from the phone; a network-hosted HTTPS deployment is needed for installation and service-worker support.

## Current limits

- As a web app, Standly cannot mirror system notifications, provide WidgetKit widgets, or launch itself automatically when the phone is placed on a stand.
- The music player plays files selected by the user. It cannot control Apple Music's protected library or other apps' system audio.
- The World face is currently illustrative; it does not fetch live city times or map data.
- The layout adapts to orientation, but iOS controls orientation and does not expose a reliable web-app orientation lock.

## Project structure

```text
index.html             App shell, clock settings, and widget templates
manifest.json          PWA name, icons, and display settings
sw.js                  Offline app-shell cache
css/core.css           Page layout, safe areas, modal, and shared styling
css/widgets.css        Clock, music, and focus-list appearance
js/core.js             Widget mounting and app startup
js/storage.js          Local-storage helper
js/widgets/clock.js    Clock faces, settings, and saved preferences
js/widgets/music.js    Local audio player and Media Session controls
js/widgets/notes.js    Focus-list interactions
icons/                 PWA icons
references/            User-provided visual references
```
