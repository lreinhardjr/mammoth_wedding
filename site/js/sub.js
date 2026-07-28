/* L & K · sub-page choreography: hero bloom, band parallax,
   reveals, hike-card filters, photo lightbox. All guarded so any
   page can include any subset of the markup. */
(function () {
  "use strict";
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* reveal on scroll */
  const reveals = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && !reduceMotion) {
    const io = new IntersectionObserver(entries => {
      for (const e of entries) if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
    }, { threshold: 0.14, rootMargin: "0px 0px -6% 0px" });
    reveals.forEach(el => io.observe(el));
  } else {
    reveals.forEach(el => el.classList.add("in"));
  }

  /* hero sharpens with scroll; painting bands drift */
  const hero = document.querySelector(".sub-hero");
  const bands = Array.from(document.querySelectorAll(".wc-band"));
  let ticking = false;
  function frame() {
    ticking = false;
    if (hero && !reduceMotion) {
      const hp = Math.min(1, Math.max(0, window.scrollY / (window.innerHeight * 0.55)));
      hero.style.setProperty("--hp", (0.35 + hp * 0.65).toFixed(3));
    }
    if (!reduceMotion) {
      const vh = window.innerHeight;
      for (const b of bands) {
        const r = b.getBoundingClientRect();
        if (r.bottom < 0 || r.top > vh) continue;
        const p = (r.top + r.height / 2 - vh / 2) / vh;   /* -0.5 .. 0.5-ish */
        b.style.setProperty("--par", (p * -34).toFixed(1) + "px");
      }
    }
  }
  function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(frame); } }
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll, { passive: true });
  if (hero && reduceMotion) hero.style.setProperty("--hp", "1");
  frame();

  /* shared side navigation (white-veil overlay) */
  const dayNav = document.getElementById("daynav");
  const dnToggle = document.getElementById("daynavToggle");
  function closeNav() {
    if (dayNav && !dayNav.classList.contains("min")) {
      dayNav.classList.add("min");
      if (dnToggle) dnToggle.setAttribute("aria-expanded", "false");
    }
  }
  if (dayNav && dnToggle) {
    dnToggle.addEventListener("click", e => {
      e.stopPropagation();
      const min = dayNav.classList.toggle("min");
      dnToggle.setAttribute("aria-expanded", String(!min));
    });
    dayNav.querySelectorAll("a").forEach(a => a.addEventListener("click", closeNav));
    document.addEventListener("click", e => {
      if (!dayNav.classList.contains("min") && !dayNav.contains(e.target)) closeNav();
    });
    document.addEventListener("keydown", e => { if (e.key === "Escape") closeNav(); });
    window.addEventListener("scroll", closeNav, { passive: true });
  }

  /* difficulty filter (hikes / rides) */
  const chips = document.querySelectorAll(".hf-chip");
  const cards = document.querySelectorAll(".hike-card");
  chips.forEach(chip => {
    chip.addEventListener("click", () => {
      const want = chip.dataset.filter;
      chips.forEach(c => c.classList.toggle("is-on", c === chip));
      cards.forEach(card => {
        card.classList.toggle("is-hidden", want !== "all" && card.dataset.level !== want);
      });
    });
  });

  /* lightbox */
  const lb = document.getElementById("lightbox");
  if (lb) {
    const lbImg = document.getElementById("lbImg");
    const lbCap = document.getElementById("lbCap");
    const lbClose = document.getElementById("lbClose");
    let lastFocus = null;
    function openLb(btn) {
      lastFocus = btn;
      lbImg.src = btn.dataset.full;
      const im = btn.querySelector("img");
      lbImg.alt = im ? im.alt : "";
      lbCap.textContent = btn.dataset.caption || "";
      lb.hidden = false;
      requestAnimationFrame(() => lb.classList.add("on"));
      document.body.style.overflow = "hidden";
      lbClose.focus();
    }
    function closeLb() {
      lb.classList.remove("on");
      document.body.style.overflow = "";
      setTimeout(() => { lb.hidden = true; lbImg.removeAttribute("src"); }, 300);
      if (lastFocus) lastFocus.focus();
    }
    document.querySelectorAll(".hike-photo").forEach(btn => btn.addEventListener("click", () => openLb(btn)));
    lbClose.addEventListener("click", closeLb);
    lb.addEventListener("click", e => { if (e.target === lb) closeLb(); });
    document.addEventListener("keydown", e => { if (e.key === "Escape" && !lb.hidden) closeLb(); });
  }
})();
