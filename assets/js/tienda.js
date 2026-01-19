const API = "http://3.237.91.96:3000/api";



document.addEventListener("DOMContentLoaded", () => {

    loadProducts();

});



async function loadProducts() {

    try {

        const res = await fetch(`${API}/products`);

        const products = await res.json();

        const container = document.getElementById("products-container");



        if (!container) return;



        container.innerHTML = products.map(p => {

            // Usamos la ruta de imagen tal cual viene en tu DB ya que antes te funcionaba

            const imgUrl = p.image_url || 'assets/img/placeholder.jpg';



            return `

            <div class="product-card" onclick="window.location.href='producto.html?id=${p.id}'" style="cursor:pointer;">

                <div class="product-image">

                    <img src="${imgUrl}" alt="${p.name}">

                </div>

                <div class="product-info">

                    <p class="category">${p.category_name || 'Café'}</p>

                    <h3>${p.name}</h3>

                    <p class="price">$${parseFloat(p.price).toFixed(2)}</p>

                    <button class="btn-add" onclick="addToCart(event, ${p.id}, '${p.name}', ${p.price}, '${imgUrl}')">

                        Agregar al carrito

                    </button>

                </div>

            </div>

            `;

        }).join("");



    } catch (e) {

        console.error("Error al cargar productos:", e);

    }

}



function addToCart(event, id, name, price, img) {

    // Evita que al darle al botón se active el onclick de la tarjeta (ir a producto.html)

    event.stopPropagation();

    

    let cart = JSON.parse(localStorage.getItem("umbral_cart") || "[]");

    const existing = cart.find(item => item.id === id);



    if (existing) {

        existing.quantity += 1;

    } else {

        cart.push({ id, name, price, img, quantity: 1 });

    }



    localStorage.setItem("umbral_cart", JSON.stringify(cart));

    alert(`${name} agregado al carrito`);

}
