const token = localStorage.getItem('cargodealer_token');
const userStr = localStorage.getItem('cargodealer_user');

if (!token || !userStr) {
  window.location.href = '../login.html';
}

const user = JSON.parse(userStr);
document.getElementById('adminNameDisplay').textContent = user.name;

document.getElementById('logoutBtn').addEventListener('click', () => {
  localStorage.removeItem('cargodealer_token');
  localStorage.removeItem('cargodealer_user');
  window.location.href = '../login.html';
});

const STATUSES = [
  "Booking Confirmed",
  "Pickup Scheduled",
  "Picked Up",
  "In Transit",
  "Arrived at Destination Hub",
  "Delivered"
];

const apiOptions = {
  headers: {
    'Content-Type': 'application/json',
    'x-auth-token': token
  }
};

async function loadShipments() {
  const tbody = document.getElementById('shipmentsTableBody');
  try {
    const res = await fetch('/api/shipments', apiOptions);
    if (!res.ok) {
      if(res.status === 401) {
        window.location.href = '../login.html';
        return;
      }
      throw new Error('Failed to load');
    }
    const shipments = await res.json();
    tbody.innerHTML = '';
    
    if (shipments.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">No shipments found.</td></tr>';
      return;
    }

    shipments.forEach(ship => {
      const tr = document.createElement('tr');
      const date = new Date(ship.updatedAt).toLocaleString();
      tr.innerHTML = `
        <td><strong>${ship.trackingId}</strong></td>
        <td>${ship.service}</td>
        <td>${ship.route}</td>
        <td><span class="status-badge">${STATUSES[ship.currentIndex]}</span></td>
        <td>${date}</td>
        <td>
          <button class="action-btn" onclick="openUpdateModal('${ship.trackingId}', ${ship.currentIndex})">Update Status</button>
        </td>
      `;
      tbody.appendChild(tr);
    });
  } catch (err) {
    console.error(err);
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:red;">Error loading shipments.</td></tr>';
  }
}

// Modals
function openModal(id) { document.getElementById(id).style.display = 'flex'; }
function closeModal(id) { document.getElementById(id).style.display = 'none'; }

document.getElementById('newShipmentBtn').addEventListener('click', () => openModal('createModal'));
document.getElementById('closeCreateModal').addEventListener('click', () => closeModal('createModal'));
document.getElementById('closeUpdateModal').addEventListener('click', () => closeModal('updateModal'));

window.openUpdateModal = (trackingId, currentIndex) => {
  document.getElementById('uTrackingId').value = trackingId;
  document.getElementById('uTrackingIdDisplay').textContent = trackingId;
  document.getElementById('uCurrentIndex').value = currentIndex;
  document.getElementById('uNote').value = '';
  openModal('updateModal');
};

document.getElementById('createForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const body = {
    trackingId: document.getElementById('cTrackingId').value,
    service: document.getElementById('cService').value,
    route: document.getElementById('cRoute').value,
    staffNote: document.getElementById('cNote').value
  };

  try {
    const res = await fetch('/api/shipments', {
      method: 'POST',
      ...apiOptions,
      body: JSON.stringify(body)
    });
    if(res.ok) {
      closeModal('createModal');
      document.getElementById('createForm').reset();
      loadShipments();
    } else {
      alert('Error creating shipment');
    }
  } catch (err) {
    console.error(err);
    alert('Network error');
  }
});

document.getElementById('updateForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const trackingId = document.getElementById('uTrackingId').value;
  const body = {
    currentIndex: parseInt(document.getElementById('uCurrentIndex').value, 10),
    staffNote: document.getElementById('uNote').value
  };

  try {
    const res = await fetch(`/api/shipments/${trackingId}`, {
      method: 'PUT',
      ...apiOptions,
      body: JSON.stringify(body)
    });
    if(res.ok) {
      closeModal('updateModal');
      document.getElementById('updateForm').reset();
      loadShipments();
    } else {
      alert('Error updating shipment');
    }
  } catch (err) {
    console.error(err);
    alert('Network error');
  }
});

// Initial load
loadShipments();
