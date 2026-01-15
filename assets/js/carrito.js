// assets/js/carrito.js
const API = "http://localhost:3000/api";

function qs(id) { return document.getElementById(id); }
function show(el) { if (el) el.style.display = "block"; }
function hide(el) { if (el) el.style.display = "none"; }
function money(n) { return "$" + Number(n || 0).toFixed(2); }

async function apiGet(path) {
  const res = await fetch(API + path);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || data.detail || "Error servidor");
  return data;
}

function firstImg(p) {
  const imgs = p?.imagenes || p?.images || [];
  if (Array.isArray(imgs) && imgs.length && imgs[0]) return imgs[0];
  return "assets/img/product-placeholder.jpg";
}

function pName(p) { return String(p?.nombre || p?.name || "Producto"); }
function pPrice(p) { return Number(p?.precio ?? p?.price ?? 0); }

// Cargar mapa de productos (para precio/nombre/imagen)
async function loadProductsMap() {
  const list = await apiGet("/products");
  const map = new Map();
  (Array.isArray(list) ? list : []).forEach(p => map.set(Number(p.id), p));
  return map;
}

function clampQty(n) {
  let q = Number(n);
  if (!Number.isFinite(q) || q < 1) q = 1;
  return Math.floor(q);
}

function renderCart(cart, productsMap) {
  const box = qs("cart-items");
  const totalEl = qs("cart-total");
  const subEl = qs("cart-subtotal"); // opcional
  const emptyEl = qs("cart-empty");  // opcional
  const err = qs("cart-error");

  if (err) hide(err);
  if (!box || !totalEl) return;

  box.innerHTML = "";

  const isEmpty = !cart || cart.length === 0;

  if (emptyEl) emptyEl.style.display = isEmpty ? "block" : "none";

  if (isEmpty) {
    box.innerHTML = `
      <div style="opacity:.85; padding:6px 2px;">
        Tu carrito está vacío.
      </div>
    `;
    totalEl.textContent = money(0);
    if (subEl) subEl.textContent = money(0);
    return;
  }

  let subtotal = 0;

  cart.forEach(it => {
    const id = Number(it.productId);
    const qty = Math.max(1, Number(it.quantity) || 1);
    const p = productsMap.get(id);

    const name = p ? pName(p) : `Producto #${id} (no disponible)`;
    const price = p ? pPrice(p) : 0;
    const img = p ? firstImg(p) : "assets/img/product-placeholder.jpg";

    const lineTotal = price * qty;
    subtotal += lineTotal;

    const row = document.createElement("div");
    row.className = "umbral-cart-row";
    row.setAttribute("data-row", String(id));

    // UI Almanegra-style, UMBRAL-dark:
    row.innerHTML = `
      <div class="umbral-cart-item">
        <div class="umbral-cart-media">
          <img src="${img}" alt="${name}" />
        </div>

        <div class="umbral-cart-main">
          <div class="umbral-cart-top">
            <div class="umbral-cart-meta">
              <div class="umbral-cart-tag">especial</div>
              <div class="umbral-cart-name">${name}</div>
              <div class="umbral-cart-price">${money(price)}</div>
            </div>

            <div class="umbral-cart-right">
              <div class="umbral-cart-lineTotal">${money(lineTotal)}</div>
            </div>
          </div>

          <div class="umbral-cart-actions">
            <div class="umbral-qty">
              <button type="button" class="umbral-qty-btn" data-dec="${id}" aria-label="Disminuir">−</button>

              <input
                type="number"
                min="1"
                value="${qty}"
                data-qty="${id}"
                class="umbral-qty-input"
                aria-label="Cantidad"
              />

              <button type="button" class="umbral-qty-btn" data-inc="${id}" aria-label="Aumentar">+</button>
            </div>

            <div class="umbral-cart-buttons">
              <button type="button" class="umbral-icon-btn" data-del="${id}" title="Eliminar">
                <span class="umbral-icon">🗑️</span>
                <span class="umbral-icon-text">Eliminar</span>
              </button>

              <button type="button" class="umbral-icon-btn" data-go="${id}" title="Ver producto">
                <span class="umbral-icon">↗</span>
                <span class="umbral-icon-text">Ver</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    // Estilos inline mínimos (no dependes de style.css para que se vea pro)
    // Si prefieres moverlo a style.css luego, lo hacemos en limpio.
    row.style.border = "1px solid rgba(255,255,255,0.10)";
    row.style.background = "rgba(255,255,255,0.02)";
    row.style.borderRadius = "18px";
    row.style.padding = "14px";
    row.style.marginTop = "12px";

    // Subestilos
    const style = document.createElement("style");
    style.textContent = `
      .umbral-cart-item{display:flex;gap:14px;align-items:flex-start}
      .umbral-cart-media{width:92px;height:92px;border-radius:16px;overflow:hidden;flex:0 0 auto;border:1px solid rgba(255,255,255,0.10)}
      .umbral-cart-media img{width:100%;height:100%;object-fit:cover;display:block}
      .umbral-cart-main{flex:1;min-width:0}
      .umbral-cart-top{display:flex;justify-content:space-between;gap:12px;align-items:flex-start}
      .umbral-cart-meta{min-width:0}
      .umbral-cart-tag{
        display:inline-block;
        padding:6px 10px;
        border-radius:999px;
        border:1px solid rgba(212,175,55,0.18);
        color:rgba(212,175,55,0.92);
        font-size:11px;
        letter-spacing:1.6px;
        text-transform:uppercase;
        margin-bottom:8px;
        background:rgba(212,175,55,0.06);
      }
      .umbral-cart-name{font-weight:800;color:#f1f1f1;line-height:1.2;max-width:640px}
      .umbral-cart-price{margin-top:8px;color:rgba(255,255,255,0.72);font-size:13px}
      .umbral-cart-right{text-align:right}
      .umbral-cart-lineTotal{font-weight:900;color:#f7f7f7;font-size:18px}
      .umbral-cart-actions{display:flex;justify-content:space-between;gap:12px;align-items:center;flex-wrap:wrap;margin-top:12px}
      .umbral-qty{
        display:flex;align-items:center;gap:8px;
        padding:8px 10px;border-radius:999px;
        border:1px solid rgba(255,255,255,0.10);
        background:rgba(0,0,0,0.18);
      }
      .umbral-qty-btn{
        width:34px;height:34px;border-radius:10px;
        border:1px solid rgba(212,175,55,0.18);
        background:rgba(212,175,55,0.08);
        color:rgba(212,175,55,0.95);
        font-weight:900;cursor:pointer;
        display:flex;align-items:center;justify-content:center;
        transition:transform .12s ease, background .12s ease;
      }
      .umbral-qty-btn:hover{transform:translateY(-1px);background:rgba(212,175,55,0.14)}
      .umbral-qty-input{
        width:70px;padding:10px 10px;border-radius:12px;
        border:1px solid rgba(255,255,255,0.12);
        background:rgba(255,255,255,0.03);
        color:#f2f2f2;outline:none;text-align:center;
      }
      .umbral-cart-buttons{display:flex;gap:10px;align-items:center;flex-wrap:wrap}
      .umbral-icon-btn{
        border-radius:999px;padding:10px 12px;
        border:1px solid rgba(255,255,255,0.12);
        background:transparent;color:rgba(255,255,255,0.78);
        cursor:pointer;display:flex;gap:8px;align-items:center;
        transition:transform .12s ease, background .12s ease, border-color .12s ease;
      }
      .umbral-icon-btn:hover{transform:translateY(-1px);background:rgba(255,255,255,0.04);border-color:rgba(212,175,55,0.22)}
      .umbral-icon{opacity:.9}
      .umbral-icon-text{font-size:13px}
      @media(max-width:520px){
        .umbral-cart-right{width:100%;text-align:left}
        .umbral-cart-lineTotal{font-size:16px}
      }
    `;
    row.appendChild(style);

    box.appendChild(row);
  });

  // Por ahora subtotal = total (envío e impuestos en checkout)
  const total = subtotal;

  totalEl.textContent = money(total);
  if (subEl) subEl.textContent = money(subtotal);

  // Eventos: input qty (manual)
  box.querySelectorAll("[data-qty]").forEach(inp => {
    inp.addEventListener("input", () => {
      const id = Number(inp.getAttribute("data-qty"));
      let q = clampQty(inp.value);
      inp.value = String(q);
      // No actualiza hasta change para que no sea "nervioso"
    });

    inp.addEventListener("change", () => {
      const id = Number(inp.getAttribute("data-qty"));
      const q = clampQty(inp.value);
      inp.value = String(q);
      window.UmbralCart.setQty(id, q);
    });
  });

  // Eventos: - / +
  box.querySelectorAll("[data-dec]").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = Number(btn.getAttribute("data-dec"));
      const cartNow = window.UmbralCart.get() || [];
      const item = cartNow.find(x => Number(x.productId) === id);
      const q = clampQty(item?.quantity || 1);
      const next = Math.max(1, q - 1);
      window.UmbralCart.setQty(id, next);
    });
  });

  box.querySelectorAll("[data-inc]").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = Number(btn.getAttribute("data-inc"));
      const cartNow = window.UmbralCart.get() || [];
      const item = cartNow.find(x => Number(x.productId) === id);
      const q = clampQty(item?.quantity || 1);
      const next = q + 1;
      window.UmbralCart.setQty(id, next);
    });
  });

  // Eliminar
  box.querySelectorAll("[data-del]").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = Number(btn.getAttribute("data-del"));
      window.UmbralCart.remove(id);
    });
  });

  // Ver producto
  box.querySelectorAll("[data-go]").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = Number(btn.getAttribute("data-go"));
      location.href = `producto.html?id=${id}`;
    });
  });
}

async function refresh(productsMap) {
  const cart = window.UmbralCart.get();
  renderCart(cart, productsMap);

  // si está vacío, deshabilita checkout visualmente
  const btnCheckout = qs("btn-checkout");
  if (btnCheckout) {
    const empty = !cart || cart.length === 0;
    btnCheckout.style.pointerEvents = empty ? "none" : "auto";
    btnCheckout.style.opacity = empty ? ".55" : "1";
    btnCheckout.setAttribute("aria-disabled", empty ? "true" : "false");
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  if (!window.UmbralCart) {
    const err = qs("cart-error");
    if (err) {
      err.textContent = "Falta cart_ui.js";
      err.style.display = "block";
    }
    return;
  }

  let productsMap = new Map();
  try {
    productsMap = await loadProductsMap();
  } catch (e) {
    // si falla, igual deja operar el carrito (solo sin nombres precios)
  }

  await refresh(productsMap);

  document.addEventListener("umbral_cart_changed", async () => {
    await refresh(productsMap);
  });

  const btnClear = qs("btn-clear");
  if (btnClear) {
    btnClear.addEventListener("click", () => {
      const ok = confirm("¿Vaciar carrito?");
      if (ok) window.UmbralCart.clear();
    });
  }
});