// cart_ui.js
(function () {
  const CART_KEY = "umbral_cart";

  function read() {
    try { return JSON.parse(localStorage.getItem(CART_KEY) || "[]"); }
    catch { return []; }
  }

  function write(items) {
    localStorage.setItem(CART_KEY, JSON.stringify(items));
  }

  function normalizeQty(q) {
    const n = Number(q);
    if (!Number.isFinite(n) || n < 1) return 1;
    return Math.floor(n);
  }

  const api = {
    get() { return read(); },

    add(productId, qty) {
      const id = Number(productId);
      if (!id) return;
      const q = normalizeQty(qty || 1);
      const cart = read();
      const i = cart.findIndex(x => Number(x.productId) === id);
      if (i >= 0) cart[i].quantity = normalizeQty(cart[i].quantity + q);
      else cart.push({ productId: id, quantity: q });
      write(cart);
      api.emitChange();
    },

    setQty(productId, qty) {
      const id = Number(productId);
      if (!id) return;
      const q = normalizeQty(qty);
      const cart = read();
      const i = cart.findIndex(x => Number(x.productId) === id);
      if (i < 0) return;
      cart[i].quantity = q;
      write(cart);
      api.emitChange();
    },

    remove(productId) {
      const id = Number(productId);
      if (!id) return;
      const cart = read().filter(x => Number(x.productId) !== id);
      write(cart);
      api.emitChange();
    },

    clear() {
      write([]);
      api.emitChange();
    },

    count() {
      return read().reduce((acc, it) => acc + (Number(it.quantity) || 0), 0);
    },

    emitChange() {
      document.dispatchEvent(new CustomEvent("umbral_cart_changed"));
      // Ejecutar bloqueo visual si estamos en la página del carrito
      api.checkStaffBlock();
    },

    // NUEVO: Bloqueo visual para staff
    checkStaffBlock() {
        let user = null;
        try { user = JSON.parse(localStorage.getItem("user") || "null"); } catch (e) {}
        
        // Buscamos el botón de checkout (asegúrate que el ID sea btn-go-checkout en carrito.html)
        const btn = document.getElementById("btn-go-checkout");
        if (btn && user && (user.role === 'admin' || user.role === 'inventarios')) {
            btn.disabled = true;
            btn.style.opacity = "0.5";
            btn.style.cursor = "not-allowed";
            btn.innerHTML = "Solo clientes pueden comprar";
        }
    }
  };

  window.UmbralCart = api;
})();