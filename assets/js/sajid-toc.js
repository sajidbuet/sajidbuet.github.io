/* Blog article — "On this page" active-section indicator.

   Blog single pages only: the module exits immediately when `[data-sj-toc]` is
   absent, so every other route pays one failed querySelector. It is bundled
   with the rest of the site JS rather than loaded separately, so it costs no
   request.

   Progressive enhancement, strictly. The rail is a plain list of in-page
   anchors that works with scripting off; all this adds is which one is marked
   `.is-active`. Nothing here moves the page, so there is no scroll animation to
   suppress under prefers-reduced-motion — the only thing that changes is a
   colour, which the stylesheet already handles.

   Why a scroll listener and not IntersectionObserver alone: an observer only
   reports CHANGES in intersection. Jumping straight to an anchor, or any large
   scroll step, moves a heading from below the reading band to above it without
   it ever being inside — no transition, no callback, no highlight. Measured:
   after `scrollTo(0, 3000)` on a 20-heading article the observer never fired
   and nothing was ever marked active. The position is therefore computed, with
   the work coalesced into one animation frame and the listener passive, so the
   cost is a handful of reads per frame only while the reader is actually
   scrolling.
*/
(function () {
  "use strict";

  var rail = document.querySelector("[data-sj-toc]");
  if (!rail) return;

  var links = Array.prototype.slice.call(rail.querySelectorAll("a[href^='#']"));
  if (!links.length) return;

  /* Built from the rail rather than from the article, so a heading with no TOC
     entry — an h4, say — is skipped instead of clearing the highlight as the
     reader passes it. */
  var entries = [];
  links.forEach(function (a) {
    var id = decodeURIComponent(a.getAttribute("href").slice(1));
    if (!id) return;
    var el = document.getElementById(id);
    if (el) entries.push({ el: el, link: a });
  });
  if (!entries.length) return;

  var current = null;
  var ticking = false;
  var headerH = 64;

  function measureHeader() {
    var header = document.querySelector("#site-header, header");
    headerH = header ? Math.round(header.getBoundingClientRect().height) : 64;
  }

  function setActive(entry) {
    if (entry === current) return;
    if (current) current.link.classList.remove("is-active");
    current = entry;
    if (!current) return;
    current.link.classList.add("is-active");

    /* Keep the active item inside the rail's own scrollport on long articles.
       `nearest` never moves the page, only the overflowing rail, and only when
       the item is already out of view. */
    if (rail.scrollHeight > rail.clientHeight + 1) {
      current.link.scrollIntoView({ block: "nearest" });
    }
  }

  /* The section being read is the last one whose heading has passed the reading
     line, a little below the sticky header. Before the first heading, nothing is
     active; at the very bottom of the page the last heading wins, so a short
     final section still lights up when it cannot reach the line itself. */
  function update() {
    ticking = false;
    var line = headerH + 24;
    var chosen = null;

    for (var i = 0; i < entries.length; i++) {
      if (entries[i].el.getBoundingClientRect().top <= line) chosen = entries[i];
      else break;
    }

    var atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2;
    if (atBottom) chosen = entries[entries.length - 1];

    setActive(chosen);
  }

  function schedule() {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(update);
  }

  measureHeader();
  update();

  window.addEventListener("scroll", schedule, { passive: true });
  window.addEventListener("hashchange", schedule);
  window.addEventListener("resize", function () { measureHeader(); schedule(); }, { passive: true });

  /* Immediate feedback on click rather than waiting for the scroll to settle.
     The default anchor behaviour is untouched. */
  rail.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest("a[href^='#']");
    if (!a) return;
    for (var i = 0; i < entries.length; i++) {
      if (entries[i].link === a) { setActive(entries[i]); return; }
    }
  });
})();
