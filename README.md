# L &amp; K · Wedding Week

A single-page wedding-week site for **L + K** — a week in the Eastern Sierra at
**Mammoth Lakes, California, August 1–8, 2026**.

Hand-painted watercolor aesthetic with a scroll-driven, "you climb the page"
day-by-day itinerary, built as a lightweight static site.

> **Note:** this site contains private details (home addresses, family names,
> and travel dates). Please keep it private and don't share it more broadly than
> intended.

## Run it locally

No build step — it's plain HTML/CSS/JS. Serve the `site/` folder:

```bash
cd site
python3 -m http.server 8000
# then open http://localhost:8000
```

(Or use any static file server / open with a Live Server extension.)

## Structure

```
site/
  index.html          # all page content
  css/main.css        # styles + animations
  js/main.js          # scroll choreography (reveals, parallax, elevation, day nav)
  assets/paintings/   # optimized watercolor images (hero + day scenes)
```

## Tech

Vanilla HTML, CSS, and JavaScript — no framework, no build. Fonts: Ovo (display)
and Mulish (body) via Google Fonts. Animations respect `prefers-reduced-motion`.
