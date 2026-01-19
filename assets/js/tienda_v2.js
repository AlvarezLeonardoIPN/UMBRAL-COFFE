const API_BASE_URL = "http://3.237.91.96:3000/api";

const SERVER_URL = "http://3.237.91.96:3000"; 



const qs = id => document.getElementById(id);



function firstImg(p) {

    // Si hay una ruta en la base de datos, la usamos

    if (p && p.image_url) {

        return `${SERVER_URL}${p.image_url}`;

    }

    // Si no hay nada (como ahora), mostramos una imagen por defecto genérica

    return "assets/img/product-placeholder.jpg";

}



async function loadProducts() {

    try {

        const res = await fetch(`${API_BASE_URL}/products`);

        const products = await res.json();

        const list = qs("product-list");

        if (!list) return;

        list.innerHTML = "";



        products.forEach(p => {

            const card = document.createElement("div");

            card.className = "product-card";

            card.innerHTML = `

                <div class="product-img" style="cursor:pointer">

                    <img src="${firstImg(p)}" onerror="this.src='assets/img/product-placeholder.jpg'">

                </div>

                <div class="product-info">

                    <h3 class="product-title" style="cursor:pointer">${p.name}</h3>

                    <p class="product-price">$${Number(p.price).toFixed(2)}</p>

                    <button class="btn-primario" onclick="event.stopPropagation();">Agregar</button>

                </div>`;

            

            const goToDetail = () => { window.location.href = `producto.html?id=${p.id}`; };

            card.querySelector(".product-img").onclick = goToDetail;

            card.querySelector(".product-title").onclick = goToDetail;

            list.appendChild(card);

        });

    } catch (e) { console.error("Error cargando productos:", e); }

}



document.addEventListener("DOMContentLoaded", loadProducts);

