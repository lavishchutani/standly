// Screenshot-led clock faces: oversized iOS-style digital, analog and world.
const ClockWidget = {
  id: "clock",
  template: "tpl-clock",

  init(el) {
    const timeEl = el.querySelector(".clock-time");
    const dateEl = el.querySelector(".clock-date");
    const weekdayEl = el.querySelector(".clock-weekday");
    const dialog = document.getElementById("clock-sheet");
    const faceNames = ["blue", "rose", "analog", "world"];
    const saved = Storage.get("clockAppearance", { style: "blue", color: "blue" });

    const apply = ({ style, color }) => {
      const face = faceNames.includes(style) ? style : "blue";
      document.getElementById("app").classList.remove("face-blue", "face-rose", "face-analog", "face-world");
      document.getElementById("app").classList.add(`face-${face}`);
      el.dataset.style = face;
      el.dataset.color = color || "blue";
      dialog.querySelectorAll("[data-style]").forEach((button) => button.setAttribute("aria-pressed", String(button.dataset.style === face)));
      el.querySelectorAll("[data-face]").forEach((button) => button.setAttribute("aria-pressed", String(button.dataset.face === face)));
      dialog.querySelectorAll("[data-color]").forEach((button) => button.setAttribute("aria-pressed", String(button.dataset.color === color)));
    };

    const render = () => {
      const now = new Date();
      timeEl.textContent = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
      weekdayEl.textContent = now.toLocaleDateString([], { weekday: "long" }).toUpperCase();
      dateEl.textContent = now.toLocaleDateString([], { month: "long", day: "numeric" });
      const minute = now.getMinutes() + now.getSeconds() / 60;
      const hour = (now.getHours() % 12) + minute / 60;
      el.querySelector(".hour-hand").setAttribute("transform", `rotate(${hour * 30} 200 200)`);
      el.querySelector(".minute-hand").setAttribute("transform", `rotate(${minute * 6} 200 200)`);
      el.querySelector(".second-hand").setAttribute("transform", `rotate(${now.getSeconds() * 6} 200 200)`);
    };

    const ticks = el.querySelector(".dial-ticks");
    for (let i = 0; i < 60; i++) {
      const major = i % 5 === 0;
      const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
      line.setAttribute("x1", "200"); line.setAttribute("x2", "200");
      line.setAttribute("y1", major ? "25" : "30"); line.setAttribute("y2", major ? "45" : "37");
      line.setAttribute("transform", `rotate(${i * 6} 200 200)`);
      line.setAttribute("class", major ? "tick major" : "tick");
      ticks.appendChild(line);
    }

    apply(faceNames.includes(saved.style) ? saved : { style: "blue", color: "blue" });
    const setNightMode = (enabled) => {
      document.getElementById("app").classList.toggle("night-mode", enabled);
      dialog.querySelector("#night-mode-toggle").setAttribute("aria-pressed", String(enabled));
      Storage.set("nightMode", enabled);
    };
    setNightMode(Storage.get("nightMode", false));
    render();
    setInterval(render, 1000);

    const selectFace = (style) => {
      const appearance = { style, color: el.dataset.color };
      apply(appearance);
      Storage.set("clockAppearance", appearance);
    };
    el.querySelector(".clock-options").addEventListener("click", () => dialog.showModal());
    el.querySelectorAll("[data-face]").forEach((button) => button.addEventListener("click", () => selectFace(button.dataset.face)));
    dialog.querySelectorAll("[data-style]").forEach((button) => button.addEventListener("click", () => selectFace(button.dataset.style)));
    dialog.querySelectorAll("[data-color]").forEach((button) => button.addEventListener("click", () => {
      const appearance = { style: el.dataset.style, color: button.dataset.color };
      apply(appearance); Storage.set("clockAppearance", appearance);
    }));
    dialog.querySelector("#night-mode-toggle").addEventListener("click", (event) => {
      setNightMode(event.currentTarget.getAttribute("aria-pressed") !== "true");
    });
    dialog.addEventListener("click", (event) => { if (event.target === dialog) dialog.close(); });

    let startX = null;
    el.addEventListener("pointerdown", (event) => { if (!event.target.closest("button")) startX = event.clientX; });
    el.addEventListener("pointerup", (event) => {
      if (startX === null || dialog.open) return;
      const delta = event.clientX - startX;
      startX = null;
      if (Math.abs(delta) < 55) return;
      const current = faceNames.indexOf(el.dataset.style);
      selectFace(faceNames[(current + (delta < 0 ? 1 : faceNames.length - 1)) % faceNames.length]);
    });
  }
};
