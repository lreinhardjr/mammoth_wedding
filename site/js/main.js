/* L & K · scroll choreography
   – watercolor bloom + ink-draw reveals (IntersectionObserver)
   – painting parallax, sky-color continuity, elevation ticker,
     margin stream (single rAF loop, transform-only work)          */
(function () {
  "use strict";

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ── measure ink-draw path lengths so dashes fit exactly ── */
  document.querySelectorAll(".ink-draw path, .ink-draw circle, .rule path").forEach(el => {
    try {
      const len = Math.ceil(el.getTotalLength()) + 2;
      el.style.setProperty("--len", len);
      el.style.strokeDasharray = len;
      el.style.strokeDashoffset = len;
    } catch (e) { /* non-geometry element */ }
  });

  /* ── stagger indices for timeline items ── */
  document.querySelectorAll(".timeline").forEach(list => {
    list.querySelectorAll("li").forEach((li, i) => li.style.setProperty("--i", i));
  });

  /* ── reveal observer ── */
  const io = new IntersectionObserver(entries => {
    for (const e of entries) {
      if (e.isIntersecting) {
        e.target.classList.add("in");
        io.unobserve(e.target);
      }
    }
  }, { threshold: 0.18, rootMargin: "0px 0px -8% 0px" });

  document.querySelectorAll(".reveal, .bloom, .ink-draw, .day-head").forEach(el => io.observe(el));

  /* ── acts: sky color + elevation waypoints ── */
  const acts = Array.from(document.querySelectorAll(".act")).map(el => ({
    el,
    sky: el.dataset.sky || "#e8ecdf",
    elev: parseFloat(el.dataset.elev || "7880")
  }));

  const hexToRgb = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
  const lerp = (a, b, t) => a + (b - a) * t;
  const skyRgbs = acts.map(a => hexToRgb(a.sky));

  const skyEl = document.documentElement;
  const heroEl = document.querySelector(".hero");

  /* ── day navigation (right rail) ── */
  const dayNav = document.getElementById("daynav");
  const dnFill = document.getElementById("dnFill");
  const dnRail = dayNav && dayNav.querySelector(".dn-rail");
  const dnToggle = document.getElementById("daynavToggle");
  const dnToggleDay = document.getElementById("daynavToggleDay");
  const dayItems = dayNav
    ? Array.from(dayNav.querySelectorAll(".dn-item")).map(li => ({ li, sec: document.getElementById(li.dataset.target) }))
    : [];
  const isMobileNav = () => window.matchMedia("(max-width: 980px)").matches;

  if (dnToggle) {
    dnToggle.addEventListener("click", () => {
      const min = dayNav.classList.toggle("min");
      dnToggle.setAttribute("aria-expanded", String(!min));
    });
    dayItems.forEach(({ li }) => {
      const a = li.querySelector("a");
      if (a) a.addEventListener("click", () => {
        if (isMobileNav()) { dayNav.classList.add("min"); dnToggle.setAttribute("aria-expanded", "false"); }
      });
    });
  }
  const elevNum = document.getElementById("elevNum");
  const elevBadge = document.getElementById("elevBadge");
  const elevDot = document.getElementById("elevDot");
  const streamPath = document.getElementById("streamPath");
  const week = document.getElementById("week");
  const STREAM_LEN = 8000;

  let ticking = false;
  let lastElevShown = -1;

  function frame() {
    ticking = false;
    const vh = window.innerHeight;
    const mid = window.scrollY + vh * 0.5;

    /* which act pair are we between? (act midpoints as waypoints) */
    let i = 0;
    while (i < acts.length - 1) {
      const c = acts[i].el, n = acts[i + 1].el;
      const cMid = c.offsetTop + c.offsetHeight / 2;
      const nMid = n.offsetTop + n.offsetHeight / 2;
      if (mid < nMid || i === acts.length - 2) {
        var t = Math.min(1, Math.max(0, (mid - cMid) / Math.max(1, nMid - cMid)));
        break;
      }
      i++;
    }
    t = t || 0;

    /* sky continuity */
    const a = skyRgbs[i], b = skyRgbs[Math.min(i + 1, skyRgbs.length - 1)];
    const rgb = `rgb(${Math.round(lerp(a[0], b[0], t))},${Math.round(lerp(a[1], b[1], t))},${Math.round(lerp(a[2], b[2], t))})`;
    skyEl.style.setProperty("--sky", rgb);

    /* elevation ticker */
    const elev = Math.round(lerp(acts[i].elev, acts[Math.min(i + 1, acts.length - 1)].elev, t));
    if (elev !== lastElevShown) {
      lastElevShown = elev;
      elevNum.textContent = elev <= 20
        ? "sea level"
        : elev.toLocaleString("en-US") + "′";
      /* dot rides its tick rail: 42 (low) → 2 (high) against 11,053 max */
      const y = 42 - (Math.min(elev, 11053) / 11053) * 40;
      elevDot.setAttribute("cy", y.toFixed(1));
    }

    /* badge + stream only live during the week */
    const weekTop = week.offsetTop - vh * 0.6;
    const weekEnd = week.offsetTop + week.offsetHeight - vh * 0.4;
    const inWeek = window.scrollY > weekTop && window.scrollY < weekEnd;
    elevBadge.classList.toggle("on", inWeek);

    /* day nav: visibility, the growing climb-line, active/passed days */
    if (dayNav) {
      dayNav.classList.toggle("on", inWeek);
      const wTop = week.offsetTop, wH = week.offsetHeight;
      const dp = Math.min(1, Math.max(0, (window.scrollY + vh * 0.5 - wTop) / wH));
      if (dnRail && dnFill) dnFill.style.height = (dp * dnRail.getBoundingClientRect().height).toFixed(1) + "px";
      let act = -1;
      for (let k = 0; k < dayItems.length; k++) {
        if (dayItems[k].sec && dayItems[k].sec.offsetTop <= mid) act = k;
      }
      for (let k = 0; k < dayItems.length; k++) {
        dayItems[k].li.classList.toggle("active", k === act);
        dayItems[k].li.classList.toggle("passed", k < act);
      }
      if (dnToggleDay) dnToggleDay.textContent = act >= 0
        ? dayItems[act].li.querySelector(".dn-label").textContent
        : "The week";
    }

    if (streamPath) {
      const p = Math.min(1, Math.max(0, (window.scrollY - weekTop) / Math.max(1, weekEnd - weekTop)));
      streamPath.style.strokeDashoffset = STREAM_LEN * (1 - p);
    }

    /* hero scroll-reveal: mountains bloom up, copy drifts + fades */
    if (heroEl && !reduceMotion) {
      const hp = Math.min(1, Math.max(0, window.scrollY / (vh * 0.85)));
      heroEl.style.setProperty("--hp", hp.toFixed(3));
    }

    /* painting parallax */
    if (!reduceMotion) {
      for (const scene of parallaxScenes) {
        const r = scene.wrap.getBoundingClientRect();
        if (r.bottom < -80 || r.top > vh + 80) continue;
        const prog = (r.top + r.height / 2 - vh / 2) / vh; /* -~1 … ~1 */
        scene.img.style.transform =
          `translate3d(0, ${(prog * scene.speed * 100).toFixed(2)}px, 0) scale(1.04)`;
      }
    }
  }

  const parallaxScenes = Array.from(document.querySelectorAll(".scene")).map(wrap => {
    const img = wrap.querySelector(".scene-img");
    return { wrap, img, speed: parseFloat(img.dataset.parallax || "0.15") * 5 };
  });

  function onScroll() {
    /* on mobile the rail tucks away as you scroll; tap the handle to reopen */
    if (dayNav && isMobileNav() && !dayNav.classList.contains("min")) {
      dayNav.classList.add("min");
      if (dnToggle) dnToggle.setAttribute("aria-expanded", "false");
    }
    if (!ticking) { ticking = true; requestAnimationFrame(frame); }
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll, { passive: true });
  frame();
})();
