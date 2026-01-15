// tienda + carrito (modo backend real)
// - Productos vienen de la BD (GET /api/products)
// - Carrito se guarda en localStorage (umbral_cart)
// - Checkout requiere sesion (si no hay token, manda a login con return)

const API_BASE_URL = "http://localhost:3000/api";
const CART_KEY = "umbral_cart";

// helpers
function money(n) {
  return "$" + Number(n || 0).toFixed(2);
}

function getToken() {
  // en tu proyecto ya usamos token en localStorage
  // si tu login guarda con otra key, ajusta aqui
  return localStorage.getItem("token") || "";
}

function cartGet() {
  try {
    return JSON.parse(localStorage.getItem(CART_KEY) || "[]");
  } catch (e) {
    return [];
  }
}

function cartSave(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

function cartAdd(product, qty) {
  const cart = cartGet();
  const i = cart.findIndex(x => x.productId === product.id);

  const addQty = Number(qty) || 1;

  if (i >= 0) {
    const next = cart[i].quantity + addQty;

    // si el backend manda stock, evitamos pasarnos
    if (typeof product.stock === "number" && next > product.stock) {
      alert("No hay stock suficiente para agregar esa cantidad.");
      return;
    }

    cart[i].quantity = next;
  } else {
    // guardamos snapshot basico para que el carrito se pinte rapido
    const item = {
      productId: product.id,
      name: product.nombre || product.name || "Producto",
      price: Number(product.precio || product.price || 0),
      quantity: addQty
    };

    if (typeof product.stock === "number") item.stock = product.stock;

    cart.push(item);
  }

  cartSave(cart);
}

function cartSetQty(productId, qty, productStock) {
  const cart = cartGet();
  const i = cart.findIndex(x => x.productId === productId);
  if (i < 0) return;

  let q = Number(qty) || 1;
  if (q < 1) q = 1;

  if (typeof productStock === "number" && q > productStock) {
    alert("No hay stock suficiente para esa cantidad.");
    q = productStock;
    if (q < 1) q = 1;
  }

  cart[i].quantity = q;
  cartSave(cart);
}

function cartRemove(productId) {
  const cart = cartGet().filter(x => x.productId !== productId);
  cartSave(cart);
}

async function loadProducts() {
  const res = await fetch(API_BASE_URL + "/products");
  if (!res.ok) throw new Error("No se pudieron cargar los productos.");
  return await res.json();
}

function renderProducts(products) {
  const list = document.getElementById("product-list");
  if (!list) return;

  list.innerHTML = "";

  products.forEach(p => {
    const card = document.createElement("div");
    card.className = "product-card";

    const nombre = p.nombre || p.name || "Producto";
    const descripcion = p.descripcion || p.description || "";
    const precio = Number(p.precio || p.price || 0);

    card.innerHTML = `
      <div class="product-card-body">
        <h3 class="product-title">${nombre}</h3>
        <p class="product-desc">${descripcion}</p>
        <p class="product-price">${money(precio)}</p>

        <button class="btn-primario btn-add-cart" data-id="${p.id}">
          Agregar al carrito
        </button>
      </div>
    `;

    list.appendChild(card);
  });

  // click add
  document.querySelectorAll(".btn-add-cart").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = Number(btn.dataset.id);
      const product = products.find(x => x.id === id);
      if (!product) return;

      cartAdd(product, 1);
      renderCart(products);
    });
  });
}

function renderCart(products) {
  const cart = cartGet();

  const itemsDiv = document.getElementById("cart-items");
  const emptyP = document.getElementById("cart-empty");
  const totalEl = document.getElementById("cart-total");

  if (!itemsDiv || !emptyP || !totalEl) return;

  itemsDiv.innerHTML = "";

  // mapa de productos por id (para stock y datos frescos)
  const map = new Map(products.map(p => [p.id, p]));

  if (cart.length === 0) {
    emptyP.style.display = "block";
    totalEl.textContent = money(0);
    return;
  }

  emptyP.style.display = "none";

  let total = 0;

  cart.forEach(item => {
    const p = map.get(item.productId);

    // preferimos datos actuales del backend, si existen
    const nombre = (p && (p.nombre || p.name)) || item.name || "Producto";
    const precio = Number((p && (p.precio || p.price)) || item.price || 0);
    const stock = p && typeof p.stock === "number" ? p.stock : item.stock;

    const sub = precio * item.quantity;
    total += sub;

    const row = document.createElement("div");
    row.className = "cart-item";

    row.innerHTML = `
      <div class="cart-item-info">
        <strong>${nombre}</strong>
        <div>${money(precio)}</div>
      </div>

      <div class="cart-item-actions" style="display:flex; gap:8px; align-items:center">
        <input
          type="number"
          min="1"
          value="${item.quantity}"
          class="cart-qty"
          data-id="${item.productId}"
          style="width:70px"
        />
        <button class="btn btn-outline btn-remove" data-id="${item.productId}">X</button>
      </div>

      <div class="cart-item-subtotal">
        <strong>${money(sub)}</strong>
      </div>
    `;

    itemsDiv.appendChild(row);

    // guardamos en el item lo basico por si recargas sin productos
    item.name = nombre;
    item.price = precio;
    if (typeof stock === "number") item.stock = stock;
  });

  cartSave(cart);
  totalEl.textContent = money(total);

  // qty change
  document.querySelectorAll(".cart-qty").forEach(inp => {
    inp.addEventListener("change", () => {
      const id = Number(inp.dataset.id);
      const p = map.get(id);
      const stock = p && typeof p.stock === "number" ? p.stock : undefined;

      cartSetQty(id, inp.value, stock);
      renderCart(products);
    });
  });

  // remove
  document.querySelectorAll(".btn-remove").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = Number(btn.dataset.id);
      cartRemove(id);
      renderCart(products);
    });
  });
}

function goCheckout() {
  // checkout debe ser privado: si no hay token, manda a login
  const token = getToken();

  if (!token) {
    // return para volver al checkout despues del login
    window.location.href = "login.html?next=checkout.html";
    return;
  }

  window.location.href = "checkout.html";
}

document.addEventListener("DOMContentLoaded", async () => {
  try {
    const products = await loadProducts();
    renderProducts(products);
    renderCart(products);

    const btnCheckout = document.getElementById("checkout-btn");
    if (btnCheckout) {
      btnCheckout.addEventListener("click", goCheckout);
    }
  } catch (e) {
    console.error(e);

    const list = document.getElementById("product-list");
    if (list) {
      list.innerHTML = `<p class="mensaje-error">No se pudieron cargar los productos.</p>`;
    }
  }
});


