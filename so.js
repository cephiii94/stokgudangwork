// ===========================================
// LOGIC REKAP, INPUT, & DETAIL SO
// File: so.js (UPDATED VERSI DROPDOWN)
// ===========================================

// --- DATA DUMMY ---
let dummyHistory = [
    {
        id: 'SO-001', date: '2024-05-18', location: 'Gudang',
        items: [{ name: 'SP 1.5GB', system: 50, physical: 50, note: '' }]
    }
];

document.addEventListener('dataReady', function() {
    setTimeout(() => {
        const loader = document.getElementById('loader-overlay');
        if(loader) loader.classList.add('hidden');
    }, 300);
    populateDropdowns();
    renderHistoryTable(); 
});

// --- Element References ---
const soModal = document.getElementById('soModal');
const openBtn = document.getElementById('openSoModalBtn');
const closeBtn = document.getElementById('closeSoModalBtn');
const cancelBtn = document.getElementById('cancelSoBtn');
const saveBtn = document.getElementById('saveSoBtn');
const locationSelect = document.getElementById('modalSoLocation');
const dateInput = document.getElementById('modalSoDate');
const inputTableBody = document.getElementById('soInputTableBody');
const addItemBtn = document.getElementById('addSoItemBtn'); // Tombol Baru

// Detail Modal Refs
const detailModal = document.getElementById('soDetailModal');
const closeDetailBtn = document.getElementById('closeDetailModalBtn');
const detailTableBody = document.getElementById('detailTableBody');
const btnDeleteSO = document.getElementById('btnDeleteSO');
const btnEditSO = document.getElementById('btnEditSO');
let currentDetailId = null;

// --- Event Listeners Modal Input ---
if(openBtn) {
    openBtn.addEventListener('click', () => {
        // Set Default Date ke Hari Ini saat buka baru
        if(dateInput) dateInput.valueAsDate = new Date();
        prepareSoSheet('Gudang'); 
        soModal.classList.add('show');
    });
}

function closeModal() { soModal.classList.remove('show'); }
if(closeBtn) closeBtn.addEventListener('click', closeModal);
if(cancelBtn) cancelBtn.addEventListener('click', closeModal);

if(locationSelect) {
    locationSelect.addEventListener('change', (e) => {
        prepareSoSheet(e.target.value);
    });
}

// [BARU] Event Tombol Tambah Item
if(addItemBtn) {
    addItemBtn.addEventListener('click', () => {
        // Tambah baris kosong dengan stok sistem 0
        addTableRow({ nama: '', stok: 0 }, true); 
        // Scroll ke bawah
        inputTableBody.lastElementChild.scrollIntoView({ behavior: 'smooth' });
    });
}

// --- FUNGSI UTAMA ---

// [BARU] Fungsi Generate Dropdown Produk dari Data Master
function getProductOptionsHTML(selectedName) {
    // Ambil semua produk unik dari Gudang Summary (Master Data)
    const masterData = window.gudangSummary || [];
    let options = `<option value="" disabled ${!selectedName ? 'selected' : ''}>Pilih Produk...</option>`;
    
    // Urutkan nama abjad
    const sortedProducts = [...masterData].sort((a,b) => a.nama.localeCompare(b.nama));

    sortedProducts.forEach(p => {
        const isSelected = p.nama === selectedName ? 'selected' : '';
        options += `<option value="${p.nama}" ${isSelected}>${p.nama}</option>`;
    });
    return options;
}

// [BARU] Fungsi Cari Stok Sistem berdasarkan Nama & Lokasi
function getSystemStock(productName, locationName) {
    if(!productName) return 0;
    
    if (locationName === 'Gudang') {
        const product = window.gudangSummary.find(p => p.nama === productName);
        return product ? product.stok : 0;
    } else {
        // Cari di canvasser
        const items = window.processedData.filter(p => p.canvasser === locationName && p.nama === productName);
        // Asumsi sistem stok canvasser = jumlah item yg dibawa
        return items.length > 0 ? items[0].items.length : 0; 
    }
}

// Menyiapkan Lembar Kerja (Reset & Load Awal)
function prepareSoSheet(locationName) {
    if(!inputTableBody) return;
    inputTableBody.innerHTML = '';
    
    // Ambil produk awal sesuai lokasi
    let products = locationName === 'Gudang' ? (window.gudangSummary || []) : window.processedData.filter(p => p.canvasser === locationName);
    
    // Jika canvasser, group by nama produk biar gak double di list
    if (locationName !== 'Gudang') {
        // Logic khusus canvasser (karena di processedData dia per item detail)
        // Kita butuh unique product names saja
        const uniqueNames = [...new Set(products.map(p => p.nama))];
        products = uniqueNames.map(name => ({ nama: name }));
    }

    if (products.length === 0 && locationName !== 'Gudang') {
        // Jika kosong, biarkan kosong, user bisa tambah manual
    }

    products.forEach(p => {
        // Hitung stok sistem awal
        const sysStock = getSystemStock(p.nama, locationName);
        addTableRow({ nama: p.nama, stok: sysStock }, false);
    });
}

// [BARU] Fungsi Render Satu Baris Tabel
function addTableRow(productData, isManualAdd = false) {
    const row = document.createElement('tr');
    
    // Generate Dropdown Options
    const dropdownHTML = `<select class="input-product-select product-select">${getProductOptionsHTML(productData.nama)}</select>`;
    
    // Stok default
    const sysStock = productData.stok || 0;
    const fisikStock = sysStock; // Default fisik = sistem (biar user tinggal edit yg beda aja)

    const deleteButtonHTML = isManualAdd 
        ? `<button class="btn-remove-row" title="Hapus Baris"><i class="fas fa-times"></i></button>` 
        : '';

    row.innerHTML = `
        <td>${dropdownHTML}</td>
        <td style="text-align:center;">
            <span class="tag tag-kosongan val-system-text">${sysStock}</span>
            <input type="hidden" class="val-system" value="${sysStock}">
        </td>
        <td style="text-align:center;">
            <input type="number" class="input-stock-modal val-fisik" value="${fisikStock}" min="0">
        </td>
        <td style="text-align:center;">
            <span class="variance-good val-variance">0</span>
        </td>
        <td>
            <input type="text" class="input-note-modal" placeholder="Ket...">
        </td>
        <td style="text-align:center;">
            ${deleteButtonHTML}
        </td>
    `;

    inputTableBody.appendChild(row);

    // --- SETUP EVENT LISTENERS UNTUK BARIS INI ---

    const selectEl = row.querySelector('.product-select');
    const systemValEl = row.querySelector('.val-system');
    const systemTextEl = row.querySelector('.val-system-text');
    const fisikInput = row.querySelector('.val-fisik');
    const varianceEl = row.querySelector('.val-variance');
    const removeBtn = row.querySelector('.btn-remove-row');

// 1. Hitung Selisih
    function calculateVariance() {
        const sys = parseInt(systemValEl.value) || 0;
        const fisik = parseInt(fisikInput.value) || 0;
        const diff = fisik - sys;
        varianceEl.textContent = diff;
        varianceEl.className = diff !== 0 ? 'variance-bad val-variance' : 'variance-good val-variance';
    }

    fisikInput.addEventListener('input', calculateVariance);

    // 2. Dropdown Berubah
    selectEl.addEventListener('change', function() {
        const newName = this.value;
        const currentLocation = document.getElementById('modalSoLocation').value;
        const newSysStock = getSystemStock(newName, currentLocation);
        
        systemValEl.value = newSysStock;
        systemTextEl.textContent = newSysStock;
        calculateVariance();
    });

    // 3. [UPDATE] Tombol Hapus Baris Logic
    if(removeBtn) {
        removeBtn.addEventListener('click', function() {
            // Animasi hapus sedikit biar halus (User Experience)
            row.style.opacity = '0';
            row.style.transform = 'translateX(20px)';
            setTimeout(() => {
                row.remove();
            }, 200); // Tunggu 0.2 detik baru hilang
        });
    }
}

// --- Other Logics (Detail, Save, Delete) ---

// Simpan Logic
if(saveBtn) {
    saveBtn.addEventListener('click', () => {
        showAlert('Simulasi: Data berhasil disimpan ke Riwayat!', 'success');
        closeModal();
    });
}

// Populate Filter Dropdowns
function populateDropdowns() {
    const allData = window.processedData || [];
    const canvasserNames = [...new Set(allData.filter(i => i.lokasi === 'Canvasser').map(i => i.canvasser))];
    const filterLoc = document.getElementById('filterLocation');
    const modalLoc = document.getElementById('modalSoLocation');
    
    if(filterLoc && modalLoc) {
        canvasserNames.forEach(name => {
            // Hindari duplikasi sederhana
            if(!modalLoc.querySelector(`option[value="${name}"]`)) {
                const opt1 = document.createElement('option'); opt1.value = name; opt1.textContent = name; filterLoc.appendChild(opt1);
                const opt2 = document.createElement('option'); opt2.value = name; opt2.textContent = name; modalLoc.appendChild(opt2);
            }
        });
    }
}

// Render History
function renderHistoryTable() {
    const tbody = document.getElementById('historyTableBody');
    if(!tbody) return;
    tbody.innerHTML = '';
    
    const emptyMsg = document.getElementById('emptyHistoryMsg');
    if (dummyHistory.length === 0) {
        if(emptyMsg) emptyMsg.style.display = 'block';
        return;
    } else {
        if(emptyMsg) emptyMsg.style.display = 'none';
    }

    dummyHistory.forEach(h => {
        const totalItem = h.items.length;
        const totalSelisih = h.items.reduce((acc, curr) => acc + (curr.physical - curr.system), 0);
        const hasIssue = h.items.some(i => i.physical !== i.system);
        const row = document.createElement('tr');
        row.dataset.id = h.id;
        row.innerHTML = `<td>${h.date}</td><td><span class="tag tag-provider-xl">${h.location}</span></td><td>${totalItem} Item</td><td>-</td><td>-</td><td><span class="${totalSelisih===0?'variance-good':'variance-bad'}">${totalSelisih}</span></td><td>${hasIssue?'Selisih':'Sesuai'}</td><td>${hasIssue?'<span class="tag tag-voucher" style="background:#fee2e2; color:#dc2626;">Cek</span>':'<span class="tag tag-paket">Valid</span>'}</td>`;
        row.addEventListener('click', () => openDetailModal(h.id));
        tbody.appendChild(row);
    });
}

// Detail Modal
function openDetailModal(id) {
    const data = dummyHistory.find(h => h.id === id);
    if (!data) return;
    currentDetailId = id;
    document.getElementById('detailDate').textContent = data.date;
    document.getElementById('detailLocation').textContent = data.location;
    detailTableBody.innerHTML = '';
    data.items.forEach(item => {
        const selisih = item.physical - item.system;
        const row = document.createElement('tr');
        row.innerHTML = `<td>${item.name}</td><td>${item.system}</td><td>${item.physical}</td><td><span class="${selisih===0?'variance-good':'variance-bad'}">${selisih}</span></td><td>${item.note||'-'}</td>`;
        detailTableBody.appendChild(row);
    });
    detailModal.classList.add('show');
}

if(closeDetailBtn) closeDetailBtn.addEventListener('click', () => detailModal.classList.remove('show'));

// Delete & Edit (Using Custom Alert)
if(btnDeleteSO) btnDeleteSO.addEventListener('click', () => {
    showConfirm('Hapus laporan ini?', () => {
        dummyHistory = dummyHistory.filter(h => h.id !== currentDetailId);
        renderHistoryTable();
        detailModal.classList.remove('show');
        showAlert('Terhapus!', 'success');
    }, 'warning');
});

if(btnEditSO) btnEditSO.addEventListener('click', () => {
    detailModal.classList.remove('show');
    const data = dummyHistory.find(h => h.id === currentDetailId);
    if(data) {
        if(locationSelect) locationSelect.value = data.location;
        if(dateInput) dateInput.value = data.date;
        prepareSoSheet(data.location);
        soModal.classList.add('show');
        showAlert('Mode Edit Aktif', 'info');
    }
});

// Helper Alert & Confirm (SAMA SEPERTI SEBELUMNYA)
const alertModal = document.getElementById('customAlertModal');
const alertTitle = document.getElementById('alertTitle');
const alertMessage = document.getElementById('alertMessage');
const alertIcon = document.getElementById('alertIcon');
const alertIconWrapper = document.querySelector('.alert-icon-wrapper');
const btnAlertOk = document.getElementById('btnAlertOk');
const btnAlertCancel = document.getElementById('btnAlertCancel');

function showAlert(message, type = 'info') {
    if(!alertModal) return alert(message);
    setupAlertUI(type, 'Notifikasi');
    alertMessage.textContent = message;
    btnAlertCancel.style.display = 'none';
    btnAlertOk.onclick = () => alertModal.classList.remove('show');
    alertModal.classList.add('show');
}

function showConfirm(message, onYes, type = 'warning') {
    if(!alertModal) return confirm(message) ? onYes() : null;
    setupAlertUI(type, 'Konfirmasi');
    alertMessage.textContent = message;
    btnAlertCancel.style.display = 'block';
    btnAlertCancel.onclick = () => alertModal.classList.remove('show');
    btnAlertOk.onclick = () => { alertModal.classList.remove('show'); if(onYes) onYes(); };
    alertModal.classList.add('show');
}

function setupAlertUI(type, defaultTitle) {
    alertIconWrapper.className = 'alert-icon-wrapper';
    if (type === 'success') { alertIconWrapper.classList.add('success'); alertIcon.className = 'fas fa-check'; alertTitle.textContent = 'Berhasil!'; }
    else if (type === 'error') { alertIconWrapper.classList.add('error'); alertIcon.className = 'fas fa-times'; alertTitle.textContent = 'Gagal!'; }
    else if (type === 'warning') { alertIconWrapper.classList.add('warning'); alertIcon.className = 'fas fa-exclamation-triangle'; alertTitle.textContent = 'Perhatian'; }
    else { alertIcon.className = 'fas fa-info'; alertTitle.textContent = defaultTitle; }
}

// Sync Dark Mode Mobile
const mobileToggle = document.getElementById('darkModeToggleMobile');
if(mobileToggle) mobileToggle.addEventListener('click', () => document.getElementById('darkModeToggle').click());