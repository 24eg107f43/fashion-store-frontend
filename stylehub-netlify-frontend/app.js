(() => {
  const API = (window.STYLEHUB_API_BASE || "http://localhost:8080").replace(/\/+$/, "");
  const $ = (s, root=document) => root.querySelector(s);
  const money = n => "₹" + Number(n || 0).toLocaleString("en-IN", {minimumFractionDigits:2, maximumFractionDigits:2});
  const esc = value => String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const message = (text, type="error") => { const el=$("#message"); if(el) el.innerHTML = text ? `<div class="alert ${type}">${esc(text)}</div>` : ""; };
  async function api(path, options={}) {
    const init = {...options, credentials:"include", headers:{...(options.body ? {"Content-Type":"application/json"} : {}), ...(options.headers||{})}};
    const response = await fetch(API + path, init);
    const raw = await response.text();
    let data = null;
    try { data = raw ? JSON.parse(raw) : null; } catch { data = raw; }
    if (!response.ok) {
      const detail = data && typeof data === "object" ? (data.message || data.error || data.detail) : data;
      throw new Error(detail || `Request failed (${response.status})`);
    }
    return data;
  }
  const nav = async () => {
    try {
      const customer = await api("/api/auth/me");
      const host = $("#nav-auth");
      if (host && customer) host.innerHTML = `<span>Hi, ${esc(customer.fullName || customer.name || customer.email || "there")}</span> <button id="logout-button" class="link-button" type="button">Log out</button>`;
      const logout=$("#logout-button");
      if(logout) logout.addEventListener("click", async () => { try { await api("/api/auth/logout",{method:"POST"}); location.href="index.html"; } catch(e) { message(e.message); } });
    } catch (_) {}
    try {
      const cart=await api("/api/cart");
      const count=(cart.items||[]).reduce((sum,item)=>sum+Number(item.quantity||0),0);
      const badge=$("#cart-count"); if(badge) badge.textContent=count ? `(${count})` : "";
    } catch (_) {}
  };
  const productArt = p => `<div class="product-art art-${Math.min(Number(p.id)||1,6)}"><span>${esc(p.category||"StyleHub")}</span></div>`;
  async function loadProducts() {
    const grid=$("#product-grid"); if(!grid) return;
    try {
      const products=await api("/api/products");
      if(!Array.isArray(products)||!products.length) { grid.innerHTML='<p class="empty-state">No products are available right now.</p>'; return; }
      grid.innerHTML=products.map(p=>`<article class="product-card">${productArt(p)}<div class="product-info"><p class="category">${esc(p.category)}</p><h3>${esc(p.name)}</h3><p class="description">${esc(p.description)}</p><div class="product-bottom"><strong>${money(p.price)}</strong><button class="button small add-product" data-id="${esc(p.id)}" ${Number(p.stock)<=0?"disabled":""}>${Number(p.stock)<=0?"Out of stock":"Add to cart"}</button></div><small>${esc(p.stock)} in stock</small></div></article>`).join("");
      grid.querySelectorAll(".add-product").forEach(btn=>btn.addEventListener("click",async()=>{try{await api("/api/cart/items",{method:"POST",body:JSON.stringify({productId:Number(btn.dataset.id),quantity:1})});message("Added to your cart.","success");await nav();}catch(e){message(e.message || "Please log in before adding items.");}}));
    } catch(e) { grid.innerHTML=`<div class="alert error">Could not load products. ${esc(e.message)}<br>Check that your backend is running and config.js has the correct API URL.</div>`; }
  }
  async function signup() {
    const form=$("#signup-form"); if(!form)return;
    form.addEventListener("submit",async e=>{e.preventDefault();const d=Object.fromEntries(new FormData(form).entries());try{await api("/api/auth/register",{method:"POST",body:JSON.stringify(d)});message("Account created successfully.","success");location.href="index.html";}catch(err){message(err.message||"Could not create account.");}});
  }
  async function login() {
    const form=$("#login-form"); if(!form)return;
    form.addEventListener("submit",async e=>{e.preventDefault();const d=Object.fromEntries(new FormData(form).entries());try{await api("/api/auth/login",{method:"POST",body:JSON.stringify(d)});location.href="index.html";}catch(err){message(err.message||"Login failed.");}});
  }
  async function loadCart() {
    const root=$("#cart-content"); if(!root)return;
    try {
      const cart=await api("/api/cart"), items=cart.items||[], total=Number(cart.total||0);
      if(!items.length){root.innerHTML='<div class="empty-state"><h2>Your cart is empty</h2><p>Find something you love in our collection.</p><a class="button" href="index.html">Continue shopping</a></div>';return;}
      root.innerHTML=`<div class="cart-layout"><section class="panel">${items.map(line=>{const p=line.product||{};return `<div class="cart-line"><div class="mini-art">SH</div><div class="cart-detail"><h3>${esc(p.name||"Product")}</h3><p>${money(p.price)}</p><label>Qty <input class="qty-input" type="number" min="1" max="${esc(p.stock||99)}" value="${esc(line.quantity)}" data-id="${esc(p.id)}"></label><button class="text-button update-qty" data-id="${esc(p.id)}">Update</button></div><button class="text-button remove-item" data-id="${esc(p.id)}">Remove</button><strong>${money(line.lineTotal)}</strong></div>`;}).join("")}</section><aside class="panel summary"><h2>Order summary</h2><div class="summary-row"><span>Subtotal</span><strong>${money(total)}</strong></div><div class="summary-row"><span>Delivery</span><span>Free</span></div><div class="summary-row total"><span>Total</span><strong>${money(total)}</strong></div><a class="button full" href="checkout.html">Continue to checkout</a><a class="back-link" href="index.html">Continue shopping</a></aside></div>`;
      root.querySelectorAll(".update-qty").forEach(btn=>btn.addEventListener("click",async()=>{const input=root.querySelector(`.qty-input[data-id="${btn.dataset.id}"]`);try{await api(`/api/cart/items/${btn.dataset.id}`,{method:"PUT",body:JSON.stringify({quantity:Number(input.value)})});await loadCart();await nav();message("Cart updated.","success");}catch(e){message(e.message);}}));
      root.querySelectorAll(".remove-item").forEach(btn=>btn.addEventListener("click",async()=>{try{await api(`/api/cart/items/${btn.dataset.id}`,{method:"DELETE"});await loadCart();await nav();}catch(e){message(e.message);}}));
    } catch(e) { root.innerHTML=`<div class="alert error">${esc(e.message)}<p><a href="login.html">Log in</a> if your cart requires an account.</p></div>`; }
  }
  async function checkout() {
    const form=$("#checkout-form"); if(!form)return;
    try { const cart=await api("/api/cart"); $("#checkout-total").innerHTML=`<span>Order total</span><strong>${money(cart.total)}</strong>`; }
    catch(e){ message(e.message); }
    form.addEventListener("submit",async e=>{e.preventDefault();const shippingAddress=new FormData(form).get("shippingAddress");try{const order=await api("/api/checkout",{method:"POST",body:JSON.stringify({shippingAddress})});message(`Order #${order.id} placed successfully!`,"success");setTimeout(()=>location.href="orders.html",700);}catch(err){message(err.message||"Checkout failed.");}});
  }
  async function loadOrders() {
    const root=$("#orders-content");if(!root)return;
    try { const orders=await api("/api/orders");if(!Array.isArray(orders)||!orders.length){root.innerHTML='<div class="empty-state"><h2>No orders yet</h2><p>Your orders will appear here after checkout.</p><a class="button" href="index.html">Start shopping</a></div>';return;}
      root.innerHTML=`<div class="order-list">${orders.map(o=>`<article class="panel order-card"><div class="order-head"><div><p class="eyebrow">ORDER #${esc(o.id)}</p><h2>${esc(o.createdAt ? new Date(o.createdAt).toLocaleString("en-IN") : "Recent order")}</h2></div><span class="status">${esc(o.status||"Placed")}</span></div><p>${esc(o.itemsSummary||"")}</p><div class="summary-row total"><span>Total paid at checkout</span><strong>${money(o.total)}</strong></div></article>`).join("")}</div>`;
    } catch(e){root.innerHTML=`<div class="alert error">${esc(e.message)}<p>Please log in to see your order history.</p><a href="login.html">Log in</a></div>`;}
  }
  document.addEventListener("DOMContentLoaded",async()=>{
    await nav();
    const page=document.body.dataset.page;
    if(page==="home")loadProducts();
    if(page==="signup")signup();
    if(page==="login")login();
    if(page==="cart")loadCart();
    if(page==="checkout")checkout();
    if(page==="orders")loadOrders();
  });
})();