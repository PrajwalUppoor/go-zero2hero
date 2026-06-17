/* =====================================================================
   Go: Zero → Hero — shared layout & UX enhancements
   - Sidebar, mobile drawer, persistent checklist (existing)
   - Theme toggle (dark / light / auto)
   - Reading progress bar + scroll-to-top
   - Auto-generated heading anchors + sticky TOC for long pages
   - Cmd/Ctrl+K command palette searching titles & headings across all pages
   - Code block toolbar (language label + copy button)
   - Auto prev/next page navigation
   - Keyboard shortcuts overlay
   - Lightweight Go syntax highlighter
   ===================================================================== */

// ---------- Site navigation (single source of truth) ----------
const SITE_NAV = [
  {
    title: "Start Here",
    items: [
      { href: "index.html", label: "Roadmap" },
      { href: "pages/leetcode-tricks.html", label: "LeetCode tricks", badge: "★★" },
      { href: "pages/cheatsheet.html", label: "Last-minute cheatsheet", badge: "🔥" },
      { href: "pages/flashcards.html", label: "Flashcards", badge: "★" },
    ],
  },
  {
    title: "Go Language",
    items: [
      { href: "pages/go-basics.html", label: "Fundamentals" },
      { href: "pages/go-advanced.html", label: "Advanced Go" },
      { href: "pages/concurrency.html", label: "Concurrency" },
      { href: "pages/go-stdlib.html", label: "Stdlib & idioms" },
    ],
  },
  {
    title: "Coding Patterns",
    items: [
      { href: "pages/arrays.html", label: "Arrays & slices" },
      { href: "pages/strings.html", label: "Strings" },
      { href: "pages/two-pointers.html", label: "Two pointers" },
      { href: "pages/sliding-window.html", label: "Sliding window" },
      { href: "pages/binary-search.html", label: "Binary search" },
      { href: "pages/sorting.html", label: "Sorting" },
      { href: "pages/linked-lists.html", label: "Linked lists" },
      { href: "pages/stacks-queues.html", label: "Stacks & queues" },
      { href: "pages/hashing.html", label: "Hash maps & sets" },
      { href: "pages/heaps.html", label: "Heaps / priority queue" },
      { href: "pages/trees.html", label: "Trees & BST" },
      { href: "pages/tries.html", label: "Tries" },
      { href: "pages/graphs.html", label: "Graphs (BFS/DFS)" },
      { href: "pages/backtracking.html", label: "Backtracking" },
      { href: "pages/greedy.html", label: "Greedy" },
      { href: "pages/dynamic-programming.html", label: "Dynamic programming" },
      { href: "pages/bit-manipulation.html", label: "Bit manipulation" },
      { href: "pages/intervals.html", label: "Intervals" },
      { href: "pages/math.html", label: "Math & number theory" },
    ],
  },
  {
    title: "System Design",
    items: [
      { href: "pages/system-design.html", label: "Fundamentals" },
      { href: "pages/system-design-building-blocks.html", label: "Building blocks" },
      { href: "pages/databases.html", label: "Databases & storage" },
      { href: "pages/caching.html", label: "Caching" },
      { href: "pages/messaging.html", label: "Messaging & queues" },
      { href: "pages/microservices.html", label: "Microservices in Go" },
      { href: "pages/system-design-cases.html", label: "Case studies" },
    ],
  },
  {
    title: "Behavioral",
    items: [
      { href: "pages/behavioral.html", label: "Behavioral & leadership" },
    ],
  },
];

// ---------- Theme (applied early to minimize flash) ----------
(function initTheme() {
  try {
    const saved = localStorage.getItem("theme") || "auto";
    applyTheme(saved);
  } catch (_) { /* ignore */ }
})();

function applyTheme(mode) {
  const root = document.documentElement;
  let effective = mode;
  if (mode === "auto") {
    effective = window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
  }
  if (effective === "light") root.setAttribute("data-theme", "light");
  else root.removeAttribute("data-theme");
  try { localStorage.setItem("theme", mode); } catch (_) {}
}

function cycleTheme() {
  const order = ["auto", "dark", "light"];
  const cur = (localStorage.getItem("theme") || "auto");
  const next = order[(order.indexOf(cur) + 1) % order.length];
  applyTheme(next);
  toast(`Theme: ${next}`);
  updateThemeButton();
}

// React to system theme changes while in auto mode
window.matchMedia("(prefers-color-scheme: light)").addEventListener?.("change", () => {
  if ((localStorage.getItem("theme") || "auto") === "auto") applyTheme("auto");
});

// ---------- 3-day cram mode ----------
// Essential-by-default heading text patterns for pages we haven't tagged yet.
// A page can override by adding data-cram="essential" (or "skip") on any <h2>.
const CRAM_ESSENTIAL_PATTERNS = [
  /^\s*mental model/i,
  /^\s*core templates?/i,
  /^\s*the (two|three) canonical templates?/i,
  /^\s*templates?\b/i,
  /^\s*cheatsheet/i,
  /^\s*quick reference/i,
  /^\s*must[- ]do/i,
  /^\s*pitfalls?/i,
  /^\s*senior pitfalls?/i,
  /^\s*common (deadlocks|pitfalls|mistakes)/i,
  /^\s*self[- ]check/i,
  /^\s*\d+\s*[·\.]\s*(complexity|pattern\s*[→\-]|go templates|complexity table)/i,
  /^\s*signal\s*[→\-]\s*tool/i,
  /^\s*pattern[- ]recognition/i,
  /^\s*the 5[- ]step universal solving framework/i,
];

function isCramEssentialHeading(h2) {
  const tag = (h2.dataset.cram || "").toLowerCase();
  if (tag === "essential") return true;
  if (tag === "skip") return false;
  const text = (h2.textContent || "").trim();
  return CRAM_ESSENTIAL_PATTERNS.some((re) => re.test(text));
}

function getCramMode() {
  try { return localStorage.getItem("cram") === "1"; } catch (_) { return false; }
}
function setCramMode(on) {
  try { localStorage.setItem("cram", on ? "1" : "0"); } catch (_) {}
}

function applyCramMode(on) {
  document.body.dataset.mode = on ? "cram" : "full";
  const main = document.querySelector(".main");
  if (!main) return;

  // Remove any prior cram-hidden marks first
  main.querySelectorAll(".cram-hidden").forEach((el) => el.classList.remove("cram-hidden"));
  document.querySelectorAll(".toc a.cram-hidden").forEach((el) => el.classList.remove("cram-hidden"));
  document.getElementById("cram-banner")?.remove();

  if (!on) return;

  const headings = Array.from(main.querySelectorAll("h2"))
    .filter((h) => !h.closest(".page-header"));
  const total = headings.length;
  let kept = 0;

  for (const h2 of headings) {
    if (isCramEssentialHeading(h2)) { kept++; continue; }
    h2.classList.add("cram-hidden");
    let n = h2.nextElementSibling;
    while (n && n.tagName !== "H2") {
      n.classList.add("cram-hidden");
      n = n.nextElementSibling;
    }
  }

  // Sync TOC: hide links for hidden h2s
  document.querySelectorAll(".toc a").forEach((a) => {
    const id = (a.getAttribute("href") || "").replace(/^#/, "");
    if (!id) return;
    const target = document.getElementById(id);
    if (target && target.classList.contains("cram-hidden")) a.classList.add("cram-hidden");
  });

  // Insert a banner just under the page-header (or at top of .article if TOC layout)
  const banner = document.createElement("div");
  banner.id = "cram-banner";
  banner.className = "cram-banner";
  banner.setAttribute("role", "status");

  if (total === 0 || kept === 0) {
    banner.innerHTML = `
      <span class="pill">📅 3-Day Cram</span>
      <span>This page has no cram-mode summary yet. Showing everything.</span>
      <button type="button" id="cram-disable" aria-label="Disable cram mode">Show full</button>
    `;
    // If there are no kept sections, don't actually hide anything (avoid an empty page).
    main.querySelectorAll(".cram-hidden").forEach((el) => el.classList.remove("cram-hidden"));
    document.querySelectorAll(".toc a.cram-hidden").forEach((el) => el.classList.remove("cram-hidden"));
  } else {
    banner.innerHTML = `
      <span class="pill">📅 3-Day Cram</span>
      <span><b>${kept}</b> of <b>${total}</b> sections shown — only the essentials.</span>
      <span class="summary">Press <kbd>c</kbd> or click again to see everything.</span>
      <button type="button" id="cram-disable" aria-label="Disable cram mode">Show full</button>
    `;
  }

  // Place banner: prefer .article (TOC layout) > .page-header > top of main
  const article = main.querySelector(".with-toc .article");
  const header = main.querySelector(".page-header");
  if (article) article.insertBefore(banner, article.firstChild);
  else if (header) header.insertAdjacentElement("afterend", banner);
  else main.insertBefore(banner, main.firstChild);

  banner.querySelector("#cram-disable")?.addEventListener("click", () => toggleCramMode(false));
}

function toggleCramMode(force) {
  const on = typeof force === "boolean" ? force : !getCramMode();
  setCramMode(on);
  applyCramMode(on);
  updateCramButton();
  if (on) toast("3-day cram mode on");
  else toast("Showing full content");
}

function updateCramButton() {
  const btn = document.getElementById("sb-cram");
  const label = document.getElementById("sb-cram-label");
  if (!btn || !label) return;
  const on = getCramMode();
  btn.classList.toggle("cram-active", on);
  btn.setAttribute("aria-pressed", on ? "true" : "false");
  label.textContent = on ? "Cram on" : "3-Day cram";
}

// Add a small "Essential" badge next to each cram-essential heading (full mode only).
function decorateEssentialHeadings() {
  const main = document.querySelector(".main");
  if (!main) return;
  main.querySelectorAll("h2").forEach((h2) => {
    if (h2.closest(".page-header")) return;
    if (h2.querySelector(".cram-essential-badge")) return;
    if (!isCramEssentialHeading(h2)) return;
    const badge = document.createElement("span");
    badge.className = "cram-essential-badge";
    badge.textContent = "Essential";
    badge.title = "Shown in 3-day cram mode";
    // Insert before the existing anchor link if present.
    const anchor = h2.querySelector(".anchor-link");
    if (anchor) h2.insertBefore(badge, anchor);
    else h2.appendChild(badge);
  });
}

// ---------- Small helpers ----------
function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;",
  }[c]));
}

function slugify(s) {
  return String(s)
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function basePathFromCurrent() {
  const path = location.pathname;
  return path.includes("/pages/") ? "../" : "./";
}

function currentHref() {
  const path = location.pathname;
  const file = path.split("/").pop() || "index.html";
  return path.includes("/pages/") ? "pages/" + file : file;
}

function getCompletion() {
  // Aggregate "done" items across all checklists in localStorage.
  let done = 0, total = 0;
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (!k || !k.startsWith("chk:")) continue;
      const v = JSON.parse(localStorage.getItem(k) || "{}");
      for (const id in v) {
        total++;
        if (v[id]) done++;
      }
    }
  } catch (_) {}
  return { done, total };
}

// Transient toast for feedback (theme switch, copy, etc.)
let toastTimer = null;
function toast(msg) {
  let el = document.getElementById("toast");
  if (!el) {
    el = document.createElement("div");
    el.id = "toast";
    Object.assign(el.style, {
      position: "fixed",
      bottom: "20px",
      left: "50%",
      transform: "translateX(-50%) translateY(10px)",
      background: "var(--bg-elev)",
      color: "var(--text)",
      border: "1px solid var(--border-strong)",
      padding: "8px 14px",
      borderRadius: "10px",
      boxShadow: "var(--shadow)",
      fontSize: "13px",
      zIndex: "120",
      opacity: "0",
      transition: "opacity .15s, transform .15s",
      pointerEvents: "none",
    });
    document.body.appendChild(el);
  }
  el.textContent = msg;
  requestAnimationFrame(() => {
    el.style.opacity = "1";
    el.style.transform = "translateX(-50%) translateY(0)";
  });
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    el.style.opacity = "0";
    el.style.transform = "translateX(-50%) translateY(10px)";
  }, 1400);
}

// ---------- Sidebar ----------
function renderSidebar() {
  const root = document.getElementById("sidebar-root");
  if (!root) return;
  const base = basePathFromCurrent();
  const here = currentHref();

  let html = `
    <div class="brand">
      <div class="logo" aria-hidden="true">Go</div>
      <div>
        <div class="name">Go: Zero → Hero</div>
        <div class="sub">Senior backend interview track</div>
      </div>
    </div>
    <div class="sidebar-tools" role="toolbar" aria-label="Site tools">
      <button class="tool" id="sb-search" type="button" aria-label="Open search (Cmd+K)">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
             stroke-linecap="round" stroke-linejoin="round" width="14" height="14" aria-hidden="true">
          <circle cx="11" cy="11" r="7"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
        <span>Search</span>
        <span class="kbd-mini">⌘K</span>
      </button>
      <button class="tool" id="sb-theme" type="button" aria-label="Toggle theme">
        <span id="sb-theme-icon" aria-hidden="true">◐</span>
        <span id="sb-theme-label">Auto</span>
      </button>
    </div>
    <div class="sidebar-tools" role="toolbar" aria-label="Study mode">
      <button class="tool" id="sb-cram" type="button"
              aria-label="Toggle 3-day cram mode" aria-pressed="false"
              title="Show only the essential sections — for 3-day prep crunches.">
        <span aria-hidden="true">📅</span>
        <span id="sb-cram-label">3-Day cram</span>
        <span class="kbd-mini">C</span>
      </button>
    </div>
  `;

  for (const group of SITE_NAV) {
    html += `<div class="nav-group"><div class="title">${escapeHtml(group.title)}</div><nav class="nav" aria-label="${escapeHtml(group.title)}">`;
    for (const it of group.items) {
      const href = base + it.href;
      const isActive = it.href === here || (it.href.endsWith("index.html") && here === "index.html");
      const active = isActive ? "active" : "";
      const aria = isActive ? ' aria-current="page"' : "";
      const badge = it.badge ? `<span class="badge">${escapeHtml(it.badge)}</span>` : "";
      html += `<a class="${active}" href="${href}"${aria}>${escapeHtml(it.label)}${badge}</a>`;
    }
    html += `</nav></div>`;
  }
  root.innerHTML = html;

  document.getElementById("sb-search")?.addEventListener("click", openCmdK);
  document.getElementById("sb-theme")?.addEventListener("click", cycleTheme);
  document.getElementById("sb-cram")?.addEventListener("click", toggleCramMode);
  updateThemeButton();
  updateCramButton();
}

function updateThemeButton() {
  const mode = localStorage.getItem("theme") || "auto";
  const icon = document.getElementById("sb-theme-icon");
  const label = document.getElementById("sb-theme-label");
  if (!icon || !label) return;
  if (mode === "light")     { icon.textContent = "☀";  label.textContent = "Light"; }
  else if (mode === "dark") { icon.textContent = "☾";  label.textContent = "Dark"; }
  else                      { icon.textContent = "◐";  label.textContent = "Auto"; }
}

// ---------- Skip-to-content + main landmark ----------
function setupA11y() {
  if (!document.querySelector(".skip-link")) {
    const link = document.createElement("a");
    link.className = "skip-link";
    link.href = "#main";
    link.textContent = "Skip to content";
    document.body.insertBefore(link, document.body.firstChild);
  }
  const main = document.querySelector(".main");
  if (main && !main.id) {
    main.id = "main";
    main.setAttribute("role", "main");
    main.setAttribute("tabindex", "-1");
  }
}

// ---------- Mobile chrome (topbar + drawer) ----------
function setupMobileChrome() {
  const main = document.querySelector(".main");
  if (!main) return;

  const h1 = main.querySelector("h1");
  const pageTitle = (h1 && h1.textContent.trim()) || document.title || "Go: Zero → Hero";
  const base = basePathFromCurrent();

  const topbar = document.createElement("div");
  topbar.className = "topbar";
  topbar.innerHTML = `
    <button class="menu-btn" id="drawer-toggle" type="button" aria-label="Open navigation" aria-expanded="false">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
           stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <line x1="3"  y1="6"  x2="21" y2="6"></line>
        <line x1="3"  y1="12" x2="21" y2="12"></line>
        <line x1="3"  y1="18" x2="21" y2="18"></line>
      </svg>
    </button>
    <div class="title"><a href="${base}index.html">${escapeHtml(pageTitle)}</a></div>
    <button class="search-btn" id="topbar-search" type="button" aria-label="Search">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
           stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <circle cx="11" cy="11" r="7"></circle>
        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
      </svg>
    </button>
  `;
  main.insertBefore(topbar, main.firstChild);

  const backdrop = document.createElement("div");
  backdrop.className = "drawer-backdrop";
  document.body.appendChild(backdrop);

  let lastFocus = null;
  const sidebar = document.querySelector(".sidebar");
  const closeDrawer = () => {
    if (!document.body.classList.contains("drawer-open")) return;
    document.body.classList.remove("drawer-open");
    const btn = document.getElementById("drawer-toggle");
    if (btn) btn.setAttribute("aria-expanded", "false");
    if (lastFocus && typeof lastFocus.focus === "function") lastFocus.focus();
  };
  const openDrawer = () => {
    lastFocus = document.activeElement;
    document.body.classList.add("drawer-open");
    const btn = document.getElementById("drawer-toggle");
    if (btn) btn.setAttribute("aria-expanded", "true");
    // Move focus into the drawer for keyboard users.
    const first = sidebar?.querySelector("a, button");
    if (first) setTimeout(() => first.focus(), 60);
  };

  topbar.querySelector("#drawer-toggle").addEventListener("click", () => {
    document.body.classList.contains("drawer-open") ? closeDrawer() : openDrawer();
  });
  topbar.querySelector("#topbar-search").addEventListener("click", openCmdK);
  backdrop.addEventListener("click", closeDrawer);

  // Close drawer when nav link tapped on mobile.
  sidebar?.addEventListener("click", (e) => {
    const a = e.target.closest("a");
    if (a && window.matchMedia("(max-width: 900px)").matches) closeDrawer();
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 900) closeDrawer();
  });

  // Simple focus trap while drawer is open
  document.addEventListener("focusin", (e) => {
    if (!document.body.classList.contains("drawer-open")) return;
    if (!sidebar) return;
    if (!sidebar.contains(e.target) && !backdrop.contains(e.target)) {
      const first = sidebar.querySelector("a, button");
      if (first) first.focus();
    }
  });

  // Expose for keyboard shortcuts
  window.__closeDrawer = closeDrawer;
}

// ---------- Persistent checklist with progress bar ----------
function bindChecklists() {
  document.querySelectorAll(".checklist").forEach((list) => {
    const key = "chk:" + (list.dataset.key || location.pathname);
    let saved = {};
    try { saved = JSON.parse(localStorage.getItem(key) || "{}"); } catch (_) {}

    const items = Array.from(list.querySelectorAll("li"));
    const updateProgress = () => {
      const done = items.filter((li) => li.classList.contains("done")).length;
      const pct = items.length ? Math.round((done / items.length) * 100) : 0;
      let p = list.nextElementSibling;
      if (!p || !p.classList?.contains("checklist-progress")) {
        p = document.createElement("div");
        p.className = "checklist-progress";
        p.innerHTML = `<span class="txt"></span><div class="bar"><i></i></div><span class="pct"></span>`;
        list.parentNode.insertBefore(p, list.nextSibling);
      }
      p.querySelector(".txt").textContent = `${done} / ${items.length} done`;
      p.querySelector(".pct").textContent = `${pct}%`;
      p.querySelector(".bar > i").style.width = pct + "%";
    };

    items.forEach((li, idx) => {
      const id = li.dataset.id || String(idx);
      const cb = li.querySelector("input[type=checkbox]");
      if (!cb) return;
      cb.checked = !!saved[id];
      li.classList.toggle("done", cb.checked);

      const persist = () => {
        saved[id] = cb.checked;
        try { localStorage.setItem(key, JSON.stringify(saved)); } catch (_) {}
      };

      li.addEventListener("click", (e) => {
        if (e.target === cb) return;
        cb.checked = !cb.checked;
        li.classList.toggle("done", cb.checked);
        persist();
        updateProgress();
      });
      cb.addEventListener("change", () => {
        li.classList.toggle("done", cb.checked);
        persist();
        updateProgress();
      });
    });

    updateProgress();
  });
}

// ---------- Auto headings: IDs + anchor links + TOC ----------
function setupHeadings() {
  const main = document.querySelector(".main");
  if (!main) return;
  const headings = main.querySelectorAll("h2, h3");
  const used = new Set();
  headings.forEach((h) => {
    if (h.closest(".page-header")) return;
    if (!h.id) {
      let slug = slugify(h.textContent || "section");
      let candidate = slug;
      let n = 2;
      while (used.has(candidate) || document.getElementById(candidate)) {
        candidate = `${slug}-${n++}`;
      }
      h.id = candidate;
    }
    used.add(h.id);
    if (!h.querySelector(".anchor-link")) {
      const a = document.createElement("a");
      a.className = "anchor-link";
      a.href = "#" + h.id;
      a.setAttribute("aria-label", "Link to this section");
      a.innerHTML = "§";
      a.addEventListener("click", (e) => {
        // Use default jump but also write to clipboard for sharing.
        try { navigator.clipboard.writeText(location.origin + location.pathname + "#" + h.id); } catch (_) {}
      });
      h.appendChild(a);
    }
  });
}

function setupToc() {
  const main = document.querySelector(".main");
  if (!main) return;
  const isLanding = !!main.querySelector(".page-header h1") && location.pathname.endsWith("index.html");
  if (isLanding) return;
  // Skip pages with custom layouts (e.g. flashcards) — only build a TOC when
  // there are 4+ H2s to navigate.
  const h2s = Array.from(main.querySelectorAll("h2"))
    .filter((h) => !h.closest(".page-header"));
  if (h2s.length < 4) return;

  const article = document.createElement("div");
  article.className = "article";
  const aside = document.createElement("aside");
  aside.className = "toc";
  aside.setAttribute("aria-label", "Table of contents");

  // Wrap all main children (after the page-header) into .article so we can grid them with .toc
  const header = main.querySelector(".page-header");
  const crumbs = main.querySelector(".crumbs");
  const topbar = main.querySelector(".topbar");

  const wrap = document.createElement("div");
  wrap.className = "with-toc";
  // Move siblings after header into wrap
  const children = Array.from(main.children);
  let startMoving = false;
  const toMove = [];
  for (const c of children) {
    if (c === topbar || c === crumbs || c === header) continue;
    if (c.classList?.contains("footer")) continue; // keep footer outside
    if (c.classList?.contains("prev-next")) continue;
    toMove.push(c);
  }
  toMove.forEach((c) => article.appendChild(c));
  wrap.appendChild(article);
  wrap.appendChild(aside);

  // Insert wrap right after the page-header (or crumbs if no header)
  const anchor = header || crumbs || topbar || main.firstChild;
  if (anchor && anchor.parentNode === main) {
    anchor.insertAdjacentElement("afterend", wrap);
  } else {
    main.appendChild(wrap);
  }

  let html = `<div class="toc-title">On this page</div><ul>`;
  h2s.forEach((h) => {
    const txt = h.cloneNode(true);
    txt.querySelector(".anchor-link")?.remove();
    html += `<li class="lvl-2"><a href="#${h.id}">${escapeHtml(txt.textContent.trim())}</a></li>`;
  });
  html += `</ul>`;
  aside.innerHTML = html;

  // Scroll-spy
  const links = Array.from(aside.querySelectorAll("a"));
  const map = new Map(h2s.map((h, i) => [h.id, links[i]]));
  const obs = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const link = map.get(entry.target.id);
        if (!link) return;
        if (entry.isIntersecting) {
          links.forEach((l) => l.classList.remove("active"));
          link.classList.add("active");
        }
      });
    },
    { rootMargin: "-30% 0px -60% 0px", threshold: 0 }
  );
  h2s.forEach((h) => obs.observe(h));
}

// ---------- Reading progress bar ----------
function setupReadingProgress() {
  const bar = document.createElement("div");
  bar.className = "reading-progress";
  bar.innerHTML = `<div class="bar"></div>`;
  document.body.appendChild(bar);
  const inner = bar.querySelector(".bar");
  const update = () => {
    const h = document.documentElement;
    const max = h.scrollHeight - h.clientHeight;
    const pct = max > 0 ? (h.scrollTop / max) * 100 : 0;
    inner.style.width = Math.min(100, Math.max(0, pct)) + "%";
  };
  update();
  document.addEventListener("scroll", update, { passive: true });
  window.addEventListener("resize", update);
}

// ---------- Scroll-to-top button ----------
function setupScrollTop() {
  const btn = document.createElement("button");
  btn.className = "scroll-top";
  btn.setAttribute("aria-label", "Scroll to top");
  btn.type = "button";
  btn.innerHTML = `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"
         stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <polyline points="18 15 12 9 6 15"></polyline>
    </svg>`;
  document.body.appendChild(btn);
  const toggle = () => {
    if (window.scrollY > 600) btn.classList.add("visible");
    else btn.classList.remove("visible");
  };
  document.addEventListener("scroll", toggle, { passive: true });
  btn.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
  toggle();
}

// ---------- Page meta: estimated reading time ----------
function setupReadingTime() {
  const header = document.querySelector(".page-header > div");
  if (!header) return;
  if (header.querySelector(".page-meta")) return;
  const main = document.querySelector(".main");
  const text = main ? main.textContent : "";
  const words = (text.match(/\S+/g) || []).length;
  if (words < 80) return; // tiny pages (e.g. flashcards) shouldn't show "1 min read"
  const mins = Math.max(1, Math.round(words / 220));
  const meta = document.createElement("div");
  meta.className = "page-meta";
  meta.innerHTML = `
    <span title="Estimated reading time">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
           stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="9"></circle>
        <polyline points="12 7 12 12 15 14"></polyline>
      </svg>
      ${mins} min read
    </span>
    <span title="Word count">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
           stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M4 6h16M4 12h10M4 18h16"></path>
      </svg>
      ${words.toLocaleString()} words
    </span>
  `;
  header.appendChild(meta);
}

// ---------- Code blocks: language label + copy button ----------
function setupCodeBlocks() {
  document.querySelectorAll("pre").forEach((pre) => {
    if (pre.parentElement?.classList.contains("code-wrap")) return;
    const wrap = document.createElement("div");
    wrap.className = "code-wrap";
    pre.parentNode.insertBefore(wrap, pre);
    wrap.appendChild(pre);

    const lang = (pre.getAttribute("data-lang") || "code").toUpperCase();
    const bar = document.createElement("div");
    bar.className = "code-bar";
    bar.innerHTML = `
      <span class="lang">${escapeHtml(lang)}</span>
      <button class="copy-btn" type="button" aria-label="Copy code">Copy</button>
    `;
    wrap.insertBefore(bar, pre);

    bar.querySelector(".copy-btn").addEventListener("click", async () => {
      const txt = pre.textContent;
      try {
        await navigator.clipboard.writeText(txt);
        const btn = bar.querySelector(".copy-btn");
        btn.textContent = "Copied!";
        btn.classList.add("ok");
        setTimeout(() => { btn.textContent = "Copy"; btn.classList.remove("ok"); }, 1500);
      } catch (_) {
        // Fallback for non-https / older browsers
        const ta = document.createElement("textarea");
        ta.value = txt;
        document.body.appendChild(ta);
        ta.select();
        try { document.execCommand("copy"); } catch (_) {}
        ta.remove();
        toast("Copied to clipboard");
      }
    });
  });
}

// ---------- Prev / Next page nav ----------
function setupPrevNext() {
  const main = document.querySelector(".main");
  if (!main) return;
  if (main.querySelector(".prev-next")) return;

  const flat = [];
  for (const g of SITE_NAV) {
    for (const it of g.items) flat.push(it);
  }
  const here = currentHref();
  // Skip if current page isn't in nav (or is the index landing)
  const idx = flat.findIndex((it) => it.href === here);
  if (idx === -1) return;
  if (here === "index.html") return;

  const prev = idx > 0 ? flat[idx - 1] : null;
  const next = idx < flat.length - 1 ? flat[idx + 1] : null;
  if (!prev && !next) return;

  const base = basePathFromCurrent();
  const block = document.createElement("nav");
  block.className = "prev-next";
  block.setAttribute("aria-label", "Page navigation");

  const renderCell = (item, dir) => {
    if (!item) return `<span class="placeholder" aria-hidden="true"></span>`;
    return `
      <a class="${dir}" href="${base + item.href}">
        <div class="lbl">${dir === "prev" ? "← Previous" : "Next →"}</div>
        <div class="ttl">${escapeHtml(item.label)}</div>
      </a>
    `;
  };
  block.innerHTML = renderCell(prev, "prev") + renderCell(next, "next");

  const footer = main.querySelector(".footer");
  if (footer) footer.parentNode.insertBefore(block, footer);
  else main.appendChild(block);
}

// ---------- Command palette (Cmd+K) ----------
let cmdkBuiltIndex = null; // pages from SITE_NAV
let cmdkAllHeadingsIndex = null; // lazy

function buildBaseIndex() {
  if (cmdkBuiltIndex) return cmdkBuiltIndex;
  const items = [];
  for (const g of SITE_NAV) {
    for (const it of g.items) {
      items.push({
        kind: "page",
        group: g.title,
        label: it.label,
        href: it.href,
        haystack: (it.label + " " + g.title).toLowerCase(),
      });
    }
  }
  cmdkBuiltIndex = items;
  return items;
}

async function buildHeadingsIndex() {
  if (cmdkAllHeadingsIndex) return cmdkAllHeadingsIndex;
  // Try sessionStorage cache
  try {
    const cached = sessionStorage.getItem("cmdk:headings:v1");
    if (cached) {
      cmdkAllHeadingsIndex = JSON.parse(cached);
      return cmdkAllHeadingsIndex;
    }
  } catch (_) {}

  const base = basePathFromCurrent();
  const pages = [];
  for (const g of SITE_NAV) for (const it of g.items) pages.push({ ...it, group: g.title });

  const fetchPage = async (p) => {
    try {
      const res = await fetch(base + p.href, { credentials: "same-origin" });
      if (!res.ok) return [];
      const html = await res.text();
      const doc = new DOMParser().parseFromString(html, "text/html");
      const main = doc.querySelector(".main");
      if (!main) return [];
      const hs = Array.from(main.querySelectorAll("h2, h3"))
        .filter((h) => !h.closest(".page-header"));
      const used = new Set();
      const out = [];
      for (const h of hs) {
        let slug = h.id || slugify(h.textContent || "section");
        let candidate = slug;
        let n = 2;
        while (used.has(candidate)) candidate = `${slug}-${n++}`;
        used.add(candidate);
        out.push({
          kind: "heading",
          group: p.label,
          label: h.textContent.trim(),
          href: p.href + "#" + candidate,
          level: h.tagName.toLowerCase(),
          haystack: (h.textContent + " " + p.label).toLowerCase(),
        });
      }
      return out;
    } catch (_) {
      return [];
    }
  };

  // Fetch in parallel but with reasonable concurrency
  const results = await Promise.all(pages.map(fetchPage));
  const all = [].concat(...results);
  cmdkAllHeadingsIndex = all;
  try { sessionStorage.setItem("cmdk:headings:v1", JSON.stringify(all)); } catch (_) {}
  return all;
}

function fuzzyScore(query, target) {
  if (!query) return 1;
  const q = query.toLowerCase();
  const t = target.toLowerCase();
  if (t.includes(q)) return 100 - Math.max(0, t.indexOf(q));
  let score = 0, qi = 0;
  for (let i = 0; i < t.length && qi < q.length; i++) {
    if (t[i] === q[qi]) { score += 1; qi++; }
  }
  return qi === q.length ? score : 0;
}

function highlightMatch(text, q) {
  if (!q) return escapeHtml(text);
  const lc = text.toLowerCase();
  const lq = q.toLowerCase();
  const i = lc.indexOf(lq);
  if (i === -1) return escapeHtml(text);
  return escapeHtml(text.slice(0, i)) +
         `<span class="hl">${escapeHtml(text.slice(i, i + q.length))}</span>` +
         escapeHtml(text.slice(i + q.length));
}

let cmdkSelectedIndex = 0;
let cmdkVisibleItems = [];

function ensureCmdkDom() {
  let el = document.getElementById("cmdk");
  if (el) return el;
  el = document.createElement("div");
  el.id = "cmdk";
  el.className = "cmdk";
  el.setAttribute("role", "dialog");
  el.setAttribute("aria-modal", "true");
  el.setAttribute("aria-label", "Search the site");
  el.innerHTML = `
    <div class="cmdk-panel">
      <input class="cmdk-input" id="cmdk-input" type="search"
             placeholder="Search pages and headings…" autocomplete="off" spellcheck="false" />
      <div class="cmdk-list" id="cmdk-list" role="listbox"></div>
      <div class="cmdk-footer">
        <span><kbd>↑</kbd><kbd>↓</kbd> navigate</span>
        <span class="sep">·</span>
        <span><kbd>↵</kbd> open</span>
        <span class="sep">·</span>
        <span><kbd>Esc</kbd> close</span>
      </div>
    </div>`;
  document.body.appendChild(el);

  el.addEventListener("click", (e) => {
    if (e.target === el) closeCmdK();
  });
  const input = el.querySelector("#cmdk-input");
  input.addEventListener("input", renderCmdk);
  input.addEventListener("keydown", (e) => {
    if (e.key === "ArrowDown") { e.preventDefault(); moveCmdkSel(1); }
    else if (e.key === "ArrowUp") { e.preventDefault(); moveCmdkSel(-1); }
    else if (e.key === "Enter") {
      e.preventDefault();
      const it = cmdkVisibleItems[cmdkSelectedIndex];
      if (it) navigateTo(it.href);
    }
  });

  return el;
}

function moveCmdkSel(delta) {
  if (!cmdkVisibleItems.length) return;
  cmdkSelectedIndex = (cmdkSelectedIndex + delta + cmdkVisibleItems.length) % cmdkVisibleItems.length;
  renderCmdkSelection();
  const list = document.getElementById("cmdk-list");
  const sel = list?.querySelector(".cmdk-item.selected");
  sel?.scrollIntoView({ block: "nearest" });
}

function renderCmdkSelection() {
  const list = document.getElementById("cmdk-list");
  if (!list) return;
  list.querySelectorAll(".cmdk-item").forEach((el, i) => {
    el.classList.toggle("selected", i === cmdkSelectedIndex);
    if (i === cmdkSelectedIndex) el.setAttribute("aria-selected", "true");
    else el.removeAttribute("aria-selected");
  });
}

function renderCmdk() {
  const input = document.getElementById("cmdk-input");
  const list = document.getElementById("cmdk-list");
  if (!input || !list) return;
  const q = input.value.trim();

  const base = buildBaseIndex();
  let merged = base.slice();
  if (cmdkAllHeadingsIndex) merged = merged.concat(cmdkAllHeadingsIndex);

  const scored = merged
    .map((it) => ({ it, s: fuzzyScore(q, it.haystack) }))
    .filter(({ s }) => s > 0)
    .sort((a, b) => {
      // Prefer pages over headings when scores tie
      if (b.s !== a.s) return b.s - a.s;
      if (a.it.kind !== b.it.kind) return a.it.kind === "page" ? -1 : 1;
      return a.it.label.localeCompare(b.it.label);
    })
    .slice(0, 40)
    .map(({ it }) => it);

  cmdkVisibleItems = scored;
  cmdkSelectedIndex = 0;

  if (!scored.length) {
    list.innerHTML = `<div class="cmdk-empty">No matches${cmdkAllHeadingsIndex ? "" : " — still indexing headings…"}</div>`;
    return;
  }

  // Group by kind
  const pages = scored.filter((x) => x.kind === "page");
  const heads = scored.filter((x) => x.kind === "heading");
  let html = "";
  let idx = 0;
  const renderItem = (it) => {
    const right = it.kind === "heading"
      ? `<span class="meta">${escapeHtml(it.group)}</span>`
      : `<span class="meta">${escapeHtml(it.group)}</span>`;
    const labelHtml = highlightMatch(it.label, q);
    const result = `
      <div class="cmdk-item" role="option" data-i="${idx}">
        <span>${labelHtml}</span>
        ${right}
      </div>
    `;
    idx++;
    return result;
  };

  if (pages.length) {
    html += `<div class="cmdk-group">Pages</div>`;
    html += pages.map(renderItem).join("");
  }
  if (heads.length) {
    html += `<div class="cmdk-group">Headings</div>`;
    html += heads.map(renderItem).join("");
  }
  list.innerHTML = html;
  renderCmdkSelection();

  list.querySelectorAll(".cmdk-item").forEach((el) => {
    el.addEventListener("mouseenter", () => {
      cmdkSelectedIndex = Number(el.dataset.i || 0);
      renderCmdkSelection();
    });
    el.addEventListener("click", () => {
      const it = cmdkVisibleItems[Number(el.dataset.i || 0)];
      if (it) navigateTo(it.href);
    });
  });
}

function navigateTo(href) {
  const base = basePathFromCurrent();
  location.href = base + href;
}

let cmdkPrevFocus = null;
function openCmdK() {
  const el = ensureCmdkDom();
  el.classList.add("open");
  cmdkPrevFocus = document.activeElement;
  const input = el.querySelector("#cmdk-input");
  input.value = "";
  renderCmdk();
  setTimeout(() => input.focus(), 30);
  // Lazy build content index in the background.
  if (!cmdkAllHeadingsIndex) {
    buildHeadingsIndex().then(() => {
      if (el.classList.contains("open")) renderCmdk();
    });
  }
}
function closeCmdK() {
  const el = document.getElementById("cmdk");
  if (el) el.classList.remove("open");
  if (cmdkPrevFocus && typeof cmdkPrevFocus.focus === "function") cmdkPrevFocus.focus();
}

// ---------- Keyboard shortcuts overlay ----------
function ensureShortcutsDom() {
  let el = document.getElementById("shortcuts");
  if (el) return el;
  el = document.createElement("div");
  el.id = "shortcuts";
  el.className = "shortcuts";
  el.setAttribute("role", "dialog");
  el.setAttribute("aria-modal", "true");
  el.setAttribute("aria-label", "Keyboard shortcuts");
  el.innerHTML = `
    <div class="panel">
      <h3>Keyboard shortcuts</h3>
      <dl>
        <dt><kbd>⌘</kbd> / <kbd>Ctrl</kbd> + <kbd>K</kbd></dt><dd>Open search</dd>
        <dt><kbd>/</kbd></dt><dd>Focus search</dd>
        <dt><kbd>g</kbd> <kbd>h</kbd></dt><dd>Go to roadmap (home)</dd>
        <dt><kbd>g</kbd> <kbd>c</kbd></dt><dd>Cheatsheet</dd>
        <dt><kbd>g</kbd> <kbd>f</kbd></dt><dd>Flashcards</dd>
        <dt><kbd>g</kbd> <kbd>t</kbd></dt><dd>LeetCode tricks</dd>
        <dt><kbd>t</kbd></dt><dd>Cycle theme (auto / dark / light)</dd>
        <dt><kbd>c</kbd></dt><dd>Toggle 3-day cram mode</dd>
        <dt><kbd>?</kbd></dt><dd>Show this help</dd>
        <dt><kbd>Esc</kbd></dt><dd>Close overlays / drawer</dd>
      </dl>
      <button class="btn close" id="shortcuts-close" type="button">Got it</button>
    </div>`;
  document.body.appendChild(el);
  el.addEventListener("click", (e) => { if (e.target === el) closeShortcuts(); });
  el.querySelector("#shortcuts-close").addEventListener("click", closeShortcuts);
  return el;
}
function openShortcuts() { ensureShortcutsDom().classList.add("open"); }
function closeShortcuts() { document.getElementById("shortcuts")?.classList.remove("open"); }

// ---------- Global keyboard handling ----------
function setupShortcuts() {
  let gPending = false;
  let gTimer = null;
  const editable = (el) =>
    el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.tagName === "SELECT" || el.isContentEditable);

  document.addEventListener("keydown", (e) => {
    const cmdk = document.getElementById("cmdk");
    const shortcuts = document.getElementById("shortcuts");
    const cmdkOpen = cmdk?.classList.contains("open");
    const shortcutsOpen = shortcuts?.classList.contains("open");

    if (e.key === "Escape") {
      if (cmdkOpen) { closeCmdK(); return; }
      if (shortcutsOpen) { closeShortcuts(); return; }
      if (document.body.classList.contains("drawer-open")) { window.__closeDrawer?.(); return; }
    }

    // Cmd/Ctrl+K always opens search
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
      e.preventDefault();
      cmdkOpen ? closeCmdK() : openCmdK();
      return;
    }

    // Don't interfere while typing in inputs / textareas
    if (editable(e.target)) return;

    if (e.key === "/") {
      e.preventDefault();
      openCmdK();
      return;
    }
    if (e.key === "?") {
      e.preventDefault();
      shortcutsOpen ? closeShortcuts() : openShortcuts();
      return;
    }
    if (e.key === "t" && !e.metaKey && !e.ctrlKey) {
      e.preventDefault();
      cycleTheme();
      return;
    }
    if (e.key === "c" && !e.metaKey && !e.ctrlKey) {
      e.preventDefault();
      toggleCramMode();
      return;
    }

    // g + (h / c / f / t) two-key combos
    if (gPending) {
      clearTimeout(gTimer);
      gPending = false;
      const base = basePathFromCurrent();
      const go = (href) => navigateTo(href);
      if (e.key === "h") { e.preventDefault(); go("index.html"); return; }
      if (e.key === "c") { e.preventDefault(); go("pages/cheatsheet.html"); return; }
      if (e.key === "f") { e.preventDefault(); go("pages/flashcards.html"); return; }
      if (e.key === "t") { e.preventDefault(); go("pages/leetcode-tricks.html"); return; }
      return;
    }
    if (e.key === "g") {
      gPending = true;
      gTimer = setTimeout(() => { gPending = false; }, 900);
      return;
    }
  });
}

// ---------- Lightweight Go syntax highlighter ----------
const GO_KEYWORDS = new Set([
  "break","case","chan","const","continue","default","defer","else","fallthrough",
  "for","func","go","goto","if","import","interface","map","package","range",
  "return","select","struct","switch","type","var",
  "true","false","nil","iota",
]);
const GO_TYPES = new Set([
  "string","int","int8","int16","int32","int64","uint","uint8","uint16","uint32",
  "uint64","uintptr","byte","rune","float32","float64","complex64","complex128",
  "bool","error","any",
]);

function highlightGo(src) {
  const tokens = [];
  let i = 0;
  while (i < src.length) {
    const ch = src[i];
    if (ch === "/" && src[i + 1] === "/") {
      const j = src.indexOf("\n", i);
      const end = j === -1 ? src.length : j;
      tokens.push({ t: "co", v: src.slice(i, end) });
      i = end;
      continue;
    }
    if (ch === "/" && src[i + 1] === "*") {
      const j = src.indexOf("*/", i + 2);
      const end = j === -1 ? src.length : j + 2;
      tokens.push({ t: "co", v: src.slice(i, end) });
      i = end;
      continue;
    }
    if (ch === "\"" || ch === "`") {
      const q = ch;
      let j = i + 1;
      while (j < src.length) {
        if (src[j] === "\\" && q === "\"") { j += 2; continue; }
        if (src[j] === q) { j++; break; }
        j++;
      }
      tokens.push({ t: "st", v: src.slice(i, j) });
      i = j;
      continue;
    }
    if (/[A-Za-z_]/.test(ch)) {
      let j = i + 1;
      while (j < src.length && /[A-Za-z0-9_]/.test(src[j])) j++;
      const word = src.slice(i, j);
      if (GO_KEYWORDS.has(word)) tokens.push({ t: "kw", v: word });
      else if (GO_TYPES.has(word)) tokens.push({ t: "ty", v: word });
      else if (/^[A-Z]/.test(word)) tokens.push({ t: "nm", v: word });
      else tokens.push({ t: "x", v: word });
      i = j;
      continue;
    }
    if (/[0-9]/.test(ch)) {
      let j = i + 1;
      while (j < src.length && /[0-9xX_a-fA-F\.]/.test(src[j])) j++;
      tokens.push({ t: "nm", v: src.slice(i, j) });
      i = j;
      continue;
    }
    tokens.push({ t: "x", v: ch });
    i++;
  }
  for (let k = 0; k < tokens.length - 1; k++) {
    if (tokens[k].t === "x" && /^[A-Za-z_][A-Za-z0-9_]*$/.test(tokens[k].v) && tokens[k + 1].v && tokens[k + 1].v[0] === "(") {
      tokens[k] = { t: "fn", v: tokens[k].v };
    }
  }
  return tokens.map((tok) => {
    const v = escapeHtml(tok.v);
    if (tok.t === "x") return v;
    return `<span class="${tok.t}">${v}</span>`;
  }).join("");
}

function highlightAll() {
  document.querySelectorAll('pre[data-lang="go"]').forEach((el) => {
    if (el.dataset.highlighted) return;
    el.innerHTML = highlightGo(el.textContent);
    el.dataset.highlighted = "1";
  });
}

// ---------- Boot ----------
document.addEventListener("DOMContentLoaded", () => {
  setupA11y();
  renderSidebar();
  setupMobileChrome();
  setupReadingProgress();
  setupReadingTime();
  setupHeadings();
  decorateEssentialHeadings();
  setupToc();
  highlightAll();
  setupCodeBlocks();
  bindChecklists();
  setupPrevNext();
  setupScrollTop();
  setupShortcuts();
  // Apply cram mode after layout is finalized so banner placement is correct.
  if (getCramMode()) applyCramMode(true);

  // Honor URL hash after late mutations (TOC moves content around)
  if (location.hash) {
    const target = document.querySelector(location.hash);
    if (target) {
      // Re-trigger smooth scroll after layout changes.
      setTimeout(() => target.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
    }
  }
});

// Expose a tiny global API for inline pages (e.g. flashcards stats).
window.GoZH = {
  openCmdK,
  closeCmdK,
  cycleTheme,
  toggleCramMode,
  getCramMode,
  getCompletion,
};
