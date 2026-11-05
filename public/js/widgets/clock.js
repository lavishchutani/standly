// Clock faces (Digital, Bloom, Analog, World) plus the time-format settings sheet.
const CLOCK_DEFAULT_FORMAT = {
  font: "classic", weight: "heavy", size: "m",
  hour: "24", seconds: false, leadingZero: true, ampm: true,
  date: "long", cities: true, precise: false
};
const CLOCK_FONTS = ["classic", "rounded", "serif", "mono", "condensed"];
const CLOCK_WIDTH = { classic: .56, rounded: .58, serif: .54, mono: .62, condensed: .64 };

const ClockFormat = {
  // Hour/minute/second/day-period for a date, optionally in another IANA zone.
  parts(date, fmt, timeZone) {
    const opts = { hour: "numeric", minute: "2-digit", second: "2-digit", hourCycle: fmt.hour === "12" ? "h12" : "h23" };
    let parts;
    try { parts = new Intl.DateTimeFormat("en-US", timeZone ? { ...opts, timeZone } : opts).formatToParts(date); }
    catch (e) { parts = new Intl.DateTimeFormat("en-US", opts).formatToParts(date); }
    const get = (type) => (parts.find((p) => p.type === type) || {}).value || "";
    let h = get("hour");
    if (fmt.hour !== "12" && h === "24") h = "00";
    h = fmt.leadingZero ? h.padStart(2, "0") : String(Number(h));
    return { h, m: get("minute").padStart(2, "0"), s: get("second").padStart(2, "0"), period: get("dayPeriod").toUpperCase() };
  },

  // Writes the time markup and the width hint used to scale the digits to fit.
  paint(node, date, fmt, { timeZone, seconds = fmt.seconds } = {}) {
    const p = this.parts(date, fmt, timeZone);
    const showPeriod = fmt.hour === "12" && fmt.ampm;
    let html = `<span class="t-hm">${p.h}:${p.m}</span>`;
    if (seconds) html += `<span class="t-sec">:${p.s}</span>`;
    if (showPeriod) html += `<span class="t-ampm">${p.period}</span>`;
    if (node.innerHTML !== html) node.innerHTML = html;
    const chars = p.h.length + 3 + (seconds ? 3 : 0) + (showPeriod ? 1.3 : 0);
    node.style.setProperty("--chars", chars);
    node.style.setProperty("--wf", CLOCK_WIDTH[fmt.font] || .56);
    return `${p.h}:${p.m}${seconds ? ":" + p.s : ""}${showPeriod ? " " + p.period : ""}`;
  },

  date(date, fmt, timeZone) {
    const tz = timeZone ? { timeZone } : {};
    const safe = (opts) => { try { return date.toLocaleDateString([], { ...opts, ...tz }); } catch (e) { return date.toLocaleDateString([], opts); } };
    if (fmt.date === "off") return "";
    if (fmt.date === "short") return safe({ weekday: "short", month: "short", day: "numeric" });
    if (fmt.date === "numeric") return safe({ day: "2-digit", month: "2-digit", year: "numeric" });
    return safe({ month: "long", day: "numeric" });
  },

  weekday(date, timeZone) {
    try { return date.toLocaleDateString([], { weekday: "long", ...(timeZone ? { timeZone } : {}) }).toUpperCase(); }
    catch (e) { return date.toLocaleDateString([], { weekday: "long" }).toUpperCase(); }
  },

  // Applies the typography attributes that drive CSS variables.
  style(node, fmt) {
    node.dataset.font = fmt.font;
    node.dataset.weight = fmt.weight;
    node.dataset.size = fmt.size;
  }
};

const ClockWidget = {
  id: "clock",
  template: "tpl-clock",

  init(el) {
    const app = document.getElementById("app");
    const timeEl = el.querySelector(".clock-time");
    const dateEl = el.querySelector(".clock-date");
    const weekdayEl = el.querySelector(".clock-weekday");
    const dialog = document.getElementById("clock-sheet");
    const previewTime = dialog.querySelector(".preview-time");
    const previewDate = dialog.querySelector(".preview-date");
    const faceNames = ["blue", "rose", "analog", "world"];
    const saved = Storage.get("clockAppearance", null) || { style: "blue", color: "blue" };
    const appearance = { style: faceNames.includes(saved.style) ? saved.style : "blue", color: saved.color || "blue" };
    const fmt = { ...CLOCK_DEFAULT_FORMAT, ...(Storage.get("clockFormat", null) || {}) };
    if (!CLOCK_FONTS.includes(fmt.font)) fmt.font = "classic";
    const world = WorldFace.init(el, fmt);

    const applyAppearance = () => {
      app.classList.remove(...faceNames.map((f) => `face-${f}`));
      app.classList.add(`face-${appearance.style}`);
      el.dataset.style = appearance.style;
      el.dataset.color = appearance.color;
      dialog.dataset.color = appearance.color;
      el.querySelectorAll("[data-face]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.face === appearance.style)));
      dialog.querySelectorAll("[data-color]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.color === appearance.color)));
    };

    const syncControls = () => {
      ClockFormat.style(el, fmt);
      ClockFormat.style(previewTime, fmt);
      dialog.querySelectorAll("[data-opt]").forEach((group) => {
        const key = group.dataset.opt;
        if (group.classList.contains("row-toggle")) group.setAttribute("aria-pressed", String(!!fmt[key]));
        else group.querySelectorAll("[data-val]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.val === String(fmt[key]))));
      });
      dialog.querySelector('[data-opt="ampm"]').disabled = fmt.hour !== "12";
    };

    const render = () => {
      const now = new Date();
      const label = ClockFormat.paint(timeEl, now, fmt);
      ClockFormat.paint(previewTime, now, fmt);
      const date = ClockFormat.date(now, fmt);
      weekdayEl.textContent = fmt.date === "long" ? ClockFormat.weekday(now) : "";
      dateEl.textContent = date;
      previewDate.textContent = [fmt.date === "long" ? ClockFormat.weekday(now).toLowerCase().replace(/^./, (c) => c.toUpperCase()) : "", date].filter(Boolean).join(", ");
      el.classList.toggle("no-date", fmt.date === "off");
      el.setAttribute("aria-label", `Clock, ${label}`);
      const minute = now.getMinutes() + now.getSeconds() / 60;
      const hour = (now.getHours() % 12) + minute / 60;
      el.querySelector(".hour-hand").setAttribute("transform", `rotate(${hour * 30} 200 200)`);
      el.querySelector(".minute-hand").setAttribute("transform", `rotate(${minute * 6} 200 200)`);
      el.querySelector(".second-hand").setAttribute("transform", `rotate(${now.getSeconds() * 6} 200 200)`);
      el.querySelector(".second-hand").style.display = fmt.seconds ? "" : "none";
      world.render(now);
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

    const setNightMode = (enabled) => {
      app.classList.toggle("night-mode", enabled);
      dialog.querySelector("#night-mode-toggle").setAttribute("aria-pressed", String(enabled));
      document.getElementById("quick-night").setAttribute("aria-pressed", String(enabled));
      Storage.set("nightMode", enabled);
    };

    const saveFormat = () => { Storage.set("clockFormat", fmt); syncControls(); render(); };
    const selectFace = (style) => {
      appearance.style = style;
      applyAppearance();
      Storage.set("clockAppearance", appearance);
      render();
    };

    applyAppearance();
    syncControls();
    setNightMode(Storage.get("nightMode", false));
    render();
    setInterval(render, 1000);

    document.querySelector(".clock-options").addEventListener("click", () => dialog.showModal());
    el.querySelectorAll("[data-face]").forEach((b) => b.addEventListener("click", () => selectFace(b.dataset.face)));
    dialog.querySelectorAll("[data-color]").forEach((b) => b.addEventListener("click", () => {
      appearance.color = b.dataset.color;
      applyAppearance();
      Storage.set("clockAppearance", appearance);
    }));
    dialog.querySelectorAll("[data-opt]").forEach((group) => {
      const key = group.dataset.opt;
      if (group.classList.contains("row-toggle")) {
        group.addEventListener("click", () => {
          fmt[key] = !fmt[key];
          saveFormat();
          if (key === "precise") world.setPrecise(fmt.precise);
        });
      } else {
        group.querySelectorAll("[data-val]").forEach((b) => b.addEventListener("click", () => { fmt[key] = b.dataset.val; saveFormat(); }));
      }
    });
    world.onPreciseChange = (enabled) => { fmt.precise = enabled; saveFormat(); };
    document.getElementById("quick-night").addEventListener("click", (e) => setNightMode(e.currentTarget.getAttribute("aria-pressed") !== "true"));
    dialog.querySelector("#night-mode-toggle").addEventListener("click", (e) => setNightMode(e.currentTarget.getAttribute("aria-pressed") !== "true"));
    dialog.addEventListener("click", (e) => { if (e.target === dialog) dialog.close(); });

    let startX = null;
    el.addEventListener("pointercancel", () => { startX = null; });
    el.addEventListener("pointerdown", (e) => { if (!e.target.closest("button")) startX = e.clientX; });
    el.addEventListener("pointerup", (e) => {
      if (startX === null || dialog.open) return;
      const delta = e.clientX - startX;
      startX = null;
      if (Math.abs(delta) < 55) return;
      const current = faceNames.indexOf(el.dataset.style);
      selectFace(faceNames[(current + (delta < 0 ? 1 : faceNames.length - 1)) % faceNames.length]);
    });
  }
};

// World face: dot-matrix map that pins your location
// and shades the night side of the planet.
const WorldFace = {
  init(el, fmt) {
    const svgNS = "http://www.w3.org/2000/svg";
    const map = el.querySelector(".world-map");
    const dotsGroup = map.querySelector(".map-dots");
    const marker = map.querySelector(".map-marker");
    const cityEl = el.querySelector(".world-city");
    const regionEl = el.querySelector(".world-region");
    const sourceEl = el.querySelector(".world-source");
    const timeEl = el.querySelector(".world-time");
    const metaEl = el.querySelector(".world-meta");
    const citiesEl = el.querySelector(".world-cities");
    const locateBtn = el.querySelector(".world-locate");
    const { step, cols, top, rows } = WORLD_MAP;
    const CELL = 10;
    const deviceZone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";

    // Build the land dots once.
    const dots = [];
    rows.forEach((hex, r) => {
      const bits = hex.split("").map((h) => parseInt(h, 16).toString(2).padStart(4, "0")).join("");
      for (let c = 0; c < cols; c++) {
        if (bits[c] !== "1") continue;
        const dot = document.createElementNS(svgNS, "circle");
        dot.setAttribute("cx", c * CELL + CELL / 2);
        dot.setAttribute("cy", r * CELL + CELL / 2);
        dot.setAttribute("r", "3.3");
        dotsGroup.appendChild(dot);
        dots.push({ el: dot, lat: top - step * (r + .5), lon: -180 + step * (c + .5), cls: "" });
      }
    });

    const zoneName = (tz) => (tz.split("/").pop() || tz).replace(/_/g, " ");
    const offsetMinutes = (tz, date) => {
      try {
        const name = new Intl.DateTimeFormat("en-US", { timeZone: tz, timeZoneName: "shortOffset" }).formatToParts(date).find((p) => p.type === "timeZoneName").value;
        const m = name.match(/GMT([+-])(\d{1,2})(?::(\d{2}))?/);
        return m ? (m[1] === "-" ? -1 : 1) * (Number(m[2]) * 60 + Number(m[3] || 0)) : 0;
      } catch (e) { return tz === deviceZone ? -date.getTimezoneOffset() : 0; }
    };
    const formatOffset = (mins) => {
      const sign = mins < 0 ? "−" : "+";
      const a = Math.abs(mins);
      return `UTC${sign}${Math.floor(a / 60)}${a % 60 ? ":" + String(a % 60).padStart(2, "0") : ""}`;
    };
    const zoneFallback = () => {
      const coords = ZONE_COORDS[deviceZone];
      const off = offsetMinutes(deviceZone, new Date());
      return { city: zoneName(deviceZone), region: null, country: null, lat: coords ? coords[0] : 20, lon: coords ? coords[1] : off / 4, tz: deviceZone, source: "zone" };
    };

    let loc = zoneFallback();
    let networkLocation = null;
    let preciseRequest = 0;
    let lastShade = "";
    const api = { onPreciseChange: null };

    const subsolar = (date) => {
      const start = Date.UTC(date.getUTCFullYear(), 0, 0);
      const day = (date - start) / 864e5;
      const decl = -23.44 * Math.cos((2 * Math.PI / 365) * (day + 10));
      const hours = date.getUTCHours() + date.getUTCMinutes() / 60;
      return { lat: decl, lon: (12 - hours) * 15 };
    };
    const rad = (d) => d * Math.PI / 180;
    const isDay = (lat, lon, sun) => Math.sin(rad(lat)) * Math.sin(rad(sun.lat)) + Math.cos(rad(lat)) * Math.cos(rad(sun.lat)) * Math.cos(rad(lon - sun.lon)) > -0.02;

    const shade = (date) => {
      const sun = subsolar(date);
      const key = `${loc.lat},${loc.lon},${loc.tz},${Math.round(sun.lon * 2)}`;
      if (key === lastShade) return;
      lastShade = key;
      const wrap = (d) => ((d + 540) % 360) - 180;
      dots.forEach((d) => {
        const near = Math.hypot(d.lat - loc.lat, wrap(d.lon - loc.lon) * Math.cos(rad(loc.lat))) < 3.4;
        const cls = [near ? "here" : "", isDay(d.lat, d.lon, sun) ? "" : "night"].filter(Boolean).join(" ");
        if (cls !== d.cls) { d.el.setAttribute("class", cls); d.cls = cls; }
      });
      const x = (wrap(loc.lon) + 180) / step * CELL;
      const y = Math.min(Math.max((top - loc.lat) / step * CELL, 0), rows.length * CELL);
      marker.setAttribute("transform", `translate(${x.toFixed(1)} ${y.toFixed(1)})`);

      el.classList.toggle("loc-night", !isDay(loc.lat, loc.lon, sun));
    };

    const paintPlace = () => {
      cityEl.textContent = loc.city || zoneName(loc.tz);
      regionEl.textContent = [loc.region, loc.country].filter(Boolean).join(", ") || zoneName(loc.tz.split("/")[0] || "");
      const source = { gps: "Precise location", network: "Approximate location", zone: "Device time zone" }[loc.source] || "Current location";
      sourceEl.textContent = source;
      locateBtn.setAttribute("aria-pressed", String(loc.source === "gps"));
      map.setAttribute("aria-label", `World map: ${cityEl.textContent}. The coral pin marks the displayed location.`);
      lastShade = "";
    };

    const setLocation = (next) => {
      loc = { ...loc, ...next };

      paintPlace();
      api.render(new Date());
    };

    const fetchNetwork = async () => {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 5000);
      try {
        const res = await fetch("/api/locate", { cache: "no-store", signal: ctrl.signal });
        clearTimeout(timer);
        if (!res.ok || !(res.headers.get("content-type") || "").includes("json")) return;
        const g = await res.json();
        if (!Number.isFinite(g.latitude) || !Number.isFinite(g.longitude) || Math.abs(g.latitude) > 90 || Math.abs(g.longitude) > 180) return;
        try { new Intl.DateTimeFormat("en", { timeZone: g.timezone }); } catch { return; }
        const next = { city: g.city, region: g.region, country: g.country, tz: g.timezone || deviceZone };
        networkLocation = { ...next, lat: g.latitude, lon: g.longitude, source: "network" };
        if (loc.source !== "gps") setLocation(networkLocation);
      } catch (e) { /* Offline: keep the device-zone fallback. */ }
      finally { clearTimeout(timer); }
    };

    const requestPrecise = () => new Promise((resolve) => {
      const request = ++preciseRequest;
      if (!("geolocation" in navigator)) {
        sourceEl.textContent = "Location unavailable";
        return resolve(false);
      }
      sourceEl.textContent = "Locating…";
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          if (request !== preciseRequest) return resolve(null);
          // GPS supplies coordinates, not a city or IANA time zone. Avoid pairing
          // a precise pin with a potentially unrelated network city (e.g. a VPN).
          setLocation({ lat: pos.coords.latitude, lon: pos.coords.longitude,
            city: "Your position", region: `${pos.coords.latitude.toFixed(2)}°, ${pos.coords.longitude.toFixed(2)}°`,
            country: null, tz: deviceZone, source: "gps" });
          resolve(true);
        },
        (error) => {
          if (request !== preciseRequest) return resolve(null);
          setLocation(networkLocation || zoneFallback());
          sourceEl.textContent = error.code === 1 ? "Location permission denied" : "Location unavailable";
          resolve(false);
        },
        { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 }
      );
    });

    api.setPrecise = async (enabled) => {
      if (!enabled) {
        preciseRequest++;
        if (api.onPreciseChange) api.onPreciseChange(false);
        setLocation(networkLocation || zoneFallback());
        fetchNetwork();
        return;
      }
      const ok = await requestPrecise();
      if (ok !== null && api.onPreciseChange) api.onPreciseChange(ok);
    };

    locateBtn.addEventListener("click", () => api.setPrecise(loc.source !== "gps"));

    let citiesKey = "";
    api.render = (now) => {
      if (el.dataset.style !== "world") return;
      ClockFormat.style(timeEl, fmt);
      const label = ClockFormat.paint(timeEl, now, fmt, { timeZone: loc.tz });
      el.setAttribute("aria-label", `${loc.city || zoneName(loc.tz)}, ${label}`);
      shade(now);
      const offset = offsetMinutes(loc.tz, now);
      metaEl.textContent = [ClockFormat.date(now, fmt, loc.tz), loc.source === "gps" ? `${formatOffset(offset)} · Device time zone` : formatOffset(offset), el.classList.contains("loc-night") ? "Night" : "Daylight"].filter(Boolean).join(" · ");
      el.classList.toggle("no-cities", !fmt.cities);
      if (!fmt.cities) return;
      const picks = [];
      const seen = new Set([offset]);
      for (const c of REFERENCE_CITIES) {
        const o = offsetMinutes(c.tz, now);
        if (seen.has(o)) continue;
        seen.add(o); picks.push({ ...c, o });
        if (picks.length === 3) break;
      }
      const shortFmt = { ...fmt, seconds: false, ampm: false };
      const html = picks.map((c) => {
        const p = ClockFormat.parts(now, shortFmt, c.tz);
        const diff = (c.o - offset) / 60;
        const diffLabel = `${diff > 0 ? "+" : "−"}${Math.abs(diff)}h`;
        return `<li><span class="wc-code">${c.code}</span><span class="wc-time">${p.h}:${p.m}${fmt.hour === "12" ? `<small>${p.period}</small>` : ""}</span><span class="wc-diff">${diffLabel}</span></li>`;
      }).join("");
      if (html !== citiesKey) { citiesEl.innerHTML = html; citiesKey = html; }
    };

    paintPlace();
    fetchNetwork();
    // Request GPS only after an explicit action in this session.
    fmt.precise = false;
    return api;
  }
};
