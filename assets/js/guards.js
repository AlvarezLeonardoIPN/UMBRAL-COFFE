// guards.js

function guardRequireLogin(redirectTo = "login.html") {
  const token = localStorage.getItem("token");
  const user = localStorage.getItem("user");

  if (!token || !user) {
    const cur = window.location.pathname.split("/").pop() || "index.html";
    window.location.href = `${redirectTo}?next=${encodeURIComponent(cur)}`;
  }
}

function guardRequireRole(roles, redirectTo = "index.html") {
  const token = localStorage.getItem("token");
  let user = null;
  try { user = JSON.parse(localStorage.getItem("user") || "null"); } catch (e) {}

  const arr = Array.isArray(roles) ? roles : [roles];
  const role = user && user.role ? String(user.role) : "";

  if (!token || !user || !arr.includes(role)) {
    window.location.href = redirectTo;
  }
}

// NUEVO: Bloqueo proactivo para el checkout
function guardRestrictStaffFromCheckout() {
    let user = null;
    try { user = JSON.parse(localStorage.getItem("user") || "null"); } catch (e) {}
    
    if (user && (user.role === 'admin' || user.role === 'inventarios')) {
        alert("🛡️ Acceso restringido: El personal administrativo no puede acceder a la pasarela de pago.");
        window.location.href = "tienda.html";
    }
}
