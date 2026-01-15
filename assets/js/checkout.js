// assets/js/checkout.js
// ==========================================
// Lógica de Finalización de Compra - UMBRAL
// ==========================================

const API = "http://localhost:3000/api";
const CART_KEY = "umbral_cart";

const qs = (id) => document.getElementById(id);
const show = (el) => { if (el) el.style.display = "block"; };
const hide = (el) => { if (el) el.style.display = "none"; };
const money = (n) => "$" + Number(n || 0).toFixed(2);

function authToken() {
    return localStorage.getItem("token") || "";
}

function cartGet() {
    try { return JSON.parse(localStorage.getItem(CART_KEY)) || []; }
    catch (e) { return []; }
}

function cartClear() {
    localStorage.removeItem(CART_KEY);
}

// --- BLOQUEO DE SEGURIDAD ---
function checkAuth() {
    const token = authToken();
    const user = localStorage.getItem("user");
    if (!token || !user) {
        alert("Debes iniciar sesión para realizar el pago.");
        window.location.href = "login.html?next=carrito.html";
        return false;
    }
    return true;
}

// Función genérica para GET protegidos
async function apiGet(path) {
    const token = authToken();
    try {
        const res = await fetch(API + path, {
            headers: { Authorization: "Bearer " + token }
        });
        
        if (res.status === 401 || res.status === 403) {
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            window.location.href = "login.html";
            return [];
        }

        const data = await res.json().catch(() => ([]));
        if (!res.ok) throw new Error(data.error || "Error en servidor.");
        return data;
    } catch (err) {
        console.error("Error en apiGet:", path, err);
        return [];
    }
}

async function loadProductsMap() {
    try {
        const res = await fetch(API + "/products");
        const data = await res.json();
        const map = new Map();
        (data || []).forEach(p => map.set(Number(p.id), p));
        return map;
    } catch (e) {
        console.error("Error cargando productos:", e);
        return new Map();
    }
}

function renderSummary(cart, productsMap) {
    const box = qs("summary-items");
    const totalEl = qs("summary-total");
    if (!box || !totalEl) return;

    box.innerHTML = "";
    let total = 0;

    if (!cart.length) {
        box.innerHTML = `<p style="opacity:.85; text-align:center; padding:20px;">Tu carrito está vacío.</p>`;
        totalEl.textContent = money(0);
        return;
    }

    cart.forEach(it => {
        const p = productsMap.get(Number(it.productId || it.id));
        if (!p) return;
        const qty = Number(it.quantity || it.cantidad || 0);
        const sub = Number(p.price || 0) * qty;
        total += sub;

        const row = document.createElement("div");
        row.style = "border: 1px solid rgba(255,255,255,.12); border-radius:12px; padding:12px; margin-top:10px;";
        row.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <div>
                    <strong>${p.name}</strong><br>
                    <small style="opacity:.7">Cant: ${qty} x ${money(p.price)}</small>
                </div>
                <div style="text-align:right">
                    <strong>${money(sub)}</strong>
                </div>
            </div>
        `;
        box.appendChild(row);
    });
    totalEl.textContent = money(total);
}

function fillAddresses(select, addresses) {
    select.innerHTML = "";
    if (!addresses || addresses.length === 0) {
        select.innerHTML = `<option value="">No tienes direcciones registradas</option>`;
        return;
    }
    select.innerHTML = `<option value="">Selecciona una dirección</option>`;
    addresses.forEach(a => {
        const opt = document.createElement("option");
        opt.value = a.id;
        opt.textContent = `${a.street} #${a.ext_number}, ${a.neighborhood} (${a.city})`;
        select.appendChild(opt);
    });
}

function fillPayments(select, methods) {
    select.innerHTML = "";
    if (!methods || methods.length === 0) {
        select.innerHTML = `<option value="">No tienes métodos de pago</option>`;
        return;
    }
    select.innerHTML = `<option value="">Selecciona un método</option>`;
    methods.forEach(m => {
        const opt = document.createElement("option");
        opt.value = m.id;
        opt.textContent = `${m.brand || "Tarjeta"} **** ${m.card_last4}`;
        select.appendChild(opt);
    });
}

// --- LÓGICA PRINCIPAL ---
document.addEventListener("DOMContentLoaded", async () => {
    if (!checkAuth()) return;

    const err = qs("chk-error");
    const ok = qs("chk-success");
    if (err) hide(err);
    if (ok) hide(ok);

    const cart = cartGet();
    const productsMap = await loadProductsMap();
    renderSummary(cart, productsMap);

    const selAddr = qs("address-select");
    const selPay = qs("payment-select");
    const inputCvv = qs("checkout-cvv"); // Referencia al nuevo input CVV

    // CARGAR DIRECCIONES Y PAGOS
    try {
        // Corrección de rutas: en users.js son /addresses y /payment-methods
        const addresses = await apiGet("/addresses"); 
        const methods = await apiGet("/payment-methods"); 
        
        if (selAddr) fillAddresses(selAddr, addresses);
        if (selPay) fillPayments(selPay, methods);
    } catch (e) {
        console.error("Falla al llenar selectores:", e);
    }

    // Buscamos el botón nuevo (validate-and-confirm) o el viejo (confirm) por si acaso
    const btnConfirm = qs("btn-validate-and-confirm") || qs("btn-confirm");

    if (btnConfirm) {
        btnConfirm.onclick = async () => {
            const addressId = Number(selAddr?.value);
            const paymentMethodId = Number(selPay?.value);
            const cvvValue = inputCvv ? inputCvv.value : "";

            if (!cart.length) return alert("Tu carrito está vacío.");
            
            if (!addressId) {
                alert("Por favor selecciona una dirección de envío.");
                if(selAddr) selAddr.focus();
                return;
            }
            if (!paymentMethodId) {
                alert("Por favor selecciona un método de pago.");
                if(selPay) selPay.focus();
                return;
            }

            // --- VALIDACIÓN DE CVV (Simulación de seguridad) ---
            if (!cvvValue || cvvValue.length < 3 || !/^\d+$/.test(cvvValue)) {
                alert("⚠️ Por seguridad, ingresa el CVV (3 dígitos) de tu tarjeta para autorizar.");
                if(inputCvv) inputCvv.focus();
                return;
            }

            // Si pasa la validación visual, procesamos:
            if (err) hide(err);
            btnConfirm.textContent = "Procesando...";
            btnConfirm.disabled = true;

            try {
                const payload = {
                    items: cart.map(x => ({ 
                        productId: Number(x.productId || x.id), 
                        quantity: Number(x.quantity || x.cantidad) 
                    })),
                    addressId,
                    paymentMethodId,
                    notes: qs("notes")?.value || ""
                    // NOTA: No enviamos el CVV al backend, es solo validación visual local
                };

                const res = await fetch(API + "/orders", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": "Bearer " + authToken()
                    },
                    body: JSON.stringify(payload)
                });

                const data = await res.json();
                if (!res.ok) throw new Error(data.error || "Error al crear orden");

                if (ok) {
                    ok.textContent = "¡Pago autorizado! Redirigiendo...";
                    show(ok);
                }
                
                cartClear();
                setTimeout(() => { 
                    window.location.href = "mis_pedidos.html?success=true"; 
                }, 1500);

            } catch (e) {
                btnConfirm.textContent = "Confirmar compra";
                btnConfirm.disabled = false;
                if (err) { err.textContent = e.message; show(err); }
                else { alert(e.message); }
            }
        };
    }

    const btnCancel = qs("btn-cancel");
    if (btnCancel) {
        btnCancel.onclick = () => { window.location.href = "tienda.html"; };
    }
});