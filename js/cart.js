import { formatPrice, showToast, updateCartBadge, sanitize } from "./main.js";

// Fixed key — old code used "fg_cart" (ForgeFit remnant)
const CART_KEY = "kf_cart";

// Maximum quantity allowed per product
// Future: individual products can override this via a maxQty field in products.json
export const MAX_QTY = 10;

// ─── Core Cart API ────────────────────────────────────────────
export function getCart() {
  try {
    return JSON.parse(localStorage.getItem(CART_KEY) || "[]");
  } catch {
    return [];
  }
}

export function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  updateCartBadge();
}

export function addToCart(product, qty = 1) {
  if (!product.inStock) {
    showToast("This product is out of stock", "error");
    return;
  }
  const cart = getCart();
  const existing = cart.find((i) => i.id === product.id);
  if (existing) {
    existing.qty += qty;
  } else {
    cart.push({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      category: product.category,
      qty,
    });
  }
  saveCart(cart);
  showToast(`${product.name} added to cart`);
}

export function removeFromCart(productId) {
  saveCart(getCart().filter((i) => i.id !== productId));
}

export function updateQty(productId, qty) {
  const cart = getCart();
  const item = cart.find((i) => i.id === productId);
  if (!item) return;
  if (qty <= 0) {
    removeFromCart(productId);
  } else {
    if (qty > MAX_QTY) {
      showToast(`Maximum quantity is ${MAX_QTY}`, "info");
      qty = MAX_QTY;
    }
    item.qty = qty;
    saveCart(cart);
  }
}

export function clearCart() {
  localStorage.removeItem(CART_KEY);
  updateCartBadge();
}

export function getCartTotal() {
  return getCart().reduce((sum, i) => sum + i.price * i.qty, 0);
}

export function getCartCount() {
  return getCart().reduce((sum, i) => sum + i.qty, 0);
}

// ─── Render Cart Page ─────────────────────────────────────────
export function renderCartPage() {
  const container = document.getElementById("cart-items");
  const emptyMsg = document.getElementById("cart-empty");
  const summaryBox = document.getElementById("cart-summary");
  if (!container) return;

  const cart = getCart();

  if (cart.length === 0) {
    container.innerHTML = "";
    emptyMsg?.classList.remove("hidden");
    summaryBox?.classList.add("hidden");
    return;
  }

  emptyMsg?.classList.add("hidden");
  summaryBox?.classList.remove("hidden");

  // Use data attributes instead of inline onclick — no global namespace pollution
  container.innerHTML = cart
    .map(
      (item) => `
    <div class="flex gap-4 items-start py-5 border-b border-forge-700" data-cart-item="${item.id}">
      <a href="product-detail.html?id=${item.id}" aria-label="View ${sanitize(item.name)}">
        <img src="${sanitize(item.image)}" alt="${sanitize(item.name)}" class="w-20 h-20 object-cover rounded-xl flex-shrink-0 bg-forge-700" width="80" height="80">
      </a>
      <div class="flex-1 min-w-0">
        <a href="product-detail.html?id=${item.id}" class="font-semibold text-white hover:text-fire-400 transition-colors line-clamp-2">${sanitize(item.name)}</a>
        <p class="text-ash-400 text-sm mt-1">${sanitize(item.category)}</p>
        <div class="flex items-center gap-3 mt-3">
          <div class="flex items-center border border-forge-600 rounded-lg overflow-hidden" role="group" aria-label="Quantity for ${sanitize(item.name)}">
            <button data-qty="${item.id}:${item.qty - 1}" aria-label="Decrease quantity" class="w-8 h-8 flex items-center justify-center text-ash-300 hover:text-white hover:bg-forge-600 transition-colors text-lg focus-ring">−</button>
            <span aria-live="polite" aria-label="Quantity: ${item.qty}" class="w-8 text-center text-white font-medium text-sm">${item.qty}</span>
            <button data-qty="${item.id}:${item.qty + 1}" aria-label="Increase quantity" class="w-8 h-8 flex items-center justify-center text-ash-300 hover:text-white hover:bg-forge-600 transition-colors text-lg focus-ring">+</button>
          </div>
          <button data-remove="${item.id}" class="text-ash-400 hover:text-fire-400 text-sm transition-colors focus-ring" aria-label="Remove ${sanitize(item.name)} from cart">Remove</button>
        </div>
      </div>
      <div class="text-right flex-shrink-0">
        <p class="text-white font-bold">${formatPrice(item.price * item.qty)}</p>
        <p class="text-ash-400 text-xs mt-1">${formatPrice(item.price)} each</p>
      </div>
    </div>
  `
    )
    .join("");

  // Event delegation — no global window pollution
  container.addEventListener("click", handleCartAction);

  // Update totals
  const total = getCartTotal();
  const count = getCartCount();
  const totalEl = document.getElementById("cart-total");
  const totalFinalEl = document.getElementById("cart-total-final");
  const countEl = document.getElementById("cart-count");
  if (totalEl) totalEl.textContent = formatPrice(total);
  if (totalFinalEl) totalFinalEl.textContent = formatPrice(total);
  if (countEl) countEl.textContent = `${count} item${count !== 1 ? "s" : ""}`;
}

function handleCartAction(e) {
  const qtyBtn = e.target.closest("[data-qty]");
  const removeBtn = e.target.closest("[data-remove]");

  if (qtyBtn) {
    const [id, qty] = qtyBtn.dataset.qty.split(":").map(Number);
    updateQty(id, qty);
    renderCartPage();
    return;
  }

  if (removeBtn) {
    const id = parseInt(removeBtn.dataset.remove, 10);
    removeFromCart(id);
    renderCartPage();
    showToast("Item removed", "info");
  }
}
