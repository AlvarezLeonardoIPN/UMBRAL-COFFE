const API = "http://localhost:3000/api";
const params = new URLSearchParams(window.location.search);
const productId = params.get("id");

const qs = id => document.getElementById(id);
const token = () => localStorage.getItem("token");

async function loadProductDetail() {
    if (!productId) { window.location.href = "tienda.html"; return; }

    try {
        const res = await fetch(`${API}/products/${productId}`);
        const p = await res.json();
        if (!res.ok) throw new Error();

        qs("p-name").textContent = p.name;
        qs("p-price").textContent = `$${Number(p.price).toFixed(2)}`;
        qs("p-desc").textContent = p.description || "Sin descripción disponible.";
        qs("p-delivery").textContent = `Entrega estimada: ${p.estimated_delivery_days || 3} días`;

        // Imagen principal
        const imgEl = qs("main-img-el");
        imgEl.src = `http://localhost:3000${p.image_url}`;

        // GALERÍA DE MINIATURAS
        const gallery = qs("prod-gallery");
        if (gallery && p.gallery && p.gallery.length > 0) {
            gallery.innerHTML = p.gallery.map(imgUrl => `
                <img src="http://localhost:3000${imgUrl}" 
                     onclick="document.getElementById('main-img-el').src='http://localhost:3000${imgUrl}'"
                     style="width:70px; height:70px; object-fit:cover; border-radius:10px; cursor:pointer; border:1px solid #333; transition: 0.2s;"
                     onmouseover="this.style.borderColor='#c5a059'"
                     onmouseout="this.style.borderColor='#333'">
            `).join("");
        }

        // Validación de Stock
        const stockEl = qs("p-stock");
        const btnAdd = qs("btn-add-cart");
        if (p.stock > 0) {
            stockEl.innerHTML = `✅ Unidades: <strong>${p.stock}</strong>`;
            btnAdd.disabled = false;
        } else {
            stockEl.innerHTML = `❌ Agotado`;
            btnAdd.disabled = true;
            btnAdd.textContent = "SIN STOCK";
        }

        renderStars(p.rating_promedio || 0);
        loadReviews();
    } catch (e) { console.error(e); }
}

// ... (las funciones renderStars, loadReviews y sendReview se quedan igual)

function addToCart(id) {
    let cart = JSON.parse(localStorage.getItem("umbral_cart")) || [];
    const exists = cart.find(it => it.productId === id);
    if (exists) exists.quantity += 1;
    else cart.push({ productId: id, quantity: 1 });
    localStorage.setItem("umbral_cart", JSON.stringify(cart));
    alert("Producto añadido al carrito");
}

document.addEventListener("DOMContentLoaded", () => {
    loadProductDetail();
    if (token()) {
        if(qs("review-form-container")) qs("review-form-container").style.display = "block";
        if(qs("login-to-review")) qs("login-to-review").style.display = "none";
    }
    if(qs("btn-send-review")) qs("btn-send-review").onclick = sendReview;
    if(qs("btn-add-cart")) qs("btn-add-cart").onclick = () => addToCart(productId);
});