// ─── HTML Sanitizer (prevents XSS) ────────────────────────────
export function sanitize(str) {
  const div = document.createElement("div");
  div.appendChild(document.createTextNode(String(str ?? "")));
  return div.innerHTML;
}

// ─── Debounce ─────────────────────────────────────────────────
export function debounce(fn, delay = 300) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

// ─── Price Formatter ──────────────────────────────────────────
export function formatPrice(amount) {
  return "₦" + Number(amount).toLocaleString("en-NG");
}

// ─── ARIA Live Region (for screen readers) ────────────────────
function ensureLiveRegion() {
  let region = document.getElementById("aria-live");
  if (!region) {
    region = document.createElement("div");
    region.id = "aria-live";
    region.setAttribute("role", "status");
    region.setAttribute("aria-live", "polite");
    region.setAttribute("aria-atomic", "true");
    region.className = "sr-only";
    document.body.appendChild(region);
  }
  return region;
}

// ─── Toast Notifications ──────────────────────────────────────
export function showToast(message, type = "success") {
  const existing = document.getElementById("toast");
  if (existing) existing.remove();

  const bg =
    type === "success" ? "bg-go" :
    type === "error"   ? "bg-fire-500" :
                         "bg-forge-700";

  const toast = document.createElement("div");
  toast.id = "toast";
  toast.setAttribute("role", "alert");
  toast.setAttribute("aria-live", "assertive");
  toast.className = `fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] px-6 py-3 rounded-xl ${bg} text-white text-sm font-medium shadow-lg flex items-center gap-2 transition-all duration-300 opacity-0 translate-y-4`;
  toast.innerHTML = `<span aria-hidden="true">${type === "success" ? "✓" : "!"}</span><span>${sanitize(message)}</span>`;
  document.body.appendChild(toast);

  // Announce to screen readers
  const liveRegion = ensureLiveRegion();
  liveRegion.textContent = message;
  setTimeout(() => { liveRegion.textContent = ""; }, 3000);

  requestAnimationFrame(() => {
    toast.classList.remove("opacity-0", "translate-y-4");
  });

  setTimeout(() => {
    toast.classList.add("opacity-0", "translate-y-4");
    setTimeout(() => toast.remove(), 300);
  }, 2800);
}

// ─── Cart Count Badge ─────────────────────────────────────────
export function updateCartBadge() {
  const cart = JSON.parse(localStorage.getItem("kf_cart") || "[]");
  const total = cart.reduce((sum, i) => sum + i.qty, 0);
  document.querySelectorAll(".cart-badge").forEach((el) => {
    el.textContent = total;
    el.classList.toggle("hidden", total === 0);
    if (total > 0) {
      el.classList.remove("badge-pop");
      requestAnimationFrame(() => {
        el.classList.add("badge-pop");
        el.addEventListener("animationend", () => el.classList.remove("badge-pop"), { once: true });
      });
    }
  });
  // Update aria-label on cart link
  document.querySelectorAll("a[href='cart.html']").forEach((el) => {
    el.setAttribute("aria-label", `Shopping cart${total > 0 ? `, ${total} item${total !== 1 ? "s" : ""}` : ""}`);
  });
}

// ─── Active Nav Link ──────────────────────────────────────────
function setActiveNav() {
  const path = window.location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll("[data-nav]").forEach((link) => {
    const href = link.getAttribute("href");
    const isActive = href === path || (path === "" && href === "index.html");
    link.classList.toggle("text-fire-500", isActive);
    link.classList.toggle("text-ash-300", !isActive);
    if (isActive) link.setAttribute("aria-current", "page");
  });
}

// ─── Mobile Menu ─────────────────────────────────────────────
function initMobileMenu() {
  const btn  = document.getElementById("menu-btn");
  const menu = document.getElementById("mobile-menu");
  if (!btn || !menu) return;

  const open = () => {
    menu.classList.replace("mobile-menu-closed", "mobile-menu-open");
    btn.setAttribute("aria-expanded", "true");
    btn.setAttribute("aria-label", "Close menu");
  };

  const close = () => {
    menu.classList.replace("mobile-menu-open", "mobile-menu-closed");
    btn.setAttribute("aria-expanded", "false");
    btn.setAttribute("aria-label", "Open menu");
  };

  const toggle = () => {
    menu.classList.contains("mobile-menu-open") ? close() : open();
  };

  btn.setAttribute("aria-expanded", "false");
  btn.setAttribute("aria-controls", "mobile-menu");
  btn.setAttribute("aria-label", "Open menu");
  menu.setAttribute("role", "navigation");
  menu.setAttribute("aria-label", "Mobile navigation");

  btn.addEventListener("click", toggle);

  // Close menu when any nav link is clicked
  menu.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", close);
  });

  // Close on Escape key
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && menu.classList.contains("mobile-menu-open")) {
      close();
      btn.focus();
    }
  });
}

// ─── Copyright Year ───────────────────────────────────────────
function setCopyrightYear() {
  const year = new Date().getFullYear();
  document.querySelectorAll(".copyright-year").forEach((el) => {
    el.textContent = year;
  });
}

// ─── Scroll Reveal ────────────────────────────────────────────
function initScrollReveal() {
  const targets = document.querySelectorAll("[data-reveal]");
  if (!targets.length) return;

  targets.forEach((el) => el.classList.add("reveal"));

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const delay = parseInt(entry.target.dataset.revealDelay || "0", 10);
        setTimeout(() => entry.target.classList.add("revealed"), delay);
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.15 }
  );

  targets.forEach((el) => observer.observe(el));
}


// ─── Page Transitions ─────────────────────────────────────────
function initPageTransitions() {
  document.addEventListener("click", (e) => {
    const link = e.target.closest("a");
    if (!link) return;

    const href = link.getAttribute("href");
    if (
      !href ||
      href.startsWith("#") ||
      href.startsWith("mailto:") ||
      href.startsWith("tel:") ||
      href.startsWith("https://") ||
      href.startsWith("http://") ||
      link.hasAttribute("download") ||
      link.getAttribute("target") === "_blank"
    ) return;

    e.preventDefault();
    document.body.classList.add("page-leaving");
    setTimeout(() => { window.location.href = href; }, 200);
  });
}


// ─── Init ─────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  updateCartBadge();
  setActiveNav();
  initMobileMenu();
  setCopyrightYear();
  initScrollReveal();
  initPageTransitions();
});
