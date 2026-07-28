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

  function closeNav() {
    if (dayNav && !dayNav.classList.contains("min")) {
      dayNav.classList.add("min");
      if (dnToggle) dnToggle.setAttribute("aria-expanded", "false");
    }
  }
  if (dnToggle) {
    dnToggle.addEventListener("click", e => {
      e.stopPropagation();
      const min = dayNav.classList.toggle("min");
      dnToggle.setAttribute("aria-expanded", String(!min));
    });
    /* any nav link (days or guides) closes the veil */
    dayNav.querySelectorAll("a").forEach(a => a.addEventListener("click", closeNav));
    /* clicking the page outside the panel closes it */
    document.addEventListener("click", e => {
      if (!dayNav.classList.contains("min") && !dayNav.contains(e.target)) closeNav();
    });
    document.addEventListener("keydown", e => { if (e.key === "Escape") closeNav(); });
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

    /* day nav: active/passed day states */
    if (dayNav) {
      /* mobile: pill hides until you've scrolled a little (CSS scopes
         the effect to small screens) */
      dayNav.classList.toggle("tucked", window.scrollY < vh * 0.4);
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
    closeNav();   /* the veil never rides along while you scroll */
    if (!ticking) { ticking = true; requestAnimationFrame(frame); }
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll, { passive: true });
  frame();

  /* ── a single celebratory confetti breath on "The main event" ── */
  const mainEvent = document.querySelector(".main-event");
  if (mainEvent && !reduceMotion && "IntersectionObserver" in window) {
    const palette = ["#2c4433", "#33708e", "#2f5f86", "#93a690", "#9aa6ac", "#c9b458"];
    const burst = () => {
      for (let i = 0; i < 26; i++) {
        const c = document.createElement("span");
        c.className = "cf";
        const ang = (Math.PI * 2 * i) / 26 + Math.random() * 0.5;
        const dist = 46 + Math.random() * 74;
        c.style.setProperty("--cfx", (Math.cos(ang) * dist).toFixed(0) + "px");
        c.style.setProperty("--cfy", (Math.sin(ang) * dist * 0.85 + 26).toFixed(0) + "px");
        c.style.setProperty("--cfr", (Math.random() * 540 - 270).toFixed(0) + "deg");
        c.style.setProperty("--cfd", (Math.random() * 0.18).toFixed(2) + "s");
        c.style.background = palette[i % palette.length];
        if (i % 5 === 4) c.style.borderRadius = "50%";
        mainEvent.appendChild(c);
      }
      setTimeout(() => mainEvent.querySelectorAll(".cf").forEach(el => el.remove()), 2400);
    };
    const cio = new IntersectionObserver(entries => {
      for (const e of entries) if (e.isIntersecting) { cio.disconnect(); setTimeout(burst, 350); }
    }, { threshold: 0.7 });
    cio.observe(mainEvent);
  }

  /* ── trails: difficulty filter ── */
  const chips = document.querySelectorAll(".hf-chip");
  const hikeCards = document.querySelectorAll(".hike-card");
  chips.forEach(chip => {
    chip.addEventListener("click", () => {
      const want = chip.dataset.filter;
      chips.forEach(c => c.classList.toggle("is-on", c === chip));
      hikeCards.forEach(card => {
        card.classList.toggle("is-hidden", want !== "all" && card.dataset.level !== want);
      });
    });
  });

  /* ── trails: photo lightbox ── */
  const lb = document.getElementById("lightbox");
  if (lb) {
    const lbImg = document.getElementById("lbImg");
    const lbCap = document.getElementById("lbCap");
    let lastFocus = null;

    function openLb(btn) {
      lastFocus = btn;
      lbImg.src = btn.dataset.full;
      lbImg.alt = btn.querySelector("img") ? btn.querySelector("img").alt : "";
      lbCap.textContent = btn.dataset.caption || "";
      lb.hidden = false;
      requestAnimationFrame(() => lb.classList.add("on"));
      document.body.style.overflow = "hidden";
      document.getElementById("lbClose").focus();
    }
    function closeLb() {
      lb.classList.remove("on");
      document.body.style.overflow = "";
      setTimeout(() => { lb.hidden = true; lbImg.removeAttribute("src"); }, 300);
      if (lastFocus) lastFocus.focus();
    }
    document.querySelectorAll(".hike-photo").forEach(btn => {
      btn.addEventListener("click", () => openLb(btn));
    });
    document.getElementById("lbClose").addEventListener("click", closeLb);
    lb.addEventListener("click", e => { if (e.target === lb) closeLb(); });
    document.addEventListener("keydown", e => {
      if (e.key === "Escape" && !lb.hidden) closeLb();
    });
  }
})();
