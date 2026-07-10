import { formatPrice, sanitize, showToast } from "./main.js";
import { addToCart, MAX_QTY } from "./cart.js";

let allProducts = [];

// Add-to-cart button animation
const CART_ICON = `<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>`;
const CHECK_ICON = `<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" /></svg>`;

function animateAddToCart(btn) {
  if (!btn || btn.disabled) return;
  const originalLabel = btn.getAttribute("aria-label");
  const originalHTML = btn.innerHTML;
  const originalClasses = btn.className;
  btn.classList.add("btn-adding");
  btn.style.display = "flex";
  btn.style.alignItems = "center";
  btn.style.justifyContent = "center";
  btn.innerHTML = CHECK_ICON;
  btn.setAttribute("aria-label", "Added to cart");
  setTimeout(() => {
    btn.className = originalClasses;
    btn.style.display = "";
    btn.style.alignItems = "";
    btn.style.justifyContent = "";
    btn.innerHTML = originalHTML;
    btn.setAttribute("aria-label", originalLabel);
  }, 1200);
}

// Fetch with error handling
export async function fetchProducts() {
  if (allProducts.length) return allProducts;
  try {
    const res = await fetch("data/products.json");
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    allProducts = await res.json();
    return allProducts;
  } catch (err) {
    console.error("Failed to load products:", err);
    throw err;
  }
}

// Product Card
export function renderProductCard(product) {
  const badgeColors = {
    "Best Seller": "bg-fire-500",
    "New":         "bg-go",
    "Sale":        "bg-fire-600",
    "Out of Stock":"bg-forge-600",
  };

  const badgeHtml = product.badge
    ? `<span class="absolute top-3 left-3 text-xs font-bold uppercase tracking-wider px-2 py-1 rounded-md text-white ${badgeColors[product.badge] || "bg-forge-600"}" aria-label="${sanitize(product.badge)}">${sanitize(product.badge)}</span>`
    : "";

  const oldPriceHtml = product.oldPrice
    ? `<span class="text-ash-400 line-through text-sm ml-1" aria-label="Was ${formatPrice(product.oldPrice)}">${formatPrice(product.oldPrice)}</span>`
    : "";

  const ratingLabel = `${product.rating} out of 5 stars, ${product.reviews} reviews`;
  const starsDisplay = "★".repeat(Math.round(product.rating)) + "☆".repeat(5 - Math.round(product.rating));

  return `
    <article class="group bg-forge-800 rounded-2xl overflow-hidden border border-forge-700 hover:border-forge-600 transition-all duration-300 hover:-translate-y-1 hover:shadow-card-hover flex flex-col">
      <a href="product-detail.html?id=${product.id}" class="relative block overflow-hidden" tabindex="0">
        <img
          src="${sanitize(product.image)}"
          alt="${sanitize(product.name)}"
          class="w-full h-52 object-cover transition-transform duration-500 group-hover:scale-105${!product.inStock ? " opacity-60 grayscale" : ""}"
          loading="lazy"
          width="400"
          height="208"
        >
        ${badgeHtml}
        ${!product.inStock ? '<div class="absolute inset-0 flex items-center justify-center" aria-hidden="true"><span class="bg-forge-900/80 text-ash-300 text-sm font-semibold px-4 py-2 rounded-full">Out of Stock</span></div>' : ""}
      </a>
      <div class="p-4 flex flex-col flex-1">
        <span class="text-xs uppercase tracking-widest text-fire-500 font-semibold mb-1" aria-label="Category: ${sanitize(product.category)}">${sanitize(product.category)}</span>
        <a href="product-detail.html?id=${product.id}" class="font-semibold text-white hover:text-fire-400 transition-colors mb-2 leading-snug line-clamp-2">${sanitize(product.name)}</a>
        <div class="flex items-center gap-1 mb-3" aria-label="${ratingLabel}">
          <span class="text-fire-400 text-xs tracking-tight" aria-hidden="true">${starsDisplay}</span>
          <span class="text-ash-400 text-xs">(${product.reviews})</span>
        </div>
        <div class="mt-auto flex items-center justify-between">
          <div>
            <span class="text-white font-bold text-lg" aria-label="Price: ${formatPrice(product.price)}">${formatPrice(product.price)}</span>
            ${oldPriceHtml}
          </div>
          <button
            data-add-to-cart="${product.id}"
            aria-label="${product.inStock ? `Add ${sanitize(product.name)} to cart` : `${sanitize(product.name)} is out of stock`}"
            ${!product.inStock ? "disabled aria-disabled='true'" : ""}
            class="w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200 focus-ring ${product.inStock ? "bg-fire-600 hover:bg-fire-500 text-white hover:shadow-fire" : "bg-forge-700 text-ash-500 cursor-not-allowed"}"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </button>
        </div>
      </div>
    </article>
  `;
}

// Event delegation — no global window pollution
document.addEventListener("click", (e) => {
  const btn = e.target.closest("[data-add-to-cart]");
  if (!btn || btn.disabled) return;
  const id = parseInt(btn.dataset.addToCart, 10);
  const product = allProducts.find((p) => p.id === id);
  if (product) {
    addToCart(product);
    animateAddToCart(btn);
  }
});

// Loading Skeleton
function renderSkeleton(count = 4) {
  return Array.from({ length: count }, () => `
    <div class="bg-forge-800 rounded-2xl overflow-hidden border border-forge-700 animate-pulse">
      <div class="w-full h-52 bg-forge-600"></div>
      <div class="p-4 space-y-3">
        <div class="h-3 bg-forge-700 rounded w-1/4"></div>
        <div class="h-4 bg-forge-700 rounded w-3/4"></div>
        <div class="h-3 bg-forge-700 rounded w-1/3"></div>
        <div class="h-6 bg-forge-700 rounded w-1/2 mt-4"></div>
      </div>
    </div>
  `).join("");
}

// Error State 
function renderError(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = `
    <div class="col-span-full text-center py-20">
      <div class="w-16 h-16 bg-forge-800 border border-forge-700 rounded-full flex items-center justify-center mx-auto mb-4">
        <svg xmlns="http://www.w3.org/2000/svg" class="w-8 h-8 text-fire-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
      </div>
      <h2 class="font-display text-2xl font-bold text-white uppercase mb-2">Couldn't Load Products</h2>
      <p class="text-ash-400 mb-6">Please check your connection and try again.</p>
      <button onclick="window.location.reload()" class="btn-primary">Try Again</button>
    </div>
  `;
}

// Featured Products
export async function renderFeaturedProducts(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = renderSkeleton(4);
  try {
    const products = await fetchProducts();
    container.innerHTML = products.filter((p) => p.featured).map(renderProductCard).join("");
  } catch {
    renderError(containerId);
  }
}

// All Products
export async function renderAllProducts(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = renderSkeleton(8);
  try {
    const products = await fetchProducts();
    container.innerHTML = products.map(renderProductCard).join("");
    return products;
  } catch {
    renderError(containerId);
    return [];
  }
}

// Product Detail Page
export async function renderProductDetail() {
  const detailEl = document.getElementById("product-detail");
  if (!detailEl) return;

  detailEl.innerHTML = `<div class="text-center py-20 text-ash-400" aria-live="polite">Loading product…</div>`;

  const params = new URLSearchParams(window.location.search);
  const id = parseInt(params.get("id"), 10);

  try {
    const products = await fetchProducts();
    const product = products.find((p) => p.id === id);

    if (!product) {
      detailEl.innerHTML = `
        <div class="text-center py-24" role="main">
          <h1 class="font-display text-3xl font-bold text-white uppercase mb-4">Product Not Found</h1>
          <p class="text-ash-300 mb-8">The product you're looking for doesn't exist or has been removed.</p>
          <a href="products.html" class="btn-primary">Browse All Products</a>
        </div>`;
      return;
    }

    // Update page title and meta description
    document.title = `${sanitize(product.name)} — KunoFitness`;
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute("content", product.description.substring(0, 160));

    // Inject JSON-LD structured data for SEO
    const existingLd = document.getElementById("product-ld");
    if (existingLd) existingLd.remove();
    const script = document.createElement("script");
    script.id = "product-ld";
    script.type = "application/ld+json";
    script.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Product",
      name: product.name,
      description: product.description,
      image: product.images,
      sku: `KF-${product.id}`,
      brand: { "@type": "Brand", name: "KunoFitness" },
      offers: {
        "@type": "Offer",
        priceCurrency: "NGN",
        price: product.price,
        availability: product.inStock
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
        seller: { "@type": "Organization", name: "KunoFitness" },
      },
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: product.rating,
        reviewCount: product.reviews,
      },
    });
    document.head.appendChild(script);

    const ratingLabel = `${product.rating} out of 5, ${product.reviews} reviews`;
    const starsDisplay = "★".repeat(Math.round(product.rating)) + "☆".repeat(5 - Math.round(product.rating));
    const oldPrice = product.oldPrice
      ? `<span class="text-ash-400 line-through text-xl ml-2" aria-label="Was ${formatPrice(product.oldPrice)}">${formatPrice(product.oldPrice)}</span>`
      : "";

    detailEl.innerHTML = `
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
        <div>
          <div class="rounded-2xl overflow-hidden bg-forge-800 border border-forge-700 mb-3">
            <img id="main-img" src="${sanitize(product.images[0])}" alt="${sanitize(product.name)}" class="w-full h-96 object-cover" width="600" height="384">
          </div>
          ${product.images.length > 1 ? `
            <div class="flex gap-3" role="list" aria-label="Product images">
              ${product.images.map((img, i) => `
                <button
                  data-thumb="${sanitize(img)}"
                  aria-label="View image ${i + 1}"
                  class="w-20 h-20 rounded-xl overflow-hidden border-2 ${i === 0 ? "border-fire-500" : "border-forge-700"} hover:border-fire-500 transition-colors flex-shrink-0 focus-ring"
                  role="listitem"
                >
                  <img src="${sanitize(img)}" alt="Product view ${i + 1}" class="w-full h-full object-cover" width="80" height="80">
                </button>`).join("")}
            </div>` : ""}
        </div>

        <div>
          <span class="text-xs uppercase tracking-widest text-fire-500 font-bold">${sanitize(product.category)}</span>
          <h1 class="font-display text-4xl font-bold text-white mt-2 mb-3 uppercase tracking-tight">${sanitize(product.name)}</h1>
          <div class="flex items-center gap-2 mb-5" aria-label="${ratingLabel}">
            <span class="text-fire-400" aria-hidden="true">${starsDisplay}</span>
            <span class="text-ash-400 text-sm">${product.rating} · ${product.reviews} reviews</span>
          </div>
          <div class="flex items-baseline gap-1 mb-6">
            <span class="text-3xl font-bold text-white" aria-label="Price: ${formatPrice(product.price)}">${formatPrice(product.price)}</span>
            ${oldPrice}
          </div>
          <p class="text-ash-300 leading-relaxed mb-8">${sanitize(product.description)}</p>

          <div class="flex items-center gap-3 mb-6">
            <div class="flex items-center border border-forge-600 rounded-xl overflow-hidden" role="group" aria-label="Quantity">
              <button id="qty-minus" aria-label="Decrease quantity" class="w-11 h-11 flex items-center justify-center text-ash-300 hover:text-white hover:bg-forge-600 transition-colors text-xl focus-ring">−</button>
              <span id="qty-display" aria-live="polite" aria-label="Quantity: 1" class="w-10 text-center text-white font-semibold">1</span>
              <button id="qty-plus" aria-label="Increase quantity" class="w-11 h-11 flex items-center justify-center text-ash-300 hover:text-white hover:bg-forge-600 transition-colors text-xl focus-ring">+</button>
            </div>
            <button
              id="atc-btn"
              aria-label="${product.inStock ? `Add ${sanitize(product.name)} to cart` : "Out of stock"}"
              ${!product.inStock ? "disabled aria-disabled='true'" : ""}
              class="flex-1 h-11 rounded-xl font-bold uppercase tracking-widest text-sm transition-all duration-200 focus-ring ${product.inStock ? "bg-fire-600 hover:bg-fire-500 text-white hover:shadow-fire" : "bg-forge-700 text-ash-500 cursor-not-allowed"}"
            >
              ${product.inStock ? "Add to Cart" : "Out of Stock"}
            </button>
          </div>

          <div class="flex items-center gap-2 text-sm ${product.inStock ? "text-go" : "text-ash-400"}" aria-live="polite">
            <span aria-hidden="true">${product.inStock ? "✓" : "✗"}</span>
            <span>${product.inStock ? "In stock — ready to ship" : "Currently out of stock"}</span>
          </div>
        </div>
      </div>

      <div class="mt-20">
        <h2 class="font-display text-3xl font-bold text-white uppercase tracking-tight mb-8">You might also like</h2>
        <div id="related-grid" class="grid grid-cols-2 md:grid-cols-4 gap-5" aria-label="Related products"></div>
      </div>
    `;

    // Thumbnail switcher
    let fadeTimer;
    detailEl.querySelectorAll("[data-thumb]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const mainImg = document.getElementById("main-img");
        if (!mainImg) return;

        // Update active thumbnail border immediately
        detailEl.querySelectorAll("[data-thumb]").forEach((b) => {
          b.classList.toggle("border-fire-500", b === btn);
          b.classList.toggle("border-forge-700", b !== btn);
        });

        // Phase 1 — fade out
        clearTimeout(fadeTimer);
        mainImg.classList.remove("img-fade-in");
        mainImg.classList.add("img-fade-out");

        // Phase 2 — swap src while invisible
        fadeTimer = setTimeout(() => {
          mainImg.src = btn.dataset.thumb;
          mainImg.alt = btn.querySelector("img")?.alt || product.name;

          // Phase 3 — fade in
          mainImg.classList.remove("img-fade-out");
          mainImg.classList.add("img-fade-in");

          // Cleanup
          fadeTimer = setTimeout(() => {
            mainImg.classList.remove("img-fade-in");
          }, 150);
        }, 150);
      });
    });

    // Quantity controls
    let qty = 1;
    const qtyDisplay = document.getElementById("qty-display");
    const updateQtyDisplay = () => {
      if (qtyDisplay) {
        qtyDisplay.textContent = qty;
        qtyDisplay.setAttribute("aria-label", `Quantity: ${qty}`);
      }
    };

    document.getElementById("qty-minus")?.addEventListener("click", () => {
      if (qty > 1) { qty--; updateQtyDisplay(); }
    });
    document.getElementById("qty-plus")?.addEventListener("click", () => {
      if (qty >= MAX_QTY) {
        showToast(`Maximum quantity is ${MAX_QTY}`, "info");
        return;
      }
      qty++;
      updateQtyDisplay();
    });
    document.getElementById("atc-btn")?.addEventListener("click", (e) => {
      addToCart(product, qty);
      animateAddToCart(e.currentTarget);
    });

    // Related products
    const related = products.filter((p) => p.category === product.category && p.id !== product.id).slice(0, 4);
    const relatedGrid = document.getElementById("related-grid");
    if (relatedGrid) relatedGrid.innerHTML = related.map(renderProductCard).join("");

  } catch {
    detailEl.innerHTML = `
      <div class="text-center py-24">
        <h1 class="font-display text-3xl font-bold text-white uppercase mb-4">Something Went Wrong</h1>
        <p class="text-ash-300 mb-8">We couldn't load this product. Please try again.</p>
        <a href="products.html" class="btn-primary">Browse All Products</a>
      </div>`;
  }
}
