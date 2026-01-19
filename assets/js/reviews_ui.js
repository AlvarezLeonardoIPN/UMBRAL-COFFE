// assets/js/reviews_ui.js
const API = "http://3.237.91.96:3000/api/auth/register";

function qs(id){ return document.getElementById(id); }
function show(el){ if(el) el.style.display = "block"; }
function hide(el){ if(el) el.style.display = "none"; }

function getToken(){ return localStorage.getItem("token") || ""; }
function getUser(){
  try { return JSON.parse(localStorage.getItem("user") || "null"); }
  catch { return null; }
}
function isLogged(){ return !!getToken() && !!getUser(); }

async function apiGetPublic(path){
  const res = await fetch(API + path);
  const data = await res.json().catch(() => ({}));
  if(!res.ok) throw new Error(data.error || data.detail || "Error servidor");
  return data;
}

async function apiPostAuth(path, body){
  const res = await fetch(API + path, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + getToken()
    },
    body: JSON.stringify(body || {})
  });
  const data = await res.json().catch(() => ({}));
  if(!res.ok) throw new Error(data.error || data.detail || "Error servidor");
  return data;
}

function formatDate(iso){
  try { return new Date(iso).toLocaleString(); }
  catch { return iso || ""; }
}

function starsHtml(val){
  const v = Math.max(1, Math.min(5, Number(val || 1)));
  let html = "";
  for(let i=1;i<=5;i++){
    html += `<span style="color:${i<=v ? "#f5c46b" : "#555"}">★</span>`;
  }
  return html;
}

async function loadReviews(productId){
  const data = await apiGetPublic(`/reviews/product/${productId}`);
  return Array.isArray(data) ? data : [];
}

async function sendReview(productId, rating, comment){
  return await apiPostAuth(`/reviews`, { productId, rating, comment });
}

// estado UI
let PICKED = 1;

function paintPicker(){
  const box = qs("star-picker");
  const val = qs("star-value");
  if(!box) return;

  const disabled = !isLogged();
  box.querySelectorAll(".star-btn").forEach(btn => {
    const v = Number(btn.dataset.v);
    btn.disabled = disabled;
    btn.style.opacity = disabled ? ".55" : "1";
    btn.style.background = "transparent";
    btn.style.border = "none";
    btn.style.cursor = disabled ? "not-allowed" : "pointer";
    btn.style.fontSize = "22px";
    btn.style.color = (v <= PICKED) ? "#f5c46b" : "#555";

    if(!btn.dataset.bound){
      btn.dataset.bound = "1";
      btn.addEventListener("click", () => {
        PICKED = Number(btn.dataset.v) || 1;
        paintPicker();
      });
    }
  });

  if(val) val.textContent = `${PICKED}/5`;
}

function paintList(list){
  const box = qs("reviews-list");
  if(!box) return;

  if(!Array.isArray(list) || list.length === 0){
    box.innerHTML = `<p style="opacity:.85">Aún no hay reseñas.</p>`;
    return;
  }

  box.innerHTML = list.map(r => {
    const name = r.user_name || "Usuario";
    const rating = Number(r.rating || 1);
    const text = String(r.comment || "").trim();

    return `
      <div style="border:1px solid rgba(255,255,255,.10); border-radius:14px; padding:12px; margin-top:10px">
        <div style="display:flex; justify-content:space-between; gap:10px">
          <div>
            <strong>${name}</strong>
            <div style="margin-top:6px">${starsHtml(rating)}</div>
          </div>
          <div style="opacity:.75">${formatDate(r.updated_at || r.created_at)}</div>
        </div>
        ${text ? `<p style="margin-top:10px; opacity:.9">${text}</p>` : `<p style="margin-top:10px; opacity:.7">Sin comentario.</p>`}
      </div>
    `;
  }).join("");
}

// --- FUNCIÓN PRINCIPAL CORREGIDA ---
async function initReviewsUI(productId){
  const user = getUser();
  
  // 1. REGLA VISUAL DE STAFF
  // Si es empleado, ocultamos el formulario completamente
  const reviewFormContainer = qs("review-form-container"); 
  if (user && (user.role === 'admin' || user.role === 'inventarios')) {
      if (reviewFormContainer) {
          reviewFormContainer.innerHTML = `
            <div style="background:rgba(197, 160, 89, 0.1); border:1px solid #c5a059; padding:15px; border-radius:8px; text-align:center; color:#ddd; font-size:13px;">
                🛡️ <strong>Modo Staff Activo</strong><br>
                La función de reseñas está deshabilitada para tu rol (${user.role}) por política de imparcialidad.
            </div>
          `;
      }
      // Cargamos la lista y salimos
      const list = await loadReviews(productId);
      paintList(list);
      return; 
  }

  // --- Lógica normal para clientes ---
  const hint = qs("p-login-hint");
  if(hint){
    hint.style.display = isLogged() ? "none" : "block";
  }

  paintPicker();

  const err = qs("rev-error");
  const ok = qs("rev-ok");
  const btn = qs("btn-send-review");

  const clearMsgs = () => {
    if(err) hide(err);
    if(ok) hide(ok);
  };

  const refresh = async () => {
    const list = await loadReviews(productId);
    paintList(list);
  };

  await refresh();

  if(btn && !btn.dataset.bound){
    btn.dataset.bound = "1";
    btn.addEventListener("click", async () => {
      clearMsgs();

      if(!isLogged()){
        if(err){ err.textContent = "Inicia sesión para calificar o comentar."; show(err); }
        return;
      }

      const rating = Number(PICKED || 1);
      if(rating < 1 || rating > 5){
        if(err){ err.textContent = "Calificación inválida (1 a 5)."; show(err); }
        return;
      }

      const comment = String(qs("review-text")?.value || "").trim();
      const payloadComment = comment ? comment : null;

      try{
        await sendReview(productId, rating, payloadComment);
        if(ok){ ok.textContent = "Reseña guardada."; show(ok); }
        if(qs("review-text")) qs("review-text").value = "";
        await refresh();
      }catch(e){
        if(err){ err.textContent = e.message; show(err); }
      }
    });
  }
}

window.UmbralReviewsUI = { initReviewsUI };
