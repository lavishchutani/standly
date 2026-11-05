// Local widget shell: no remote layout library is required to render the app.
const WIDGETS = [ClockWidget, MusicWidget, NotesWidget];

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

document.addEventListener("DOMContentLoaded", () => {
  buildGrid();
  registerServiceWorker();
  keepScreenAwake();
});
