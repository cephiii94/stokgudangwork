// Menunggu event 'dataReady' dari data-loader.js
document.addEventListener('dataReady', function() {
    const allProducts = window.processedData;
    const gudangSummary = window.gudangSummary || [];
    const stokCanvasser = allProducts.filter(p => p.lokasi === 'Canvasser');

    // --- DOM ELEMENTS ---
    const gudangSummaryContainer = document.getElementById('gudang-summary');
    const canvasserGridContainer = document.getElementById('canvasser-grid');
    const filterGroup = document.querySelector('.filter-group');
    
    // Modal Rincian Stok
    const detailModal = document.getElementById('detailModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalBody = document.getElementById('modalBody');
    const modalFooter = document.getElementById('modalFooter');
    const closeDetailBtn = document.getElementById('closeDetailBtn');
    
    // Modal QR Code
    const qrCodeModal = document.getElementById('qrCodeModal');
    const qrCodeModalTitle = document.getElementById('qrCodeModalTitle');
    const serialNumberHeader = document.getElementById('serialNumberHeader');
    const serialNumberTableBody = document.getElementById('serialNumberTableBody');
    const closeQrCodeBtn = document.getElementById('closeQrCodeBtn');
    const qrcodeValue = document.getElementById('qrcodeValue');
    const qrcodeContainer = document.getElementById('qrcode');

    // Modal Info
    const infoModal = document.getElementById('infoModal');
    const infoIcon = document.getElementById('info-icon');
    const closeInfoBtn = document.getElementById('closeInfoBtn');


    // --- STATE ---
    let activeFilters = {
        jenis: 'kartu-perdana',
        tipe: 'kosongan'
    };
    let currentCanvasserProducts = [];

    // --- FUNCTIONS ---

    // =============== [FUNGSI BARU] ===============
    // Fungsi untuk memeriksa apakah sebuah tanggal (dalam format string) adalah hari ini.
    function isDateToday(dateString) {
        if (!dateString || typeof dateString !== 'string') return false;

        // Peta untuk mengubah nama bulan Bahasa Indonesia ke angka (0-11)
        const monthMap = {
            'Januari': 0, 'Februari': 1, 'Maret': 2, 'April': 3, 'Mei': 4, 'Juni': 5,
            'Juli': 6, 'Agustus': 7, 'September': 8, 'Oktober': 9, 'November': 10, 'Desember': 11
        };

        const parts = dateString.split(' ');
        if (parts.length !== 3) return false; // Format harus "DD NAMA_BULAN YYYY"

        const day = parseInt(parts[0], 10);
        const month = monthMap[parts[1]];
        const year = parseInt(parts[2], 10);

        if (isNaN(day) || month === undefined || isNaN(year)) return false;

        const updateDate = new Date(year, month, day);
        const today = new Date();

        // Bandingkan tahun, bulan, dan tanggal
        return today.getFullYear() === updateDate.getFullYear() &&
               today.getMonth() === updateDate.getMonth() &&
               today.getDate() === updateDate.getDate();
    }
    // ===============================================

    // =============== [FUNGSI DIPERBARUI] ===============
    // Fungsi untuk menampilkan tanggal update gudang
    function displayGudangUpdateTime() {
        const gudangTimestampEl = document.getElementById('gudang-update-time');
        if (gudangTimestampEl && window.updateTimestamps && window.updateTimestamps.gudang) {
            const updateDateStr = window.updateTimestamps.gudang;
            gudangTimestampEl.textContent = `Diperbarui: ${updateDateStr}`;
            
            // Tambahkan kelas 'update-today' jika tanggalnya adalah hari ini
            if (isDateToday(updateDateStr)) {
                gudangTimestampEl.classList.add('update-today');
            }
        } else if (gudangTimestampEl) {
            gudangTimestampEl.textContent = 'Tanggal tidak ditemukan';
        }
    }
    // ===================================================

    // Fungsi untuk format angka
    function formatNumber(num) {
        return Number(num).toLocaleString('id-ID');
    }

    // Fungsi untuk mengisi kartu stok gudang
    function populateStokGudang() {
        if (!gudangSummaryContainer) return;

        const filteredProducts = gudangSummary.filter(p =>
            (activeFilters.jenis ? p.jenis === activeFilters.jenis : true) &&
            (activeFilters.tipe ? p.tipe === activeFilters.tipe : true)
        );

        const totals = filteredProducts.reduce((acc, p) => {
            if (p.provider) { 
                acc[p.provider] = (acc[p.provider] || 0) + p.stok;
            }
            return acc;
        }, {});
        
        const spAxisRegulerProduct = gudangSummary.find(p => p.nama.trim().toLowerCase() === 'sp10k axis reguler');

        if (activeFilters.jenis === 'kartu-perdana' && activeFilters.tipe === 'kosongan') {
            totals['axis'] = spAxisRegulerProduct ? spAxisRegulerProduct.stok : 0;
        }

        gudangSummaryContainer.innerHTML = '';
        const providers = { xl: 'XL', axis: 'Axis', smartfren: 'Smartfren' };
        const isPaketActive = activeFilters.tipe === 'paket';

        for (const key in providers) {
            const card = document.createElement('div');
            card.className = 'summary-card';
            card.innerHTML = `<h4>${providers[key]}</h4><p class="amount">${formatNumber(totals[key] || 0)}</p>`;

            if (isPaketActive && (totals[key] || 0) > 0) {
                card.classList.add('clickable');
                card.dataset.provider = key;
            }
            gudangSummaryContainer.appendChild(card);
            
            if (key === 'axis' && activeFilters.jenis === 'kartu-perdana' && activeFilters.tipe === 'kosongan') {
                 const spAxisSchoolProduct = gudangSummary.find(p => p.nama.trim().toLowerCase() === 'sp10k axis ex school');
                 if (spAxisSchoolProduct && spAxisSchoolProduct.stok > 0) {
                     const spAxisCard = document.createElement('div');
                     spAxisCard.className = 'summary-card';
                     spAxisCard.innerHTML = `<h4>Axis ex School</h4><p class="amount">${formatNumber(spAxisSchoolProduct.stok)}</p>`;
                     gudangSummaryContainer.appendChild(spAxisCard);
                 }
            }
        }

        if (activeFilters.jenis === 'kartu-perdana' && activeFilters.tipe === 'kosongan') {
            const totalDompul = gudangSummary
                .filter(p => p.tipe === 'dompul')
                .reduce((sum, p) => sum + p.stok, 0);

            if (totalDompul > 0) {
                const dompulCard = document.createElement('div');
                dompulCard.className = 'summary-card';
                dompulCard.innerHTML = `<h4>Dompul</h4><p class="amount">${formatNumber(totalDompul)}</p>`;
                gudangSummaryContainer.appendChild(dompulCard);
            }
        }
    }

    // =============== [FUNGSI DIPERBARUI] ===============
    // Fungsi untuk mengisi kartu stok canvasser
    function populateStokCanvasser() {
        if (!canvasserGridContainer) return;

        const canvasserSummary = stokCanvasser.reduce((acc, p) => {
            if (!acc[p.canvasser]) {
                acc[p.canvasser] = { alokasi: 0, sellIn: 0 };
            }
            p.items.forEach(item => {
                if (item.status === 'Alokasi') acc[p.canvasser].alokasi++;
                else if (item.status === 'Sell In') acc[p.canvasser].sellIn++;
            });
            return acc;
        }, {});

        canvasserGridContainer.innerHTML = '';
        for (const name in canvasserSummary) {
            const card = document.createElement('div');
            card.className = 'canvasser-card';
            
            const updateTime = window.updateTimestamps.canvassers[name] || 'N/A';
            // Cek apakah tanggalnya hari ini, lalu siapkan kelas CSS-nya
            const isTodayClass = isDateToday(updateTime) ? 'update-today' : '';

            // Terapkan kelas CSS 'isTodayClass' ke elemen <small>
            card.innerHTML = `
                <div class="canvasser-card-header">
                    <h4>${name}</h4>
                    <small class="update-timestamp-card ${isTodayClass}">
                        <i class="fas fa-clock"></i> ${updateTime}
                    </small>
                </div>
                <div class="stock-info">
                    <div class="stock-alokasi">
                        Stok Alokasi: <span class="total-stock">${formatNumber(canvasserSummary[name].alokasi)}</span>
                    </div>
                    <div class="stock-sell-in">
                        Stok Sell In: <span class="sell-in-stock">${formatNumber(canvasserSummary[name].sellIn)}</span>
                    </div>
                </div>
                <button class="detail-btn" data-canvasser="${name}">Lihat Detail</button>
            `;
            canvasserGridContainer.appendChild(card);
        }
    }
    // ===================================================
    
    // Fungsi untuk sinkronisasi tombol filter
    function syncFilterButtons() {
        document.querySelectorAll('.filter-item').forEach(item => {
            const group = item.dataset.filterGroup;
            const value = item.dataset.filterValue;
            item.classList.toggle('active', activeFilters[group] === value);
        });
    }

    // Fungsi untuk membuka modal detail stok gudang (paket)
    function openGudangDetailModal(providerName) {
        const productsToShow = gudangSummary.filter(p => 
            p.provider === providerName &&
            p.jenis === activeFilters.jenis &&
            p.tipe === activeFilters.tipe
        );

        const providerDisplayName = providerName.charAt(0).toUpperCase() + providerName.slice(1);
        modalTitle.textContent = `Rincian Stok Paket ${providerDisplayName}`;
        
        let tableHTML = `<div class="table-wrapper"><table class="detail-modal-table"><thead><tr><th>Nama Produk</th><th>Total Stok</th></tr></thead><tbody>`;
        
        if (productsToShow.length > 0) {
            productsToShow.forEach(product => {
                tableHTML += `
                    <tr>
                        <td>${product.nama}</td>
                        <td>${formatNumber(product.stok)}</td>
                    </tr>
                `;
            });
        } else {
            tableHTML += `<tr><td colspan="2">Tidak ada produk paket yang tersedia untuk provider ini.</td></tr>`;
        }

        tableHTML += `</tbody></table></div>`;
        
        modalBody.innerHTML = tableHTML;
        modalFooter.innerHTML = '';
        detailModal.classList.add('show');
    }

    // Fungsi untuk membuka modal detail canvasser
    function openCanvasserModal(canvasserName) {
        currentCanvasserProducts = stokCanvasser.filter(p => p.canvasser === canvasserName);
        modalTitle.textContent = `Rincian Stok: ${canvasserName}`;
        
        let tableHTML = `<div class="table-wrapper"><table class="detail-modal-table"><thead><tr><th>Nama Produk</th><th>Alokasi</th><th>Sell In</th><th>Operasi</th></tr></thead><tbody>`;
        
        currentCanvasserProducts.forEach(product => {
            const alokasiCount = product.items.filter(i => i.status === 'Alokasi').length;
            const sellInCount = product.items.filter(i => i.status === 'Sell In').length;
            tableHTML += `
                <tr>
                    <td>${product.nama}</td>
                    <td>${formatNumber(alokasiCount)}</td>
                    <td>${formatNumber(sellInCount)}</td>
                    <td>
                        ${alokasiCount > 0 ? `<button class="action-btn" data-product-name="${product.nama}"><i class="fas fa-qrcode"></i> Detail SN</button>` : '-'}
                    </td>
                </tr>
            `;
        });

        tableHTML += `</tbody></table></div>`;
        modalBody.innerHTML = tableHTML;
        modalFooter.innerHTML = `<button class="expand-btn" onclick="window.location.href='canvasser-detail.html?name=${encodeURIComponent(canvasserName)}'">Lihat Halaman Rinci <i class="fas fa-arrow-right"></i></button>`;
        detailModal.classList.add('show');
    }

    // Fungsi untuk membuat QR Code
    function generateQrCode(text) {
        qrcodeContainer.innerHTML = '';
        if (text) {
            new QRCode(qrcodeContainer, { text, width: 160, height: 160 });
            qrcodeValue.textContent = text;
        } else {
            qrcodeValue.textContent = 'Tidak ada data';
        }
    }

    // Fungsi untuk membuka modal QR Code
    function openQrCodeModal(product) {
        if (!product) return;
        qrCodeModalTitle.textContent = `Rincian SN (Alokasi): ${product.nama}`;
        serialNumberHeader.textContent = product.jenis === 'kartu-perdana' ? 'MSISDN' : 'Serial Number';
        
        serialNumberTableBody.innerHTML = '';
        const alokasiItems = product.items.filter(item => item.status === 'Alokasi');
        
        alokasiItems.forEach((item, index) => {
            const row = document.createElement('tr');
            row.dataset.id = item.id;
            row.innerHTML = `<td>${index + 1}. ${item.id}</td>`;
            if (index === 0) row.classList.add('active');
            serialNumberTableBody.appendChild(row);
        });

        generateQrCode(alokasiItems[0]?.id);
        qrCodeModal.classList.add('show');
    }

    // --- FUNGSI UNTUK NOTIFIKASI ---
    function setupNotifications() {
        const bellWrapper = document.querySelector('.notification-wrapper');
        if (!bellWrapper) return;

        const notificationDot = bellWrapper.querySelector('.notification-dot');
        const notificationDropdown = bellWrapper.querySelector('.notification-dropdown');
        const notificationList = document.getElementById('notification-list');
        const timestamps = window.updateTimestamps;
        let newNotifications = [];

        if (timestamps && timestamps.gudang && isDateToday(timestamps.gudang)) {
            newNotifications.push(`<li><strong>Stok Gudang</strong> telah diperbarui hari ini.</li>`);
        }

        if (timestamps && timestamps.canvassers) {
            for (const canvasserName in timestamps.canvassers) {
                const date = timestamps.canvassers[canvasserName];
                if (isDateToday(date)) {
                    newNotifications.push(`<li><strong>Stok ${canvasserName}</strong> telah diperbarui hari ini.</li>`);
                }
            }
        }

        if (newNotifications.length > 0) {
            notificationDot.style.display = 'block';
            notificationList.innerHTML = newNotifications.join('');
        } else {
            notificationList.innerHTML = '<li class="no-notif">Tidak ada pembaruan hari ini.</li>';
        }

        bellWrapper.addEventListener('click', (e) => {
            e.stopPropagation();
            notificationDropdown.classList.toggle('show');
            notificationDot.style.display = 'none';
        });
    }

    // --- FUNGSI UNTUK PENGUMUMAN & TAB ---
 function populateAnnouncements() {
    const container = document.getElementById('pengumumanContent');
    if (!container) return;

    function getIconForType(type) {
        if (!type) return 'fas fa-info-circle';
        
        const lowerType = type.toLowerCase().trim();
        switch(lowerType) {
            case 'penting':
                return 'fas fa-triangle-exclamation';
            case 'perbaikan':
                return 'fas fa-wrench';
            case 'info':
            default:
                return 'fas fa-info-circle';
        }
    }

    const announcements = window.pengumumanData || [];

    if (announcements.length > 0) {
        let html = '';
        announcements.forEach(item => {
            const iconClass = getIconForType(item.Tipe);
            html += `
                <div class="announcement-item">
                    <div class="announcement-header">
                        <h5><i class="${iconClass}"></i> ${item.Judul || 'Tanpa Judul'}</h5>
                        <span class="date">${item.Tanggal || ''}</span>
                    </div>
                    <p>${item.Isi || 'Tidak ada konten.'}</p>
                </div>
            `;
        });
        container.innerHTML = html;
    } else {
        container.innerHTML = '<p class="no-announcement">Tidak ada pengumuman saat ini.</p>';
    }
}

    function setupInfoTabs() {
        const modal = document.getElementById('infoModal');
        if (!modal) return;

        const tabContainer = modal.querySelector('.modal-tabs');
        const tabBtns = modal.querySelectorAll('.tab-btn');
        const tabContents = modal.querySelectorAll('.tab-content');

        if (!tabContainer) return;

        tabContainer.addEventListener('click', (e) => {
            const clickedBtn = e.target.closest('.tab-btn');
            if (!clickedBtn) return;

            const tabId = clickedBtn.dataset.tab;

            tabBtns.forEach(btn => btn.classList.remove('active'));
            clickedBtn.classList.add('active');

            tabContents.forEach(content => {
                if (content.id === tabId) {
                    content.classList.remove('hidden');
                } else {
                    content.classList.add('hidden');
                }
            });
        });
    }

    // --- EVENT LISTENERS ---
    if (filterGroup) {
        filterGroup.addEventListener('click', (e) => {
            if (e.target.classList.contains('filter-item')) {
                const group = e.target.dataset.filterGroup;
                const value = e.target.dataset.filterValue;
                activeFilters[group] = value;
                syncFilterButtons();
                populateStokGudang();
            }
        });
    }

    if (gudangSummaryContainer) {
        gudangSummaryContainer.addEventListener('click', (e) => {
            const card = e.target.closest('.summary-card.clickable');
            if (card) {
                const provider = card.dataset.provider;
                openGudangDetailModal(provider);
            }
        });
    }

    if (canvasserGridContainer) {
        canvasserGridContainer.addEventListener('click', (e) => {
            const detailBtn = e.target.closest('.detail-btn');
            if (detailBtn) openCanvasserModal(detailBtn.dataset.canvasser);
        });
    }
    
    if (modalBody) {
        modalBody.addEventListener('click', (e) => {
            const actionBtn = e.target.closest('.action-btn');
            if (actionBtn) {
                const productName = actionBtn.dataset.productName;
                const product = currentCanvasserProducts.find(p => p.nama === productName);
                openQrCodeModal(product);
            }
        });
    }

    if (serialNumberTableBody) {
        serialNumberTableBody.addEventListener('click', (e) => {
            const clickedRow = e.target.closest('tr');
            if (!clickedRow) return;
            serialNumberTableBody.querySelectorAll('tr').forEach(row => row.classList.remove('active'));
            clickedRow.classList.add('active');
            generateQrCode(clickedRow.dataset.id);
        });
    }

    function setupModalClosers() {
        const allModals = document.querySelectorAll('.modal');
        allModals.forEach(modal => {
            const closeBtn = modal.querySelector('.close-btn');
            if (closeBtn) {
                closeBtn.addEventListener('click', () => modal.classList.remove('show'));
            }
        });
        window.addEventListener('click', (event) => {
            allModals.forEach(modal => {
                if (event.target == modal) {
                    modal.classList.remove('show');
                }
            });
        });
    }
    
    if (infoIcon) {
        infoIcon.addEventListener('click', () => {
            if (infoModal) infoModal.classList.add('show');
        });
    }

    document.addEventListener('click', (e) => {
        const dropdown = document.querySelector('.notification-dropdown');
        const bellWrapper = document.querySelector('.notification-wrapper');
        if (dropdown && dropdown.classList.contains('show') && !bellWrapper.contains(e.target)) {
            dropdown.classList.remove('show');
        }
    });


    // --- INITIALIZATION ---
    displayGudangUpdateTime();
    populateStokGudang();
    populateStokCanvasser();
    syncFilterButtons();
    setupNotifications();
    setupModalClosers(); 
    populateAnnouncements(); 
    setupInfoTabs();
});
