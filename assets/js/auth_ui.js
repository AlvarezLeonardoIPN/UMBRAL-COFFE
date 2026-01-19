function updateAuthUI() {

    const token = localStorage.getItem("token");

    const userStr = localStorage.getItem("user");

    

    const loginLink = document.getElementById("umbral-login-link");

    const accountDiv = document.getElementById("umbral-account");

    const accountName = document.getElementById("umbral-account-name");

    const linkAdmin = document.getElementById("umbral-link-admin");



    if (token && userStr) {

        const user = JSON.parse(userStr);

        if (loginLink) loginLink.style.display = "none";

        if (accountDiv) accountDiv.style.display = "block";

        if (accountName) accountName.textContent = user.name.split(" ")[0];



        // Mostrar panel solo si es staff

        if (linkAdmin && (user.role === 'admin' || user.role === 'inventarios')) {

            linkAdmin.style.display = "block";

            linkAdmin.textContent = user.role === 'admin' ? "Administrador" : "Inventarios";

        }

    } else {

        if (loginLink) loginLink.style.display = "block";

        if (accountDiv) accountDiv.style.display = "none";

    }

}



// Dropdown Toggle

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

const logoutBtn = document.getElementById("umbral-logout");

if (logoutBtn) {

    logoutBtn.addEventListener("click", () => {

        localStorage.clear();

        window.location.href = "index.html";

    });

}



document.addEventListener("DOMContentLoaded", updateAuthUI);
