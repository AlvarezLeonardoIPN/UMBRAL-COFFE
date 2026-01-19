const API = "http://3.237.91.96:3000/api";

const token = () => localStorage.getItem("token");



document.addEventListener("DOMContentLoaded", async () => {

    if (!token()) {

        window.location.href = "login.html";

        return;

    }



    // Carga inicial de datos

    await loadProfile();

    await loadAddresses();

    await loadCards();



    // Eventos para Perfil

    document.getElementById("btn-save-profile").addEventListener("click", saveProfile);



    // Eventos para Direcciones

    document.getElementById("btn-add-address").addEventListener("click", addAddress);



    // Eventos para Métodos de Pago

    document.getElementById("btn-add-card").addEventListener("click", addCard);

});



// --- PERFIL ---

async function loadProfile() {

    try {

        const res = await fetch(`${API}/auth/me`, {

            headers: { "Authorization": "Bearer " + token() }

        });

        const user = await res.json();

        document.getElementById("acc-name").value = user.name || "";

        document.getElementById("acc-email").value = user.email || "";

    } catch (e) { console.error("Error al cargar perfil", e); }

}



async function saveProfile() {

    const name = document.getElementById("acc-name").value;

    const email = document.getElementById("acc-email").value;



    try {

        const res = await fetch(`${API}/users/profile`, {

            method: "PUT",

            headers: { 

                "Content-Type": "application/json",

                "Authorization": "Bearer " + token()

            },

            body: JSON.stringify({ name, email })

        });

        if (res.ok) alert("Perfil actualizado correctamente");

        else alert("Error al actualizar perfil");

    } catch (e) { alert("Error de conexión"); }

}



// --- DIRECCIONES ---

async function loadAddresses() {

    try {

        const res = await fetch(`${API}/addresses`, {

            headers: { "Authorization": "Bearer " + token() }

        });

        const addrs = await res.json();

        const list = document.getElementById("addresses-list");

        list.innerHTML = addrs.map(a => `

            <div class="umbral-list-item">

                <span>${a.street} #${a.ext_number}, ${a.colonia}</span>

                <button onclick="deleteAddress(${a.id})" style="background:none; border:none; color:#ff5555; cursor:pointer;">Eliminar</button>

            </div>

        `).join("");

    } catch (e) { console.error(e); }

}



async function addAddress() {

    const data = {

        street: document.getElementById("addr-street").value,

        ext_number: document.getElementById("addr-ext").value,

        colonia: document.getElementById("addr-neigh").value,

        cp: document.getElementById("addr-cp").value

    };



    const res = await fetch(`${API}/addresses`, {

        method: "POST",

        headers: { 

            "Content-Type": "application/json",

            "Authorization": "Bearer " + token()

        },

        body: JSON.stringify(data)

    });



    if (res.ok) {

        alert("Dirección agregada");

        location.reload();

    }

}



// --- MÉTODOS DE PAGO (TARJETAS) ---

async function loadCards() {

    try {

        const res = await fetch(`${API}/payment-methods`, {

            headers: { "Authorization": "Bearer " + token() }

        });

        const cards = await res.json();

        const list = document.getElementById("cards-list");

        list.innerHTML = cards.map(c => `

            <div class="umbral-list-item">

                <span>${c.brand} **** ${c.card_last4}</span>

                <button onclick="deleteCard(${c.id})" style="background:none; border:none; color:#ff5555; cursor:pointer;">Eliminar</button>

            </div>

        `).join("");

    } catch (e) { console.error(e); }

}



async function addCard() {

    const cardData = {

        cardHolder: document.getElementById("card-holder").value,

        cardNumber: document.getElementById("card-number").value,

        expMonth: parseInt(document.getElementById("card-mm").value),

        expYear: parseInt(document.getElementById("card-yy").value),

        cvv: document.getElementById("card-cvv").value, // SE ENVÍA EL CVV AL BACKEND

        brand: document.getElementById("card-brand").value

    };



    if (!cardData.cardHolder || !cardData.cardNumber || !cardData.cvv) {

        alert("Por favor completa los datos de la tarjeta y el CVV");

        return;

    }



    try {

        const res = await fetch(`${API}/payment-methods`, {

            method: "POST",

            headers: { 

                "Content-Type": "application/json",

                "Authorization": "Bearer " + token()

            },

            body: JSON.stringify(cardData)

        });



        if (res.ok) {

            alert("Tarjeta guardada con éxito");

            location.reload();

        } else {

            const err = await res.json();

            alert("Error: " + err.error);

        }

    } catch (e) { alert("Error de conexión"); }

}



// Funciones globales para eliminar

window.deleteAddress = async (id) => {

    if (!confirm("¿Eliminar dirección?")) return;

    await fetch(`${API}/addresses/${id}`, {

        method: "DELETE",

        headers: { "Authorization": "Bearer " + token() }

    });

    location.reload();

};



window.deleteCard = async (id) => {

    if (!confirm("¿Eliminar tarjeta?")) return;

    await fetch(`${API}/payment-methods/${id}`, {

        method: "DELETE",

        headers: { "Authorization": "Bearer " + token() }

    });

    location.reload();

};
