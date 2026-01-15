// assets/js/cuenta.js  (CORREGIDO A TU BACKEND REAL)

const API_BASE_URL = "http://localhost:3000/api";

function qs(id) { return document.getElementById(id); }
function show(el) { if (el) el.style.display = "block"; }
function hide(el) { if (el) el.style.display = "none"; }

function getToken() {
  return localStorage.getItem("token") || "";
}

function getUser() {
  try { return JSON.parse(localStorage.getItem("user") || "null"); }
  catch { return null; }
}

function setUser(u) {
  localStorage.setItem("user", JSON.stringify(u));
}

function setMsg(text) {
  const ok = qs("cuenta-msg");
  const err = qs("cuenta-error");
  if (err) hide(err);
  if (ok) { ok.textContent = text; show(ok); }
}

function setErr(text) {
  const ok = qs("cuenta-msg");
  const err = qs("cuenta-error");
  if (ok) hide(ok);
  if (err) { err.textContent = text; show(err); }
}

// --------------------------
// API helpers
// --------------------------
async function apiGet(path) {
  const res = await fetch(API_BASE_URL + path, {
    headers: { Authorization: "Bearer " + getToken() }
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || data.detail || "Error en servidor.");
  return data;
}

async function apiPut(path, body) {
  const res = await fetch(API_BASE_URL + path, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + getToken()
    },
    body: JSON.stringify(body || {})
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || data.detail || "Error en servidor.");
  return data;
}

async function apiPost(path, body) {
  const res = await fetch(API_BASE_URL + path, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + getToken()
    },
    body: JSON.stringify(body || {})
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || data.detail || "Error en servidor.");
  return data;
}

async function apiDelete(path) {
  const res = await fetch(API_BASE_URL + path, {
    method: "DELETE",
    headers: { Authorization: "Bearer " + getToken() }
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || data.detail || "Error en servidor.");
  return data;
}

// --------------------------
// Pintar direcciones / tarjetas
// --------------------------
function addrLine(a) {
  const street = a.street || "";
  const ext = a.ext_number || "";
  const intr = a.int_number ? ("Int " + a.int_number) : "";
  const neigh = a.neighborhood || "";
  const city = a.city || "";
  const state = a.state || "";
  const country = a.country || "";
  const cp = a.postal_code || "";
  return `${street} ${ext} ${intr}, ${neigh}, ${city}, ${state}, ${country}, CP ${cp}`.replace(/\s+/g, " ").trim();
}

function paintAddresses(list) {
  const box = qs("addresses-list");
  if (!box) return;

  box.innerHTML = "";

  if (!Array.isArray(list) || list.length === 0) {
    box.innerHTML = `<p style="opacity:.85">No tienes direcciones guardadas.</p>`;
    return;
  }

  list.forEach((a) => {
    const div = document.createElement("div");
    div.style.border = "1px solid rgba(255,255,255,.12)";
    div.style.borderRadius = "12px";
    div.style.padding = "12px";
    div.style.marginTop = "10px";

    div.innerHTML = `
      <div style="display:flex; justify-content:space-between; gap:12px; align-items:flex-start">
        <div style="opacity:.95">${addrLine(a)}</div>
        <button type="button" class="btn btn-outline" data-del-addr="${a.id}">Eliminar</button>
      </div>
    `;

    box.appendChild(div);
  });

  box.querySelectorAll("[data-del-addr]").forEach(btn => {
    btn.addEventListener("click", async () => {
      const id = Number(btn.getAttribute("data-del-addr"));
      await deleteAddress(id);
    });
  });
}

function paintCards(list) {
  const box = qs("cards-list");
  if (!box) return;

  box.innerHTML = "";

  if (!Array.isArray(list) || list.length === 0) {
    box.innerHTML = `<p style="opacity:.85">No tienes tarjetas guardadas.</p>`;
    return;
  }

  list.forEach((c) => {
    const div = document.createElement("div");
    div.style.border = "1px solid rgba(255,255,255,.12)";
    div.style.borderRadius = "12px";
    div.style.padding = "12px";
    div.style.marginTop = "10px";

    div.innerHTML = `
      <div style="display:flex; justify-content:space-between; gap:12px; align-items:flex-start">
        <div>
          <div><strong>${c.brand || "Tarjeta"}</strong></div>
          <div style="opacity:.85; margin-top:6px">${c.card_holder || ""} · **** ${c.card_last4 || ""}</div>
          <div style="opacity:.85; margin-top:6px">Vence: ${c.exp_month || ""}/${c.exp_year || ""}</div>
        </div>
        <button type="button" class="btn btn-outline" data-del-card="${c.id}">Eliminar</button>
      </div>
    `;

    box.appendChild(div);
  });

  box.querySelectorAll("[data-del-card]").forEach(btn => {
    btn.addEventListener("click", async () => {
      const id = Number(btn.getAttribute("data-del-card"));
      await deleteCard(id);
    });
  });
}

// --------------------------
// Cargar datos iniciales
// --------------------------
function fillProfileFromLS() {
  const u = getUser();
  if (!u) return;

  if (qs("acc-name")) qs("acc-name").value = u.name || "";
  if (qs("acc-email")) qs("acc-email").value = u.email || "";
}

async function loadAccountData() {
  hide(qs("cuenta-msg"));
  hide(qs("cuenta-error"));

  // Perfil desde backend (nuevo endpoint)
  try {
    const me = await apiGet("/users/me");
    if (me && me.name && me.email) {
      setUser(me);
      fillProfileFromLS();
    }
  } catch (_) {}

  // Direcciones reales
  try {
    const addrs = await apiGet("/addresses/mine");
    paintAddresses(addrs);
  } catch (e) {
    setErr(e.message);
  }

  // Métodos de pago reales
  try {
    const cards = await apiGet("/payment-methods/mine");
    paintCards(cards);
  } catch (e) {
    setErr(e.message);
  }
}

// --------------------------
// Guardar perfil
// --------------------------
async function saveProfile() {
  hide(qs("cuenta-msg"));
  hide(qs("cuenta-error"));

  const name = (qs("acc-name")?.value || "").trim();
  const email = (qs("acc-email")?.value || "").trim().toLowerCase();

  if (!name || !email) { setErr("Completa nombre y correo."); return; }
  if (typeof esEmailValido === "function" && !esEmailValido(email)) {
    setErr("Correo invalido.");
    return;
  }

  try {
    const updated = await apiPut("/users/me", { name, email });
    setUser(updated);
    setMsg("Cambios guardados.");
  } catch (e) {
    setErr(e.message);
  }
}

// --------------------------
// Direcciones (CRUD mínimo: crear + eliminar; editar ya lo tienes en backend)
// --------------------------
async function addAddress() {
  hide(qs("cuenta-msg"));
  hide(qs("cuenta-error"));

  const a = {
    street: (qs("addr-street")?.value || "").trim(),
    ext_number: (qs("addr-ext")?.value || "").trim(),
    int_number: (qs("addr-int")?.value || "").trim(),
    neighborhood: (qs("addr-neigh")?.value || "").trim(),
    postal_code: (qs("addr-cp")?.value || "").trim(),
    city: (qs("addr-city")?.value || "").trim(),
    state: (qs("addr-state")?.value || "").trim(),
    country: (qs("addr-country")?.value || "").trim()
  };

  if (!a.street || !a.ext_number || !a.neighborhood || !a.postal_code || !a.city || !a.state || !a.country) {
    setErr("Completa los campos principales de la direccion.");
    return;
  }
  if (!/^[0-9]{5}$/.test(a.postal_code)) {
    setErr("CP invalido (debe tener 5 digitos).");
    return;
  }

  try {
    await apiPost("/addresses", a);
    setMsg("Direccion agregada.");
    paintAddresses(await apiGet("/addresses/mine"));
  } catch (e) {
    setErr(e.message);
  }
}

async function deleteAddress(id) {
  hide(qs("cuenta-msg"));
  hide(qs("cuenta-error"));

  try {
    await apiDelete("/addresses/" + id);
    setMsg("Direccion eliminada.");
    paintAddresses(await apiGet("/addresses/mine"));
  } catch (e) {
    setErr(e.message);
  }
}

// --------------------------
// Tarjetas (CRUD mínimo: crear + eliminar)
// --------------------------
function onlyDigits(s) { return String(s || "").replace(/\D/g, ""); }

async function addCard() {
  hide(qs("cuenta-msg"));
  hide(qs("cuenta-error"));

  const card_holder = (qs("card-holder")?.value || "").trim();
  const card_number = onlyDigits(qs("card-number")?.value || "");
  const mm = onlyDigits(qs("card-mm")?.value || "");
  const yy = onlyDigits(qs("card-yy")?.value || "");
  const cvv = onlyDigits(qs("card-cvv")?.value || "");
  const brand = (qs("card-brand")?.value || "").trim();

  if (!card_holder || !card_number || !mm || !yy || !cvv || !brand) {
    setErr("Completa los campos de la tarjeta.");
    return;
  }

  if (card_number.length < 13 || card_number.length > 19) { setErr("Numero de tarjeta invalido."); return; }
  const exp_month = Number(mm);
  if (!exp_month || exp_month < 1 || exp_month > 12) { setErr("Mes invalido."); return; }
  if (!(yy.length === 2 || yy.length === 4)) { setErr("Anio invalido."); return; }
  if (!(cvv.length === 3 || cvv.length === 4)) { setErr("CVV invalido."); return; }

  const exp_year = Number(yy.length === 2 ? ("20" + yy) : yy);

  try {
    await apiPost("/payment-methods", { card_holder, card_number, exp_month, exp_year, brand, cvv });
    setMsg("Tarjeta agregada.");
    paintCards(await apiGet("/payment-methods/mine"));

    ["card-holder","card-number","card-mm","card-yy","card-cvv","card-brand"].forEach(id => {
      const el = qs(id);
      if (el) el.value = "";
    });
  } catch (e) {
    setErr(e.message);
  }
}

async function deleteCard(id) {
  hide(qs("cuenta-msg"));
  hide(qs("cuenta-error"));

  try {
    await apiDelete("/payment-methods/" + id);
    setMsg("Tarjeta eliminada.");
    paintCards(await apiGet("/payment-methods/mine"));
  } catch (e) {
    setErr(e.message);
  }
}

// --------------------------
// Cambiar password
// --------------------------
function pwShowError(msg) {
  const e = qs("pw-msg");
  const ok = qs("pw-ok");
  if (ok) hide(ok);
  if (!e) return;
  e.textContent = msg;
  show(e);
}

function pwShowOk(msg) {
  const e = qs("pw-msg");
  const ok = qs("pw-ok");
  if (e) hide(e);
  if (!ok) return;
  ok.textContent = msg;
  show(ok);
}

async function changePassword() {
  const oldPw = String(qs("pw-old")?.value || "");
  const newPw = String(qs("pw-new")?.value || "");
  const newPw2 = String(qs("pw-new2")?.value || "");

  if (!oldPw || !newPw || !newPw2) { pwShowError("Completa todos los campos."); return; }
  if (newPw !== newPw2) { pwShowError("Las nuevas contrasenas no coinciden."); return; }

  if (typeof esPasswordValida === "function") {
    const r = esPasswordValida(newPw);
    if (!r.ok) { pwShowError("Contrasena debil: " + r.msg); return; }
  }

  try {
    await apiPost("/users/change-password", { oldPassword: oldPw, newPassword: newPw });
    pwShowOk("Contrasena actualizada.");
    if (qs("pw-old")) qs("pw-old").value = "";
    if (qs("pw-new")) qs("pw-new").value = "";
    if (qs("pw-new2")) qs("pw-new2").value = "";
  } catch (e) {
    pwShowError(e.message);
  }
}

// --------------------------
// Init
// --------------------------
document.addEventListener("DOMContentLoaded", () => {
  fillProfileFromLS();
  loadAccountData();

  qs("btn-save-profile")?.addEventListener("click", saveProfile);
  qs("btn-add-address")?.addEventListener("click", addAddress);
  qs("btn-add-card")?.addEventListener("click", addCard);
  qs("btn-change-pass")?.addEventListener("click", changePassword);
});
