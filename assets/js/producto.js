const API = "http://3.237.91.96:3000/api";

const SERVER = "http://3.237.91.96:3000";



const qs = id => document.getElementById(id);



async function loadProductDetail() {

    const urlParams = new URLSearchParams(window.location.search);

    const productId = urlParams.get('id');



    if (!productId) {

        window.location.href = 'tienda.html';

        return;

    }



    try {

        const res = await fetch(`${API}/products/${productId}`);

        const product = await res.json();



        // 1. Renderizar Imágenes

        const mainImg = qs("main-img");

        if (mainImg) mainImg.src = SERVER + (product.image_url || '/uploads/default.jpg');



        const gallery = qs("gallery-container");

        if (gallery && product.gallery) {

            gallery.innerHTML = product.gallery.map(url => `

                <img src="${SERVER}${url}" onclick="document.getElementById('main-img').src=this.src" style="cursor:pointer; width:80px; height:80px; object-fit:cover; border-radius:8px; border:1px solid #333;">

            `).join("");

        }



        // 2. Info Básica

        if (qs("p-name")) qs("p-name").textContent = product.name;

        if (qs("p-price")) qs("p-price").textContent = `$${product.price}`;

        if (qs("p-desc")) qs("p-desc").textContent = product.description;

        if (qs("p-stock")) qs("p-stock").textContent = product.stock > 0 ? `Disponible: ${product.stock}` : 'Agotado';



        // 3. Estrellas

        renderStars(product.rating_avg);



        // 4. Reseñas (LA FUNCIÓN QUE FALTABA)

        loadReviews(product.reviews);



        // 5. Botón Agregar

        const btnAdd = qs("btn-add-cart");

        if (btnAdd) {

            btnAdd.onclick = () => addToCart(product);

        }



    } catch (e) {

        console.error("Error cargando detalle:", e);

    }

}



function renderStars(rating) {

    const container = qs("stars-container");

    if (!container) return;

    const r = Math.round(rating || 0);

    container.innerHTML = '★'.repeat(r) + '☆'.repeat(5 - r);

}



function loadReviews(reviews) {

    const container = qs("reviews-container");

    if (!container) return;

    if (!reviews || reviews.length === 0) {

        container.innerHTML = "<p>No hay reseñas aún.</p>";

        return;

    }

    container.innerHTML = reviews.map(r => `

        <div class="review-card" style="border-bottom:1px solid #222; padding:10px 0;">

            <strong>${r.user_name}</strong> <span>${'★'.repeat(r.rating)}</span>

            <p style="margin:5px 0; opacity:0.8;">${r.comment}</p>

        </div>

    `).join("");

}



function addToCart(p) {

    let cart = JSON.parse(localStorage.getItem("cart") || "[]");

    const item = {

        id: p.id,

        name: p.name,

        price: parseFloat(p.price),

        image: p.image_url,

        qty: 1

    };

    

    const exists = cart.find(i => i.id === p.id);

    if (exists) {

        exists.qty++;

    } else {

        cart.push(item);

    }

    

    localStorage.setItem("cart", JSON.stringify(cart));

    alert("¡Añadido al carrito!");

}



document.addEventListener("DOMContentLoaded", loadProductDetail);
