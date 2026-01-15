// validaciones.js

function esEmailValido(email) {
  const s = String(email || "").trim();
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(s);
}

/*
  Password fuerte:
  - minimo 8, 1 mayus, 1 minus, 1 num, 1 especial
*/
function esPasswordValida(password) {
  const p = String(password || "");

  if (p.length < 8) return { ok: false, msg: "Minimo 8 caracteres." };
  if (!/[A-Z]/.test(p)) return { ok: false, msg: "Agrega al menos 1 mayuscula." };
  if (!/[a-z]/.test(p)) return { ok: false, msg: "Agrega al menos 1 minuscula." };
  if (!/[0-9]/.test(p)) return { ok: false, msg: "Agrega al menos 1 numero." };
  if (!/[!@#$%^&*()_\-+={}[\]|\\:;"'<>,.?/`~]/.test(p)) {
    return { ok: false, msg: "Agrega al menos 1 caracter especial." };
  }

  return { ok: true, msg: "OK" };
}

function esTelefonoValido(telefono) {
  const limpio = String(telefono || "").replace(/\s+/g, "");
  const regex = /^[0-9]{8,15}$/;
  return regex.test(limpio);
}

// Helpers UI
function mostrarErrorCampo(input, elementoError, mensaje) {
  if (input) input.classList.add("campo-error");
  if (elementoError) {
    elementoError.textContent = mensaje;
    elementoError.style.display = "block";
  }
}

function limpiarErrorCampo(input, elementoError) {
  if (input) input.classList.remove("campo-error");
  if (elementoError) {
    elementoError.textContent = "";
    elementoError.style.display = "none";
  }
}

// --- NUEVO: Formateador de Tarjeta Visual (0000 0000 0000 0000) ---
function setupCardFormatter(inputId) {
    const input = document.getElementById(inputId);
    if (!input) return;

    input.addEventListener('input', function (e) {
        // 1. Eliminar todo lo que no sea número
        let value = e.target.value.replace(/\D/g, '');
        
        // 2. Limitar a 16 dígitos
        if (value.length > 16) value = value.slice(0, 16);
        
        // 3. Agrupar de 4 en 4 con espacios
        let formatted = value.match(/.{1,4}/g);
        
        // 4. Asignar valor
        e.target.value = formatted ? formatted.join(' ') : value;
    });
}

// Inicializar formater en login y cuenta
document.addEventListener("DOMContentLoaded", () => {
    setupCardFormatter("card-number"); // ID usado en cuenta.html
    setupCardFormatter("reg-card-number"); // ID usado en login.html (si aplica) o donde uses registro
});
