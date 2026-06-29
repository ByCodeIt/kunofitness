import { getCart, getCartTotal, clearCart } from "./cart.js";
import { formatPrice, sanitize } from "./main.js";

// ← Replace with client's real WhatsApp number (no + or spaces)
const WHATSAPP_NUMBER = "2348012345678";

// ─── Order Reference Generator ────────────────────────────────
export function generateOrderRef() {
  const now    = new Date();
  const date   = now.getFullYear().toString()
               + String(now.getMonth() + 1).padStart(2, "0")
               + String(now.getDate()).padStart(2, "0");
  const suffix = String(Math.floor(Math.random() * 1000)).padStart(3, "0");
  return `KF-${date}-${suffix}`;
}

// ─── Build WhatsApp Order Message ─────────────────────────────
export function buildWhatsAppOrder(customerInfo, orderRef, cart, total) {
  if (!cart.length) return null;

  const itemLines = cart
    .map((item) => `  • [${item.category}] ${item.name} (KF-${item.id}) × ${item.qty} — ${formatPrice(item.price * item.qty)}`)
    .join("\n");

  return `
🏋️ *New Order — KunoFitness*
📋 *Order Ref: ${orderRef}*

*Customer Details*
Name: ${customerInfo.name}
Phone: ${customerInfo.phone}
Address: ${customerInfo.address}
${customerInfo.note ? `Note: ${customerInfo.note}` : ""}

*Order Summary*
${itemLines}

*Total: ${formatPrice(total)}*

Payment: To be arranged on WhatsApp
`.trim();
}

// ─── Build Bank Transfer Confirmation Message ─────────────────
export function buildBankTransferConfirmation(customerInfo, orderRef, cart, total) {
  if (!cart.length) return null;

  const itemLines = cart
    .map((item) => `  • [${item.category}] ${item.name} (KF-${item.id}) × ${item.qty} — ${formatPrice(item.price * item.qty)}`)
    .join("\n");

  return `
✅ *Payment Notification — KunoFitness*
📋 *Order Ref: ${orderRef}*

*Customer Details*
Name: ${customerInfo.name}
Phone: ${customerInfo.phone}
Address: ${customerInfo.address}
${customerInfo.note ? `Note: ${customerInfo.note}` : ""}

*Order Summary*
${itemLines}

*Total Transferred: ${formatPrice(total)}*

I have transferred payment for the above order.
Please confirm receipt and process my delivery.
`.trim();
}

// ─── Open WhatsApp with message ───────────────────────────────
export function openWhatsApp(message, fallbackElId) {
  const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
  const opened = window.open(url, "_blank", "noopener,noreferrer");
  if (!opened) {
    const fallback = document.getElementById(fallbackElId);
    if (fallback) {
      fallback.innerHTML = `
        <p class="text-ash-300 text-sm mb-2">Your browser blocked the popup. <a href="${url}" target="_blank" rel="noopener noreferrer" class="text-go underline font-semibold">Click here to open WhatsApp</a> and then come back.</p>
      `;
      fallback.classList.remove("hidden");
    }
    return false;
  }
  return true;
}

// ─── Validation Utilities (shared) ───────────────────────────
export function validateCheckoutFields(fields) {
  const errors = [];
  const { name, phone, address } = fields;

  if (!name || name.length < 2)
    errors.push({ field: "name",    msg: "Please enter your full name." });
  if (!phone || !/^(\+?234|0)[789]\d{9}$/.test(phone.replace(/[\s\-().]/g, "")))
    errors.push({ field: "phone",   msg: "Please enter a valid Nigerian phone number." });
  if (!address || address.length < 10)
    errors.push({ field: "address", msg: "Please enter your full delivery address." });

  return errors;
}

export function showFieldError(fieldEl, field, msg) {
  const errorId = `${field}-error`;
  let errorEl = document.getElementById(errorId);
  if (!errorEl) {
    errorEl = document.createElement("p");
    errorEl.id = errorId;
    errorEl.className = "text-fire-400 text-xs mt-1";
    errorEl.setAttribute("role", "alert");
    fieldEl.parentNode.appendChild(errorEl);
  }
  errorEl.textContent = msg;
  fieldEl.classList.add("border-fire-500");
  fieldEl.setAttribute("aria-describedby", errorId);
  fieldEl.setAttribute("aria-invalid", "true");
}

export function clearFieldError(fieldEl, field) {
  const errorEl = document.getElementById(`${field}-error`);
  if (errorEl) errorEl.textContent = "";
  fieldEl?.classList.remove("border-fire-500");
  fieldEl?.removeAttribute("aria-invalid");
}
