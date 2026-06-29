import { renderProductCard } from "./products.js";
import { sanitize, debounce } from "./main.js";

export function initFilters(products) {
  const grid      = document.getElementById("products-grid");
  const searchInput = document.getElementById("search-input");
  const categoryBtns = document.querySelectorAll("[data-category]");
  const sortSelect  = document.getElementById("sort-select");
  const countEl    = document.getElementById("product-count");

  let currentCategory = "All";
  let currentSearch   = "";
  let currentSort     = "default";

  function applyFilters() {
    let filtered = [...products];

    if (currentCategory !== "All") {
      filtered = filtered.filter((p) => p.category === currentCategory);
    }

    if (currentSearch) {
      const q = currentSearch.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q)
      );
    }

    if (currentSort === "price-asc")  filtered.sort((a, b) => a.price - b.price);
    if (currentSort === "price-desc") filtered.sort((a, b) => b.price - a.price);
    if (currentSort === "rating")     filtered.sort((a, b) => b.rating - a.rating);
    if (currentSort === "name")       filtered.sort((a, b) => a.name.localeCompare(b.name));

    if (grid) {
      if (filtered.length === 0) {
        grid.innerHTML = `
          <div class="col-span-full text-center py-16" role="status" aria-live="polite">
            <p class="text-ash-300 text-lg">No products found for "<strong class="text-white">${sanitize(currentSearch)}</strong>"</p>
            <button id="clear-search-btn" class="mt-4 text-fire-400 hover:text-fire-300 text-sm underline focus-ring">Clear search</button>
          </div>`;
        document.getElementById("clear-search-btn")?.addEventListener("click", clearSearch);
      } else {
        grid.innerHTML = filtered.map(renderProductCard).join("");
      }
    }

    if (countEl) {
      const msg = `${filtered.length} product${filtered.length !== 1 ? "s" : ""}`;
      countEl.textContent = msg;
      countEl.setAttribute("aria-live", "polite");
    }
  }

  // Debounced search — prevents firing on every keystroke
  const debouncedSearch = debounce((value) => {
    currentSearch = value;
    applyFilters();
  }, 300);

  searchInput?.addEventListener("input", (e) => {
    debouncedSearch(e.target.value.trim());
  });

  // Category pills
  categoryBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      currentCategory = btn.dataset.category;
      categoryBtns.forEach((b) => {
        const isActive = b === btn;
        b.classList.toggle("bg-fire-600", isActive);
        b.classList.toggle("text-white",  isActive);
        b.classList.toggle("border-fire-600", isActive);
        b.classList.toggle("text-ash-300",    !isActive);
        b.classList.toggle("border-forge-600", !isActive);
        b.setAttribute("aria-pressed", String(isActive));
      });
      applyFilters();
    });

    // Set initial aria-pressed state
    btn.setAttribute("aria-pressed", btn.dataset.category === "All" ? "true" : "false");
    btn.setAttribute("type", "button");
  });

  sortSelect?.addEventListener("change", (e) => {
    currentSort = e.target.value;
    applyFilters();
  });

  function clearSearch() {
    currentSearch = "";
    if (searchInput) searchInput.value = "";
    applyFilters();
    searchInput?.focus();
  }

  // Handle URL-passed category (e.g. from homepage category cards)
  const params = new URLSearchParams(window.location.search);
  const cat = params.get("category");
  if (cat) {
    currentCategory = cat;
    categoryBtns.forEach((btn) => {
      const isActive = btn.dataset.category === cat;
      btn.classList.toggle("bg-fire-600", isActive);
      btn.classList.toggle("text-white",  isActive);
      btn.classList.toggle("border-fire-600", isActive);
      btn.classList.toggle("text-ash-300",    !isActive);
      btn.classList.toggle("border-forge-600", !isActive);
      btn.setAttribute("aria-pressed", String(isActive));
    });
  }

  applyFilters();
}
