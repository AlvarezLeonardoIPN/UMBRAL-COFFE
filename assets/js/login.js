// login.js
const API_BASE_URL = "http://3.237.91.96:3000/api/auth/login";

const form = document.getElementById("login-form");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const errorBox = document.getElementById("login-error");
const successBox = document.getElementById("login-success");

function mostrarError(msg) {
  if (!errorBox) return;
  errorBox.textContent = msg;
  errorBox.style.display = "block";
  if (successBox) successBox.style.display = "none";
}

function mostrarExito(msg) {
  if (!successBox) return;
  successBox.textContent = msg;
  successBox.style.display = "block";
  if (errorBox) errorBox.style.display = "none";
}

function getNextUrl() {
  const params = new URLSearchParams(window.location.search);
  const next = params.get("next") || "";
  if (!next) return "";
  if (next.includes("http")) return "";
  if (!next.endsWith(".html")) return "";
  return next;
}

if (form) {
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = (emailInput?.value || "").trim();
    const password = (passwordInput?.value || "").trim();

    if (!email || !password) {
      mostrarError("Por favor ingresa tu correo y contrasena.");
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        mostrarError(data.error || "No se pudo iniciar sesion.");
        return;
      }

      // { user, token }
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      // compat (si aun lo usas en otras partes)
      localStorage.setItem("umbralToken", data.token);
      localStorage.setItem("umbralUser", JSON.stringify(data.user));

      mostrarExito("Bienvenido de nuevo a UMBRAL.");

      const next = getNextUrl();

      setTimeout(() => {
        if (next) {
          window.location.href = next;
          return;
        }

        const role = (data.user && data.user.role) ? String(data.user.role) : "cliente";
        if (role === "inventarios") window.location.href = "inventarios.html";
        else if (role === "admin") window.location.href = "admin.html";
        else window.location.href = "tienda.html";
      }, 600);

    } catch (err) {
      console.error(err);
      mostrarError("Error de conexion con el servidor.");
    }
  });
}
// Esta función la llama Google automáticamente al terminar el login
async function handleCredentialResponse(response) {
  console.log("Token de Google recibido:", response.credential);
  
  try {
    // Enviamos el token de Google a NUESTRO backend
    const res = await fetch("http://http://3.237.91.96:3000/api/auth/google", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: response.credential })
    });

    const data = await res.json();

    if (res.ok) {
      // Guardar sesión y redirigir (igual que el login normal)
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      alert("¡Bienvenido " + data.user.name + "!");
      window.location.href = "index.html";
    } else {
      alert("Error: " + data.error);
    }
  } catch (error) {
    console.error(error);
    alert("Error conectando con el servidor");
  }
}

// Hacerla global para que el HTML la encuentre
window.handleCredentialResponse = handleCredentialResponse;
