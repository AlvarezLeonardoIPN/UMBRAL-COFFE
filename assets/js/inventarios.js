// assets/js/inventarios.js
const API = "http://localhost:3000/api";

const qs = (id) => document.getElementById(id);
const token = () => localStorage.getItem("token");

// --- INICIALIZACIÓN ---
document.addEventListener("DOMContentLoaded", () => {
    // Verificar sesión básica
    const userStr = localStorage.getItem("user");
    if (!userStr || !token()) { 
        window.location.href = "login.html"; 
        return; 
    }
    
    // Cargar pedidos
    loadToday();
});

// --- CARGAR PEDIDOS ---
async function loadToday() {
    const box = qs("orders-box");
    const err = qs("inv-error");
    if (!box) return;

    if(err) err.style.display = "none";
    box.innerHTML = "<p style='padding:20px; text-align:center;'>Cargando pedidos...</p>";

    try {
        const res = await fetch(`${API}/orders/today`, { 
            headers: { "Authorization": "Bearer " + token() } 
        });
        const orders = await res.json();

        if (!res.ok) throw new Error(orders.error || "Error al cargar ventas");

        if (orders.length === 0) {
            box.innerHTML = "<p style='opacity:.85; text-align:center; padding:40px;'>✅ Todo limpio. No hay ventas pendientes hoy.</p>";
            return;
        }

        // Renderizar lista
        box.innerHTML = orders.map(o => {
            // Colores según estatus
            let statusColor = '#ffbb33'; // Pendiente (Amarillo)
            let borderColor = 'rgba(255,255,255,0.1)';
            
            if (o.status === 'en proceso') statusColor = '#33b5e5'; // Azul
            if (o.status === 'enviado') statusColor = '#2BBBAD'; // Teal
            if (o.status === 'recibido') statusColor = '#00C851'; // Verde
            if (o.status === 'cancelado') {
                statusColor = '#ff4444'; // Rojo
                borderColor = '#ff4444'; 
            }

            // Parsear detalles si vienen como string (por seguridad)
            let productos = o.detalles;
            if (typeof productos === 'string') productos = JSON.parse(productos);

            return `
            <div style="background:#161616; border:1px solid ${borderColor}; border-radius:14px; padding:16px; margin-bottom:16px;">
                <div style="display:flex; justify-content:space-between; gap:12px; flex-wrap:wrap;">
                    
                    <div style="flex:1; min-width:200px;">
                        <div style="display:flex; align-items:center; gap:10px; margin-bottom:8px;">
                            <strong style="font-size:16px; color:#c5a059;">Orden #${o.id}</strong>
                            <span style="font-size:11px; padding:2px 8px; border-radius:4px; border:1px solid ${statusColor}; color:${statusColor}; text-transform:uppercase; font-weight:bold;">
                                ${o.status}
                            </span>
                        </div>
                        
                        <div style="font-size:13px; opacity:.85; margin-bottom:4px;">
                            👤 <strong>${o.cliente_nombre}</strong> (ID: ${o.cliente_id})
                        </div>
                        <div style="font-size:13px; opacity:.85; margin-bottom:10px;">
                            💰 Total: <strong>$${Number(o.total).toFixed(2)}</strong>
                        </div>

                        <div style="background:rgba(255,255,255,0.05); border-radius:8px; padding:10px;">
                            <ul style="margin:0; padding-left:20px; font-size:13px; color:#ddd;">
                                ${productos.map(p => `
                                    <li><strong>${p.cantidad}x</strong> ${p.nombre}</li>
                                `).join("")}
                            </ul>
                        </div>
                        <div style="font-size:11px; opacity:0.5; margin-top:8px; text-align:right;">
                            Hora: ${new Date(o.created_at).toLocaleTimeString()}
                        </div>
                    </div>

                    <div style="min-width:200px; display:flex; flex-direction:column; justify-content:center;">
                        <label style="font-size:12px; margin-bottom:5px; color:#aaa;">Actualizar Estatus:</label>
                        <select onchange="updateStatus(${o.id}, this.value)" style="width:100%; padding:10px; border-radius:8px; background:#000; color:#fff; border:1px solid #444; cursor:pointer;">
                            <option value="pendiente" ${o.status==='pendiente'?'selected':''}>⏳ Pendiente</option>
                            <option value="en proceso" ${o.status==='en proceso'?'selected':''}>📦 En Proceso</option>
                            <option value="enviado" ${o.status==='enviado'?'selected':''}>🚚 Enviado</option>
                            <option value="recibido" ${o.status==='recibido'?'selected':''}>✅ Recibido</option>
                            <option value="cancelado" ${o.status==='cancelado'?'selected':''}>🚫 CANCELAR</option>
                        </select>
                    </div>
                </div>
            </div>
            `;
        }).join("");

    } catch (e) {
        console.error(e);
        if (err) {
            err.textContent = e.message;
            err.style.display = "block";
        }
        box.innerHTML = "<p style='color:#ff5555; text-align:center;'>Error de conexión con el servidor.</p>";
    }
}

// --- ACTUALIZAR ESTATUS (Con lógica de Stock) ---
async function updateStatus(id, status) {
    let restoreStock = false;

    // Si elige cancelar, preguntamos lo del stock
    if (status === 'cancelado') {
        const confirmCancel = confirm("¿Estás seguro de cancelar esta orden? El cliente verá el aviso en su perfil.");
        if (!confirmCancel) {
            loadToday(); // Recargar para revertir el select visualmente
            return;
        }
        restoreStock = confirm("¿Deseas devolver los productos al inventario?\n\n[Aceptar] = Sí, restaurar stock\n[Cancelar] = No, solo cancelar orden");
    }

    try {
        const res = await fetch(`${API}/orders/${id}/status`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + token()
            },
            body: JSON.stringify({ status, restoreStock })
        });

        const data = await res.json();

        if (!res.ok) throw new Error(data.error || "Error al actualizar");

        alert(`Orden #${id} actualizada a: ${status}`);
        loadToday(); // Recargar lista para ver cambios (colores, etc)

    } catch (e) {
        alert(e.message);
    }
}