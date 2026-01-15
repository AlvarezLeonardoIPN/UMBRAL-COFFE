// assets/js/auth_ui.js

function updateAuthUI() {
    const token = localStorage.getItem("token");
    const userStr = localStorage.getItem("user");
    
    const loginLink = document.getElementById("umbral-login-link");
    const accountDiv = document.getElementById("umbral-account");
    const accountName = document.getElementById("umbral-account-name");
    
    // Enlaces especiales del dropdown
    const linkAdmin = document.getElementById("umbral-link-admin");
    const linkInventarios = document.getElementById("umbral-link-inventarios"); // Si existe en tu HTML

    if (token && userStr) {
        const user = JSON.parse(userStr);
        
        if (loginLink) loginLink.style.display = "none";
        if (accountDiv) accountDiv.style.display = "block";
        if (accountName) accountName.textContent = user.name.split(" ")[0];

        // --- LÓGICA DE VISIBILIDAD DE ROLES EN EL MENÚ ---
        
        // Si es Admin o Inventarios, mostramos el acceso al Panel Administrativo
        if (user.role === 'admin' || user.role === 'inventarios') {
            if (linkAdmin) {
                linkAdmin.style.display = "block";
                // Opcional: Cambiamos el texto si es inventarios para que sea más claro
                linkAdmin.textContent = (user.role === 'inventarios') ? "Panel Inventarios" : "Panel Administrador";
            }
        } else {
            if (linkAdmin) linkAdmin.style.display = "none";
        }

        // Si usas un enlace separado para inventarios específicamente
        if (linkInventarios) {
            linkInventarios.style.display = (user.role === 'inventarios') ? "block" : "none";
        }

    } else {
        if (loginLink) loginLink.style.display = "block";
        if (accountDiv) accountDiv.style.display = "none";
    }
}

// Manejo del Dropdown (Abrir/Cerrar)
document.addEventListener("click", (e) => {
    const btn = document.getElementById("umbral-account-btn");
    const dropdown = document.getElementById("umbral-dropdown");
    
    if (btn && btn.contains(e.target)) {
        dropdown.style.display = dropdown.style.display === "block" ? "none" : "block";
    } else if (dropdown && !dropdown.contains(e.target)) {
        dropdown.style.display = "none";
    }
});

// Logout
const btnLogout = document.getElementById("umbral-logout");
if (btnLogout) {
    btnLogout.addEventListener("click", () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        localStorage.removeItem("umbral_cart");
        window.location.href = "index.html";
    });
}

// Ejecutar al cargar cualquier página
document.addEventListener("DOMContentLoaded", updateAuthUI);