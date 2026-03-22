// ─── DATA STORE ───────────────────────────────────────────────
const DB = {
  get: (key) => JSON.parse(localStorage.getItem(key) || '[]'),
  set: (key, val) => localStorage.setItem(key, JSON.stringify(val)),
};

const getInventory = () => DB.get('inventory');
const getSales     = () => DB.get('sales');

function saveInventory(data) { DB.set('inventory', data); }
function saveSales(data)     { DB.set('sales', data); }

// ─── TAB NAVIGATION ───────────────────────────────────────────
function showTab(name) {
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('nav button').forEach(b => b.classList.remove('active'));
  document.getElementById(name).classList.add('active');
  document.getElementById('tab-' + name).classList.add('active');

  if (name === 'dashboard') renderDashboard();
  if (name === 'inventory')  renderInventory();
  if (name === 'sale')       populateSaleDropdown();
  if (name === 'udhaar')     renderUdhaar();
  if (name === 'history')    renderHistory();
}

// ─── INVENTORY ────────────────────────────────────────────────
function addItem() {
  const name  = document.getElementById('item-name').value.trim();
  const stock = parseInt(document.getElementById('item-stock').value);
  const price = parseFloat(document.getElementById('item-price').value);

  if (!name || isNaN(stock) || isNaN(price)) return alert('Sab fields bharo!');

  const inv = getInventory();
  if (inv.find(i => i.name.toLowerCase() === name.toLowerCase()))
    return alert('Yeh item pehle se hai!');

  inv.push({ id: Date.now(), name, stock, price });
  saveInventory(inv);
  renderInventory();
  document.getElementById('item-name').value = '';
  document.getElementById('item-stock').value = '';
  document.getElementById('item-price').value = '';
}

function renderInventory() {
  const inv = getInventory();
  const tbody = document.getElementById('inventory-tbody');
  tbody.innerHTML = inv.length === 0
    ? '<tr><td colspan="4" style="text-align:center;color:#aaa">Koi item nahi. Upar se add karo.</td></tr>'
    : inv.map(item => `
      <tr class="${item.stock <= 3 ? 'low-stock' : ''}">
        <td>${item.name}</td>
        <td>${item.stock} ${item.stock <= 3 ? '⚠️' : ''}</td>
        <td>₹${item.price}</td>
        <td>
          <button class="btn-sm btn-edit" onclick="editItem(${item.id})">✏️ Edit</button>
          <button class="btn-sm btn-delete" onclick="deleteItem(${item.id})">🗑️ Delete</button>
        </td>
      </tr>`).join('');
}

function editItem(id) {
  const inv  = getInventory();
  const item = inv.find(i => i.id === id);
  const newStock = prompt(`"${item.name}" ka naya stock:`, item.stock);
  const newPrice = prompt(`"${item.name}" ki nai price (₹):`, item.price);
  if (newStock === null || newPrice === null) return;
  item.stock = parseInt(newStock) || item.stock;
  item.price = parseFloat(newPrice) || item.price;
  saveInventory(inv);
  renderInventory();
}

function deleteItem(id) {
  if (!confirm('Pakka delete karna hai?')) return;
  saveInventory(getInventory().filter(i => i.id !== id));
  renderInventory();
}

// ─── SALE ENTRY ───────────────────────────────────────────────
function populateSaleDropdown() {
  const sel = document.getElementById('sale-item');
  const inv = getInventory();
  sel.innerHTML = '<option value="">-- Item chunno --</option>' +
    inv.map(i => `<option value="${i.id}" data-price="${i.price}">${i.name} (Stock: ${i.stock})</option>`).join('');
  sel.onchange = () => {
    const opt = sel.selectedOptions[0];
    if (opt.dataset.price) document.getElementById('sale-price').value = opt.dataset.price;
  };
}

function recordSale() {
  const itemId  = parseInt(document.getElementById('sale-item').value);
  const qty     = parseInt(document.getElementById('sale-qty').value);
  const amount  = parseFloat(document.getElementById('sale-price').value);
  const payment = document.getElementById('payment-type').value;
  const customer= document.getElementById('customer-name').value.trim();
  const phone   = document.getElementById('customer-phone').value.trim();

  if (!itemId || !qty || isNaN(amount)) return alert('Item, quantity aur amount bharo!');
  if (payment === 'udhaar' && !customer) return alert('Udhaar ke liye customer naam zaroori hai!');

  const inv  = getInventory();
  const item = inv.find(i => i.id === itemId);
  if (!item) return alert('Item nahi mila!');
  if (item.stock < qty) return alert(`Sirf ${item.stock} stock bacha hai!`);

  item.stock -= qty;
  saveInventory(inv);

  const sales = getSales();
  sales.push({
    id: Date.now(),
    itemId,
    itemName: item.name,
    qty,
    amount,
    payment,
    customer: customer || 'Walk-in',
    phone,
    date: new Date().toISOString(),
    udhaarpaid: payment !== 'udhaar',
  });
  saveSales(sales);

  alert(`✅ Bikri save ho gayi!\n${item.name} x${qty} = ₹${amount}\nPayment: ${payment.toUpperCase()}`);

  // reset form
  document.getElementById('sale-item').value = '';
  document.getElementById('sale-qty').value = '1';
  document.getElementById('sale-price').value = '';
  document.getElementById('customer-name').value = '';
  document.getElementById('customer-phone').value = '';
}

// ─── UDHAAR ───────────────────────────────────────────────────
function renderUdhaar() {
  const sales = getSales().filter(s => s.payment === 'udhaar' && !s.udhaarpaid);
  const tbody = document.getElementById('udhaar-tbody');

  // group by customer
  const map = {};
  sales.forEach(s => {
    const key = s.customer + '|' + s.phone;
    if (!map[key]) map[key] = { customer: s.customer, phone: s.phone, total: 0 };
    map[key].total += s.amount;
  });

  const rows = Object.values(map);
  tbody.innerHTML = rows.length === 0
    ? '<tr><td colspan="4" style="text-align:center;color:#aaa">Koi udhaar nahi! 🎉</td></tr>'
    : rows.map(r => `
      <tr>
        <td>${r.customer}</td>
        <td>${r.phone || '-'}</td>
        <td style="color:#e74c3c;font-weight:bold">₹${r.total}</td>
        <td>
          <button class="btn-sm btn-view" onclick="viewUdhaar('${r.customer}','${r.phone}')">👁 Detail</button>
        </td>
      </tr>`).join('');
}

function viewUdhaar(customer, phone) {
  const sales = getSales().filter(s =>
    s.payment === 'udhaar' && s.customer === customer && s.phone === phone
  );
  document.getElementById('modal-title').textContent = `Udhaar: ${customer} (${phone || 'no phone'})`;
  document.getElementById('modal-tbody').innerHTML = sales.map(s => `
    <tr>
      <td>${new Date(s.date).toLocaleDateString('en-IN')}</td>
      <td>${s.itemName} x${s.qty}</td>
      <td>₹${s.amount}</td>
      <td><span class="badge ${s.udhaarpaid ? 'badge-paid' : 'badge-udhaar'}">${s.udhaarpaid ? 'Paid' : 'Baaki'}</span></td>
      <td>${!s.udhaarpaid ? `<button class="btn-sm btn-paid" onclick="markPaid(${s.id})">✅ Paid</button>` : ''}</td>
    </tr>`).join('');
  document.getElementById('modal').classList.remove('hidden');
}

function markPaid(id) {
  const sales = getSales();
  const sale  = sales.find(s => s.id === id);
  if (sale) { sale.udhaarpaid = true; saveSales(sales); }
  // refresh modal
  viewUdhaar(sale.customer, sale.phone);
  renderUdhaar();
  renderDashboard();
}

function closeModal() {
  document.getElementById('modal').classList.add('hidden');
}

// ─── HISTORY ──────────────────────────────────────────────────
function renderHistory() {
  const dateFilter    = document.getElementById('filter-date').value;
  const paymentFilter = document.getElementById('filter-payment').value;

  let sales = getSales().slice().reverse();

  if (dateFilter) {
    sales = sales.filter(s => s.date.startsWith(dateFilter));
  }
  if (paymentFilter) {
    sales = sales.filter(s => s.payment === paymentFilter);
  }

  document.getElementById('history-tbody').innerHTML = sales.length === 0
    ? '<tr><td colspan="6" style="text-align:center;color:#aaa">Koi record nahi</td></tr>'
    : sales.map(s => `
      <tr>
        <td>${new Date(s.date).toLocaleDateString('en-IN')}</td>
        <td>${s.itemName}</td>
        <td>${s.qty}</td>
        <td>₹${s.amount}</td>
        <td><span class="badge badge-${s.payment}">${s.payment.toUpperCase()}</span></td>
        <td>${s.customer}</td>
      </tr>`).join('');
}

function clearFilters() {
  document.getElementById('filter-date').value = '';
  document.getElementById('filter-payment').value = '';
  renderHistory();
}

// ─── DASHBOARD ────────────────────────────────────────────────
function renderDashboard() {
  const today = new Date().toISOString().split('T')[0];
  const sales = getSales();
  const todaySales = sales.filter(s => s.date.startsWith(today));

  const income = todaySales
    .filter(s => s.payment !== 'udhaar')
    .reduce((sum, s) => sum + s.amount, 0);

  const totalUdhaar = sales
    .filter(s => s.payment === 'udhaar' && !s.udhaarpaid)
    .reduce((sum, s) => sum + s.amount, 0);

  const lowStock = getInventory().filter(i => i.stock <= 3).length;

  document.getElementById('today-income').textContent      = `₹${income}`;
  document.getElementById('total-udhaar').textContent      = `₹${totalUdhaar}`;
  document.getElementById('today-sales-count').textContent = todaySales.length;
  document.getElementById('low-stock-count').textContent   = lowStock;

  document.getElementById('today-tbody').innerHTML = todaySales.length === 0
    ? '<tr><td colspan="5" style="text-align:center;color:#aaa">Aaj koi bikri nahi</td></tr>'
    : todaySales.slice().reverse().map(s => `
      <tr>
        <td>${s.itemName}</td>
        <td>${s.qty}</td>
        <td>₹${s.amount}</td>
        <td><span class="badge badge-${s.payment}">${s.payment.toUpperCase()}</span></td>
        <td>${s.customer}</td>
      </tr>`).join('');
}

// ─── INIT ─────────────────────────────────────────────────────
renderDashboard();
