// ==========================================================================
// 0. SPLASH SCREEN — SMOOTH CINEMATIC EXIT
// ==========================================================================
function matikanLoading() {
    const splash = document.getElementById('splashScreen');
    if (!splash) return;
    splash.style.opacity = '0';
    splash.style.visibility = 'hidden';
}
setTimeout(matikanLoading, 2400);


// ==========================================================================
// 1. NAVIGASI HALAMAN (SPA)
// ==========================================================================
function pindahHalaman(idHalamanTujuan) {
    document.querySelectorAll('.app-page').forEach(page => page.classList.add('hidden'));
    const target = document.getElementById(idHalamanTujuan);
    if (target) target.classList.remove('hidden');

    // Jika masuk ke halaman celengan, refresh nilai saldo tabungan penunjuk di atasnya
    if (idHalamanTujuan === 'pageCelengan') {
        updateSaldoTabunganHeaderCelengan();
        renderDaftarCelengan();
    }
}

// Event listener tombol kembali ke menu utama
document.getElementById('backToMenu2').addEventListener('click', () => pindahHalaman('pageMenuUtama'));
document.getElementById('backToMenu3').addEventListener('click', () => pindahHalaman('pageMenuUtama'));
document.getElementById('backToMenu4').addEventListener('click', () => pindahHalaman('pageMenuUtama'));
document.getElementById('backToMenu5').addEventListener('click', () => pindahHalaman('pageMenuUtama'));


// ==========================================================================
// 2. HALAMAN ALOKASI UANG
// ==========================================================================
let financialChart = null;
let riwayatJajan  = JSON.parse(localStorage.getItem('riwayatJajan')) || [];

// STRUKTUR DATA: Menggunakan Array untuk menampung banyak celengan sekaligus
let daftarCelengan = JSON.parse(localStorage.getItem('daftarCelengan')) || [];

let savedHarian = localStorage.getItem('persenHarian') !== null ? Number(localStorage.getItem('persenHarian')) : 0;
let savedTabungan = localStorage.getItem('persenTabungan') !== null ? Number(localStorage.getItem('persenTabungan')) : 0;
let savedInvestasi = localStorage.getItem('persenInvestasi') !== null ? Number(localStorage.getItem('persenInvestasi')) : 0;
let savedPendapatan = localStorage.getItem('pendapatanTerakhir') !== null ? Number(localStorage.getItem('pendapatanTerakhir')) : 0;

document.getElementById('persenHarian').value = savedHarian;
document.getElementById('persenTabungan').value = savedTabungan;
document.getElementById('persenInvestasi').value = savedInvestasi;

restoreAlokasiData();
updateHistoryUI();

document.getElementById('hitungBtn').addEventListener('click', () => {
    const inputPendapatanBaru = Number(document.getElementById('pendapatanInput').value);
    const pHarian    = Number(document.getElementById('persenHarian').value);
    const pTabungan  = Number(document.getElementById('persenTabungan').value);
    const pInvestasi = Number(document.getElementById('persenInvestasi').value);
    const errorText  = document.getElementById('errorPersenText');

    if ((pHarian + pTabungan + pInvestasi) !== 100) {
        errorText.textContent = "⚠️ Total persentase harus pas 100%!";
        errorText.classList.remove('hidden'); return;
    }
    if (inputPendapatanBaru <= 0) {
        errorText.textContent = "⚠️ Masukkan nominal pendapatan yang valid!";
        errorText.classList.remove('hidden'); return;
    }
    errorText.classList.add('hidden');

    let pendapatanLama = Number(localStorage.getItem('pendapatanTerakhir')) || 0;
    let pendapatanTotalTerbaru = pendapatanLama + inputPendapatanBaru;

    const tambahanHarian = (inputPendapatanBaru * pHarian) / 100;
    const tambahanTabungan = (inputPendapatanBaru * pTabungan) / 100;

    let sisaHarianLama = localStorage.getItem('sisaBersihHarian') !== null ? Number(localStorage.getItem('sisaBersihHarian')) : 0;
    let sisaTabunganLama = localStorage.getItem('sisaBersihTabungan') !== null ? Number(localStorage.getItem('sisaBersihTabungan')) : 0;
    
    let sisaHarianMaju = sisaHarianLama + tambahanHarian;
    let sisaTabunganMaju = sisaTabunganLama + tambahanTabungan;

    localStorage.setItem('persenHarian', pHarian);
    localStorage.setItem('persenTabungan', pTabungan);
    localStorage.setItem('persenInvestasi', pInvestasi);
    localStorage.setItem('pendapatanTerakhir', pendapatanTotalTerbaru);
    localStorage.setItem('sisaBersihHarian', sisaHarianMaju);
    localStorage.setItem('sisaBersihTabungan', sisaTabunganMaju);

    document.getElementById('pendapatanInput').value = "";

    tampilkanDataKeUI(pendapatanTotalTerbaru, pHarian, pTabungan, pInvestasi, sisaHarianMaju, sisaTabunganMaju);
    alert(`Berhasil menambahkan dana sebesar ${formatRupiah(inputPendapatanBaru)} ke dalam alokasi keuangan!`);
});

function tampilkanDataKeUI(totalPendapatan, pHarian, pTabungan, pInvestasi, sisaBersihHarian, sisaBersihTabungan) {
    const totalDanaHarian    = (totalPendapatan * pHarian) / 100;
    const totalDanaTabungan  = (totalPendapatan * pTabungan) / 100;
    const totalDanaInvestasi = (totalPendapatan * pInvestasi) / 100;

    document.getElementById('txtTotalPendapatanGabungan').textContent = formatRupiah(totalPendapatan);
    document.getElementById('txtHarian').textContent   = formatRupiah(sisaBersihHarian);
    document.getElementById('txtTabungan').textContent  = formatRupiah(sisaBersihTabungan);
    document.getElementById('txtInvestasi').textContent = formatRupiah(totalDanaInvestasi);

    const rBulanan   = 0.10 / 12;
    const nBulan     = 5 * 12;
    const fvInvestasi= totalDanaInvestasi * ((Math.pow(1 + rBulanan, nBulan) - 1) / rBulanan);
    document.getElementById('txtSimulasiInvestasi').textContent = formatRupiah(fvInvestasi);

    document.getElementById('hasilSection').classList.remove('hidden');
    
    renderChart(totalDanaHarian, totalDanaTabungan, totalDanaInvestasi);
    hitungEstimasiJajan(sisaBersihHarian);
}

function restoreAlokasiData() {
    const totalPendapatan = Number(localStorage.getItem('pendapatanTerakhir')) || 0;
    if (totalPendapatan <= 0) return; 

    const pHarian    = Number(localStorage.getItem('persenHarian')) || 0;
    const pTabungan  = Number(localStorage.getItem('persenTabungan')) || 0;
    const pInvestasi = Number(localStorage.getItem('persenInvestasi')) || 0;

    const totalDanaHarian = (totalPendapatan * pHarian) / 100;
    const totalDanaTabungan = (totalPendapatan * pTabungan) / 100;

    let sisaBersihHarian = localStorage.getItem('sisaBersihHarian') !== null ? Number(localStorage.getItem('sisaBersihHarian')) : totalDanaHarian;
    let sisaBersihTabungan = localStorage.getItem('sisaBersihTabungan') !== null ? Number(localStorage.getItem('sisaBersihTabungan')) : totalDanaTabungan;

    tampilkanDataKeUI(totalPendapatan, pHarian, pTabungan, pInvestasi, sisaBersihHarian, sisaBersihTabungan);
}

function updateSaldoTabunganHeaderCelengan() {
    let sisaTabungan = localStorage.getItem('sisaBersihTabungan') !== null ? Number(localStorage.getItem('sisaBersihTabungan')) : 0;
    document.getElementById('txtSaldoTabunganCelenganPage').textContent = formatRupiah(sisaTabungan);
}

document.getElementById('jajanHarianInput').addEventListener('input', () => {
    let sisaBersihHarian = localStorage.getItem('sisaBersihHarian') !== null ? Number(localStorage.getItem('sisaBersihHarian')) : 0;
    hitungEstimasiJajan(sisaBersihHarian);
});

function hitungEstimasiJajan(danaHarianSekarang) {
    const jajanPerHari     = Number(document.getElementById('jajanHarianInput').value) || 0;
    const totalJajanSebulan= jajanPerHari * 30;
    const sisaAkhirBulan   = danaHarianSekarang - totalJajanSebulan;
    const txtSisa          = document.getElementById('txtSisaJajan');
    txtSisa.textContent    = formatRupiah(sisaAkhirBulan);
    txtSisa.style.color    = sisaAkhirBulan < 0 ? '#f87171' : '';
}

// CATAT JAJAN HARIAN
document.getElementById('catatJajanBtn').addEventListener('click', () => {
    const nama  = document.getElementById('namaJajanInput').value.trim();
    const harga = Number(document.getElementById('hargaJajanInput').value);
    if (!nama || harga <= 0) { alert("Masukkan nama pengeluaran dan harga!"); return; }

    const totalPendapatan = Number(localStorage.getItem('pendapatanTerakhir')) || 0;
    const pHarian    = Number(localStorage.getItem('persenHarian')) || 0;
    const danaHarianAwal = (totalPendapatan * pHarian) / 100;

    let sisaBersihHarian = localStorage.getItem('sisaBersihHarian') !== null ? Number(localStorage.getItem('sisaBersihHarian')) : danaHarianAwal;

    sisaBersihHarian -= harga;
    localStorage.setItem('sisaBersihHarian', sisaBersihHarian);

    document.getElementById('txtHarian').textContent = formatRupiah(sisaBersihHarian);

    riwayatJajan.push({ nama, harga, tanggal: new Date().toLocaleDateString('id-ID') });
    localStorage.setItem('riwayatJajan', JSON.stringify(riwayatJajan));
    
    document.getElementById('namaJajanInput').value  = "";
    document.getElementById('hargaJajanInput').value = "";
    
    updateHistoryUI();
    hitungEstimasiJajan(sisaBersihHarian);
});

function updateHistoryUI() {
    const listContainer = document.getElementById('jajanHistoryList');
    const historyCard   = document.getElementById('historySectionCard');
    if (riwayatJajan.length === 0) { historyCard.classList.add('hidden'); return; }
    historyCard.classList.remove('hidden');
    listContainer.innerHTML = "";
    riwayatJajan.forEach(item => {
        const li = document.createElement('li');
        li.innerHTML = `<span><b>${item.nama}</b> (${item.tanggal})</span><span style="color:#ef4444; font-weight:bold;">-${formatRupiah(item.harga)}</span>`;
        listContainer.appendChild(li);
    });
}


// ==========================================================================
// 3. HALAMAN CELENGAN IMPIAN (LOGIKA ARRAY MULTI TARGET & INSTANT DEPOSIT)
// ==========================================================================
renderDaftarCelengan();

document.getElementById('setTargetBtn').addEventListener('click', () => {
    const nama  = document.getElementById('targetNamaInput').value.trim();
    const harga = Number(document.getElementById('targetHargaInput').value);
    if (!nama || harga <= 0) { alert("Masukkan data target yang valid!"); return; }

    const celenganBaru = {
        id: Date.now(), 
        nama: nama,
        harga: harga,
        terkumpul: 0
    };

    daftarCelengan.push(celenganBaru);
    localStorage.setItem('daftarCelengan', JSON.stringify(daftarCelengan));
    
    document.getElementById('targetNamaInput').value  = "";
    document.getElementById('targetHargaInput').value = "";
    
    alert(`Target Impian "${nama}" berhasil ditambahkan!`);
    renderDaftarCelengan();
});

function renderDaftarCelengan() {
    const container = document.getElementById('daftarCelenganContainer');
    container.innerHTML = "";

    if (daftarCelengan.length === 0) {
        container.innerHTML = `<p style="text-align:center; color:var(--text-sub); font-size:13px; margin-top:20px;">Belum ada target impian. Yuk bikin satu di atas!</p>`;
        return;
    }

    let sisaTabungan = localStorage.getItem('sisaBersihTabungan') !== null ? Number(localStorage.getItem('sisaBersihTabungan')) : 0;

    daftarCelengan.forEach((item, index) => {
        let persen = Math.min((item.terkumpul / item.harga) * 100, 100);
        let sisaKurang = item.harga - item.terkumpul;

        const card = document.createElement('div');
        card.className = "content-card";
        
        let statusTextHTML = "";
        let buttonHTML = "";

        if (sisaKurang <= 0) {
            statusTextHTML = `<span style="color:var(--green); font-weight:bold;">🎉 Target Tercapai Penuh!</span>`;
            buttonHTML = `<button class="btn-primary" style="background:#4b5563; border: 1px solid #374151; color:#ffffff !important; cursor:not-allowed;" disabled>🔒 Celengan Sudah Penuh</button>`;
        } else {
            statusTextHTML = `<span>Kurang <b>${formatRupiah(sisaKurang)}</b> lagi</span>`;
            
            if (sisaTabungan <= 0) {
                buttonHTML = `<button class="btn-primary" style="background:#4b5563; border: 1px solid #374151; color:#ffffff !important; cursor:not-allowed;" disabled>❌ Saldo Tabungan Habis</button>`;
            } else {
                buttonHTML = `<button class="btn-primary" onclick="setorKeCelenganSpesifik(${item.id})" style="background:var(--grad-green); border: 1px solid rgba(0,0,0,0.25) !important; color:#000000 !important; font-weight:bold; box-shadow:0 4px 12px rgba(16,185,129,0.15);">Ambil dari Uang Tabungan</button>`;
            }
        }

        card.innerHTML = `
            <div class="celengan-header-display" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
                <h4 style="margin:0;">🎯 <span>${item.nama}</span></h4>
                <span class="badge-harga" style="background:rgba(59,130,246,0.1); color:var(--blue); padding:4px 8px; border-radius:6px; font-weight:bold; font-size:12px;">${formatRupiah(item.harga)}</span>
            </div>
            <div class="progress-bar-container" style="background:rgba(255,255,255,0.05); height:8px; border-radius:4px; overflow:hidden; margin-bottom:8px;">
                <div class="progress-bar" style="width: ${persen}%; background:var(--grad-blue); height:100%; transition:width 0.4s ease;"></div>
            </div>
            <div class="celengan-status-text" style="display:flex; justify-content:space-between; font-size:12px; color:var(--text-sub); margin-bottom:12px;">
                <span>${Math.round(persen)}% Terpenuhi</span>
                <span style="color:var(--green); font-weight:bold;">${formatRupiah(item.terkumpul)} Terkumpul</span>
            </div>
            <div style="display:flex; justify-content:space-between; align-items:center; font-size:12px; margin-bottom:14px;">
                ${statusTextHTML}
                <button onclick="hapusCelengan(${item.id})" style="background:none; border:none; color:#ef4444; cursor:pointer; font-size:12px;">❌ Hapus Target</button>
            </div>
            ${buttonHTML}
        `;
        container.appendChild(card);
    });
}

function setorKeCelenganSpesifik(idCelengan) {
    let sisaTabungan = localStorage.getItem('sisaBersihTabungan') !== null ? Number(localStorage.getItem('sisaBersihTabungan')) : 0;
    if (sisaTabungan <= 0) { alert("⚠️ Saldo Tabungan kamu kosong!"); return; }

    let indexCelengan = daftarCelengan.findIndex(item => item.id === idCelengan);
    if (indexCelengan === -1) return;

    let celengan = daftarCelengan[indexCelengan];
    let kekurangan = celengan.harga - celengan.terkumpul;
    let danaDisetor = Math.min(sisaTabungan, kekurangan);

    sisaTabungan -= danaDisetor;
    celengan.terkumpul += danaDisetor;

    localStorage.setItem('sisaBersihTabungan', sisaTabungan);
    localStorage.setItem('daftarCelengan', JSON.stringify(daftarCelengan));

    alert(`Berhasil memindahkan ${formatRupiah(danaDisetor)} langsung ke target "${celengan.nama}"!`);

    updateSaldoTabunganHeaderCelengan();
    renderDaftarCelengan();
    restoreAlokasiData();
}

function hapusCelengan(idCelengan) {
    if (confirm("Apakah kamu yakin ingin menghapus target impian ini? (Uang yang sudah terkumpul di celengan ini akan hangus)")) {
        daftarCelengan = daftarCelengan.filter(item => item.id !== idCelengan);
        localStorage.setItem('daftarCelengan', JSON.stringify(daftarCelengan));
        renderDaftarCelengan();
    }
}


// ==========================================================================
// 4. PUSAT KALKULATOR — DANA DARURAT & GADGET MANUAL
// ==========================================================================
document.getElementById('ddPengeluaranInput').addEventListener('input',  hitungDanaDarurat);
document.getElementById('ddStatusSelect').addEventListener('change', hitungDanaDarurat);

function hitungDanaDarurat() {
    const pengeluaran = Number(document.getElementById('ddPengeluaranInput').value) || 0;
    const status      = document.getElementById('ddStatusSelect').value;
    let pengali = 6;
    if (status === 'menikah') { pengali = 9;  document.getElementById('txtBulanDanaDarurat').textContent = "(9 Bulan)"; }
    else if (status === 'anak') { pengali = 12; document.getElementById('txtBulanDanaDarurat').textContent = "(12 Bulan)"; }
    else { document.getElementById('txtBulanDanaDarurat').textContent = "(6 Bulan)"; }
    document.getElementById('txtDanaDaruratHasil').textContent = formatRupiah(pengeluaran * pengali);
}

// LOGIKA KALKULATOR GADGET (MANUAL)
const calcScreen = document.getElementById('calc-screen');

function inputCalc(value) {
    if (calcScreen.value === "Error") {
        calcScreen.value = "";
    }
    calcScreen.value += value;
}

function clearCalc() {
    calcScreen.value = "";
}

function calculateResult() {
    try {
        if (calcScreen.value.trim() === "") return;
        // Melakukan evaluasi matematika secara aman dari string input layar
        let result = eval(calcScreen.value);
        
        // Membatasi angka di belakang koma jika hasilnya desimal panjang
        if (!Number.isInteger(result)) {
            result = Math.round(result * 100) / 100;
        }
        calcScreen.value = result;
    } catch (err) {
        calcScreen.value = "Error";
    }
}

// ==========================================================================
// 5. HALAMAN TOOLS — MANAGEMENT DATA BACKUP & RESTORE
// ==========================================================================
document.getElementById('exportBtn').addEventListener('click', () => {
    const dataBackup = {
        riwayatJajan:  localStorage.getItem('riwayatJajan'),
        daftarCelengan:localStorage.getItem('daftarCelengan'),
        persenHarian:  localStorage.getItem('persenHarian'),
        persenTabungan:localStorage.getItem('persenTabungan'),
        persenInvestasi:localStorage.getItem('persenInvestasi'),
        pendapatanTerakhir: localStorage.getItem('pendapatanTerakhir'),
        sisaBersihHarian: localStorage.getItem('sisaBersihHarian'),
        sisaBersihTabungan: localStorage.getItem('sisaBersihTabungan')
    };
    const blob = new Blob([JSON.stringify(dataBackup, null, 2)], { type: "application/json" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `backup-finsimpro-${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
});

// FIX: Menutup block catch, try, function, dan event listener secara sempurna
document.getElementById('importFile').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(event) {
        try {
            const data = JSON.parse(event.target.result);
            if (data.riwayatJajan)  localStorage.setItem('riwayatJajan',  data.riwayatJajan);
            if (data.daftarCelengan) localStorage.setItem('daftarCelengan', data.daftarCelengan);
            if (data.persenHarian !== undefined) localStorage.setItem('persenHarian', data.persenHarian);
            if (data.persenTabungan !== undefined) localStorage.setItem('persenTabungan', data.persenTabungan);
            if (data.persenInvestasi !== undefined) localStorage.setItem('persenInvestasi', data.persenInvestasi);
            if (data.pendapatanTerakhir) localStorage.setItem('pendapatanTerakhir', data.pendapatanTerakhir);
            if (data.sisaBersihHarian) localStorage.setItem('sisaBersihHarian', data.sisaBersihHarian);
            if (data.sisaBersihTabungan) localStorage.setItem('sisaBersihTabungan', data.sisaBersihTabungan);

            alert("📂 Pemulihan sukses! Data cadangan berhasil dimuat ulang.");
            window.location.reload();
        } catch (error) {
            alert("⚠️ Gagal membaca berkas cadangan. Pastikan format berkas JSON valid.");
        }
    };
    reader.readAsText(file);
});


// ==========================================================================
// UTILITIES — FORMATTING & GRAPHICS (BAGIAN AKHIR SCRIPT YANG SUDAH DIPERBAIKI)
// ==========================================================================
function formatRupiah(angka) {
    return "Rp " + Math.round(angka).toLocaleString('id-ID');
}

function renderChart(harian, tabungan, investasi) {
    const ctx = document.getElementById('financialChart').getContext('2d');
    if (financialChart) financialChart.destroy();

    financialChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Harian', 'Tabungan', 'Investasi'],
            datasets: [{
                data: [harian, tabungan, investasi],
                backgroundColor: [
                    'rgba(30,58,95,0.85)',   
                    'rgba(90,127,110,0.85)',  
                    'rgba(201,169,110,0.85)' 
                ],
                borderColor: [
                    'rgba(30,58,95,0.2)',
                    'rgba(90,127,110,0.2)',
                    'rgba(201,169,110,0.2)'
                ],
                borderWidth: 2,
                hoverOffset: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '68%',
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: '#7b8494',
                        font: { size: 12, weight: '600', family: 'Inter' },
                        padding: 16,
                        usePointStyle: true, pointStyleWidth: 8
                    }
                }
            }
        }
    });
}

// ==========================================================================
// LOGIKA RESET DATA KHUSUS ANDROID (TAMBAHAN BARU)
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => {
    const tombolReset = document.getElementById('resetDataBtn');
    if (tombolReset) {
        tombolReset.onclick = function() {
            const yakin = confirm("⚠️ PERINGATAN! Apakah Anda yakin ingin menghapus SELURUH data keuangan, celengan, dan riwayat pengeluaran dari HP ini?");
            if (yakin) {
                // Menghapus seluruh data yang tersimpan di memori lokal browser HP
                localStorage.clear(); 
                alert("Semua data FinSim Pro berhasil direset ke kondisi pabrik!");
                window.location.reload(); // Muat ulang halaman aplikasi
            }
        };
    }
});
