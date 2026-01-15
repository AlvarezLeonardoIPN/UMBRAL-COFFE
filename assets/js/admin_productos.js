const API = "http://localhost:3000/api";
let CURRENT_ID = null;

const qs = id => document.getElementById(id);
const token = () => localStorage.getItem("token");
const SUPERADMIN_ID = 4; 

async function init() {
    const userStr = localStorage.getItem("user");
    if (!userStr) { window.location.href = "login.html"; return; }
    const user = JSON.parse(userStr);

    if (user.role === 'admin') {
        loadUsers();
        loadReports();
    } else if (user.role === 'inventarios') {
        if(qs("tab-users")) qs("tab-users").style.display = 'none';
        if(qs("tab-reports")) qs("tab-reports").style.display = 'none';
        if(qs("panel-title")) qs("panel-title").textContent = "Panel de Inventarios 📦";
    }

    loadTodaySales();
    loadProducts();

    try {
        const catRes = await fetch(`${API}/categories`);
        const cats = await catRes.json();
        if(qs("p-category")) {
            qs("p-category").innerHTML = cats.map(c => `<option value="${c.id}">${c.name}</option>`).join("");
        }
    } catch (e) { console.error(e); }
}

async function loadProducts() {
    try {
        const res = await fetch(`${API}/products`);
        const data = await res.json();
        const list = qs("products-list");
        if(!list) return;

        list.innerHTML = data.map(p => `
            <div class="user-row" onclick='fillForm(${JSON.stringify(p)})' style="cursor:pointer;">
                <div><strong>${p.name}</strong><br><small>$${Number(p.price).toFixed(2)} | Stock: ${p.stock}</small></div>
                <div>✏️</div>
            </div>
        `).join("");
    } catch (e) { console.error(e); }
}

function fillForm(p) {
    CURRENT_ID = p.id;
    qs("form-title").textContent = "Editando: " + p.name;
    qs("p-name").value = p.name;
    qs("p-price").value = p.price;
    qs("p-stock").value = p.stock;
    qs("p-delivery").value = p.estimated_delivery_days || 3;
    qs("p-category").value = p.category_id;
    qs("p-desc").value = p.description || "";
    
    // Mostrar Imágenes Actuales
    const imgContainer = qs("current-images-container");
    imgContainer.innerHTML = "";
    if(p.images && p.images.length > 0) {
        p.images.forEach(img => {
            const wrap = document.createElement("div");
            wrap.className = "thumb-wrapper";
            wrap.innerHTML = `
                <img src="${img.url}">
                <button type="button" class="btn-del-img" onclick="deleteImage(${img.id}, event)">🗑️</button>
            `;
            imgContainer.appendChild(wrap);
        });
    } else {
        imgContainer.innerHTML = "<small style='opacity:0.5;'>Sin imágenes.</small>";
    }

    const user = JSON.parse(localStorage.getItem("user") || "{}");
    qs("btn-delete").style.display = (user.role === 'admin') ? "block" : "none";
    qs("btn-save").textContent = "Actualizar Producto";
}

async function deleteImage(imageId, event) {
    event.stopPropagation();
    if(!confirm("¿Eliminar esta imagen?")) return;
    try {
        const res = await fetch(`${API}/products/images/${imageId}`, {
            method: 'DELETE',
            headers: { "Authorization": "Bearer " + token() }
        });
        if(res.ok) {
            event.target.closest('.thumb-wrapper').remove();
            loadProducts(); // Refrescar datos en segundo plano
        }
    } catch (e) { alert("Error al borrar"); }
}

async function saveProduct() {
    const formData = new FormData();
    formData.append('name', qs("p-name").value);
    formData.append('price', qs("p-price").value);
    formData.append('stock', qs("p-stock").value);
    formData.append('estimated_delivery_days', qs("p-delivery").value);
    formData.append('category', qs("p-category").value);
    formData.append('description', qs("p-desc").value);
    
    const fileInput = qs("p-images");
    for (let i = 0; i < fileInput.files.length; i++) {
        formData.append('images', fileInput.files[i]);
    }

    const url = CURRENT_ID ? `${API}/products/${CURRENT_ID}` : `${API}/products`;
    const method = CURRENT_ID ? "PUT" : "POST";

    try {
        const res = await fetch(url, {
            method: method,
            headers: { "Authorization": "Bearer " + token() },
            body: formData
        });
        if (res.ok) { alert("¡Éxito!"); location.reload(); }
    } catch(e) { console.error(e); }
}

// Ventas, Usuarios y Reportes (Mismo código anterior...)
async function loadTodaySales() {
    const list = qs("ventas-dia-list");
    if(!list) return;
    try {
        const res = await fetch(`${API}/orders/today`, { headers: { "Authorization": "Bearer " + token() } });
        const orders = await res.json();
        if (orders.length === 0) { list.innerHTML = "<p>No hay pedidos hoy.</p>"; return; }
        list.innerHTML = orders.map(o => `
            <div class="user-row" style="flex-direction:column; align-items:flex-start;">
                <strong>ORDEN #${o.id} - ${o.status}</strong>
                <select onchange="updateStatus(${o.id}, this.value)">
                    <option value="pendiente" ${o.status==='pendiente'?'selected':''}>Pendiente</option>
                    <option value="en proceso" ${o.status==='en proceso'?'selected':''}>En Proceso</option>
                    <option value="enviado" ${o.status==='enviado'?'selected':''}>Enviado</option>
                    <option value="cancelado" ${o.status==='cancelado'?'selected':''}>Cancelar</option>
                </select>
                <small>${o.cliente_nombre}: ${o.detalles.map(d => d.nombre).join(", ")}</small>
            </div>
        `).join("");
    } catch (e) { console.error(e); }
}

async function updateStatus(id, status) {
    await fetch(`${API}/orders/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token() },
        body: JSON.stringify({ status })
    });
    loadTodaySales();
}

async function loadUsers() {
    const list = qs("users-list");
    if(!list) return;
    const res = await fetch(`${API}/users`, { headers: { "Authorization": "Bearer " + token() } });
    const users = await res.json();
    list.innerHTML = users.map(u => `
        <div class="user-row">
            <span>${u.name} (${u.role})</span>
            <select onchange="updateRole(${u.id}, this.value)" ${u.id === SUPERADMIN_ID ? 'disabled' : ''}>
                <option value="cliente" ${u.role==='cliente'?'selected':''}>Cliente</option>
                <option value="admin" ${u.role==='admin'?'selected':''}>Admin</option>
                <option value="inventarios" ${u.role==='inventarios'?'selected':''}>Inventarios</option>
            </select>
        </div>
    `).join("");
}

async function updateRole(id, role) {
    await fetch(`${API}/users/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', "Authorization": "Bearer " + token() }, body: JSON.stringify({ role }) });
}

async function loadReports() {
    const resD = await fetch(`${API}/reports/daily`, { headers: { "Authorization": "Bearer " + token() } });
    const daily = await resD.json();
    if(qs("report-daily-body")) {
        qs("report-daily-body").innerHTML = daily.map(r => `<tr><td>${r.day}</td><td>${r.orders}</td><td>$${r.total}</td></tr>`).join("");
    }
}

document.addEventListener("DOMContentLoaded", () => {
    init();
    if(qs("btn-save")) qs("btn-save").onclick = saveProduct;
});