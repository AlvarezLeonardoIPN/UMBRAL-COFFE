const API = "http://3.237.91.96:3000/api";

const token = () => localStorage.getItem("token");



const cartItemsContainer = document.getElementById("cart-items");

const cartTotalElement = document.getElementById("cart-total");

const cartSubtotalElement = document.getElementById("cart-subtotal");

const cartEmptyMsg = document.getElementById("cart-empty");

const btnCheckout = document.getElementById("btn-checkout");

const btnClear = document.getElementById("btn-clear");

const staffMsg = document.getElementById("staff-block-msg");



// --- INICIO ---

document.addEventListener("DOMContentLoaded", () => {

    checkStaffPermission();

    renderCart();



    if(btnClear) {

        btnClear.addEventListener("click", () => {

            if(confirm("¿Vaciar carrito?")) {

                localStorage.removeItem("cart");

                renderCart();

            }

        });

    }



    if(btnCheckout) {

        btnCheckout.addEventListener("click", () => {

            if (!token()) {

                alert("Debes iniciar sesión para continuar.");

                window.location.href = "login.html";

                return;

            }

            // AQUÍ LA CORRECCIÓN: Redirigir a checkout.html

            window.location.href = "checkout.html";

        });

    }

});



function getCart() {

    return JSON.parse(localStorage.getItem("cart")) || [];

}



function saveCart(cart) {

    localStorage.setItem("cart", JSON.stringify(cart));

    renderCart();

}



// --- RENDERIZADO (Solo Texto, Estilo Umbral) ---

function renderCart() {

    const cart = getCart();



    if (cart.length === 0) {

        if(cartItemsContainer) cartItemsContainer.style.display = "none";

        if(cartEmptyMsg) cartEmptyMsg.style.display = "block";

        if(cartTotalElement) cartTotalElement.textContent = "$0.00";

        if(cartSubtotalElement) cartSubtotalElement.textContent = "$0.00";

        if(btnCheckout) btnCheckout.disabled = true;

        return;

    }



    if(cartItemsContainer) cartItemsContainer.style.display = "block";

    if(cartEmptyMsg) cartEmptyMsg.style.display = "none";

    if(btnCheckout && !isStaff()) btnCheckout.disabled = false;



    let total = 0;



    if(cartItemsContainer) {

        cartItemsContainer.innerHTML = cart.map((item, index) => {

            const subtotal = item.price * item.quantity;

            total += subtotal;



            return `

                <div style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.1); border-radius:14px; padding:15px; margin-bottom:12px; display:flex; justify-content:space-between; align-items:center;">

                    

                    <div style="flex-grow:1;">

                        <h4 style="margin:0; color:#c5a059; font-size:15px; letter-spacing:0.5px; text-transform:uppercase;">${item.name}</h4>

                        <small style="color:#888;">$${Number(item.price).toFixed(2)} c/u</small>

                    </div>



                    <div style="display:flex; align-items:center; gap:15px;">

                        <div style="display:flex; align-items:center; background:#111; border-radius:8px; padding:4px;">

                            <button onclick="updateQuantity(${index}, -1)" style="background:none; border:none; color:#ccc; cursor:pointer; width:30px;">-</button>

                            <span style="color:#fff; font-weight:bold; width:20px; text-align:center;">${item.quantity}</span>

                            <button onclick="updateQuantity(${index}, 1)" style="background:none; border:none; color:#ccc; cursor:pointer; width:30px;">+</button>

                        </div>



                        <div style="text-align:right;">

                            <div style="font-weight:bold; color:#fff; font-size:15px;">$${subtotal.toFixed(2)}</div>

                            <button onclick="removeItem(${index})" style="color:#e74c3c; background:none; border:none; font-size:11px; cursor:pointer; margin-top:4px; text-decoration:underline; opacity:0.8;">

                                Quitar

                            </button>

                        </div>

                    </div>



                </div>

            `;

        }).join("");

    }



    const totalFmt = `$${total.toFixed(2)}`;

    if(cartTotalElement) cartTotalElement.textContent = totalFmt;

    if(cartSubtotalElement) cartSubtotalElement.textContent = totalFmt;

}



window.updateQuantity = (index, change) => {

    let cart = getCart();

    cart[index].quantity += change;

    if (cart[index].quantity <= 0) {

        if(confirm("¿Eliminar producto?")) cart.splice(index, 1);

        else cart[index].quantity = 1;

    }

    saveCart(cart);

};



window.removeItem = (index) => {

    let cart = getCart();

    cart.splice(index, 1);

    saveCart(cart);

};



// --- STAFF CHECK ---

function isStaff() {

    try {

        const user = JSON.parse(localStorage.getItem("user") || "{}");

        return user.role === 'admin' || user.role === 'inventarios';

    } catch(e) { return false; }

}



function checkStaffPermission() {

    if (isStaff()) {

        if(btnCheckout) {

            btnCheckout.disabled = true;

            btnCheckout.textContent = "Staff no compra";

            btnCheckout.style.opacity = "0.5";

        }

        if(staffMsg) staffMsg.style.display = "block";

    }

}
