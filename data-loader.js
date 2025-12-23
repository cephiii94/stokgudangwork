// ============================================================
// DATA LOADER BARU (FIREBASE MODE)
// ============================================================

// URL Endpoint Firebase (Akses langsung ke JSON)
// Bri ambil dari screenshot database Tuan tadi
const FIREBASE_ENDPOINT = "https://project-notonlen-default-rtdb.asia-southeast1.firebasedatabase.app/stok_ppu.json";

// Fungsi utama untuk mengambil data
async function fetchAndProcessData() {
    console.log("🚀 Mengambil data dari Firebase...");
    
    // Reset data global
    window.gudangSummary = [];
    window.processedData = [];
    window.pengumumanData = []; // Nanti bisa kita tambah fitur pengumuman di Firebase
    window.updateTimestamps = {
        gudang: null,
        canvassers: {}
    };

    try {
        // 1. Fetch Data dari Firebase (Super Cepat!)
        const response = await fetch(FIREBASE_ENDPOINT);
        if (!response.ok) throw new Error("Gagal menghubungi Firebase");
        
        const dbData = await response.json();

        if (!dbData) {
            console.warn("Database kosong!");
            return;
        }

        // 2. Ambil Waktu Update Terakhir
        const lastUpdate = dbData.LastUpdate || "Belum ada update";
        window.updateTimestamps.gudang = lastUpdate; // Kita pakai satu waktu untuk semua sementara ini

        // 3. Proses Data Gudang
        if (dbData.Gudang) {
            window.gudangSummary = dbData.Gudang.map(item => ({
                nama: (item.nama || '').trim(),
                provider: (item.provider || '').toLowerCase().trim(),
                jenis: (item.jenis || '').toLowerCase().trim().replace(/ /g, '-'),
                tipe: (item.tipe || '').toLowerCase().trim(),
                stok: parseInt(item.stok, 10) || 0
            }));
        }

        // 4. Proses Data Canvasser
        // Kita harus ubah format Firebase biar cocok sama logika Dashboard Tuan yang lama
        const processedItems = [];

        if (dbData.Canvasser) {
            // Loop setiap nama canvasser (Ali, Yanuar, dll)
            Object.keys(dbData.Canvasser).forEach(canvasserName => {
                const items = dbData.Canvasser[canvasserName];
                
                // Set timestamp per canvasser (samakan dulu dengan global)
                window.updateTimestamps.canvassers[canvasserName] = lastUpdate;

                // Loop barang bawaan mereka
                items.forEach(item => {
                    // Masukkan ke array utama
                    processedItems.push({
                        nama: item.nama,
                        provider: (item.provider || '').toLowerCase(),
                        jenis: (item.jenis || '').toLowerCase().replace(/ /g, '-'),
                        tipe: (item.tipe || '').toLowerCase(),
                        lokasi: 'Canvasser',
                        canvasser: canvasserName,
                        
                        // Detail spesifik untuk Modal & Tabel Detail
                        id: item.sn,      // Serial Number
                        status: item.status, // Alokasi / Sell In
                        alokasiAwal: item.alokasi
                    });
                });
            });
        }

        // 5. Kelompokkan Data Canvasser (Grouping Logic)
        // Dashboard Tuan butuh data yang sudah dikelompokkan per Produk + Canvasser
        const groupedData = processedItems.reduce((acc, item) => {
            const key = `${item.nama}-${item.canvasser}`;
            
            if (!acc[key]) {
                acc[key] = {
                    nama: item.nama,
                    provider: item.provider,
                    jenis: item.jenis,
                    tipe: item.tipe,
                    lokasi: 'Canvasser',
                    canvasser: item.canvasser,
                    items: [] // Array untuk menampung list SN
                };
            }
            
            // Masukkan detail SN ke dalam kelompok ini
            acc[key].items.push({
                id: item.id,
                status: item.status
            });
            
            return acc;
        }, {});

        // Simpan hasil grouping ke variabel global window.processedData
        window.processedData = Object.values(groupedData);

        console.log("✅ Data berhasil diproses!", {
            gudang: window.gudangSummary.length,
            canvasserGroups: window.processedData.length
        });

    } catch (error) {
        console.error("❌ Error fetch data:", error);
        document.body.innerHTML = `<div style="text-align: center; padding: 50px; color: red;">
            <h1>Koneksi Gagal</h1>
            <p>${error.message}</p>
        </div>`;
    }
}

// Menjalankan saat script dimuat
document.addEventListener('DOMContentLoaded', () => {
    const dataReadyEvent = new Event('dataReady');
    
    fetchAndProcessData().then(() => {
        // Beritahu script.js dan dashboard.js kalau data sudah siap
        document.dispatchEvent(dataReadyEvent);
    });
});