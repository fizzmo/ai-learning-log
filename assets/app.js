/* AI Learning Log (Jekyll) — progressive enhancement over server-rendered HTML.
   Content is built by Jekyll; this only adds theme toggle, search, and tag filtering. */

(() => {
  "use strict";

  const root = document.documentElement;
  const search = document.getElementById("search");
  const toggle = document.getElementById("theme-toggle");
  const count = document.getElementById("count");
  const empty = document.getElementById("empty");
  const entries = Array.from(document.querySelectorAll(".entry"));
  let activeTag = "";

  /* ---------- Theme ---------- */
  const saved = localStorage.getItem("theme");
  if (saved) root.setAttribute("data-theme", saved);
  if (toggle) {
    toggle.addEventListener("click", () => {
      const current =
        root.getAttribute("data-theme") ||
        (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
      const next = current === "dark" ? "light" : "dark";
      root.setAttribute("data-theme", next);
      localStorage.setItem("theme", next);
    });
  }

  /* ---------- Filtering ---------- */
  function apply() {
    const q = (search ? search.value : "").toLowerCase().trim();
    let shown = 0;
    entries.forEach((el) => {
      const tags = (el.dataset.tags || "").split(/\s+/);
      const matchTag = !activeTag || tags.includes(activeTag);
      const matchText = !q || el.textContent.toLowerCase().includes(q);
      const visible = matchTag && matchText;
      el.style.display = visible ? "" : "none";
      if (visible) shown++;
    });
    if (empty) empty.hidden = shown > 0;
    if (count) count.textContent = `${shown} of ${entries.length} learnings shown`;
  }

  function setTag(tag) {
    activeTag = activeTag === tag ? "" : tag;
    document.querySelectorAll(".tag-chip").forEach((c) =>
      c.classList.toggle("active", (c.dataset.tag || "") === activeTag));
    apply();
  }

  document.querySelectorAll(".tag-chip").forEach((chip) => {
    chip.addEventListener("click", () => setTag(chip.dataset.tag || ""));
  });
  document.querySelectorAll(".entry-tag").forEach((chip) => {
    if (chip.dataset.tag) {
      chip.addEventListener("click", (e) => {
        e.preventDefault();
        setTag(chip.dataset.tag);
        window.scrollTo({ top: 0, behavior: "smooth" });
      });
    }
  });
  if (search) search.addEventListener("input", apply);

  /* Deep-link support: /#tag=rag pre-selects a filter (used by permalink pages). */
  const m = location.hash.match(/tag=([\w-]+)/);
  if (m) setTag(m[1].toLowerCase());

  apply();
})();
