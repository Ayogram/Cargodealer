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
    initInactivityTimer();

    // Logout
    document.getElementById('logoutBtn').addEventListener('click', logout);
});

function logout() {
    localStorage.removeItem('cargodealer_token');
    localStorage.removeItem('cargodealer_user');
    window.location.href = 'login.html';
}

// Inactivity Timer (5 Minutes)
let inactivityTimeout;
function initInactivityTimer() {
    resetTimer();
    document.onmousemove = resetTimer;
    document.onkeypress = resetTimer;
}

function resetTimer() {
    clearTimeout(inactivityTimeout);
    inactivityTimeout = setTimeout(() => {
        logout();
    }, 5 * 60 * 1000); 
}

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
        
        // Populate Top Bar
        if(document.getElementById('topBarUser')) {
            document.getElementById('topBarUser').textContent = user.name;
        }

        // Profile Information is now handled in its specific tab loader

        // Populate Preferences
        if(document.getElementById('prefAutoShip')) document.getElementById('prefAutoShip').checked = user.preferences ? user.preferences.autoShip : false;
        if(document.getElementById('prefConsolidate')) document.getElementById('prefConsolidate').checked = user.preferences ? user.preferences.consolidate : false;

        // Recent Orders Table
        const tbody = document.getElementById('recentOrdersBody');
        if (data.lastOrders && data.lastOrders.length > 0) {
            tbody.innerHTML = '';
            data.lastOrders.forEach(order => {
                const date = new Date(order.createdAt).toLocaleDateString();
                const itemsCount = order.items ? order.items.length : 0;
                const statuses = ['Received at Office', 'Processing', 'Ready for Export', 'Shipped', 'In Transit', 'Arrived', 'Delivered'];
                const statusText = statuses[order.currentIndex] || 'Initiated';
                tbody.innerHTML += `
                    <tr>
                        <td>${date}</td>
                        <td>${itemsCount} Items</td>
                        <td>${order.shippingTo || 'N/A'}</td>
                        <td><span class="status-badge" style="background:var(--primary-soft); color:var(--primary); font-size:10px;">${statusText}</span></td>
                    </tr>
                `;
            });
        }

    } catch (err) {
        console.error('Dash load error:', err);
    }
}

function setupTabSwitching() {
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            const target = link.getAttribute('data-tab');
            switchTab(target);
        });
    });
}

const tabTitles = {
    'dashboard': { breadcrumb: 'Dashboard', title: 'Dashboard Overview' },
    'create': { breadcrumb: 'Ship Items', title: 'Initialize Logistics' },
    'orders': { breadcrumb: 'Logistic Ledger', title: 'Personal History' },
    'notifications': { breadcrumb: 'Alerts', title: 'Logistic Alerts' },
    'profile': { breadcrumb: 'Account Profile', title: 'Security & Meta' }
};

function switchTab(tabId) {
    // Update Sidebar UI
    document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));
    document.querySelector(`.nav-link[data-tab="${tabId}"]`).classList.add('active');

    // Update Panes
    document.querySelectorAll('.tab-pane').forEach(pane => pane.classList.remove('active'));
    document.getElementById(`tab-${tabId}`).classList.add('active');

    // Update Header Text
    if (tabTitles[tabId]) {
        document.getElementById('breadcrumbSection').textContent = tabTitles[tabId].breadcrumb;
        document.getElementById('pageTitle').textContent = tabTitles[tabId].title;
    }

    // Special Logic
    if (tabId === 'orders') loadAllOrders();
    if (tabId === 'notifications') loadNotifications();
    if (tabId === 'profile') loadProfile();
}

async function loadNotifications() {
    const list = document.getElementById('notifList');
    if (!list) return;

    try {
        const response = await fetch('/api/dashboard/notifications', {
            headers: { 'x-auth-token': localStorage.getItem('cargodealer_token') }
        });
        const notifications = await response.json();

        if (notifications.length === 0) {
            list.innerHTML = '<p class="empty-notif" style="padding:40px; text-align:center; color:var(--text-muted); font-size:13px;">You have no new logistics alerts.</p>';
            return;
        }

        list.innerHTML = '';
        notifications.forEach(n => {
            const date = new Date(n.createdAt).toLocaleString();
            list.innerHTML += `
                <div class="notif-item" style="padding:16px; border-radius:10px; background:#f8fafc; border:1px solid var(--border); display:flex; gap:16px;">
                    <div style="width:10px; height:10px; border-radius:50%; background:${n.isRead ? '#cbd5e1' : '#10b981'}; margin-top:4px;"></div>
                    <div class="notif-body">
                        <p style="margin:0; font-size:14px; font-weight:600; color:var(--navy);">${n.message}</p>
                        <small style="color:var(--text-muted); font-size:11px;">${date}</small>
                    </div>
                </div>
            `;
        });
        const badge = document.getElementById('notifBadge');
        if (badge) badge.textContent = notifications.filter(n => !n.isRead).length;
    } catch (err) {
        list.innerHTML = '<p class="empty-state">Unable to synchronize notifications.</p>';
    }
}

async function loadProfile() {
    const user = JSON.parse(localStorage.getItem('cargodealer_user'));
    if(!user) return;

    if(document.getElementById('profName')) document.getElementById('profName').value = user.name;
    if(document.getElementById('profPhone')) document.getElementById('profPhone').value = user.phone || '';
    if(document.getElementById('profileNameDisplay')) document.getElementById('profileNameDisplay').textContent = user.name;
    if(document.getElementById('profileEmailDisplay')) document.getElementById('profileEmailDisplay').textContent = user.email;
    
    // Initial handling
    const initial = user.name.charAt(0).toUpperCase();
    if(document.getElementById('userInitial')) document.getElementById('userInitial').textContent = initial;

    // Profile Form Submit
    const profileForm = document.getElementById('profileUpdateForm');
    if (profileForm) {
        profileForm.onsubmit = async (e) => {
            e.preventDefault();
            const btn = e.target.querySelector('button');
            const originalText = btn.textContent;
            btn.textContent = 'Synchronizing...';
            
            // Simulation of persistence
            user.name = document.getElementById('profName').value;
            user.phone = document.getElementById('profPhone').value;
            localStorage.setItem('cargodealer_user', JSON.stringify(user));
            
            setTimeout(() => {
                btn.textContent = 'Security Vault Updated ✅';
                loadProfile();
                setTimeout(() => btn.textContent = originalText, 2000);
            }, 1000);
        };
    }
}

function previewPhoto(input) {
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            document.getElementById('profilePhotoDisplay').innerHTML = `<img src="${e.target.result}" style="width:100%; height:100%; object-fit:cover;">`;
        }
        reader.readAsDataURL(input.files[0]);
    }
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
            const statuses = ['Received', 'Processing', 'Ready', 'Shipped', 'Transit', 'Arrived', 'Delivered'];
            const statusText = statuses[order.currentIndex] || 'Initiated';
            tbody.innerHTML += `
                <tr>
                    <td>${date}</td>
                    <td><strong>${order.trackingId}</strong></td>
                    <td>${order.recipient ? order.recipient.firstName + ' ' + order.recipient.lastName : 'N/A'}</td>
                    <td>${order.shippingTo}</td>
                    <td><span class="status-badge" style="background:#f1f5f9; color:var(--navy); font-size:10px;">${statusText}</span></td>
                </tr>
            `;
        });
    } catch (err) {
        tbody.innerHTML = '<tr><td colspan="6" class="empty-state">Error loading orders.</td></tr>';
    }
}

let currentCurrency = 'USD';

function setupShipmentForm() {
    const table = document.getElementById('itemsTable')?.getElementsByTagName('tbody')[0];
    const addBtn = document.getElementById('addItemBtn');

    if (!table || !addBtn) return;

    window.setCurrency = function(ccy) {
        currentCurrency = ccy;
        const toggleUSD = document.getElementById('toggleUSD');
        const toggleNGN = document.getElementById('toggleNGN');
        if (!toggleUSD || !toggleNGN) return;

        if (ccy === 'USD') {
            toggleUSD.style.background = '#10b981';
            toggleUSD.style.color = 'white';
            toggleUSD.style.boxShadow = '0 4px 12px rgba(16,185,129,0.3)';
            toggleNGN.style.background = 'transparent';
            toggleNGN.style.color = 'rgba(255,255,255,0.4)';
            toggleNGN.style.boxShadow = 'none';
        } else {
            toggleNGN.style.background = '#10b981';
            toggleNGN.style.color = 'white';
            toggleNGN.style.boxShadow = '0 4px 12px rgba(16,185,129,0.3)';
            toggleUSD.style.background = 'transparent';
            toggleUSD.style.color = 'rgba(255,255,255,0.4)';
            toggleUSD.style.boxShadow = 'none';
        }
        calculateTotal();
    }

    addBtn.addEventListener('click', () => {
        const row = table.insertRow();
        row.style.borderTop = '1px solid #f1f5f9';
        row.innerHTML = `
            <td style="padding:12px;"><input type="number" class="item-qty" value="1" min="1" oninput="calculateTotal()" style="width:100%; border:none; background:transparent; font-weight:700; text-align:center; color:var(--navy);"></td>
            <td style="padding:12px;"><input type="text" class="item-desc" placeholder="Item name..." style="width:100%; border:none; background:transparent; font-weight:500;"></td>
            <td style="padding:12px;"><input type="number" class="item-weight" value="1.0" min="0.1" step="0.1" oninput="calculateTotal()" style="width:100%; border:none; background:transparent; font-weight:700; text-align:center; color:#10b981;"></td>
            <td style="padding:12px; text-align:right; display:flex; align-items:center; justify-content:flex-end; gap:8px;">
                <span class="item-charge" style="font-weight:800; color:var(--navy);">$10.00</span>
                <button type="button" class="delete-row" style="color:#ef4444; background:none; border:none; font-size:18px; cursor:pointer; padding:0 5px;">×</button>
            </td>
        `;
        row.querySelector('.delete-row').onclick = () => {
            row.remove();
            calculateTotal();
        };
        attachValListeners();
    });

    function attachValListeners() {
        document.querySelectorAll('.item-weight, .item-qty').forEach(input => {
            input.oninput = calculateTotal;
        });
    }

    window.calculateTotal = function() {
        let totalUSD = 0;
        const ratePerKg = 10; // $10 per KG
        const exchangeRate = 1500;

        document.querySelectorAll('#itemsTable tbody tr').forEach(row => {
            const qtyInput = row.querySelector('.item-qty');
            const weightInput = row.querySelector('.item-weight');
            const chargeDisplay = row.querySelector('.item-charge');

            if (qtyInput && weightInput) {
                const qty = parseFloat(qtyInput.value || 0);
                const weight = parseFloat(weightInput.value || 0);
                const itemCharge = qty * weight * ratePerKg;
                
                totalUSD += itemCharge;
                if (chargeDisplay) chargeDisplay.textContent = `$${itemCharge.toFixed(2)}`;
            }
        });

        const display = document.getElementById('totalValueDisplay');
        if (!display) return;

        if (currentCurrency === 'USD') {
            display.textContent = `$${totalUSD.toFixed(2)}`;
        } else {
            const totalNGN = totalUSD * exchangeRate;
            display.textContent = `₦${totalNGN.toLocaleString()}`;
        }
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
            totalValue: parseFloat(document.getElementById('totalValueDisplay').textContent.replace('$',''))
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
                const resData = await response.json();
                alert('Shipment Request Created Successfully! Tracking ID: ' + resData.trackingId);
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
