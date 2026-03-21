document.addEventListener('DOMContentLoaded', () => {
    // Check Authentication
    const token = localStorage.getItem('cargodealer_token');
    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    // Initialize Dashboard
    loadDashboardData();
    setupTabSwitching();
    setupShipmentForm();

    // Logout
    document.getElementById('logoutBtn').addEventListener('click', () => {
        localStorage.removeItem('cargodealer_token');
        localStorage.removeItem('cargodealer_user');
        window.location.href = 'login.html';
    });
});

async function loadDashboardData() {
    try {
        const response = await fetch('/api/dashboard/stats', {
            headers: {
                'x-auth-token': localStorage.getItem('cargodealer_token')
            }
        });

        if (!response.ok) throw new Error('Failed to fetch data');

        const data = await response.json();
        const user = data.user;

        // Populate Welcome
        document.getElementById('welcomeUser').textContent = `Hello, ${user.name.split(' ')[0]}`;
        
        // Populate Address
        document.getElementById('usAddress').innerHTML = `${user.name}<br>${data.usAddress.address}<br>${data.usAddress.city}, ${data.usAddress.state} ${data.usAddress.zip}`;

        // Populate Preferences
        document.getElementById('prefAutoShip').checked = user.preferences.autoShip;
        document.getElementById('prefAskBefore').checked = user.preferences.askBeforeShip;
        document.getElementById('prefConsolidate').checked = user.preferences.consolidate;

        // ID Banner
        if(user.hasVerifiedID) {
            document.getElementById('idWarning').style.display = 'none';
        }

        // Recent Orders Table
        const tbody = document.getElementById('recentOrdersBody');
        if (data.lastOrders && data.lastOrders.length > 0) {
            tbody.innerHTML = '';
            data.lastOrders.forEach(order => {
                const date = new Date(order.createdAt).toLocaleDateString();
                const itemsCount = order.items ? order.items.length : 0;
                tbody.innerHTML += `
                    <tr>
                        <td>${date}</td>
                        <td>${itemsCount} Items</td>
                        <td>${order.shippingTo || 'N/A'}</td>
                        <td><span class="status-badge">${['Pending', 'Transit', 'Delivered'][order.currentIndex] || 'Processing'}</span></td>
                    </tr>
                `;
            });
        }

        // Fill Form Defaults
        document.getElementById('senderName').value = user.name;
        document.getElementById('senderEmail').value = user.email;

    } catch (err) {
        console.error('Dash load error:', err);
    }
}

function setupTabSwitching() {
    const tabs = document.querySelectorAll('.tab-link');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const target = tab.getAttribute('data-tab');
            switchTab(target);
        });
    });
}

function switchTab(tabId) {
    // Update Navigation UI
    document.querySelectorAll('.tab-link').forEach(btn => btn.classList.remove('active'));
    document.querySelector(`[data-tab="${tabId}"]`).classList.add('active');

    // Update Panes
    document.querySelectorAll('.tab-pane').forEach(pane => pane.classList.remove('active'));
    document.getElementById(`tab-${tabId}`).classList.add('active');

    // Special Logic for 'orders' tab
    if (tabId === 'orders') {
        loadAllOrders();
    }
    if (tabId === 'notifications') {
        loadNotifications();
    }
    if (tabId === 'profile') {
        loadProfile();
    }
}

async function loadNotifications() {
    const container = document.getElementById('tab-notifications');
    if (!container) return;
    
    // Add inner structure if not exists
    if (!container.innerHTML || container.innerHTML.trim() === '') {
        container.innerHTML = `
            <div class="content-card">
                <h2>🔔 Notifications</h2>
                <div id="notifList" class="notif-list"></div>
            </div>
        `;
    }

    const list = document.getElementById('notifList');
    list.innerHTML = '<p class="empty-state">Loading notifications...</p>';

    try {
        const response = await fetch('/api/dashboard/notifications', {
            headers: { 'x-auth-token': localStorage.getItem('cargodealer_token') }
        });
        const notifications = await response.json();

        if (notifications.length === 0) {
            list.innerHTML = `
                <div class="notif-item empty-notif" style="padding:40px; text-align:center; color:#999;">
                    <div style="font-size:48px; margin-bottom:10px;">📭</div>
                    <p>You have no notifications yet.</p>
                </div>
            `;
            return;
        }

        list.innerHTML = '';
        notifications.forEach(n => {
            const date = new Date(n.createdAt).toLocaleString();
            list.innerHTML += `
                <div class="notif-item ${n.isRead ? 'read' : 'unread'}" style="padding:15px; border-bottom:1px solid #eee; display:flex; gap:15px;">
                    <div class="notif-icon" style="font-size:20px;">${n.type === 'shipment' ? '📦' : 'ℹ️'}</div>
                    <div class="notif-body">
                        <p style="margin:0; font-size:14px;">${n.message}</p>
                        <small style="color:#999;">${date}</small>
                    </div>
                </div>
            `;
        });
        document.getElementById('notifBadge').textContent = notifications.filter(n => !n.isRead).length;
    } catch (err) {
        list.innerHTML = '<p class="empty-state">Error loading notifications.</p>';
    }
}

async function loadProfile() {
    const container = document.getElementById('tab-profile');
    if (!container) return;

    const user = JSON.parse(localStorage.getItem('cargodealer_user'));
    
    container.innerHTML = `
        <div class="content-card">
            <h2>👤 My Profile</h2>
            <form id="profileForm" class="ship-form" style="max-width:500px; margin-top:20px;">
                <div class="field-group">
                    <label>Full Name</label>
                    <input type="text" value="${user.name}" readonly style="background:#f8f9fa;">
                </div>
                <div class="field-group">
                    <label>Email Address</label>
                    <input type="email" value="${user.email}" readonly style="background:#f8f9fa;">
                </div>
                <div class="field-group">
                    <label>Phone Number</label>
                    <input type="text" id="profPhone" value="${user.phone || ''}" placeholder="+1 ...">
                </div>
                <button type="submit" class="btn primary">Update Profile</button>
            </form>
        </div>
    `;
}

async function loadAllOrders() {
    const tbody = document.getElementById('allOrdersBody');
    tbody.innerHTML = '<tr><td colspan="6" class="empty-state">Loading shipments...</td></tr>';

    try {
        const response = await fetch('/api/shipments', {
            headers: { 'x-auth-token': localStorage.getItem('cargodealer_token') }
        });
        const orders = await response.json();

        if (orders.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="empty-state">No shipments found.</td></tr>';
            return;
        }

        tbody.innerHTML = '';
        orders.forEach(order => {
            const date = new Date(order.createdAt).toLocaleDateString();
            tbody.innerHTML += `
                <tr>
                    <td>${date}</td>
                    <td><strong>${order.trackingId}</strong></td>
                    <td>${order.recipient ? order.recipient.firstName + ' ' + order.recipient.lastName : 'N/A'}</td>
                    <td>${order.shippingTo}</td>
                    <td>${['Ready', 'Processing', 'In Transit', 'Arrived', 'Out for Delivery', 'Delivered'][order.currentIndex]}</td>
                    <td><button class="btn small">Track</button></td>
                </tr>
            `;
        });
    } catch (err) {
        tbody.innerHTML = '<tr><td colspan="6" class="empty-state">Error loading orders.</td></tr>';
    }
}

function setupShipmentForm() {
    const table = document.getElementById('itemsTable').getElementsByTagName('tbody')[0];
    const addBtn = document.getElementById('addItemBtn');

    addBtn.addEventListener('click', () => {
        const row = table.insertRow();
        row.innerHTML = `
            <td><input type="number" class="item-qty" value="1" min="1"></td>
            <td><input type="text" class="item-desc" placeholder="Item description"></td>
            <td><input type="number" class="item-val" value="0.00" step="0.01"></td>
            <td><button type="button" class="btn small delete-row">×</button></td>
        `;
        row.querySelector('.delete-row').onclick = () => row.remove();
        attachValListeners();
    });

    function attachValListeners() {
        document.querySelectorAll('.item-val, .item-qty').forEach(input => {
            input.onchange = calculateTotal;
        });
    }

    function calculateTotal() {
        let total = 0;
        document.querySelectorAll('tbody tr').forEach(row => {
            const qty = row.querySelector('.item-qty')?.value || 0;
            const val = row.querySelector('.item-val')?.value || 0;
            total += qty * val;
        });
        document.getElementById('totalValueDisplay').textContent = `$${total.toFixed(2)}`;
    }

    attachValListeners();

    // Form Submit
    document.getElementById('createShipmentForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        
        // Build items array
        const items = [];
        document.querySelectorAll('#itemsTable tbody tr').forEach(row => {
            items.push({
                qty: row.querySelector('.item-qty').value,
                description: row.querySelector('.item-desc').value,
                value: row.querySelector('.item-val').value
            });
        });

        const body = {
            service: formData.get('service'),
            route: formData.get('route'),
            shippingTo: formData.get('route'),
            recipient: {
                firstName: formData.get('recipFirst'),
                lastName: formData.get('recipLast'),
                email: formData.get('recipEmail'),
                phone: formData.get('recipPhone'),
                address: formData.get('recipAddress')
            },
            items: items,
            totalValue: parseFloat(document.getElementById('totalValueDisplay').textContent.replace('$','')),
            trackingId: "CDI-" + Math.floor(100000 + Math.random() * 900000)
        };

        try {
            const response = await fetch('/api/shipments', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': localStorage.getItem('cargodealer_token')
                },
                body: JSON.stringify(body)
            });

            if (response.ok) {
                alert('Shipment Created Successfully! Tracking ID: ' + body.trackingId);
                switchTab('orders');
                e.target.reset();
            } else {
                alert('Error creating shipment. Please check your inputs.');
            }
        } catch (err) {
            console.error('Submit error:', err);
        }
    });
}
