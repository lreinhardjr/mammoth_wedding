/* L & K · guest gate
   ─────────────────────────────────────────────────────────────
   A soft front door for the site. This is a courtesy screen, not
   security: the page content still ships to the browser, so treat
   it as "keeps the link from being casually browsed", nothing more.

   The <html class="gated"> flag is set by a tiny inline script in
   each page's <head> so nothing flashes before this file loads. */
(function () {
  "use strict";

  var KEY = "lk-unlocked";
  var PASSWORD = "snowhouse";

  if (localStorage.getItem(KEY) === "yes") {
    document.documentElement.classList.remove("gated");
    return;
  }

  function build() {
    var gate = document.createElement("div");
    gate.className = "gate";
    gate.innerHTML =
      '<div class="gate-art" aria-hidden="true">' +
        '<img src="assets/paintings/hero-range.jpg" alt="">' +
      '</div>' +
      '<div class="gate-copy">' +
        '<p class="gate-kicker">Mammoth Lakes &middot; August 2026</p>' +
        '<p class="gate-mark">Welcome</p>' +
        '<p class="gate-note">Enter the password to see the week.</p>' +
        '<form class="gate-form" autocomplete="off">' +
          '<input class="gate-input" type="password" name="lk-pass" ' +
                 'placeholder="Password" aria-label="Password" ' +
                 'autocapitalize="none" autocorrect="off" spellcheck="false">' +
          '<button class="gate-btn" type="submit">Enter</button>' +
        '</form>' +
        '<p class="gate-error" role="alert" hidden>That&rsquo;s not it — try again.</p>' +
      '</div>';
    document.body.appendChild(gate);

    var form = gate.querySelector(".gate-form");
    var input = gate.querySelector(".gate-input");
    var error = gate.querySelector(".gate-error");

    /* focus once the field has finished dissolving in */
    setTimeout(function () { input.focus(); }, 1800);

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (input.value.trim().toLowerCase() === PASSWORD) {
        localStorage.setItem(KEY, "yes");
        gate.classList.add("open");
        document.documentElement.classList.remove("gated");
        setTimeout(function () { gate.remove(); }, 950);
      } else {
        error.hidden = false;
        gate.classList.remove("nope");
        void gate.offsetWidth;          /* restart the shake */
        gate.classList.add("nope");
        input.select();
      }
    });

    input.addEventListener("input", function () { error.hidden = true; });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", build);
  } else {
    build();
  }
})();
