// registerWizard.js
window.UMBRAL_API = window.UMBRAL_API || "http://localhost:3000";
const API = window.UMBRAL_API;

function qs(id) { return document.getElementById(id); }
function show(el) { if (el) el.style.display = "block"; }
function hide(el) { if (el) el.style.display = "none"; }

function showStep(n) {
  document.querySelectorAll("#register-wizard .step").forEach(s => hide(s));
  const step = document.querySelector(`#register-wizard .step[data-step="${n}"]`);
  show(step);
}

function setError(step, msg) {
  const p = qs(`reg-error-${step}`);
  if (!p) return;
  p.textContent = msg;
  show(p);
}

function clearError(step) {
  const p = qs(`reg-error-${step}`);
  if (!p) return;
  p.textContent = "";
  hide(p);
}

let token = "";
let user = null;
let addresses = [];
let cards = [];

async function apiFetch(path, method, body, authToken) {
  const headers = { "Content-Type": "application/json" };
  if (authToken) headers.Authorization = `Bearer ${authToken}`;

  const res = await fetch(`${API}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || data.detail || "Error en servidor.");
  return data;
}

function renderAddresses() {
  const ul = qs("addresses-list");
  if (!ul) return;
  ul.innerHTML = "";
  addresses.forEach((a, idx) => {
    const li = document.createElement("li");
    li.textContent = `${idx + 1}) ${a.street} #${a.ext_number}, ${a.neighborhood}, ${a.postal_code}, ${a.city}, ${a.state}, ${a.country}`;
    ul.appendChild(li);
  });
}

function renderCards() {
  const ul = qs("cards-list");
  if (!ul) return;
  ul.innerHTML = "";
  cards.forEach((c, idx) => {
    const last4 = String(c.card_number).replace(/\s+/g, "").slice(-4);
    const li = document.createElement("li");
    li.textContent = `${idx + 1}) ${c.card_holder} - **** ${last4} (exp ${c.exp_month}/${c.exp_year})`;
    ul.appendChild(li);
  });
}

document.addEventListener("DOMContentLoaded", () => {
  const wizard = qs("register-wizard");
  const btnShow = qs("btn-show-register");
  if (!wizard || !btnShow) return;

  btnShow.addEventListener("click", () => {
    show(wizard);
    showStep(1);
  });

  const b1 = qs("btn-step1-next");
  if (b1) {
    b1.addEventListener("click", async () => {
      clearError(1);

      const name = (qs("reg-name")?.value || "").trim();
      const email = (qs("reg-email")?.value || "").trim();
      const password = (qs("reg-password")?.value || "").trim();

      if (!name || !email || !password) return setError(1, "Completa nombre, correo y contrasena.");
      if (typeof esEmailValido === "function" && !esEmailValido(email)) return setError(1, "Correo invalido.");

      if (typeof esPasswordValida === "function") {
        const r = esPasswordValida(password);
        if (!r.ok) return setError(1, "Contrasena debil: " + r.msg);
      }

      try {
        const data = await apiFetch("/api/auth/register", "POST", { name, email, password });
        token = data.token;
        user = data.user;

        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify(user));

        showStep(2);
      } catch (e) {
        setError(1, e.message);
      }
    });
  }

  const bAddAddr = qs("btn-add-address");
  if (bAddAddr) {
    bAddAddr.addEventListener("click", () => {
      clearError(2);

      const addr = {
        street: (qs("addr-street")?.value || "").trim(),
        ext_number: (qs("addr-ext")?.value || "").trim(),
        int_number: (qs("addr-int")?.value || "").trim(),
        neighborhood: (qs("addr-neigh")?.value || "").trim(),
        postal_code: (qs("addr-cp")?.value || "").trim(),
        city: (qs("addr-city")?.value || "").trim(),
        state: (qs("addr-state")?.value || "").trim(),
        country: ((qs("addr-country")?.value || "").trim() || "Mexico")
      };

      if (!addr.street || !addr.ext_number || !addr.neighborhood || !addr.postal_code || !addr.city || !addr.state || !addr.country) {
        return setError(2, "Completa: calle, num ext, colonia, CP, ciudad, estado, pais.");
      }

      addresses.push(addr);
      renderAddresses();
    });
  }

  const b2n = qs("btn-step2-next");
  if (b2n) {
    b2n.addEventListener("click", () => {
      clearError(2);
      if (addresses.length === 0) return setError(2, "Agrega al menos una direccion.");
      showStep(3);
    });
  }

  const b2b = qs("btn-step2-back");
  if (b2b) b2b.addEventListener("click", () => showStep(1));

  const bAddCard = qs("btn-add-card");
  if (bAddCard) {
    bAddCard.addEventListener("click", () => {
      clearError(3);

      const card = {
        card_holder: (qs("card-holder")?.value || "").trim(),
        card_number: (qs("card-number")?.value || "").trim(),
        exp_month: Number(qs("card-mm")?.value),
        exp_year: Number(qs("card-yy")?.value),
        brand: (qs("card-brand")?.value || "").trim()
      };

      if (!card.card_holder || !card.card_number || !card.exp_month || !card.exp_year || !card.brand) {
        return setError(3, "Completa titular, numero, mes, anio y marca.");
      }

      const num = String(card.card_number).replace(/\s+/g, "");
      if (num.length < 12) return setError(3, "Numero invalido.");

      cards.push(card);
      renderCards();
    });
  }

  const b3b = qs("btn-step3-back");
  if (b3b) b3b.addEventListener("click", () => showStep(2));

  const bFin = qs("btn-finish-register");
  if (bFin) {
    bFin.addEventListener("click", async () => {
      clearError(3);

      if (!token) return setError(3, "No hay sesion de registro.");
      if (addresses.length === 0) return setError(3, "Agrega al menos una direccion.");
      if (cards.length === 0) return setError(3, "Agrega al menos una tarjeta.");

      try {
        for (const a of addresses) await apiFetch("/api/addresses", "POST", a, token);
        for (const c of cards) await apiFetch("/api/payment-methods", "POST", c, token);

        window.location.href = "tienda.html";
      } catch (e) {
        setError(3, e.message);
      }
    });
  }
});

