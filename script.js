// -----------------------------
// Checkout via QR + location
// -----------------------------
function checkoutWithQR(){
  if(cart.length===0) return alert("Cart is empty!");
  const email = prompt("Enter your email:");
  if(!email) return;
  const location = prompt("Enter your location (Google Maps link or coordinates):");
  if(!location) return;

  const newOrder = {
    id: Date.now(),
    items: cart.map(i=>({...i})),
    status:"Pending",
    customer: email,
    invoice: null,
    location: location
  };
  orders.push(newOrder);
  cart = [];
  saveData();

  const main = document.getElementById("main-view");
  main.innerHTML = `<h2>Pay via QR</h2>
    ${adminQR ? `<img src="${adminQR}" alt="Payment QR" style="width:250px;height:250px;"><p>Scan QR to pay.</p>` : `<p>Admin has not uploaded QR yet</p>`}
    <h3>Upload your invoice after payment:</h3>
    <input type="file" id="invoiceFile" accept="image/*"><br><br>
    <button onclick="uploadInvoice(${newOrder.id})">Upload Invoice</button>
    <p>Your Location: <a href="${location}" target="_blank">${location}</a></p>`;
}

// -----------------------------
// Admin Panel - show order details
// -----------------------------
function renderAdmin(){
  return `<h2>Admin Panel</h2>
    <button onclick="showAddProductForm()">+ Add Product</button>
    <button onclick="showUploadQR()">Upload Payment QR</button>
    <h3>Orders</h3>
    <ul>
    ${orders.map(o=>`<li>
      Order #${o.id} - Customer: ${escapeHtml(o.customer)} - Status: ${o.status} - Location: <a href="${o.location}" target="_blank">View</a><br>
      Products: ${o.items.map(i=>escapeHtml(i.title)).join(', ')}
      ${o.invoice ? `<br>Invoice: <a href="${o.invoice}" target="_blank">View</a>` : ''}
    </li>`).join('')}
    </ul>
    <button onclick="logoutAdmin()">Logout</button>`;
}
