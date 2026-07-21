/* L & K · watercolor orientation map
   ─────────────────────────────────────────────────────────────
   A scroll-driven "camera" that pans + zooms across the hand-
   painted aerial of Mammoth (assets/paintings/mammoth-map.jpg),
   flying between the pins already painted on it. Same guided-tour
   idea as a 3D fly-through, but on-brand, tokenless, and light
   enough for mountain wifi — it's just a transformed image.

   Pin positions are normalized [0..1] fractions of the painting
   (x from left, y from top), aimed at each teardrop's tip.
   ───────────────────────────────────────────────────────────── */

/* Photos are freely-licensed Wikimedia Commons images (assets/map/);
   links go to each place's official page. Basecamp is a private home,
   so it carries neither. */
const STOPS = [
  {
    id: "overview",
    kicker: "The whole basin",
    title: "Mammoth Lakes",
    addr: "A high-alpine resort town at 7,880 ft, cradled in a bowl of 11,000-foot Sierra peaks. Everything for the week sits within a few minutes of here.",
    photo: "assets/map/overview.jpg",
    link: { label: "Visit Mammoth", url: "https://www.visitmammoth.com/" },
    x: 0.50, y: 0.46, zoom: 1.0
  },
  {
    id: "snowhouse",
    kicker: "Basecamp",
    title: "Snow House",
    addr: "Home base for the week — 2018 Lodestar Dr & 91 Pinehurst Dr, both a short hop from the village.",
    photo: null, link: null,
    x: 0.423, y: 0.605, zoom: 2.5
  },
  {
    id: "village",
    kicker: "Coffee · shops · the hub",
    title: "The Village at Mammoth",
    addr: "A pedestrian plaza at the base of the Village Gondola — coffee, shops, restaurants, and après. The easy place to meet up.",
    photo: "assets/map/village.jpg",
    link: { label: "villageatmammoth.com", url: "https://villageatmammoth.com/" },
    x: 0.560, y: 0.605, zoom: 2.6
  },
  {
    id: "brewery",
    kicker: "Wednesday night, all together",
    title: "Mammoth Brewing Co.",
    addr: "One of the West Coast's highest breweries at 8,000 ft — tasting room, beer garden, and the EATery. Where everyone gathers the night before the wedding.",
    photo: null,
    link: { label: "mammothbrewingco.com", url: "https://mammothbrewingco.com/" },
    x: 0.655, y: 0.610, zoom: 2.7
  },
  {
    id: "lodge",
    kicker: "Up the mountain",
    title: "Main Lodge · Panorama Gondola",
    addr: "Ride the gondola about 7 minutes to 11,053 ft for 360° Sierra views — or stay low at the Adventure Center at the base.",
    photo: "assets/map/lodge.jpg",
    link: { label: "Scenic gondola rides", url: "https://www.mammothmountain.com/things-to-do/activities/scenic-gondola" },
    x: 0.468, y: 0.470, zoom: 2.4
  },
  {
    id: "vista",
    kicker: "Thursday · 6:00 PM · the ceremony",
    title: "Minaret Vista",
    addr: "The highest drive-up overlook in Mammoth, on the Sierra Crest — a panorama of the Minarets, Mount Ritter, and Banner Peak. Where we say our vows.",
    photo: "assets/map/vista.jpg",
    link: { label: "Minaret Vista · Inyo NF", url: "https://www.fs.usda.gov/r05/inyo/recreation/minaret-vista-observation-site" },
    x: 0.556, y: 0.300, zoom: 2.6
  }
];

(function () {
  "use strict";

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const IMG_W = 1958, IMG_H = 803;
  const A = IMG_W / IMG_H;

  const frame = document.getElementById("mapFrame");
  const canvas = document.getElementById("panoCanvas");
  const img = document.getElementById("panoImg");
  const card = document.getElementById("mapCard");
  const cardKicker = document.getElementById("mapCardKicker");
  const cardTitle = document.getElementById("mapCardTitle");
  const cardAddr = document.getElementById("mapCardAddr");
  const cardPhoto = document.getElementById("mapCardPhoto");
  const cardImg = document.getElementById("mapCardImg");
  const cardLink = document.getElementById("mapCardLink");
  const stepsWrap = document.getElementById("mapSteps");
  const listEl = document.getElementById("mapList");
  const exploreBtn = document.getElementById("mapExplore");

  /* tap-through / reduced-motion list (photo + description + link) */
  for (const s of STOPS) {
    if (s.id === "overview") continue;
    const li = document.createElement("li");
    li.innerHTML =
      (s.photo ? `<img class="map-list-photo" src="${s.photo}" alt="" loading="lazy" decoding="async">` : "") +
      `<h3>${s.title}</h3><p>${s.addr}</p>` +
      (s.link ? `<a href="${s.link.url}" target="_blank" rel="noopener">${s.link.label} ↗</a>` : "");
    listEl.appendChild(li);
  }

  let current = -1;
  let exploring = false;

  /* place the camera so (nx, ny) sits at viewport centre, at `zoom`,
     clamped so the painting always fills the frame (no void edges). */
  function focus(s, instant) {
    const Vw = frame.clientWidth, Vh = frame.clientHeight;
    const canvasW = Vw, canvasH = Vw / A;          // img is width:100%
    const coverScale = Math.max(1, Vh / canvasH);   // cover the frame
    const sc = coverScale * s.zoom;

    let x = Vw / 2 - s.x * canvasW * sc;
    let y = Vh / 2 - s.y * canvasH * sc;
    const scaledW = canvasW * sc, scaledH = canvasH * sc;
    x = Math.min(0, Math.max(Vw - scaledW, x));
    y = Math.min(0, Math.max(Vh - scaledH, y));

    if (instant || reduceMotion) {
      const prev = canvas.style.transition;
      canvas.style.transition = "none";
      canvas.style.transform = `translate(${x}px, ${y}px) scale(${sc})`;
      void canvas.offsetWidth;                      // flush
      canvas.style.transition = prev;
    } else {
      canvas.style.transform = `translate(${x}px, ${y}px) scale(${sc})`;
    }
  }

  function showStop(i, instant) {
    if (i === current) return;
    current = i;
    const s = STOPS[i];
    cardKicker.textContent = s.kicker;
    cardTitle.textContent = s.title;
    cardAddr.textContent = s.addr;
    if (s.photo) { cardImg.src = s.photo; cardPhoto.hidden = false; }
    else { cardPhoto.hidden = true; cardImg.removeAttribute("src"); }
    if (s.link) { cardLink.href = s.link.url; cardLink.textContent = s.link.label + " ↗"; cardLink.hidden = false; }
    else { cardLink.hidden = true; }
    card.classList.toggle("is-overview", s.id === "overview");
    focus(s, instant);
  }

  function start() {
    /* scroll-driven stepper */
    if (!reduceMotion) {
      STOPS.forEach((s, i) => {
        const step = document.createElement("div");
        step.className = "map-step";
        step.dataset.stop = i;
        stepsWrap.appendChild(step);
      });
      const io = new IntersectionObserver(entries => {
        if (exploring) return;
        for (const e of entries) {
          if (e.isIntersecting) showStop(parseInt(e.target.dataset.stop, 10), false);
        }
      }, { threshold: 0.55 });
      stepsWrap.querySelectorAll(".map-step").forEach(el => io.observe(el));
    } else {
      document.body.classList.add("no-map");
    }
    showStop(0, true);
  }

  /* explore-on-your-own: drag to pan, wheel/pinch to zoom */
  let px = 0, py = 0, pscale = 1, dragging = false, sx = 0, sy = 0, ox = 0, oy = 0;
  function applyFree() {
    canvas.style.transform = `translate(${px}px, ${py}px) scale(${pscale})`;
  }
  function currentMatrix() {
    const m = new DOMMatrixReadOnly(getComputedStyle(canvas).transform);
    return { x: m.m41, y: m.m42, s: m.a };
  }
  exploreBtn.addEventListener("click", () => {
    exploring = !exploring;
    exploreBtn.classList.toggle("active", exploring);
    exploreBtn.textContent = exploring ? "Back to the tour" : "Explore on your own";
    frame.classList.toggle("free", exploring);
    if (exploring) {
      const m = currentMatrix();
      px = m.x; py = m.y; pscale = m.s;
      canvas.style.transition = "none";
      card.classList.add("hidden");
    } else {
      canvas.style.transition = "";
      card.classList.remove("hidden");
      current = -1;
      showStop(0, false);
    }
  });
  frame.addEventListener("pointerdown", e => {
    if (!exploring) return;
    dragging = true; sx = e.clientX; sy = e.clientY; ox = px; oy = py;
    frame.setPointerCapture(e.pointerId);
  });
  frame.addEventListener("pointermove", e => {
    if (!exploring || !dragging) return;
    px = ox + (e.clientX - sx); py = oy + (e.clientY - sy);
    clampFree(); applyFree();
  });
  frame.addEventListener("pointerup", () => { dragging = false; });
  frame.addEventListener("wheel", e => {
    if (!exploring) return;
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.12 : 0.89;
    pscale = Math.min(6, Math.max(1, pscale * factor));
    clampFree(); applyFree();
  }, { passive: false });
  function clampFree() {
    const Vw = frame.clientWidth, Vh = frame.clientHeight;
    const coverScale = Math.max(1, Vh / (Vw / A));
    const sc = Math.max(pscale, coverScale);
    pscale = sc;
    const scaledW = Vw * sc, scaledH = (Vw / A) * sc;
    px = Math.min(0, Math.max(Vw - scaledW, px));
    py = Math.min(0, Math.max(Vh - scaledH, py));
  }

  window.addEventListener("resize", () => {
    if (!exploring && current >= 0) focus(STOPS[current], true);
  }, { passive: true });

  if (img.complete) start();
  else img.addEventListener("load", start, { once: true });
})();
