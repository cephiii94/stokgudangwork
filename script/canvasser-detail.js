document.addEventListener('dataReady', function() {
    const allProducts = window.processedData;
    
    const canvasserName = new URLSearchParams(window.location.search).get('name');
    const canvasserProducts = allProducts.filter(p => p.canvasser === canvasserName);

    // DOM Elements
    const canvasserNameTitle = document.getElementById('canvasserNameTitle');
    const summaryCardsContainer = document.getElementById('summaryCardsContainer');
    const productTableBody = document.getElementById('productTableBody');
    const productSearchInput = document.getElementById('productSearchInput');
    const chartContainer = document.getElementById('chartContainer');

    // Modal Elements
    const qrCodeModal = document.getElementById('qrCodeModal');
    const qrCodeModalTitle = document.getElementById('qrCodeModalTitle');
    const serialNumberHeader = document.getElementById('serialNumberHeader');
    const serialNumberTableBody = document.getElementById('serialNumberTableBody');
    const closeQrCodeBtn = document.getElementById('closeQrCodeBtn');
    const qrcodeContainer = document.getElementById('qrcode');
    const qrcodeValue = document.getElementById('qrcodeValue');

    // Fungsi untuk format angka ke format ribuan Indonesia
    function formatNumber(num) {
        return Number(num).toLocaleString('id-ID');
    }

    function displayCanvasserInfo() {
        canvasserNameTitle.textContent = `Detail Stok: ${canvasserName}`;
    }

    function displaySummaryCards() {
        let totalAlokasi = 0;
        let totalSellIn = 0;
        canvasserProducts.forEach(p => {
            p.items.forEach(item => {
                if (item.status === 'Alokasi') totalAlokasi++;
                else if (item.status === 'Sell In') totalSellIn++;
            });
        });

        summaryCardsContainer.innerHTML = `
            <div class="detail-summary-card"><i class="fas fa-boxes-stacked"></i><div class="card-info"><span class="value">${formatNumber(totalAlokasi)}</span><span class="label">Total Stok Alokasi</span></div></div>
            <div class="detail-summary-card"><i class="fas fa-hand-holding-dollar"></i><div class="card-info"><span class="value">${formatNumber(totalSellIn)}</span><span class="label">Total Stok Sell In</span></div></div>
            <div class="detail-summary-card"><i class="fas fa-tags"></i><div class="card-info"><span class="value">${formatNumber(canvasserProducts.length)}</span><span class="label">Jenis Produk</span></div></div>
        `;
    }

    function displayProductTable(searchTerm = '') {
        const filteredData = canvasserProducts.filter(p => p.nama.toLowerCase().includes(searchTerm.toLowerCase()));
        productTableBody.innerHTML = '';
        if (filteredData.length === 0) {
            productTableBody.innerHTML = '<tr><td colspan="6" style="text-align: center;">Data tidak ditemukan.</td></tr>';
            return;
        }
        filteredData.forEach(p => {
            const alokasiCount = p.items.filter(i => i.status === 'Alokasi').length;
            const sellInCount = p.items.filter(i => i.status === 'Sell In').length;
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${p.nama}</td>
                <td><span class="tag tag-provider-${p.provider}">${p.provider.toUpperCase()}</span></td>
                <td><span class="tag tag-${p.jenis.replace('-', '')}">${p.jenis.replace('-', ' ')}</span></td>
                <td>${formatNumber(alokasiCount)}</td>
                <td>${formatNumber(sellInCount)}</td>
                <td>${alokasiCount > 0 ? `<button class="action-btn" data-product-name="${p.nama}"><i class="fas fa-qrcode"></i> Lihat Detail</button>` : '-' }</td>
            `;
            productTableBody.appendChild(row);
        });
    }

    function generateQrCode(text) {
        qrcodeContainer.innerHTML = '';
        if (text) {
            new QRCode(qrcodeContainer, { text, width: 160, height: 160 });
            qrcodeValue.textContent = text;
        } else {
            qrcodeValue.textContent = 'Tidak ada data';
        }
    }

    function openQrCodeModal(product) {
        if (!product) return;
        qrCodeModalTitle.textContent = `Rincian SN (Alokasi): ${product.nama}`;
        serialNumberHeader.textContent = product.jenis === 'kartu-perdana' ? 'MSISDN' : 'Serial Number';
        
        serialNumberTableBody.innerHTML = '';
        const alokasiItems = product.items.filter(item => item.status === 'Alokasi');
        
        if (alokasiItems.length > 0) {
            alokasiItems.forEach((item, index) => {
                const row = document.createElement('tr');
                row.dataset.id = item.id;
                row.innerHTML = `<td>${index + 1}</td><td>${item.id}</td>`;
                if (index === 0) row.classList.add('active');
                serialNumberTableBody.appendChild(row);
            });
            generateQrCode(alokasiItems[0]?.id);
        } else {
            serialNumberTableBody.innerHTML = '<tr><td colspan="2" style="text-align: center;">Tidak ada SN untuk produk ini.</td></tr>';
            generateQrCode(null);
        }

        qrCodeModal.classList.add('show');
    }

    function closeModal() {
        qrCodeModal.classList.remove('show');
    }

    // Event Listeners
    productSearchInput.addEventListener('input', (e) => displayProductTable(e.target.value));
    
    productTableBody.addEventListener('click', function(event) {
        const actionBtn = event.target.closest('.action-btn');
        if (actionBtn) {
            const productName = actionBtn.dataset.productName;
            const product = canvasserProducts.find(p => p.nama === productName);
            openQrCodeModal(product);
        }
    });

    serialNumberTableBody.addEventListener('click', (e) => {
        const clickedRow = e.target.closest('tr');
        if (!clickedRow || !clickedRow.dataset.id) return;
        serialNumberTableBody.querySelectorAll('tr').forEach(row => row.classList.remove('active'));
        clickedRow.classList.add('active');
        generateQrCode(clickedRow.dataset.id);
    });

    closeQrCodeBtn.addEventListener('click', closeModal);

    window.addEventListener('click', (event) => {
        if (event.target == qrCodeModal) {
            closeModal();
        }
    });

    // Initialization
    if (canvasserName) {
        displayCanvasserInfo();
        displaySummaryCards();
        displayProductTable();
        // displayProviderChart(); // This function is not defined in the provided code
    } else {
        document.body.innerHTML = "<h1>Canvasser tidak ditemukan.</h1>";
    }
});