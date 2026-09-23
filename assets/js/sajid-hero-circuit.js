/* SAJID.BD — hero research circuit.

   Drives the interactive PCB background in the homepage hero. Markup:
   layouts/_partials/custom/hero-circuit.html. Styling: assets/css/homepage.css.

   WHAT IT DOES
     1. Domain activation on hover, focus and tap — one domain at a time.
     2. Idle signal pulses: a small number of traces, on a jittered timer, each
        run finite.
     3. A pointer spotlight that brightens traces near the cursor.
     4. A single restrained entrance pulse on first appearance.

   WHAT IT DELIBERATELY DOES NOT DO
     - No continuous requestAnimationFrame. A frame is scheduled only in
       response to a pointer event and runs once.
     - No getBoundingClientRect per frame. The hero rect is read once per hover
       session and on a debounced resize.
     - No work at all while the hero is outside the viewport: an
       IntersectionObserver suspends the pulse timer and drops the spotlight.
     - Nothing runs under prefers-reduced-motion except the state changes that
       carry information (which domain is active).
     - No library, no framework, no canvas, no WebGL.
*/
(function () {
  "use strict";

  var root = document.querySelector("[data-sj-circuit]");
  if (!root) return;

  var reduceQuery = window.matchMedia
    ? matchMedia("(prefers-reduced-motion: reduce)")
    : { matches: false, addEventListener: null };
  var finePointer = window.matchMedia ? matchMedia("(pointer: fine)") : { matches: false };

  var domains = Array.prototype.slice.call(root.querySelectorAll("[data-research-domain]"));
  /* Scoped to the base layer on purpose: the network is emitted twice (base and
     pointer-spotlight), so an unscoped selector would animate the invisible
     copy half the time and the pulse would appear to fire at random. */
  var pulsePaths = Array.prototype.slice.call(root.querySelectorAll(".sj-net--base [data-pulse]"));
  var activeId = null;
  var inView = false;
  var pulseTimer = null;

  function reduced() { return !!reduceQuery.matches; }

  /* ---------------------------------------------------------------- domains */

  /* Below 768px the description list is `display: none`, so nothing actually
     expands when a domain is activated — the tap reveals the label instead.
     Advertising `aria-expanded` / `aria-controls` there would be a lie, so the
     disclosure semantics are attached only at widths where a disclosure really
     exists. Re-evaluated on a debounced resize. */
  function syncDisclosureSemantics() {
    for (var i = 0; i < domains.length; i++) {
      var el = domains[i];
      var btn = el.querySelector(".sj-domain__hit");
      var desc = el.querySelector(".sj-domain__desc");
      if (!btn || !desc) continue;
      var expandable = getComputedStyle(desc).display !== "none";
      if (expandable) {
        btn.setAttribute("aria-controls", desc.id);
        btn.setAttribute("aria-expanded", el.classList.contains("is-active") ? "true" : "false");
      } else {
        btn.removeAttribute("aria-controls");
        btn.removeAttribute("aria-expanded");
      }
    }
  }

  function setActive(id) {
    if (activeId === id) return;
    activeId = id;

    for (var i = 0; i < domains.length; i++) {
      var el = domains[i];
      var on = el.getAttribute("data-research-domain") === id;
      el.classList.toggle("is-active", on);
      var btn = el.querySelector(".sj-domain__hit");
      if (btn && btn.hasAttribute("aria-expanded")) {
        btn.setAttribute("aria-expanded", on ? "true" : "false");
      }
    }

    if (id) {
      root.setAttribute("data-active", id);
      // One signal runs from the domain toward the centre, so activating a
      // domain reads as current being drawn through its network.
      pulseDomain(id);
    } else {
      root.removeAttribute("data-active");
    }
  }

  /* One finite pulse along a path. The class is removed on `animationend`, so
     nothing is left running and the same path can fire again later. */
  function firePulse(path) {
    if (!path || reduced() || path.classList.contains("is-pulsing")) return;
    path.classList.add("is-pulsing");
    var done = function () {
      path.classList.remove("is-pulsing");
      path.removeEventListener("animationend", done);
      path.removeEventListener("animationcancel", done);
    };
    path.addEventListener("animationend", done);
    path.addEventListener("animationcancel", done);
  }

  function pulseDomain(id) {
    var p = root.querySelector('.sj-net--base [data-trace-domain="' + id + '"] [data-pulse]');
    firePulse(p);
  }

  domains.forEach(function (el) {
    var id = el.getAttribute("data-research-domain");
    var btn = el.querySelector(".sj-domain__hit");
    if (!btn) return;

    // Hover (fine pointers only — a touch "hover" fires spuriously).
    el.addEventListener("pointerenter", function (e) {
      if (e.pointerType === "touch") return;
      setActive(id);
    });
    el.addEventListener("pointerleave", function (e) {
      if (e.pointerType === "touch") return;
      if (activeId === id) setActive(null);
    });

    // Keyboard focus reveals exactly what hover reveals.
    btn.addEventListener("focus", function () { setActive(id); });
    btn.addEventListener("blur", function () { if (activeId === id) setActive(null); });

    /* Tap to open, tap again (or elsewhere) to close.

       Touch is handled on `pointerup`, not on `click`. A tap on this button
       reliably produces pointerdown/touchstart/pointerup/touchend but NOT a
       synthesised click — verified with Input.synthesizeTapGesture — so a
       click-only implementation silently did nothing on a phone. `click` is
       still handled, because that is what Enter and Space produce on a button
       and what a mouse produces; `suppressClick` stops a tap that does manage
       to synthesise a click from toggling the state twice. */
    var suppressClick = 0;

    btn.addEventListener("pointerup", function (e) {
      if (e.pointerType !== "touch") return;
      suppressClick = Date.now() + 600;
      setActive(activeId === id ? null : id);
    });

    btn.addEventListener("click", function (e) {
      e.preventDefault();
      if (Date.now() < suppressClick) return;
      /* A keyboard-generated click reports detail 0. Focus has already opened
         this domain, so toggling here would close it the instant the user
         pressed Enter on it. */
      if (e.detail === 0) return;
      setActive(activeId === id ? null : id);
    });
  });

  // Tapping or clicking away closes the open domain, and Escape does too.
  document.addEventListener("pointerdown", function (e) {
    if (!activeId) return;
    if (!e.target.closest || !e.target.closest("[data-research-domain]")) setActive(null);
  }, { passive: true });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && activeId) setActive(null);
  });

  /* -------------------------------------------------------------- spotlight */

  function initSpotlight() {
    if (!finePointer.matches || reduced()) return;
    var hero = root.closest(".sj-hero");
    if (!hero) return;

    var rect = null;
    var queued = false;
    var x = 0;
    var y = 0;

    function write() {
      queued = false;
      root.style.setProperty("--sj-spot-x", x + "px");
      root.style.setProperty("--sj-spot-y", y + "px");
    }

    function schedule() {
      if (queued) return;
      queued = true;
      requestAnimationFrame(write);
    }

    hero.addEventListener("pointerenter", function (e) {
      if (e.pointerType === "touch") return;
      rect = hero.getBoundingClientRect();
      root.classList.add("is-pointer");
    }, { passive: true });

    hero.addEventListener("pointermove", function (e) {
      if (e.pointerType === "touch" || !inView) return;
      if (!rect) rect = hero.getBoundingClientRect();
      x = Math.round(e.clientX - rect.left);
      y = Math.round(e.clientY - rect.top);
      schedule();
    }, { passive: true });

    hero.addEventListener("pointerleave", function (e) {
      if (e.pointerType === "touch") return;
      rect = null;
      root.classList.remove("is-pointer");
    }, { passive: true });

    var resizeTimer = null;
    window.addEventListener("resize", function () {
      if (resizeTimer) clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () { rect = null; }, 200);
    }, { passive: true });
  }

  syncDisclosureSemantics();

  var semanticsTimer = null;
  window.addEventListener("resize", function () {
    if (semanticsTimer) clearTimeout(semanticsTimer);
    semanticsTimer = setTimeout(syncDisclosureSemantics, 220);
  }, { passive: true });

  /* ------------------------------------------------------------ idle pulses */

  /* A small number of traces carry a signal every few seconds, on a jittered
     interval so it never reads as a loop. setTimeout, not rAF: the animation
     itself is CSS, and JS only needs to decide when to start one. */
  function scheduleIdlePulse() {
    if (pulseTimer) clearTimeout(pulseTimer);
    if (!inView || reduced() || !pulsePaths.length) return;
    var delay = 3200 + Math.random() * 4200;
    pulseTimer = setTimeout(function () {
      if (inView && !reduced()) {
        firePulse(pulsePaths[Math.floor(Math.random() * pulsePaths.length)]);
      }
      scheduleIdlePulse();
    }, delay);
  }

  function stopIdlePulse() {
    if (pulseTimer) clearTimeout(pulseTimer);
    pulseTimer = null;
  }

  /* -------------------------------------------------------------- entrance */

  /* Once, on first appearance: a signal leaves the centre and two domains
     answer. Then it settles and never replays. */
  var entranceDone = false;
  function playEntrance() {
    if (entranceDone) return;
    entranceDone = true;
    if (reduced() || !pulsePaths.length) return;

    var order = pulsePaths.slice().sort(function () { return Math.random() - 0.5; }).slice(0, 3);
    order.forEach(function (p, i) {
      setTimeout(function () { if (inView) firePulse(p); }, 220 + i * 420);
    });
  }

  /* --------------------------------------------------------- viewport gate */

  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      for (var i = 0; i < entries.length; i++) {
        inView = entries[i].isIntersecting;
      }
      if (inView) {
        playEntrance();
        scheduleIdlePulse();
      } else {
        stopIdlePulse();
        root.classList.remove("is-pointer");
        if (activeId) setActive(null);
      }
    }, { threshold: 0.12 });
    io.observe(root);
  } else {
    inView = true;
    playEntrance();
    scheduleIdlePulse();
  }

  // The tab going to the background should not keep timers alive.
  document.addEventListener("visibilitychange", function () {
    if (document.hidden) stopIdlePulse();
    else if (inView) scheduleIdlePulse();
  });

  // Honour the preference changing at run time, both directions.
  if (reduceQuery.addEventListener) {
    reduceQuery.addEventListener("change", function () {
      if (reduced()) {
        stopIdlePulse();
        root.classList.remove("is-pointer");
      } else if (inView) {
        scheduleIdlePulse();
      }
    });
  }

  initSpotlight();
})();
