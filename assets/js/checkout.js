const API = "http://3.237.91.96:3000/api";

const token = () => localStorage.getItem("token");



document.addEventListener("DOMContentLoaded", async () => {

    // Si no hay token, regresamos al login

    if (!token()) {

        window.location.href = "login.html";

        return;

    }



    await loadData();

    renderSummary();



    // Eventos de botones

    document.getElementById("btn-validate-and-confirm").addEventListener("click", confirmOrder);

    document.getElementById("btn-cancel").addEventListener("click", () => {

        window.location.href = "carrito.html";

    });

});



async function loadData() {

    const headers = { "Authorization": "Bearer " + token() };

    try {

        const resA = await fetch(`${API}/addresses`, { headers });

        const resP = await fetch(`${API}/payment-methods`, { headers });



        if (resA.status === 401 || resP.status === 401) {

            window.location.href = "login.html";

            return;

        }



        const addrs = await resA.json();

        const pays = await resP.json();



        // Llenar select de direcciones

        const addressSelect = document.getElementById("address-select");

        if (addrs.length > 0) {

            addressSelect.innerHTML = addrs.map(a => 

                `<option value="${a.id}">${a.street} #${a.ext_number}</option>`

            ).join("");

        } else {

            addressSelect.innerHTML = `<option value="">No tienes direcciones guardadas</option>`;

        }



        // Llenar select de métodos de pago

        const paymentSelect = document.getElementById("payment-select");

        if (pays.length > 0) {

            paymentSelect.innerHTML = pays.map(p => 

                `<option value="${p.id}">${p.brand} **** ${p.card_last4}</option>`

            ).join("");

        } else {

            paymentSelect.innerHTML = `<option value="">No tienes tarjetas guardadas</option>`;

        }



    } catch (e) {

        console.error("Error al cargar datos iniciales:", e);

    }

}



function renderSummary() {

    const cart = JSON.parse(localStorage.getItem("cart")) || [];

    const container = document.getElementById("summary-items");

    const totalEl = document.getElementById("summary-total");

    let total = 0;



    if (cart.length === 0) {

        container.innerHTML = `<p style="color:#888;">Tu carrito está vacío.</p>`;

        return;

    }



    container.innerHTML = cart.map(i => {

        const sub = i.price * i.quantity;

        total += sub;

        return `

            <div style="display:flex; justify-content:space-between; padding:8px 0; border-bottom:1px solid #222; font-size:14px;">

                <span style="color:#eee;">${i.quantity}x ${i.name}</span>

                <span style="color:#c5a059;">$${sub.toFixed(2)}</span>

            </div>`;

    }).join("");



    totalEl.textContent = `$${total.toFixed(2)}`;

}



async function confirmOrder() {

    const btn = document.getElementById("btn-validate-and-confirm");

    const cart = JSON.parse(localStorage.getItem("cart")) || [];

    const addressId = document.getElementById("address-select").value;

    const paymentMethodId = document.getElementById("payment-select").value;

    const cvv = document.getElementById("checkout-cvv").value;

    const notes = document.getElementById("notes").value;



    // Validaciones básicas

    if (!addressId || !paymentMethodId) {

        alert("Por favor selecciona dirección y método de pago.");

        return;

    }

    if (!cvv) {

        alert("El código CVV es obligatorio para procesar el pago.");

        return;

    }

    if (cart.length === 0) {

        alert("El carrito está vacío.");

        return;

    }



    btn.disabled = true;

    btn.textContent = "Validando pago...";



    try {

        const res = await fetch(`${API}/orders`, {

            method: "POST",

            headers: { 

                "Content-Type": "application/json", 

                "Authorization": "Bearer " + token() 

            },

            body: JSON.stringify({

                items: cart.map(i => ({ productId: i.id, quantity: i.quantity })),

                addressId: addressId,

                paymentMethodId: paymentMethodId,

                cvv: cvv, // Se envía al backend para validación

                notes: notes

            })

        });



        const data = await res.json();



        if (res.ok) {

            alert("✅ ¡Pago autorizado! Tu pedido ha sido creado.");

            localStorage.removeItem("cart"); // Limpiamos carrito local

            window.location.href = "mis_pedidos.html";

        } else {

            // Aquí atrapará el error de "CVV Incorrecto" enviado por el servidor

            alert("❌ Error en el pago: " + (data.error || "No se pudo completar la orden"));

            btn.disabled = false;

            btn.textContent = "Confirmar compra";

        }

    } catch (e) {

        alert("Hubo un problema de conexión con el servidor.");

        btn.disabled = false;

        btn.textContent = "Confirmar compra";

    }

}
