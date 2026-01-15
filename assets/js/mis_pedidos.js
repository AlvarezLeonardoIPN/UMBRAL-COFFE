// assets/js/mis_pedidos.js

const API = "http://localhost:3000/api";

// Configuración visual de estatus
const STATUS_CONFIG = {
    'pendiente':  { color: '#ffbb33', text: '⏳ Pendiente de envío' },
    'en proceso': { color: '#33b5e5', text: '📦 Preparando paquete' },
    'enviado':    { color: '#2BBBAD', text: '🚚 En camino' },
    'recibido':   { color: '#00C851', text: '✅ Entregado' },
    'cancelado':  { color: '#ff4444', text: '🚫 PEDIDO CANCELADO' }
};

document.addEventListener("DOMContentLoaded", async () => {
    const token = localStorage.getItem("token");
    if (!token) {
        window.location.href = "login.html";
        return;
    }

    try {
        const res = await fetch(`${API}/orders/mine`, {
            headers: { "Authorization": "Bearer " + token }
        });
        const orders = await res.json();
        
        const list = document.getElementById("orders-list");
        if (!list) return;

        if (orders.length === 0) {
            list.innerHTML = "<p style='text-align:center; opacity:0.6; margin-top:40px;'>No tienes pedidos aún.</p>";
            return;
        }

        list.innerHTML = orders.map(o => {
            const config = STATUS_CONFIG[o.status] || STATUS_CONFIG['pendiente'];
            
            // Estilo especial para cancelados (Rojo tenue)
            const bgStyle = o.status === 'cancelado' 
                ? 'background: rgba(255, 68, 68, 0.05); border: 1px solid #ff4444;' 
                : 'background: #161616; border: 1px solid #333;';

            return `
            <div class="card" onclick="toggleDetails(${o.id}, this, '${o.status}')" 
                 style="padding:20px; margin-bottom:15px; border-radius:12px; cursor:pointer; transition:0.2s; ${bgStyle}">
                
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <div>
                        <h3 style="margin:0; color:#fff; font-size:16px;">Orden #${o.id}</h3>
                        <small style="opacity:0.6">${new Date(o.created_at).toLocaleDateString()} ${new Date(o.created_at).toLocaleTimeString()}</small>
                        <br>
                        <span style="display:inline-block; margin-top:8px; padding:4px 10px; background:${config.color}; color:#000; border-radius:4px; font-size:11px; font-weight:bold; text-transform:uppercase;">
                            ${config.text}
                        </span>
                    </div>
                    <div style="text-align:right;">
                        <div style="font-size:18px; font-weight:bold; color:#c5a059;">$${Number(o.total).toFixed(2)}</div>
                        <span style="font-size:12px; opacity:0.5;">Ver detalles ▾</span>
                    </div>
                </div>
                
                <div id="details-${o.id}" style="margin-top:15px; display:none;"></div>
            </div>
            `;
        }).join("");

    } catch (e) {
        console.error(e);
    }
});

async function toggleDetails(id, cardElement, status) {
    const container = document.getElementById(`details-${id}`);
    if (!container) return;

    // Toggle abrir/cerrar
    if (container.style.display === "block") {
        container.style.display = "none";
        return;
    }
    container.style.display = "block";
    
    if (container.innerHTML !== "") return; // Ya cargado

    container.innerHTML = "<p style='font-size:12px; opacity:0.5;'>Cargando productos...</p>";

    try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${API}/orders/${id}/items`, {
            headers: { "Authorization": "Bearer " + token }
        });
        const items = await res.json();

        // Aviso especial si está cancelado
        let cancelMsg = "";
        if (status === 'cancelado') {
            cancelMsg = `
            <div style="background:rgba(255,0,0,0.1); border-left:3px solid #ff4444; padding:10px; margin-bottom:10px; font-size:12px; color:#ffaaaa;">
                ⚠️ <strong>Aviso:</strong> Este pedido fue cancelado. Si tienes dudas sobre el reembolso, contacta a soporte.
            </div>`;
        }

        const info = items[0] || {}; 

        container.innerHTML = `
            <div style="border-top:1px solid rgba(255,255,255,0.1); padding-top:15px;">
                ${cancelMsg}
                
                <div style="display:grid; grid-template-columns:1fr 1fr; gap:20px; font-size:12px; margin-bottom:15px;">
                    <div>
                        <strong style="color:#c5a059">Envío:</strong><br>
                        ${info.street || 'Dirección no disponible'} #${info.ext_number || ''}, ${info.neighborhood || ''}
                    </div>
                    <div>
                        <strong style="color:#c5a059">Pago:</strong><br>
                        ${info.brand || 'Método'} **** ${info.card_last4 || '****'}
                    </div>
                </div>

                <table style="width:100%; font-size:13px; border-collapse:collapse;">
                    <tr style="color:#888; text-align:left; border-bottom:1px solid #333;">
                        <th style="padding-bottom:5px;">Producto</th>
                        <th style="padding-bottom:5px; text-align:center;">Cant.</th>
                        <th style="padding-bottom:5px; text-align:right;">Subtotal</th>
                    </tr>
                    ${items.map(it => `
                        <tr>
                            <td style="padding:8px 0; color: ${it.product_name ? '#eee' : '#ff5555'};">
                                ${it.product_name || 'Producto no disponible (Eliminado)'}
                            </td>
                            <td style="text-align:center;">${it.quantity}</td>
                            <td style="text-align:right;">$${(it.unit_price * it.quantity).toFixed(2)}</td>
                        </tr>
                    `).join("")}
                </table>
                
                <div style="margin-top:15px; text-align:right;">
                    ${status !== 'cancelado' ? '<button onclick="alert(\'Generando PDF...\')" style="background:#c5a059; border:none; padding:5px 10px; cursor:pointer; font-weight:bold; border-radius:4px;">Descargar PDF</button>' : ''}
                </div>
            </div>
        `;

    } catch (e) {
        container.innerHTML = "<p style='color:red'>Error al cargar detalles.</p>";
    }
}