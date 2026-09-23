/* SAJID.BD — navigation behaviour (Phase 2A)
 *
 * 1. Mobile menu toggle with correct ARIA and keyboard semantics.
 *    Replaces the previous CSS checkbox hack, whose `display:none` input and
 *    non-focusable <label> made the menu impossible to open by keyboard.
 *
 * 2. Scroll-spy for anchor menu items. The primary menu currently points at
 *    homepage anchors (`/#research`), which cannot be resolved to an active
 *    state server-side. This marks the item for the section in view.
 *    Real page URLs are resolved in the template instead.
 *
 * Focus handling note: this is a single flat list of links inside the header,
 * not a modal dialog, so a full focus trap is deliberately NOT implemented.
 * Tabbing past the last link continues into the page, which is the expected
 * behaviour for a disclosure menu. Escape closes and returns focus to the
 * trigger. Documented in docs/redesign/implementation-roadmap.md.
 */
(function () {
  "use strict";

  var DESKTOP_QUERY = "(min-width: 1024px)";

  function initMobileNav() {
    var toggle = document.getElementById("nav-toggle");
    var menu = document.getElementById("nav-menu");
    if (!toggle || !menu) return;

    function isOpen() {
      return toggle.getAttribute("aria-expanded") === "true";
    }

    function setOpen(open) {
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      menu.classList.toggle("sj-open", open);
      var label = open
        ? toggle.getAttribute("data-label-close")
        : toggle.getAttribute("data-label-open");
      if (label) toggle.setAttribute("aria-label", label);
    }

    toggle.addEventListener("click", function () {
      var opening = !isOpen();
      setOpen(opening);
      if (opening) {
        var first = menu.querySelector("a[href]");
        // preventScroll matters: a plain focus() scrolls the link into view,
        // which moved the page enough to push the current section out of the
        // scroll-spy's band and cleared the active state the moment the menu
        // was opened. Verified at 390px.
        if (first) {
          try {
            first.focus({ preventScroll: true });
          } catch (e) {
            first.focus();
          }
        }
      }
    });

    // Escape closes from anywhere in the header and returns focus to the trigger.
    document.addEventListener("keydown", function (e) {
      if (e.key !== "Escape" || !isOpen()) return;
      setOpen(false);
      toggle.focus();
    });

    // Clicking outside the header closes the menu.
    document.addEventListener("click", function (e) {
      if (!isOpen()) return;
      var header = document.getElementById("site-header");
      if (header && !header.contains(e.target)) setOpen(false);
    });

    // Following a link closes the menu.
    menu.addEventListener("click", function (e) {
      if (e.target.closest("a[href]") && isOpen()) setOpen(false);
    });

    // Crossing into the desktop layout resets state so the menu cannot be
    // left in a half-open state when the viewport grows.
    var mq = window.matchMedia(DESKTOP_QUERY);
    var onChange = function (ev) {
      if (ev.matches && isOpen()) setOpen(false);
    };
    if (typeof mq.addEventListener === "function") {
      mq.addEventListener("change", onChange);
    } else if (typeof mq.addListener === "function") {
      mq.addListener(onChange);
    }
  }

  function initScrollSpy() {
    var anchorLinks = Array.prototype.slice.call(
      document.querySelectorAll("#nav-menu .nav-link[data-nav-anchor]")
    );
    if (!anchorLinks.length || !("IntersectionObserver" in window)) return;

    var byId = {};
    var sections = [];
    anchorLinks.forEach(function (link) {
      var id = link.getAttribute("data-nav-anchor");
      if (!id) return;
      var section = document.getElementById(id);
      if (!section) return;
      byId[id] = link;
      sections.push(section);
    });
    if (!sections.length) return;

    var visible = Object.create(null);
    var lastId = null;

    function render() {
      var bestId = null;
      var bestTop = Infinity;
      Object.keys(visible).forEach(function (id) {
        if (!visible[id]) return;
        var rect = document.getElementById(id).getBoundingClientRect();
        var top = Math.abs(rect.top);
        if (top < bestTop) {
          bestTop = top;
          bestId = id;
        }
      });

      // When no section occupies the band — between sections, or briefly
      // during a programmatic scroll — hold the previous selection rather
      // than blanking the navigation.
      if (bestId === null) bestId = lastId;
      lastId = bestId;
      anchorLinks.forEach(function (link) {
        var on = link.getAttribute("data-nav-anchor") === bestId;
        link.classList.toggle("active", on);
        if (on) {
          link.setAttribute("aria-current", "true");
        } else {
          link.removeAttribute("aria-current");
        }
      });
    }

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          visible[entry.target.id] = entry.isIntersecting;
        });
        render();
      },
      { rootMargin: "-20% 0px -70% 0px", threshold: 0 }
    );

    sections.forEach(function (section) {
      observer.observe(section);
    });
  }

  /* --------------------------------------------------------------------
     Navbar brand reveal (homepage only)

     homepage.css hides `.sj-home .navbar-brand` at rest. This reveals it once
     the HERO WORDMARK — not the whole hero — has scrolled up behind the sticky
     header, so the small navbar brand takes over at the moment the large one
     stops being the page's identity. Waiting for the entire hero to clear the
     viewport would leave a stretch of page with no SAJID Lab identity at all.

     Structural trigger, not a magic pixel value: an IntersectionObserver whose
     root box is inset from the top by the sticky header's own height, watching
     the hero mark. No scroll listener, no rAF, nothing running while idle.

     IntersectionObserver fires once on observe, so the state is correct
     immediately for a reload that restores a non-zero scroll position, for a
     deep link to an anchor further down the page, and for a bfcache restore.
     -------------------------------------------------------------------- */
  function initBrandReveal() {
    var brand = document.querySelector(".navbar-brand");
    if (!brand) return;
    if (!document.body || document.body.className.indexOf("sj-home") === -1) return;

    var SHOWN = "sj-brand--shown";
    function show() { brand.classList.add(SHOWN); }

    // Anything that stops the observer from working must fail OPEN: a hidden
    // brand is a missing link home, which is worse than duplicate branding.
    var mark = document.querySelector(".sj-hero__mark") || document.querySelector(".sj-hero");
    if (!mark || !("IntersectionObserver" in window)) {
      show();
      return;
    }

    // The sticky header covers the top of the viewport, so the mark is
    // effectively gone once it passes BEHIND the header, not once it passes the
    // viewport edge. Inset the observer root by the header's own height.
    var header = document.querySelector(".page-header") || document.getElementById("site-header");
    function headerHeight() {
      return header ? Math.round(header.getBoundingClientRect().height) : 64;
    }

    function onIntersect(entries) {
      for (var i = 0; i < entries.length; i++) {
        brand.classList.toggle(SHOWN, !entries[i].isIntersecting);
      }
    }

    var headerH = headerHeight();
    var observer = null;

    function observe() {
      if (observer) observer.disconnect();
      observer = new IntersectionObserver(onIntersect, {
        rootMargin: "-" + headerH + "px 0px 0px 0px",
        threshold: 0
      });
      observer.observe(mark);
    }
    observe();

    // The brand steps down at `lg` and the header reflows on rotate, so the
    // inset can change. Re-observe on a debounced resize rather than assuming
    // the first measurement holds forever. One layout read per settled resize —
    // no scroll listener and nothing running while idle.
    var resizeTimer = null;
    window.addEventListener(
      "resize",
      function () {
        if (resizeTimer) clearTimeout(resizeTimer);
        resizeTimer = setTimeout(function () {
          var h = headerHeight();
          if (h === headerH) return;
          headerH = h;
          observe();
        }, 200);
      },
      { passive: true }
    );
  }

  function init() {
    initMobileNav();
    initScrollSpy();
    initBrandReveal();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
