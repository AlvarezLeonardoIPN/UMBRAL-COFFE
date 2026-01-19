const API = "http://3.237.91.96:3000/api";

const token = () => localStorage.getItem("token");



document.addEventListener("DOMContentLoaded", async () => {

    // Si no hay sesión, redirigir al login

    if (!token()) {

        window.location.href = "login.html";

        return;

    }



    await loadOrders();

});



async function loadOrders() {

    try {

        const res = await fetch(`${API}/orders/my-orders`, {

            headers: { 

                "Authorization": "Bearer " + token() 

            }

        });



        // Si el token expiró o es inválido

        if (res.status === 401) {

            localStorage.clear();

            window.location.href = "login.html";

            return;

        }



        const orders = await res.json();

        const container = document.getElementById("orders-container");



        if (!container) return;



        if (orders.length === 0) {

            container.innerHTML = `

                <div style="text-align:center; margin-top:50px; color:#888;">

                    <p>Aún no tienes pedidos registrados.</p>

                    <a href="tienda.html" class="btn-primario" style="display:inline-block; margin-top:15px; text-decoration:none;">Ir a la tienda</a>

                </div>`;

            return;

        }



        // Renderizado de las tarjetas de pedidos

        container.innerHTML = orders.map(o => `

            <div class="order-card">

                <div class="order-header">

                    <div>

                        <span class="order-id">PEDIDO #${o.id}</span>

                        <p style="margin:5px 0 0 0; font-size:13px; color:#888;">

                            Fecha: ${new Date(o.created_at).toLocaleDateString()}

                        </p>

                    </div>

                    <span class="order-status">${o.status}</span>

                </div>

                <div style="display:flex; justify-content:space-between; align-items:center; margin-top:10px;">

                    <p style="margin:0; font-size:18px; color:#c5a059; font-weight:bold;">

                        Total: $${parseFloat(o.total || 0).toFixed(2)}

                    </p>

                    <button onclick="verTicket(${o.id})" class="btn-primario" style="padding:8px 20px; font-size:12px;">

                        DESCARGAR TICKET (PDF)

                    </button>

                </div>

            </div>

        `).join("");



    } catch (e) {

        console.error("Error al cargar pedidos:", e);

        const container = document.getElementById("orders-container");

        if (container) {

            container.innerHTML = `<p style="color:red; text-align:center;">Error al conectar con el servidor.</p>`;

        }

    }

}



/**

 * Función para descargar el ticket en PDF

 * Redirige a la ruta del API que genera el documento

 */

function verTicket(orderId) {

    const downloadUrl = `${API}/orders/${orderId}/pdf?token=${token()}`;

    

    // Abrimos en una pestaña nueva para que inicie la descarga del PDF

    window.open(downloadUrl, "_blank");

}
