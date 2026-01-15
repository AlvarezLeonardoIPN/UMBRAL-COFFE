// assets/js/reportes.js
const API = "http://localhost:3000/api";

function qs(id) { return document.getElementById(id); }
function show(el) { if (el) el.style.display = "block"; }
function hide(el) { if (el) el.style.display = "none"; }

function token() { return localStorage.getItem("token") || ""; }

async function apiGet(path) {
  const res = await fetch(API + path, {
    headers: { Authorization: "Bearer " + token() }
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || data.detail || "Error servidor");
  return data;
}

function money(n) {
  return "$" + Number(n || 0).toFixed(2);
}

function table(headers, rows) {
  if (!rows || rows.length === 0) {
    return `<p style="opacity:.85">Sin datos.</p>`;
  }

  const thead = `<tr>${headers.map(h => `<th style="text-align:left; padding:10px; border-bottom:1px solid rgba(255,255,255,.12)">${h}</th>`).join("")}</tr>`;
  const tbody = rows.map(r =>
    `<tr>${r.map(c => `<td style="padding:10px; border-bottom:1px solid rgba(255,255,255,.08); opacity:.95">${c}</td>`).join("")}</tr>`
  ).join("");

  return `
    <div style="overflow:auto">
      <table style="width:100%; border-collapse:collapse">
        <thead>${thead}</thead>
        <tbody>${tbody}</tbody>
      </table>
    </div>
  `;
}

function renderDaily(list) {
  const box = qs("rep-daily");
  if (!box) return;

  const rows = (list || []).map(x => ([
    String(x.day || ""),
    String(x.orders ?? 0),
    money(x.total)
  ]));

  box.innerHTML = table(["Dia", "Ordenes", "Total"], rows);
}

function renderMonthly(list) {
  const box = qs("rep-monthly");
  if (!box) return;

  const rows = (list || []).map(x => ([
    String(x.month || ""),
    String(x.orders ?? 0),
    money(x.total)
  ]));

  box.innerHTML = table(["Mes", "Ordenes", "Total"], rows);
}

function renderTop(list) {
  const box = qs("rep-top");
  if (!box) return;

  const rows = (list || []).map(x => ([
    String(x.month || ""),
    `${x.product_name} (ID: ${x.product_id})`,
    String(x.units ?? 0)
  ]));

  box.innerHTML = table(["Mes", "Producto top", "Unidades"], rows);
}

async function loadAll() {
  const err = qs("rep-error");
  if (err) hide(err);

  try {
    const [daily, monthly, top] = await Promise.all([
      apiGet("/reports/daily?days=14"),
      apiGet("/reports/monthly?months=12"),
      apiGet("/reports/top-products?months=12")
    ]);

    renderDaily(daily);
    renderMonthly(monthly);
    renderTop(top);
  } catch (e) {
    if (err) {
      err.textContent = e.message;
      show(err);
    }
  }
}

document.addEventListener("DOMContentLoaded", loadAll);

