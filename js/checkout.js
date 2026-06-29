import { getCart, getCartTotal, clearCart } from "./cart.js";
import { formatPrice, sanitize, showToast } from "./main.js";
import {
  generateOrderRef,
  buildWhatsAppOrder,
  buildBankTransferConfirmation,
  openWhatsApp,
  validateCheckoutFields,
  showFieldError,
  clearFieldError,
} from "./whatsapp.js";

// ← Update before go-live: replace with client's real account number
const ACCT_NUMBER = "1234567890";

// ─── Init Single-Page Checkout ────────────────────────────────
export function initCheckout() {
  const cart  = getCart();
  const total = getCartTotal();

  // Redirect to cart if empty
  if (!cart.length) {
    window.location.href = "cart.html";
    return;
  }

  renderOrderSummary(cart, total);
  initPaymentSelection(cart, total);
  initFormValidation();
}

// ─── Render Order Summary ─────────────────────────────────────
function renderOrderSummary(cart, total) {
  const summaryItemsEl = document.getElementById("co-summary-items");
  const summaryTotalEl = document.getElementById("co-summary-total");

  if (summaryItemsEl) {
    summaryItemsEl.innerHTML = cart.map((item) => `
      <div class="flex items-center gap-3 py-3 border-b border-forge-700 last:border-0">
        <img src="${sanitize(item.image)}" alt="${sanitize(item.name)}" class="w-14 h-14 rounded-xl object-cover bg-forge-700 flex-shrink-0" width="56" height="56">
        <div class="flex-1 min-w-0">
          <p class="text-white text-sm font-medium line-clamp-2">${sanitize(item.name)}</p>
          <p class="text-ash-400 text-xs mt-0.5">${sanitize(item.category)} · Qty ${item.qty}</p>
        </div>
        <span class="text-white text-sm font-semibold flex-shrink-0">${formatPrice(item.price * item.qty)}</span>
      </div>
    `).join("");
  }

  if (summaryTotalEl) summaryTotalEl.textContent = formatPrice(total);
}

// ─── Payment Method Selection ─────────────────────────────────
function initPaymentSelection(cart, total) {
  const optWhatsapp   = document.getElementById("opt-whatsapp");
  const optBank       = document.getElementById("opt-bank");
  const actionSection = document.getElementById("co-action");
  const whatsappPanel = document.getElementById("action-whatsapp");
  const bankPanel     = document.getElementById("action-bank");

  if (!optWhatsapp || !optBank) return;

  function selectPayment(selected, panel, other, otherPanel) {
    // Highlight selected card
    selected.classList.add("border-fire-500", "bg-fire-600/10");
    selected.classList.remove("border-forge-600");
    selected.setAttribute("aria-pressed", "true");

    // Reset other card
    other.classList.remove("border-fire-500", "bg-fire-600/10");
    other.classList.add("border-forge-600");
    other.setAttribute("aria-pressed", "false");

    // Show action section
    actionSection?.classList.remove("hidden");

    // Collapse other panel, expand selected panel
    otherPanel.classList.add("hidden");
    panel.classList.remove("hidden");

    // Inject account number for bank transfer
    if (panel === bankPanel) {
      const acctEl = document.getElementById("co-acct-number");
      if (acctEl) acctEl.textContent = ACCT_NUMBER;
      const totalDueEl = document.getElementById("co-total-due");
      if (totalDueEl) totalDueEl.textContent = formatPrice(total);
      const refNoteEl = document.getElementById("co-bank-ref-note");
      // Note updated with real ref when order is placed
      if (refNoteEl) refNoteEl.textContent = "Always quote your order reference when making a transfer.";
    }
  }

  optWhatsapp.addEventListener("click", () => {
    selectPayment(optWhatsapp, whatsappPanel, optBank, bankPanel);
  });

  optBank.addEventListener("click", () => {
    selectPayment(optBank, bankPanel, optWhatsapp, whatsappPanel);
  });

  // Wire action buttons
  initWhatsAppAction(cart, total);
  initBankTransferAction(cart, total);
}

// ─── WhatsApp Order Button ────────────────────────────────────
function initWhatsAppAction(cart, total) {
  const btn = document.getElementById("btn-whatsapp-order");
  if (!btn) return;

  btn.addEventListener("click", () => {
    const customerInfo = getCustomerInfo();
    if (!validateAndShow(customerInfo)) return;

    btn.textContent = "Opening WhatsApp…";
    btn.disabled = true;
    btn.setAttribute("aria-busy", "true");

    setTimeout(() => {
      const orderRef = generateOrderRef();
      const message  = buildWhatsAppOrder(customerInfo, orderRef, cart, total);

      sessionStorage.setItem("kf_last_order", JSON.stringify({
        orderRef,
        paymentMethod: "whatsapp",
        items: cart,
        total,
        customer: { name: customerInfo.name, phone: customerInfo.phone },
        placedAt: new Date().toISOString(),
      }));

      const opened = openWhatsApp(message, "co-whatsapp-fallback");
      if (!opened) {
        btn.textContent = "Send Order via WhatsApp";
        btn.disabled = false;
        btn.removeAttribute("aria-busy");
        return;
      }

      clearCart();
      window.location.href = "order-confirmation.html";
    }, 400);
  });
}

// ─── Bank Transfer Action Button ──────────────────────────────
function initBankTransferAction(cart, total) {
  const btn         = document.getElementById("btn-bank-notify");
  const copyAcctBtn = document.getElementById("co-copy-acct-btn");
  const copyIcon    = document.getElementById("co-acct-copy-icon");
  const checkIcon   = document.getElementById("co-acct-check-icon");
  const acctEl      = document.getElementById("co-acct-number");

  // Copy account number
  copyAcctBtn?.addEventListener("click", async () => {
    const acct = acctEl?.textContent?.trim();
    if (!acct) return;
    try {
      await navigator.clipboard.writeText(acct);
      copyIcon?.classList.add("hidden");
      checkIcon?.classList.remove("hidden");
      copyAcctBtn.setAttribute("aria-label", "Copied!");
      setTimeout(() => {
        copyIcon?.classList.remove("hidden");
        checkIcon?.classList.add("hidden");
        copyAcctBtn.setAttribute("aria-label", "Copy account number");
      }, 1500);
    } catch {}
  });

  // I Have Transferred button
  if (!btn) return;
  btn.addEventListener("click", () => {
    const customerInfo = getCustomerInfo();
    if (!validateAndShow(customerInfo)) {
      // Scroll to form if validation fails
      document.getElementById("co-delivery")?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }

    btn.textContent = "Opening WhatsApp…";
    btn.disabled = true;
    btn.setAttribute("aria-busy", "true");

    setTimeout(() => {
      const orderRef = generateOrderRef();
      const message  = buildBankTransferConfirmation(customerInfo, orderRef, cart, total);

      // Update bank ref note with real ref
      const refNoteEl = document.getElementById("co-bank-ref-note");
      if (refNoteEl) refNoteEl.textContent = `Always quote your order reference (${orderRef}) when making a transfer.`;

      sessionStorage.setItem("kf_last_order", JSON.stringify({
        orderRef,
        paymentMethod: "bank-transfer",
        items: cart,
        total,
        customer: { name: customerInfo.name, phone: customerInfo.phone },
        placedAt: new Date().toISOString(),
      }));

      const opened = openWhatsApp(message, "co-bank-fallback");
      if (!opened) {
        btn.textContent = "I Have Transferred — Notify via WhatsApp";
        btn.disabled = false;
        btn.removeAttribute("aria-busy");
        return;
      }

      clearCart();
      window.location.href = "order-confirmation.html";
    }, 400);
  });
}

// ─── Get Customer Info from Form ──────────────────────────────
function getCustomerInfo() {
  return {
    name:    document.getElementById("co-name")?.value.trim()    || "",
    phone:   document.getElementById("co-phone")?.value.trim()   || "",
    address: document.getElementById("co-address")?.value.trim() || "",
    note:    document.getElementById("co-note")?.value.trim()    || "",
  };
}

// ─── Validate and Show Errors ─────────────────────────────────
function validateAndShow(customerInfo) {
  // Clear existing errors
  ["co-name", "co-phone", "co-address"].forEach((id) => {
    const el = document.getElementById(id);
    if (el) clearFieldError(el, id);
  });

  const errors = validateCheckoutFields(customerInfo);
  if (errors.length > 0) {
    errors.forEach(({ field, msg }) => {
      const el = document.getElementById(`co-${field}`);
      if (el) showFieldError(el, `co-${field}`, msg);
    });
    document.getElementById(`co-${errors[0].field}`)?.focus();
    showToast("Please complete your delivery details.", "info");
    return false;
  }
  return true;
}

// ─── Real-Time Field Validation on Blur ───────────────────────
function initFormValidation() {
  ["co-name", "co-phone", "co-address"].forEach((id) => {
    const el = document.getElementById(id);
    if (!el) return;

    el.addEventListener("blur", () => {
      const field  = id.replace("co-", "");
      const info   = getCustomerInfo();
      const errors = validateCheckoutFields(info).filter((e) => e.field === field);

      if (errors.length > 0) {
        showFieldError(el, id, errors[0].msg);
      } else {
        clearFieldError(el, id);
      }
    });
  });
}
