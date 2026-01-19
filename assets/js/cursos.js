const API = "http://3.237.91.96:3000/api"; // IP corregida

const token = () => localStorage.getItem("token");



window.inscribirse = async (nombreCurso, btnId) => {

    const btn = document.getElementById(btnId) || event.target;



    if (!token()) {

        alert("Inicia sesión para inscribirte.");

        window.location.href = "login.html";

        return;

    }



    const txt = btn.textContent;

    btn.textContent = "...";

    btn.disabled = true;



    try {

        const res = await fetch(`${API}/course-registrations`, {

            method: "POST",

            headers: {

                "Content-Type": "application/json",

                "Authorization": "Bearer " + token()

            },

            body: JSON.stringify({ courseName: nombreCurso })

        });



        const data = await res.json();



        if (res.ok) {

            alert(`¡Inscrito a ${nombreCurso}!`);

            btn.textContent = "Inscrito";

            btn.style.background = "green";

        } else {

            alert(data.error);

            btn.textContent = txt;

            btn.disabled = false;

        }

    } catch (e) {

        alert("Error de conexión");

        btn.textContent = txt;

        btn.disabled = false;

    }

};
