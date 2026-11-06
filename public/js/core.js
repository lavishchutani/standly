// Local widget shell: no remote layout library is required to render the app.
// Music remains in the project for later, but is temporarily hidden from the dashboard.
const WIDGETS = [ClockWidget, NotesWidget];

function buildGrid() {
  const grid = document.getElementById("grid");
  grid.classList.add("standly-grid");
  WIDGETS.forEach((widget) => {
    const template = document.getElementById(widget.template);
    const card = document.createElement("section");
    card.className = "standly-card";
    card.dataset.widget = widget.id;
    card.append(template.content.firstElementChild.cloneNode(true));
    grid.append(card);
    widget.init(card.querySelector(".widget"));
  });
  return grid;
}

function registerServiceWorker() {
  if ("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js").catch((error) => console.warn("Service worker registration failed", error));
}

function keepScreenAwake() {
  if (!("wakeLock" in navigator)) return;
  const request = () => navigator.wakeLock.request("screen").catch(() => {});
  request();
  document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible") request(); });
}

function enterFullscreen() {
  const root = document.documentElement;
  if (document.fullscreenElement || !root.requestFullscreen) return;
  root.requestFullscreen().catch(() => {});
}

document.addEventListener("DOMContentLoaded", () => {
  buildGrid();
  registerServiceWorker();
  keepScreenAwake();

  // Browsers only allow fullscreen from a user gesture. Request it on the
  // first tap/click or keyboard activation anywhere in the app.
  let enteredAt = 0;
  const requestOnEntry = () => {
    enteredAt = performance.now();
    document.body.classList.add("clock-focus-mode");
    enterFullscreen();
    document.removeEventListener("pointerdown", requestOnEntry);
    document.removeEventListener("keydown", requestOnEntry);
  };
  document.addEventListener("pointerdown", requestOnEntry, { once: true });
  document.addEventListener("keydown", requestOnEntry, { once: true });

  const leaveFocusMode = () => {
    document.body.classList.remove("clock-focus-mode");
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
  };
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && document.body.classList.contains("clock-focus-mode")) leaveFocusMode();
  });
  document.addEventListener("fullscreenchange", () => {
    if (!document.fullscreenElement && document.body.classList.contains("clock-focus-mode")) leaveFocusMode();
  });
  document.querySelector("#grid").addEventListener("click", (event) => {
    if (!document.body.classList.contains("clock-focus-mode") || performance.now() - enteredAt < 500) return;
    if (event.target.closest(".clock-time, .analog-face, .world-time")) leaveFocusMode();
  });
});
