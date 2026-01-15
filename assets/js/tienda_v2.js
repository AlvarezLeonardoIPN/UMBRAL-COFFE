// assets/js/tienda_v2.js completo
const API_BASE_URL = "http://localhost:3000/api";
const SERVER_URL = "http://localhost:3000"; 

function qs(id) { return document.getElementById(id); }
function money(n) { return "$" + Number(n || 0).toFixed(2); }

function firstImg(p) {
    const path = p?.image_url || p?.imagen || p?.image;
    if (path) {
        return path.startsWith('http') ? path : `${SERVER_URL}${path}`;
    }
    return "assets/img/product-placeholder.jpg";
}

function ratingAvg(p) {
    const r = Number(p?.rating_promedio || 0);
    return isFinite(r) ? Math.max(0, Math.min(5, r)) : 0;
}

function renderStars(avg) {
    const v = Math.round(avg);
    let html = "";
    for (let i = 1; i <= 5; i++) {
        html += `<span style="color:${i <= v ? "#f5c46b" : "#ccc"}">★</span>`;
    }
    return html;
}

function addToCart(productId) {
    if (window.UmbralCart) {
        window.UmbralCart.add(productId, 1);
        alert("Producto agregado al carrito");
    } else {
        let carrito = JSON.parse(localStorage.getItem("umbral_cart")) || [];
        carrito.push({ productId, quantity: 1 });
        localStorage.setItem("umbral_cart", JSON.stringify(carrito));
        alert("Agregado al carrito");
    }
}

let PRODUCTS = [];
let FILTERED = [];
let CURRENT_CATEGORY = "all";
let CURRENT_ORDER = "az";

async function loadProducts() {
    const list = qs("product-list");
    try {
        const res = await fetch(`${API_BASE_URL}/products`);
        PRODUCTS = await res.json();
        FILTERED = [...PRODUCTS];
        renderCategories();
        applyFilters();
    } catch (e) {
        console.error(e);
        if (list) list.innerHTML = "<p>Error al conectar con el servidor.</p>";
    }
}

function renderProducts() {
    const list = qs("product-list");
    if (!list) return;
    list.innerHTML = "";

    FILTERED.forEach(p => {
        const avg = ratingAvg(p);
        const delivery = p.estimated_delivery_days || 3; // Valor por defecto

        const card = document.createElement("div");
        card.className = "product-card";
        card.innerHTML = `
            <div class="product-img" style="cursor:pointer">
                <img src="${firstImg(p)}" alt="${p.name}" onerror="this.src='assets/img/product-placeholder.jpg'">
            </div>
            <div class="product-info">
                <h3 class="product-title" style="cursor:pointer">${p.name}</h3>
                <p class="product-desc">${p.description || ''}</p>
                
                <div style="font-size: 11px; color: #c5a059; margin-bottom: 8px;">
                    <span style="opacity: 0.8;">🚚 Recíbelo en:</span> <strong>${delivery} días</strong>
                </div>

                <div class="product-rating">
                    ${renderStars(avg)} <small>(${avg.toFixed(1)})</small>
                </div>
                <div class="product-bottom">
                    <span class="product-price">${money(p.price)}</span>
                    <button class="btn-primario btn-add-cart" data-id="${p.id}">Agregar</button>
                </div>
            </div>
        `;

        const goToDetail = () => { window.location.href = `producto.html?id=${p.id}`; };
        card.querySelector(".product-img").onclick = goToDetail;
        card.querySelector(".product-title").onclick = goToDetail;
        card.querySelector(".btn-add-cart").onclick = (e) => {
            e.stopPropagation();
            addToCart(p.id);
        };
        list.appendChild(card);
    });
}

function renderCategories() {
    const box = qs("category-list");
    if (!box) return;
    const cats = new Set(PRODUCTS.map(p => String(p.categoria || "").trim()).filter(Boolean));
    box.innerHTML = `<button class="cat-btn active" data-cat="all">Todas</button>`;
    cats.forEach(c => {
        box.innerHTML += `<button class="cat-btn" data-cat="${c}">${c}</button>`;
    });
    box.querySelectorAll(".cat-btn").forEach(btn => {
        btn.onclick = () => {
            box.querySelectorAll(".cat-btn").forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            CURRENT_CATEGORY = btn.dataset.cat;
            applyFilters();
        };
    });
}

function applyFilters() {
    const search = (qs("search-input")?.value || "").toLowerCase();
    FILTERED = PRODUCTS.filter(p => {
        const matchCat = (CURRENT_CATEGORY === "all") || (p.categoria === CURRENT_CATEGORY);
        const matchText = p.name.toLowerCase().includes(search) || (p.description || "").toLowerCase().includes(search);
        return matchCat && matchText;
    });
    renderProducts();
}

document.addEventListener("DOMContentLoaded", () => {
    loadProducts();
    if (qs("search-input")) qs("search-input").oninput = applyFilters;
});