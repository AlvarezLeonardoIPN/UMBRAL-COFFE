const API = "http://3.237.91.96:3000/api";

const SERVER = "http://3.237.91.96:3000";

let CURRENT_ID = null;



const qs = id => document.getElementById(id);

const token = () => localStorage.getItem("token");



async function init() {

    console.log("������ Panel Iniciado");

    await loadProducts();

    await loadTodaySales();

    await loadReports();

    await loadUsers();

    await loadCategories();

}



async function loadCategories() {

    try {

        const res = await fetch(`${API}/categories`);

        const cats = await res.json();

        if(qs("p-category")) {

            qs("p-category").innerHTML = cats.map(c => `<option value="${c.id}">${c.name}</option>`).join("");

        }

    } catch(e) { console.error("Error categorías:", e); }

}



async function loadProducts() {

    try {

        const res = await fetch(`${API}/products`);

        const data = await res.json();

        const list = qs("products-list");

        if(list) {

            list.innerHTML = data.map(p => `

                <div class="user-row" onclick="prepareEdit(${p.id})" style="cursor:pointer; border-bottom:1px solid #333; padding:10px;">

                    <div><strong>${p.name}</strong><br><small>$${p.price} | Stock: ${p.stock}</small></div>

                    <div>✏️</div>

                </div>`).join("");

        }

    } catch (e) { console.error("Error productos:", e); }

}



async function prepareEdit(id) {

    try {

        console.log("Cargando producto ID:", id);

        const res = await fetch(`${API}/products/${id}`);

        const p = await res.json();

        CURRENT_ID = p.id;

        

        if(qs("form-title")) qs("form-title").textContent = "Editando: " + p.name;

        if(qs("p-name")) qs("p-name").value = p.name;

        if(qs("p-price")) qs("p-price").value = p.price;

        if(qs("p-stock")) qs("p-stock").value = p.stock;

        if(qs("p-delivery")) qs("p-delivery").value = p.estimated_delivery;

        if(qs("p-category")) qs("p-category").value = p.category_id;

        if(qs("p-desc")) qs("p-desc").value = p.description || "";



        const imgContainer = qs("current-images-container");

        if(imgContainer) {

            imgContainer.innerHTML = "";

            if (p.images && p.images.length > 0) {

                p.images.forEach(img => {

                    const wrap = document.createElement("div");

                    wrap.className = "thumb-wrapper";

                    wrap.style.margin = "5px";

                    wrap.style.display = "inline-block";

                    wrap.innerHTML = `

                        <img src="${SERVER}${img.url}" style="width:70px; height:70px; object-fit:cover; border-radius:5px;">

                        <button type="button" class="btn-del-img" onclick="deleteImage(${img.id}, event)" 

                                style="position:absolute; top:0; right:0; background:red; color:white; border:none; cursor:pointer;">X</button>

                    `;

                    imgContainer.appendChild(wrap);

                });

            } else {

                imgContainer.innerHTML = "<small>Sin imágenes en galería.</small>";

            }

        }

        // Mostrar botón eliminar producto si es edición

        if(qs("btn-delete")) qs("btn-delete").style.display = "block";

    } catch (e) { console.error("Error al cargar producto:", e); }

}



async function saveProduct(event) {

    if(event) event.preventDefault(); // Detener recarga de página

    console.log("Button Clicked: Iniciando proceso de guardado...");



    const formData = new FormData();

    formData.append('name', qs("p-name").value);

    formData.append('price', qs("p-price").value);

    formData.append('stock', qs("p-stock").value);

    formData.append('estimated_delivery', qs("p-delivery").value);

    formData.append('category_id', qs("p-category").value);

    formData.append('description', qs("p-desc").value);



    const fileInput = qs("p-images");

    if (fileInput.files.length > 0) {

        console.log(`Subiendo ${fileInput.files.length} imágenes...`);

        for (let i = 0; i < fileInput.files.length; i++) {

            formData.append('images', fileInput.files[i]);

        }

    }



    // Si hay CURRENT_ID es PUT (editar), si no es POST (crear)

    const url = CURRENT_ID ? `${API}/products/${CURRENT_ID}` : `${API}/products`;

    const method = CURRENT_ID ? "PUT" : "POST";



    try {

        const res = await fetch(url, {

            method: method,

            headers: { "Authorization": "Bearer " + token() },

            body: formData

        });



        const data = await res.json();

        if (res.ok) { 

            alert("✅ Guardado correctamente"); 

            location.reload(); 

        } else {

            alert("❌ Error: " + (data.error || "No se pudo guardar"));

        }

    } catch(e) { 

        console.error("Error fetch:", e);

        alert("Error de conexión"); 

    }

}



// FUNCIONES DE APOYO (Ventas, Usuarios, Reportes)

async function loadTodaySales() {

    try {

        const res = await fetch(`${API}/orders/today`, { headers: { "Authorization": "Bearer " + token() } });

        const data = await res.json();

        const list = qs("ventas-dia-list");

        if(list) {

            list.innerHTML = `

                <div style="display:flex; gap:20px; padding:10px; background:#1a1a1a; border-radius:10px;">

                    <div style="flex:1; text-align:center;">

                        <h2 style="margin:0; color:#c5a059;">$${Number(data.total || 0).toFixed(2)}</h2>

                        <small>Ventas hoy</small>

                    </div>

                    <div style="flex:1; text-align:center;">

                        <h2 style="margin:0; color:#c5a059;">${data.count || 0}</h2>

                        <small>Pedidos hoy</small>

                    </div>

                </div>`;

        }

    } catch (e) { console.error("Error ventas hoy:", e); }

}



async function loadUsers() {

    try {

        const res = await fetch(`${API}/users`, { headers: { "Authorization": "Bearer " + token() } });

        const users = await res.json();

        const list = qs("users-list");

        if(list && Array.isArray(users)) {

            list.innerHTML = users.map(u => `<div class="user-row"><span>${u.name}</span><strong>${u.role}</strong></div>`).join("");

        }

    } catch(e) { console.error("Error usuarios:", e); }

}



async function loadReports() {

    try {

        const res = await fetch(`${API}/reports/daily`, { headers: { "Authorization": "Bearer " + token() } });

        const daily = await res.json();

        const reportBody = qs("report-daily-body");

        if (reportBody && Array.isArray(daily)) {

            reportBody.innerHTML = daily.map(r => `<tr><td>${r.day}</td><td>${r.orders}</td><td>$${Number(r.total).toFixed(2)}</td></tr>`).join("");

        }

    } catch (e) { console.error("Error reportes:", e); }

}



async function deleteImage(id, event) {

    if(event) event.stopPropagation();

    if (!confirm("¿Eliminar imagen?")) return;

    try {

        const res = await fetch(`${API}/products/images/${id}`, {

            method: 'DELETE',

            headers: { "Authorization": "Bearer " + token() }

        });

        if (res.ok) prepareEdit(CURRENT_ID);

    } catch(e) { console.error("Error delete:", e); }

}



// VINCULACIÓN FINAL

document.addEventListener("DOMContentLoaded", () => {

    init();

    const saveBtn = qs("btn-save");

    if(saveBtn) {

        saveBtn.addEventListener("click", saveProduct);

        console.log("Event Listener attached to btn-save");

    }

});
