// -----------------------------
// Data storage (LocalStorage)
// -----------------------------
let products = JSON.parse(localStorage.getItem("products")) || [];
let cart = JSON.parse(localStorage.getItem("cart")) || [];
let orders = JSON.parse(localStorage.getItem("orders")) || [];
let adminQR = JSON.parse(localStorage.getItem("adminQR")) || null;
let isAdmin = false;

const ADMIN_EMAIL = "admin@lhaccessories.com";
const ADMIN_PASS = "12345";

function saveData(){
  localStorage.setItem("products", JSON.stringify(products));
  localStorage.setItem("cart", JSON.stringify(cart));
  localStorage.setItem("orders", JSON.stringify(orders));
  localStorage.setItem("adminQR", JSON.stringify(adminQR));
}

// -----------------------------
// Utility
// -----------------------------
function escapeHtml(text){
  return text.replace(/[&<>"']/g, m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
}

// -----------------------------
// View Rendering
// -----------------------------
function showView(v){
  if(v==='admin' && !isAdmin) v='adminLogin';
  if(v==='paidOrders') renderPaidOrders();
  else render(v);
}

function render(v){
  const main=document.getElementById("main-view");
  document.getElementById("cart-count").innerText = cart.length;
  switch(v){
    case 'shop': main.innerHTML=renderShop(); break;
    case 'cart': main.innerHTML=renderCart(); break;
    case 'adminLogin': main.innerHTML=renderAdminLogin(); break;
    case 'admin': main.innerHTML=renderAdmin(); break;
    default: main.innerHTML=renderShop();
  }
}

// -----------------------------
// Shop
// -----------------------------
function renderShop(){
  if(products.length===0) return `<p>No products yet (Admin can add)</p>`;
  return `<h2>Products</h2>
    <div class="products-grid">
      ${products.map(p=>`<div class="product">
        <img src="${p.image}" alt="">
        <h3>${p.title}</h3>
        <p>$${p.price.toFixed(2)}</p>
        <button onclick="addToCart(${p.id})">Add to Cart</button>
      </div>`).join('')}
    </div>`;
}

function addToCart(id){
  let item = cart.find(c=>c.id===id);
  if(item) item.qty++; else { let p=products.find(p=>p.id===id); cart.push({...p, qty:1}); }
  saveData(); render('cart');
}

// -----------------------------
// Cart
// -----------------------------
function renderCart(){
  if(cart.length===0) return `<h2>Cart is empty</h2>`;
  let total = cart.reduce((s,i)=>s+i.price*i.qty,0);
  return `<h2>Cart</h2>
    ${cart.map(c=>`<div class="cart-item">
      <span>${c.title} x ${c.qty}</span>
      <span>$${(c.price*c.qty).toFixed(2)}</span>
      <button onclick="removeFromCart(${c.id})" style="margin-left:10px;background:red;">Delete</button>
    </div>`).join('')}
    <h3>Total: $${total.toFixed(2)}</h3>
    ${adminQR ? `<button onclick="checkoutWithQR()">Checkout via QR</button>` : `<p>Admin has not uploaded payment QR yet.</p>`}`;
}

function removeFromCart(id){ cart = cart.filter(i=>i.id!==id); saveData(); render('cart'); }

// -----------------------------
// Customer Paid Orders
// -----------------------------
function renderPaidOrders(){
  const email = prompt("Enter your email to view paid orders:");
  if(!email) return;
  const main = document.getElementById("main-view");
  const paidOrders = orders.filter(o=>o.customer.toLowerCase()===email.toLowerCase() && o.status==="Paid");
  if(paidOrders.length===0){ main.innerHTML=`<h2>No paid orders found for ${escapeHtml(email)}</h2>`; return; }
  main.innerHTML = `<h2>Paid Orders for ${escapeHtml(email)}</h2>
    ${paidOrders.map(o=>`<div class="order-card">
      <h3>Order #${o.id}</h3>
      <ul>${o.items.map(i=>`<li>${escapeHtml(i.title)} x ${i.qty} = $${(i.price*i.qty).toFixed(2)}</li>`).join('')}</ul>
      <h4>Total: $${o.items.reduce((s,i)=>s+i.price*i.qty,0).toFixed(2)}</h4>
      ${o.invoice ? `<p>Invoice Uploaded: <a href="${o.invoice}" target="_blank">View</a></p>` : `<p>No invoice uploaded yet</p>`}
    </div>`).join('')}
    <button onclick="showView('shop')">⬅ Back to Shop</button>`;
}

// -----------------------------
// Checkout via QR
// -----------------------------
function checkoutWithQR(){
  if(cart.length===0) return alert("Cart is empty!");
  const email = prompt("Enter your email:");
  if(!email) return;

  const newOrder = {
    id: Date.now(),
    items: cart.map(i=>({...i})),
    status:"Pending",
    customer: email,
    invoice: null
  };
  orders.push(newOrder);
  cart = [];
  saveData();

  const main = document.getElementById("main-view");
  main.innerHTML = `<h2>Pay via QR</h2>
    <img src="${adminQR}" alt="Payment QR" style="width:250px;height:250px;">
    <p>Scan QR to pay.</p>
    <h3>Upload your invoice after payment:</h3>
    <input type="file" id="invoiceFile" accept="image/*"><br><br>
    <button onclick="uploadInvoice(${newOrder.id})">Upload Invoice</button>`;
}

function uploadInvoice(orderId){
  const fileInput = document.getElementById("invoiceFile");
  if(!fileInput.files[0]) return alert("Select a file!");
  const reader = new FileReader();
  reader.onload = function(e){
    const order = orders.find(o=>o.id===orderId);
    order.invoice = e.target.result;
    order.status = "Paid";
    saveData();
    alert("Invoice uploaded successfully!");
    showView('shop');
  };
  reader.readAsDataURL(fileInput.files[0]);
}

// -----------------------------
// Admin
// -----------------------------
function renderAdminLogin(){
  return `<h2>Admin Login</h2>
    <form onsubmit="return loginAdmin(event)">
      <input id="adminEmail" type="email" placeholder="Email" required><br><br>
      <input id="adminPass" type="password" placeholder="Password" required><br><br>
      <button type="submit">Login</button>
    </form>`;
}

function loginAdmin(e){
  e.preventDefault();
  const email = document.getElementById("adminEmail").value;
  const pass = document.getElementById("adminPass").value;
  if(email===ADMIN_EMAIL && pass===ADMIN_PASS){ isAdmin=true; render('admin'); }
  else alert("Invalid credentials!");
  return false;
}

function renderAdmin(){
  return `<h2>Admin Panel</h2>
    <button onclick="showAddProductForm()">+ Add Product</button>
    <button onclick="showUploadQR()">Upload Payment QR</button>
    <h3>Orders</h3>
    <ul>${orders.map(o=>`<li>Order #${o.id} - ${escapeHtml(o.customer)} - ${o.status} ${o.invoice ? '✅' : ''}</li>`).join('')}</ul>
    <button onclick="logoutAdmin()">Logout</button>`;
}

function logoutAdmin(){ isAdmin=false; render('shop'); }

function showAddProductForm(){
  document.getElementById("main-view").innerHTML = `<h2>Add Product</h2>
    <input id="pTitle" placeholder="Product Name"><br><br>
    <input id="pPrice" type="number" step="0.01" placeholder="Price"><br><br>
    <input id="pImage" type="file" accept="image/*"><br><br>
    <button onclick="addProduct()">Save</button>
    <button onclick="render('admin')">⬅ Back</button>`;
}

function addProduct(){
  const title=document.getElementById("pTitle").value;
  const price=parseFloat(document.getElementById("pPrice").value);
  const file=document.getElementById("pImage").files[0];
  if(!title || !price || !file) return alert("Fill all fields");
  const reader = new FileReader();
  reader.onload = function(e){
    products.push({id:Date.now(), title, price, image:e.target.result});
    saveData();
    render('admin');
  };
  reader.readAsDataURL(file);
}

function showUploadQR(){
  document.getElementById("main-view").innerHTML = `<h2>Upload Payment QR</h2>
    <input type="file" id="qrFile" accept="image/*"><br><br>
    <button onclick="uploadQR()">Upload QR</button>
    <button onclick="render('admin')">⬅ Back</button>`;
}

function uploadQR(){
  const file = document.getElementById("qrFile").files[0];
  if(!file) return alert("Select a file");
  const reader = new FileReader();
  reader.onload = function(e){
    adminQR = e.target.result;
    saveData();
    alert("QR uploaded!");
    render('admin');
  };
  reader.readAsDataURL(file);
}

// -----------------------------
// Initial render
// -----------------------------
render('shop');