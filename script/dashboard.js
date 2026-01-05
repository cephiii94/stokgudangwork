document.addEventListener('dataReady', function() {
    const loader = document.getElementById('loader-overlay');
    if (loader) {
        // Hide the loader when data is ready and rendered
        setTimeout(() => {
            loader.classList.add('hidden');
        }, 300); // A small delay to ensure a smooth transition
    }

    const allProducts = window.processedData;
    const gudangSummary = window.gudangSummary || [];
    const stokCanvasser = allProducts.filter(p => p.lokasi === 'Canvasser');

    // DOM Elements
    const summaryCardsContainer = document.getElementById('summaryCardsContainer');
    const gudangTableBody = document.getElementById('gudangTableBody');
    const canvasserTableBody = document.getElementById('canvasserTableBody');
    const gudangSearchInput = document.getElementById('gudangSearchInput');
    const canvasserSearchInput = document.getElementById('canvasserSearchInput');
    const modal = document.getElementById('snDetailModal');
    const modalTitle = document.getElementById('modalTitle');
    const snList = document.getElementById('snList');
    const closeButton = document.querySelector('#snDetailModal .close-button');
    const gudangTableHeader = document.getElementById('gudangTableHeader');

    // Fungsi untuk format angka ke format ribuan Indonesia
    function formatNumber(num) {
        return Number(num).toLocaleString('id-ID');
    }

    function displaySummaryCards() {
        const totalGudang = gudangSummary.reduce((sum, p) => sum + p.stok, 0);
        let totalAlokasi = 0;
        let totalSellIn = 0;

        stokCanvasser.forEach(p => {
            p.items.forEach(item => {
                if (item.status === 'Alokasi') totalAlokasi++;
                else if (item.status === 'Sell In') totalSellIn++;
            });
        });

        const stokProviderGudang = gudangSummary.reduce((acc, p) => {
            if (!acc[p.provider]) {
                acc[p.provider] = 0;
            }
            acc[p.provider] += p.stok;
            return acc;
        }, {});

        let providerCardsHTML = '';
        for (const provider in stokProviderGudang) {
            let iconClass = 'fas fa-sim-card';
            if (provider.toLowerCase() === 'xl') {
                iconClass = 'fa-solid fa-signal';
            } else if (provider.toLowerCase() === 'axis') {
                iconClass = 'fa-solid fa-broadcast-tower';
            }
            providerCardsHTML += `
                <div class="dashboard-summary-card">
                    <i class="${iconClass}"></i>
                    <div class="card-info">
                        <span class="value">${formatNumber(stokProviderGudang[provider])}</span>
                        <span class="label">Stok ${provider.toUpperCase()}</span>
                    </div>
                </div>
            `;
        }

        summaryCardsContainer.innerHTML = `
            <div class="dashboard-summary-card"><i class="fas fa-warehouse"></i><div class="card-info"><span class="value">${formatNumber(totalGudang)}</span><span class="label">Total Stok Gudang</span></div></div>
            ${providerCardsHTML}
            <div class="dashboard-summary-card"><i class="fas fa-boxes-stacked"></i><div class="card-info"><span class="value">${formatNumber(totalAlokasi)}</span><span class="label">Total Alokasi Canvasser</span></div></div>
            <div class="dashboard-summary-card"><i class="fas fa-hand-holding-dollar"></i><div class="card-info"><span class="value">${formatNumber(totalSellIn)}</span><span class="label">Total Sell In Canvasser</span></div></div>
        `;
    }

    function renderGudangTable(searchTerm = '') {
        const filteredData = gudangSummary.filter(p => p.nama.toLowerCase().includes(searchTerm.toLowerCase()));
        gudangTableBody.innerHTML = '';
        if (filteredData.length === 0) {
            gudangTableBody.innerHTML = '<tr><td colspan="6" style="text-align: center;">Data tidak ditemukan.</td></tr>';
            return;
        }
        filteredData.forEach(p => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${p.nama}</td>
                <td><span class="tag tag-provider-${p.provider}">${p.provider.toUpperCase()}</span></td>
                <td><span class="tag tag-${p.jenis.replace('-', '')}">${p.jenis.replace('-', ' ')}</span></td>
                <td><span class="tag tag-${p.tipe}">${p.tipe}</span></td>
                <td>${formatNumber(p.stok)}</td>
                <td><button class="detail-btn" data-product-name="${p.nama}">Lihat Detail</button></td>
            `;
            gudangTableBody.appendChild(row);
        });
    }

    function renderCanvasserTable(searchTerm = '') {
        const lowerCaseSearch = searchTerm.toLowerCase();
        const filteredData = stokCanvasser.filter(p => p.nama.toLowerCase().includes(lowerCaseSearch) || p.canvasser.toLowerCase().includes(lowerCaseSearch));
        canvasserTableBody.innerHTML = '';
        if (filteredData.length === 0) {
            canvasserTableBody.innerHTML = '<tr><td colspan="7" style="text-align: center;">Data tidak ditemukan.</td></tr>';
            return;
        }
        filteredData.forEach(p => {
            const alokasiCount = p.items.filter(i => i.status === 'Alokasi').length;
            const sellInCount = p.items.filter(i => i.status === 'Sell In').length;
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${p.nama}</td>
                <td><a href="canvasser-detail.html?name=${encodeURIComponent(p.canvasser)}" class="table-link">${p.canvasser}</a></td>
                <td><span class="tag tag-provider-${p.provider}">${p.provider.toUpperCase()}</span></td>
                <td><span class="tag tag-${p.jenis.replace('-', '')}">${p.jenis.replace('-', ' ')}</span></td>
                <td><span class="tag tag-${p.tipe}">${p.tipe}</span></td>
                <td>${formatNumber(alokasiCount)}</td>
                <td>${formatNumber(sellInCount)}</td>
            `;
            canvasserTableBody.appendChild(row);
        });
    }

    function openSnModal(productName) {
        const productDetails = allProducts.find(p => p.lokasi === 'Gudang' && p.nama === productName);
        
        modalTitle.textContent = `Rincian SN untuk ${productName}`;
        snList.innerHTML = '';

        if (productDetails && productDetails.items.length > 0) {
            productDetails.items.forEach((item, index) => {
                const li = document.createElement('li');
                li.textContent = `${index + 1}. ${item.id}`;
                snList.appendChild(li);
            });
        } else {
            const li = document.createElement('li');
            li.textContent = 'Tidak ada Serial Number untuk produk ini.';
            snList.appendChild(li);
        }

        modal.classList.add('show');
    }

    function closeModal() {
        modal.classList.remove('show');
    }

    // Event Listeners
    gudangSearchInput.addEventListener('input', (e) => {
        e.stopPropagation(); // Mencegah event bubbling ke header collapsible
        renderGudangTable(e.target.value);
    });
    canvasserSearchInput.addEventListener('input', (e) => renderCanvasserTable(e.target.value));
    
    if(closeButton) {
        closeButton.addEventListener('click', closeModal);
    }

    window.addEventListener('click', (event) => {
        if (event.target == modal) {
            closeModal();
        }
    });

    gudangTableBody.addEventListener('click', function(event) {
        const detailBtn = event.target.closest('.detail-btn');
        if (detailBtn) {
            openSnModal(detailBtn.dataset.productName);
        }
    });

    // [BARU] Event listener untuk collapsible table header
    if (gudangTableHeader) {
        gudangTableHeader.addEventListener('click', function(event) {
            // Pastikan klik bukan dari area search
            if (event.target.closest('.search-wrapper-detail')) {
                return;
            }
            const section = this.parentElement;
            section.classList.toggle('expanded');
        });
    }

    // Initialization
    displaySummaryCards();
    renderGudangTable();
    renderCanvasserTable();
});