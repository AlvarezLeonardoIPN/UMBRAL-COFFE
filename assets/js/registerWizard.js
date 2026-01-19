document.addEventListener("DOMContentLoaded", () => {

    // 1. Navegación del Wizard

    const btnShowRegister = document.getElementById("btn-show-register");

    const btnStep1Next = document.getElementById("btn-step1-next");

    const btnStep2Next = document.getElementById("btn-step2-next");

    const btnFinish = document.getElementById("btn-finish-register");



    if (btnShowRegister) {

        btnShowRegister.onclick = () => {

            document.getElementById("register-wizard").style.display = "block";

            document.getElementById("login-form").style.display = "none";

        };

    }



    if (btnStep1Next) {

        btnStep1Next.onclick = () => {

            document.getElementById("step-1").style.display = "none";

            document.getElementById("step-2").style.display = "grid";

        };

    }



    if (btnStep2Next) {

        btnStep2Next.onclick = () => {

            document.getElementById("step-2").style.display = "none";

            document.getElementById("step-3").style.display = "grid";

        };

    }



    // 2. Envío Final al Backend

    if (btnFinish) {

        btnFinish.onclick = async () => {

            // Recolectamos todos los datos de los 3 pasos

            const data = {

                // Paso 1: Usuario

                name: document.getElementById("reg-name").value,

                email: document.getElementById("reg-email").value,

                password: document.getElementById("reg-password").value,

                

                // Paso 2: Dirección (Mapeo a nombres de DB)

                street: document.getElementById("addr-street").value,

                ext_number: document.getElementById("addr-ext").value,

                neighborhood: document.getElementById("addr-neigh").value, // Se mapea a neighborhood

                cp: document.getElementById("addr-cp").value,

                

                // Paso 3: Pago

                cardHolder: document.getElementById("card-holder").value,

                cardNumber: document.getElementById("card-number").value,

                expMonth: document.getElementById("card-mm").value,

                expYear: document.getElementById("card-yy").value,

                cvv: document.getElementById("card-cvv").value,

                brand: document.getElementById("card-brand") ? document.getElementById("card-brand").value : "Visa"

            };



            // Validación rápida

            if (!data.email || !data.password || !data.cvv) {

                alert("Por favor completa todos los campos, incluyendo el CVV.");

                return;

            }



            try {

                const res = await fetch("http://3.237.91.96:3000/api/auth/register", {

                    method: "POST",

                    headers: { "Content-Type": "application/json" },

                    body: JSON.stringify(data)

                });



                if (res.ok) {

                    alert("¡Registro exitoso! Ya puedes iniciar sesión con tu nueva cuenta.");

                    location.reload(); // Recargamos para volver al login normal

                } else {

                    const err = await res.json();

                    const errorMsg = document.getElementById("reg-error");

                    if (errorMsg) {

                        errorMsg.textContent = "Error: " + (err.error || "No se pudo registrar.");

                        errorMsg.style.display = "block";

                    } else {

                        alert("Error: " + err.error);

                    }

                }

            } catch (e) {

                console.error("Error en fetch:", e);

                alert("No se pudo conectar con el servidor.");

            }

        };

    }

});
