// ============================================================
// ADMIN DASHBOARD JS - Ujian Online System
// VERSI: 3.0.1 - LENGKAP (Dengan Perbaikan Upload Word via Mammoth.js)
// ============================================================
// PASTIKAN ANDA MENAMBAHKAN INI DI HTML: 
// <script src="https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js"></script>

(function() {
    'use strict';

    // ============================================================
    // DATA
    // ============================================================

    let userData = [];
    let pesertaData = [];
    let soalData = [];
    let nextUserId = 1;
    let nextPesertaId = 1;
    let nextSoalId = 1;
    let uploadedSoalData = [];
    let isUploading = false;

    // Status Ujian (Aktif/Nonaktif)
    let ujianStatus = {
        pretest: false,
        posttest: false
    };

    // ============================================================
    // DOM REFERENCES
    // ============================================================

    const elements = {
        adminName: document.getElementById('adminName'),
        storageInfo: document.getElementById('storageInfo'),
        dataCount: document.getElementById('dataCount'),
        // Stats
        totalUsers: document.getElementById('totalUsers'),
        totalAdmin: document.getElementById('totalAdmin'),
        totalGuru: document.getElementById('totalGuru'),
        totalPeserta: document.getElementById('totalPeserta'),
        pesertaAktif: document.getElementById('pesertaAktif'),
        pesertaSelesai: document.getElementById('pesertaSelesai'),
        totalSoal: document.getElementById('totalSoal'),
        soalPretest: document.getElementById('soalPretest'),
        soalPosttest: document.getElementById('soalPosttest'),
        rataRata: document.getElementById('rataRata'),
        rataPretest: document.getElementById('rataPretest'),
        rataPosttest: document.getElementById('rataPosttest'),
        nilaiTertinggi: document.getElementById('nilaiTertinggi'),
        pesertaTerbaik: document.getElementById('pesertaTerbaik'),
        pretestCount: document.getElementById('pretestCount'),
        totalPretest: document.getElementById('totalPretest'),
        pretestPeserta: document.getElementById('pretestPeserta'),
        pretestSoal: document.getElementById('pretestSoal'),
        pretestRata: document.getElementById('pretestRata'),
        posttestPeserta: document.getElementById('posttestPeserta'),
        posttestSoal: document.getElementById('posttestSoal'),
        posttestRata: document.getElementById('posttestRata'),
        // Tables
        userTableBody: document.getElementById('userTableBody'),
        userTotalCount: document.getElementById('userTotalCount'),
        pesertaTableBody: document.getElementById('pesertaTableBody'),
        pesertaTotalCount: document.getElementById('pesertaTotalCount'),
        soalTableBody: document.getElementById('soalTableBody'),
        soalTotalCount: document.getElementById('soalTotalCount'),
        hasilTableBody: document.getElementById('hasilTableBody'),
        hasilTotalCount: document.getElementById('hasilTotalCount'),
        // Filters
        filterUserRole: document.getElementById('filterUserRole'),
        searchUser: document.getElementById('searchUser'),
        filterExam: document.getElementById('filterExam'),
        searchPeserta: document.getElementById('searchPeserta'),
        filterSoalJenis: document.getElementById('filterSoalJenis'),
        searchSoal: document.getElementById('searchSoal'),
        filterHasilType: document.getElementById('filterHasilType'),
        filterHasilStatus: document.getElementById('filterHasilStatus'),
        searchHasil: document.getElementById('searchHasil'),
        chartFilter: document.getElementById('chartFilter'),
        // Charts
        scoreBars: document.getElementById('scoreBars'),
        chartTotalPeserta: document.getElementById('chartTotalPeserta'),
        // Hasil Stats
        statTotalUjian: document.getElementById('statTotalUjian'),
        statRataNilai: document.getElementById('statRataNilai'),
        statLulus: document.getElementById('statLulus'),
        statTidakLulus: document.getElementById('statTidakLulus'),
        statPretest: document.getElementById('statPretest'),
        statPosttest: document.getElementById('statPosttest'),
        // Modals
        modalConfirm: document.getElementById('modalConfirm'),
        modalTambahUser: document.getElementById('modalTambahUser'),
        modalTambahPeserta: document.getElementById('modalTambahPeserta'),
        modalTambahSoal: document.getElementById('modalTambahSoal'),
        modalUploadSoal: document.getElementById('modalUploadSoal'),
        modalKelolaPretest: document.getElementById('modalKelolaPretest'),
        modalKelolaPosttest: document.getElementById('modalKelolaPosttest'),
        modalEditSoal: document.getElementById('modalEditSoal'),
        // Upload
        uploadArea: document.getElementById('uploadArea'),
        fileInput: document.getElementById('fileInput'),
        uploadProgress: document.getElementById('uploadProgress'),
        progressFill: document.getElementById('progressFill'),
        progressText: document.getElementById('progressText'),
        soalPreview: document.getElementById('soalPreview'),
        previewList: document.getElementById('previewList'),
        previewCount: document.getElementById('previewCount'),
        // Kelola
        kelolaPretestBody: document.getElementById('kelolaPretestBody'),
        kelolaPretestPeserta: document.getElementById('kelolaPretestPeserta'),
        kelolaPretestSoal: document.getElementById('kelolaPretestSoal'),
        kelolaPosttestBody: document.getElementById('kelolaPosttestBody'),
        kelolaPosttestPeserta: document.getElementById('kelolaPosttestPeserta'),
        kelolaPosttestSoal: document.getElementById('kelolaPosttestSoal'),
        // Toggle Ujian
        pretestToggle: document.getElementById('pretestToggle'),
        posttestToggle: document.getElementById('posttestToggle'),
        pretestStatus: document.getElementById('pretestStatus'),
        posttestStatus: document.getElementById('posttestStatus'),
        pretestStatusInfo: document.getElementById('pretestStatusInfo'),
        posttestStatusInfo: document.getElementById('posttestStatusInfo')
    };

    // ============================================================
// STORAGE FUNCTIONS - DENGAN FIREBASE
// ============================================================

function saveData() {
    try {
        const data = {
            userData: userData,
            pesertaData: pesertaData,
            soalData: soalData,
            nextUserId: nextUserId,
            nextPesertaId: nextPesertaId,
            nextSoalId: nextSoalId,
            savedAt: new Date().toISOString()
        };
        
        // Simpan ke localStorage (cache lokal)
        localStorage.setItem('ujianOnlineData', JSON.stringify(data));
        updateStorageInfo();
        
        // ✅ SIMPAN KE FIREBASE (CLOUD)
        if (typeof saveDataToFirebase === 'function') {
            saveDataToFirebase(data).then(function(result) {
                if (result) {
                    showToast('success', '☁️ Data tersimpan di cloud!');
                }
            });
        }
        
        console.log('✅ Data berhasil disimpan ke localStorage & Firebase');
        return true;
    } catch (e) {
        console.error('❌ Gagal menyimpan data:', e);
        showToast('error', '❌ Gagal menyimpan data!');
        return false;
    }
}

async function loadData() {
    try {
        // 1. Coba dari Firebase dulu
        if (typeof loadDataFromFirebase === 'function') {
            const cloudData = await loadDataFromFirebase();
            if (cloudData) {
                localStorage.setItem('ujianOnlineData', JSON.stringify(cloudData));
                const data = cloudData;
                userData = data.userData || [];
                pesertaData = data.pesertaData || [];
                soalData = data.soalData || [];
                nextUserId = data.nextUserId || 1;
                nextPesertaId = data.nextPesertaId || 1;
                nextSoalId = data.nextSoalId || 1;
                updateStorageInfo();
                console.log('✅ Data berhasil dimuat dari Firebase');
                return true;
            }
        }
        
        // 2. Fallback ke localStorage
        const stored = localStorage.getItem('ujianOnlineData');
        if (stored) {
            const data = JSON.parse(stored);
            userData = data.userData || [];
            pesertaData = data.pesertaData || [];
            soalData = data.soalData || [];
            nextUserId = data.nextUserId || 1;
            nextPesertaId = data.nextPesertaId || 1;
            nextSoalId = data.nextSoalId || 1;
            updateStorageInfo();
            console.log('✅ Data berhasil dimuat dari localStorage');
            return true;
        }
        return false;
    } catch (e) {
        console.error('❌ Gagal memuat data:', e);
        return false;
    }
}

    function clearAllData() {
        localStorage.removeItem('ujianOnlineData');
        userData = [];
        pesertaData = [];
        soalData = [];
        nextUserId = 1;
        nextPesertaId = 1;
        nextSoalId = 1;
        updateStorageInfo();
        console.log('🗑️ Semua data dihapus dari localStorage');
    }

    function updateStorageInfo() {
        if (elements.storageInfo) {
            const total = userData.length + pesertaData.length + soalData.length;
            elements.storageInfo.textContent = total > 0 ? '💾 Data tersimpan di localStorage' : '💾 Belum ada data';
        }
        if (elements.dataCount) {
            elements.dataCount.textContent = `👤 ${userData.length} User | 👥 ${pesertaData.length} Peserta | 📝 ${soalData.length} Soal`;
        }
    }

    // ============================================================
    // TOAST NOTIFICATION
    // ============================================================

    function showToast(type, message) {
        const toast = document.getElementById('toast');
        if (!toast) return;
        toast.className = `toast ${type}`;
        toast.textContent = message;
        toast.classList.add('show');
        clearTimeout(toast._timeout);
        toast._timeout = setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }

    // ============================================================
    // DEFAULT ADMIN
    // ============================================================

    function createDefaultAdmin() {
        const hasAdmin = userData.some(u => u.username === 'admin');
        if (!hasAdmin) {
            userData.push({
                id: nextUserId++,
                username: 'admin',
                email: 'admin@admin.com',
                fullname: 'Administrator',
                password: 'admin123',
                role: 'admin',
                status: 'active',
                nip: '',
                nuptk: '',
                tempat_lahir: '',
                tanggal_lahir: '',
                nama_sekolah: '',
                mapel: ''
            });
            saveData();
            console.log('✅ Default Admin created: admin / admin123');
            showToast('success', '✅ Default Admin: admin / admin123');
        }
    }

    // ============================================================
    // GROUP PESERTA BERDASARKAN NAMA + NIP (UNIK)
    // ============================================================

    function groupPesertaByName(data) {
        const grouped = {};
        
        data.forEach(p => {
            const key = p.nama + '|' + p.nip;
            
            if (!grouped[key]) {
                grouped[key] = {
                    id: p.id,
                    nama: p.nama,
                    nip: p.nip,
                    kelas: p.kelas || '-',
                    ujianData: [],
                    skor: 0,
                    status: 'Pending'
                };
            }
            
            grouped[key].ujianData.push({
                jenis: p.ujian,
                skor: p.skor || 0,
                status: p.status || 'Pending'
            });
            
            const allSkor = grouped[key].ujianData.map(u => u.skor);
            const validSkor = allSkor.filter(s => s > 0);
            
            if (validSkor.length > 0) {
                grouped[key].skor = Math.round(validSkor.reduce((a, b) => a + b, 0) / validSkor.length);
            } else {
                grouped[key].skor = 0;
            }
            
            if (grouped[key].skor >= 70) {
                grouped[key].status = 'Lulus';
            } else if (grouped[key].skor > 0) {
                grouped[key].status = 'Tidak Lulus';
            } else {
                grouped[key].status = 'Pending';
            }
        });
        
        return Object.values(grouped);
    }

    // ============================================================
    // UJIAN STATUS FUNCTIONS (Aktif/Nonaktif)
    // ============================================================

    function loadUjianStatus() {
        try {
            const stored = localStorage.getItem('ujianStatus');
            if (stored) {
                ujianStatus = JSON.parse(stored);
            } else {
                ujianStatus = { pretest: false, posttest: false };
                localStorage.setItem('ujianStatus', JSON.stringify(ujianStatus));
            }
            updateUjianUI();
            console.log('📋 Status ujian dimuat:', ujianStatus);
        } catch (e) {
            console.error('❌ Gagal load status ujian:', e);
            ujianStatus = { pretest: false, posttest: false };
        }
    }

    function saveUjianStatus() {
        try {
            localStorage.setItem('ujianStatus', JSON.stringify(ujianStatus));
            console.log('✅ Status ujian disimpan:', ujianStatus);
        } catch (e) {
            console.error('❌ Gagal simpan status ujian:', e);
        }
    }

    function toggleUjian(type) {
        const toggle = document.getElementById(`${type}Toggle`);
        const label = type === 'pretest' ? 'Pretest' : 'Posttest';

        ujianStatus[type] = toggle.checked;
        saveUjianStatus();
        updateUjianUI();
        
        const statusText = ujianStatus[type] ? 'diaktifkan' : 'dinonaktifkan';
        const icon = ujianStatus[type] ? '✅' : '🔴';
        showToast('success', `${icon} Ujian ${label} berhasil ${statusText}!`);
        console.log(`📋 Ujian ${label} ${statusText} oleh Admin`);
    }

    function updateUjianUI() {
        const types = ['pretest', 'posttest'];
        const labels = { pretest: 'Pretest', posttest: 'Posttest' };

        types.forEach(type => {
            const toggle = document.getElementById(`${type}Toggle`);
            const statusLabel = document.getElementById(`${type}Status`);
            const statusInfo = document.getElementById(`${type}StatusInfo`);
            const isActive = ujianStatus[type];

            if (toggle) {
                toggle.checked = isActive;
            }

            if (statusLabel) {
                if (isActive) {
                    statusLabel.className = 'toggle-status active';
                    statusLabel.textContent = '🟢 Aktif';
                } else {
                    statusLabel.className = 'toggle-status inactive';
                    statusLabel.textContent = '🔴 Nonaktif';
                }
            }

            if (statusInfo) {
                if (isActive) {
                    statusInfo.className = 'exam-status-info active';
                    statusInfo.innerHTML = `
                        <span class="status-icon">🟢</span>
                        <span>Ujian ${labels[type]} sedang <strong>AKTIF</strong>. Peserta dapat mengikuti ujian.</span>
                    `;
                } else {
                    statusInfo.className = 'exam-status-info inactive';
                    statusInfo.innerHTML = `
                        <span class="status-icon">🔴</span>
                        <span>Ujian ${labels[type]} sedang <strong>NONAKTIF</strong>. Peserta tidak dapat mengikuti ujian.</span>
                    `;
                }
            }
        });
    }

    function getUjianStatus(type) {
        return ujianStatus[type] || false;
    }

    function isUjianAktif(type) {
        return ujianStatus[type] === true;
    }

    // ============================================================
    // HASIL UJIAN
    // ============================================================

    function getHasilUjianData() {
        try {
            const stored = localStorage.getItem('hasilUjianData');
            if (stored) {
                return JSON.parse(stored);
            }
            return [];
        } catch (e) {
            console.error('❌ Gagal mengambil hasil ujian:', e);
            return [];
        }
    }

    function generateSampleHasilUjian() {
        const sampleData = [{
            id: Date.now() + 1,
            type: 'pretest',
            label: 'Pretest',
            totalSoal: 30,
            benar: 25,
            salah: 5,
            nilai: 83,
            status: 'LULUS',
            waktuPengerjaan: 1200,
            sisaWaktu: 600,
            tanggal: new Date(Date.now() - 3600000).toISOString(),
            guru: 'Dr. Ahmad Fauzi, M.Pd.',
            nip: '198512342015012345',
            sekolah: 'SMA Negeri 1 Jakarta'
        }, {
            id: Date.now() + 2,
            type: 'posttest',
            label: 'Posttest',
            totalSoal: 30,
            benar: 20,
            salah: 10,
            nilai: 67,
            status: 'TIDAK LULUS',
            waktuPengerjaan: 1800,
            sisaWaktu: 1800,
            tanggal: new Date(Date.now() - 7200000).toISOString(),
            guru: 'Dra. Siti Rahmah, M.Si.',
            nip: '198703212018021234',
            sekolah: 'SMA Negeri 2 Jakarta'
        }, {
            id: Date.now() + 3,
            type: 'pretest',
            label: 'Pretest',
            totalSoal: 30,
            benar: 28,
            salah: 2,
            nilai: 93,
            status: 'LULUS',
            waktuPengerjaan: 900,
            sisaWaktu: 900,
            tanggal: new Date(Date.now() - 10800000).toISOString(),
            guru: 'Drs. Budi Santoso, M.Kom.',
            nip: '199001152019031256',
            sekolah: 'SMA Negeri 3 Jakarta'
        }];

        const existing = localStorage.getItem('hasilUjianData');
        if (!existing || JSON.parse(existing).length === 0) {
            localStorage.setItem('hasilUjianData', JSON.stringify(sampleData));
            showToast('success', `✅ ${sampleData.length} sample hasil ujian ditambahkan!`);
            return true;
        } else {
            const current = JSON.parse(existing);
            const newData = sampleData.map((item, index) => ({
                ...item,
                id: Date.now() + index + 10
            }));
            const merged = [...current, ...newData];
            localStorage.setItem('hasilUjianData', JSON.stringify(merged));
            showToast('success', `✅ ${newData.length} sample hasil ujian ditambahkan!`);
            return true;
        }
    }

    function hapusHasilUjian(id) {
        if (!confirm('⚠️ Apakah Anda yakin ingin menghapus hasil ujian ini?')) {
            return;
        }

        try {
            let data = getHasilUjianData();
            const item = data.find(h => h.id === id);
            const namaGuru = item ? item.guru : 'tidak diketahui';
            const newData = data.filter(h => h.id !== id);
            localStorage.setItem('hasilUjianData', JSON.stringify(newData));
            renderHasilUjian();
            showToast('success', `🗑️ Hasil ujian ${namaGuru} berhasil dihapus!`);
            console.log(`🗑️ Hasil ujian ID ${id} (${namaGuru}) telah dihapus`);
        } catch (e) {
            console.error('❌ Gagal menghapus hasil ujian:', e);
            showToast('error', '❌ Gagal menghapus hasil ujian!');
        }
    }

    function hapusSemuaHasil() {
        const data = getHasilUjianData();
        if (data.length === 0) {
            showToast('warning', '⚠️ Tidak ada hasil ujian untuk dihapus!');
            return;
        }
        if (confirm(`⚠️ Apakah Anda yakin ingin menghapus SEMUA ${data.length} hasil ujian? Tindakan ini tidak dapat dibatalkan!`)) {
            try {
                localStorage.removeItem('hasilUjianData');
                renderHasilUjian();
                showToast('success', `🗑️ Semua hasil ujian (${data.length}) berhasil dihapus!`);
            } catch (e) {
                showToast('error', '❌ Gagal menghapus hasil ujian!');
            }
        }
    }

    // ============================================================
    // RENDER FUNCTIONS - LENGKAP
    // ============================================================

    function renderStats() {
        const totalUsers = userData.length;
        const totalAdmin = userData.filter(u => u.role === 'admin').length;
        const totalGuru = userData.filter(u => u.role === 'guru').length;

        const uniquePeserta = groupPesertaByName(pesertaData);
        const totalPeserta = uniquePeserta.length;
        const pesertaSudahUjian = uniquePeserta.filter(p => p.skor > 0);
        const aktif = pesertaSudahUjian.length;
        const selesai = pesertaSudahUjian.filter(p => p.status === 'Lulus' || p.status === 'Tidak Lulus').length;

        const totalSoal = soalData.length;
        const soalPretest = soalData.filter(s => s.jenis === 'pretest');
        const soalPosttest = soalData.filter(s => s.jenis === 'posttest');

        const semuaSkor = uniquePeserta.filter(p => p.skor > 0).map(p => p.skor);
        const rataRata = semuaSkor.length > 0 ? Math.round(semuaSkor.reduce((a, b) => a + b, 0) / semuaSkor.length) : 0;
        
        const pretestData = pesertaData.filter(p => p.ujian === 'pretest' && p.skor > 0);
        const posttestData = pesertaData.filter(p => p.ujian === 'posttest' && p.skor > 0);
        const rataPretest = pretestData.length > 0 ? Math.round(pretestData.reduce((a, b) => a + b.skor, 0) / pretestData.length) : 0;
        const rataPosttest = posttestData.length > 0 ? Math.round(posttestData.reduce((a, b) => a + b.skor, 0) / posttestData.length) : 0;

        const nilaiTertinggi = semuaSkor.length > 0 ? Math.max(...semuaSkor) : 0;
        const pesertaTerbaik = uniquePeserta.find(p => p.skor === nilaiTertinggi && p.skor > 0);

        const pretest = pesertaData.filter(p => p.ujian === 'pretest');

        if (elements.totalUsers) elements.totalUsers.textContent = totalUsers;
        if (elements.totalAdmin) elements.totalAdmin.textContent = totalAdmin;
        if (elements.totalGuru) elements.totalGuru.textContent = totalGuru;

        if (elements.totalPeserta) elements.totalPeserta.textContent = totalPeserta;
        if (elements.pesertaAktif) elements.pesertaAktif.textContent = aktif;
        if (elements.pesertaSelesai) elements.pesertaSelesai.textContent = selesai;

        if (elements.totalSoal) elements.totalSoal.textContent = totalSoal;
        if (elements.soalPretest) elements.soalPretest.textContent = soalPretest.length;
        if (elements.soalPosttest) elements.soalPosttest.textContent = soalPosttest.length;

        if (elements.rataRata) elements.rataRata.textContent = rataRata;
        if (elements.rataPretest) elements.rataPretest.textContent = rataPretest;
        if (elements.rataPosttest) elements.rataPosttest.textContent = rataPosttest;

        if (elements.nilaiTertinggi) elements.nilaiTertinggi.textContent = nilaiTertinggi;
        if (elements.pesertaTerbaik) {
            elements.pesertaTerbaik.textContent = pesertaTerbaik ? pesertaTerbaik.nama : '-';
        }

        if (elements.pretestCount) elements.pretestCount.textContent = pretest.length;
        if (elements.totalPretest) elements.totalPretest.textContent = pretest.length;

        if (elements.pretestPeserta) elements.pretestPeserta.textContent = pretest.length;
        if (elements.pretestSoal) elements.pretestSoal.textContent = soalPretest.length;
        if (elements.pretestRata) elements.pretestRata.textContent = rataPretest;

        const posttest = pesertaData.filter(p => p.ujian === 'posttest');
        if (elements.posttestPeserta) elements.posttestPeserta.textContent = posttest.length;
        if (elements.posttestSoal) elements.posttestSoal.textContent = soalPosttest.length;
        if (elements.posttestRata) elements.posttestRata.textContent = rataPosttest;

        updateStorageInfo();
    }

    function renderUserTable() {
        const filter = elements.filterUserRole ? elements.filterUserRole.value : 'all';
        const search = elements.searchUser ? elements.searchUser.value : '';
        const tbody = elements.userTableBody;
        const totalSpan = elements.userTotalCount;
        let data = [...userData];

        if (filter !== 'all') {
            data = data.filter(u => u.role === filter);
        }

        if (search) {
            const s = search.toLowerCase();
            data = data.filter(u =>
                u.username.toLowerCase().includes(s) ||
                u.fullname.toLowerCase().includes(s) ||
                u.email.toLowerCase().includes(s)
            );
        }

        if (totalSpan) {
            totalSpan.textContent = data.length;
        }

        if (!tbody) return;

        if (data.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6">
                        <div class="empty-state">
                            <div class="empty-icon">👤</div>
                            <div class="empty-title">Belum ada user</div>
                            <div class="empty-desc">Klik tombol "Tambah User" untuk menambahkan user baru</div>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = data.map((u, i) => {
            const avatarClass = u.role === 'admin' ? 'admin-avatar' : 'guru-avatar';
            const roleLabel = u.role === 'admin' ? '👑 Admin' : '👨‍🏫 Guru';
            const statusLabel = u.status === 'active' ? '✅ Aktif' : '⏸ Nonaktif';
            const statusClass = u.status === 'active' ? 'active' : 'inactive';

            let ttlDisplay = '-';
            if (u.role === 'guru') {
                let ttlParts = [];
                if (u.tempat_lahir) ttlParts.push(u.tempat_lahir);
                if (u.tanggal_lahir && u.tanggal_lahir !== '') {
                    try {
                        const date = new Date(u.tanggal_lahir);
                        if (!isNaN(date.getTime())) {
                            ttlParts.push(date.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }));
                        } else {
                            ttlParts.push(u.tanggal_lahir);
                        }
                    } catch (e) {
                        ttlParts.push(u.tanggal_lahir);
                    }
                }
                if (ttlParts.length > 0) {
                    ttlDisplay = ttlParts.join(', ');
                }
            }

            let guruDataHtml = '-';
            if (u.role === 'guru') {
                const guruItems = [];
                if (u.nip) guruItems.push(`<span class="guru-row"><span class="guru-label">NIP</span><span class="guru-value">${u.nip}</span></span>`);
                if (u.nuptk) guruItems.push(`<span class="guru-row"><span class="guru-label">NUPTK</span><span class="guru-value">${u.nuptk}</span></span>`);
                if (ttlDisplay !== '-') guruItems.push(`<span class="guru-row"><span class="guru-label">TTL</span><span class="guru-value">${ttlDisplay}</span></span>`);
                if (u.nama_sekolah) guruItems.push(`<span class="guru-row"><span class="guru-label">Sekolah</span><span class="guru-value">${u.nama_sekolah}</span></span>`);
                if (u.mapel) guruItems.push(`<span class="guru-row"><span class="guru-label">Mapel</span><span class="guru-value">${u.mapel}</span></span>`);
                if (guruItems.length > 0) {
                    guruDataHtml = `<div class="guru-compact">${guruItems.join('')}</div>`;
                }
            }

            return `
                <tr>
                    <td style="text-align:center;font-weight:500;color:#6b7a8a;">${i + 1}</td>
                    <td>
                        <div class="user-info-cell">
                            <div class="user-avatar-small ${avatarClass}">${u.fullname.charAt(0).toUpperCase()}</div>
                            <div>
                                <div class="user-name-cell">${u.username}</div>
                                <div style="font-size:0.8em;color:#6b7a8a;">${u.fullname}</div>
                                <div style="font-size:0.7em;color:#8a9aa8;">${u.email}</div>
                            </div>
                        </div>
                    </td>
                    <td>${guruDataHtml}</td>
                    <td><span class="user-role-badge ${u.role}">${roleLabel}</span></td>
                    <td><span class="user-status-badge ${statusClass}">${statusLabel}</span></td>
                    <td>
                        <div class="action-btns">
                            <button class="btn-icon edit" onclick="editUser(${u.id})" title="Edit User">✏️</button>
                            <button class="btn-icon view" onclick="viewUser(${u.id})" title="Detail User">👁️</button>
                            <button class="btn-icon delete" onclick="deleteUser(${u.id})" title="Hapus User">🗑️</button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    }

    function renderTable() {
        const filter = elements.filterExam ? elements.filterExam.value : 'all';
        const search = elements.searchPeserta ? elements.searchPeserta.value : '';
        const tbody = elements.pesertaTableBody;
        const totalSpan = elements.pesertaTotalCount;

        const groupedData = groupPesertaByName(pesertaData);
        let filteredData = [...groupedData];

        if (filter !== 'all') {
            filteredData = filteredData.filter(p => p.ujianData.some(u => u.jenis === filter));
        }

        if (search) {
            const s = search.toLowerCase();
            filteredData = filteredData.filter(p => p.nama.toLowerCase().includes(s) || p.nip.includes(s));
        }

        if (totalSpan) {
            totalSpan.textContent = filteredData.length;
        }

        if (!tbody) return;

        if (filteredData.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7">
                        <div class="empty-state">
                            <div class="empty-icon">👥</div>
                            <div class="empty-title">Belum ada peserta</div>
                            <div class="empty-desc">Klik tombol "Tambah Peserta" untuk menambahkan peserta baru</div>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = filteredData.map((p, i) => {
            const pretestData = p.ujianData.find(u => u.jenis === 'pretest');
            const posttestData = p.ujianData.find(u => u.jenis === 'posttest');
            const pretestSkor = pretestData ? pretestData.skor : 0;
            const posttestSkor = posttestData ? posttestData.skor : 0;

            let statusText = '⏳ Belum Ujian';
            let statusClass = 'pending';
            let rataRata = 0;

            if (pretestSkor > 0 || posttestSkor > 0) {
                const totalSkor = pretestSkor + posttestSkor;
                const count = (pretestSkor > 0 ? 1 : 0) + (posttestSkor > 0 ? 1 : 0);
                rataRata = count > 0 ? Math.round(totalSkor / count) : 0;
                if (rataRata >= 70) {
                    statusText = '✅ Lulus';
                    statusClass = 'lulus';
                } else {
                    statusText = '❌ Tidak Lulus';
                    statusClass = 'tidak-lulus';
                }
            }

            let ujianBadge = '';
            if (pretestSkor > 0) ujianBadge += `<span class="exam-badge pretest" style="margin-right:4px;">📋 Pretest ${pretestSkor}</span>`;
            if (posttestSkor > 0) ujianBadge += `<span class="exam-badge posttest">📝 Posttest ${posttestSkor}</span>`;
            if (!pretestSkor && !posttestSkor) ujianBadge = '<span style="color:#8a9aa8;font-size:0.8em;">Belum ada ujian</span>';

            return `
                <tr>
                    <td style="text-align:center;font-weight:500;color:#6b7a8a;">${i + 1}</td>
                    <td>
                        <div>
                            <div style="font-weight:600;color:#1a2a3a;">${p.nama}</div>
                            <div style="font-size:0.75em;color:#8a9aa8;">${p.kelas || '-'}</div>
                        </div>
                    </td>
                    <td>${p.nip}</td>
                    <td>${ujianBadge}</td>
                    <td style="font-weight:700;color:${rataRata >= 70 ? '#059669' : rataRata > 0 ? '#dc2626' : '#8a9aa8'};">
                        ${rataRata > 0 ? rataRata : '-'}
                    </td>
                    <td><span class="status-badge ${statusClass}">${statusText}</span></td>
                    <td>
                        <div class="action-btns">
                            <button class="btn-icon edit" onclick="editPesertaGroup(${p.id})" title="Edit Skor">✏️</button>
                            <button class="btn-icon view" onclick="viewPesertaGroup(${p.id})" title="Detail Peserta">👁️</button>
                            <button class="btn-icon delete" onclick="deletePesertaGroup(${p.id})" title="Hapus Peserta">🗑️</button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    }

    function renderSoalTable() {
        const filter = elements.filterSoalJenis ? elements.filterSoalJenis.value : 'all';
        const search = elements.searchSoal ? elements.searchSoal.value : '';
        const tbody = elements.soalTableBody;
        const totalSpan = elements.soalTotalCount;
        let data = [...soalData];

        if (filter !== 'all') {
            data = data.filter(s => s.jenis === filter);
        }

        if (search) {
            const s = search.toLowerCase();
            data = data.filter(q => q.pertanyaan && q.pertanyaan.toLowerCase().includes(s));
        }

        if (totalSpan) {
            totalSpan.textContent = data.length;
        }

        if (!tbody) return;

        if (data.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7">
                        <div class="empty-state">
                            <div class="empty-icon">📝</div>
                            <div class="empty-title">Belum ada soal</div>
                            <div class="empty-desc">Klik tombol "Tambah Soal" atau "Upload Word" untuk menambahkan soal</div>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = data.map((q, i) => {
            let pilihanHtml = '';
            if (q.a) pilihanHtml += `A. ${q.a}`;
            if (q.b) pilihanHtml += ` | B. ${q.b}`;
            if (q.c && q.c !== '-') pilihanHtml += ` | C. ${q.c}`;
            if (q.d && q.d !== '-') pilihanHtml += ` | D. ${q.d}`;
            if (!pilihanHtml) pilihanHtml = '-';

            const jenisLabel = q.jenis === 'pretest' ? '📋 Pretest' : '📝 Posttest';
            const jenisClass = q.jenis === 'pretest' ? 'pretest' : 'posttest';
            const pertanyaan = q.pertanyaan && q.pertanyaan.trim() !== '' ?
                q.pertanyaan :
                '<span style="color:#dc2626;font-style:italic;">⚠️ Soal tidak memiliki pertanyaan</span>';

            return `
                <tr>
                    <td style="text-align:center;font-weight:500;color:#6b7a8a;">${i + 1}</td>
                    <td style="max-width:300px;word-wrap:break-word;">
                        <div style="font-weight:500;color:#1a2a3a;line-height:1.5;">${pertanyaan}</div>
                        <div style="font-size:0.7em;color:#8a9aa8;margin-top:2px;">ID: SOAL-${String(q.id).padStart(3, '0')}</div>
                    </td>
                    <td style="font-size:0.8em;color:#6b7a8a;max-width:300px;word-wrap:break-word;">${pilihanHtml}</td>
                    <td style="text-align:center;"><strong style="color:#059669;font-size:1.1em;">${q.jawaban || '-'}</strong></td>
                    <td><span class="exam-badge ${jenisClass}">${jenisLabel}</span></td>
                    <td style="text-align:center;">${q.bobot || 1}</td>
                    <td>
                        <div class="action-btns">
                            <button class="btn-icon edit" onclick="editExistingSoal(${q.id})" title="Edit Soal">✏️</button>
                            <button class="btn-icon delete" onclick="deleteSoal(${q.id})" title="Hapus Soal">🗑️</button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    }

    function renderChart() {
        const filter = elements.chartFilter ? elements.chartFilter.value : 'all';
        const container = elements.scoreBars;
        const totalSpan = elements.chartTotalPeserta;

        let data = [...pesertaData];
        if (filter !== 'all') {
            data = data.filter(p => p.ujian === filter);
        }

        const grouped = groupPesertaByName(data);
        
        if (totalSpan) {
            totalSpan.textContent = grouped.length;
        }

        if (!container) return;

        if (grouped.length === 0) {
            container.innerHTML = `
                <div class="empty-chart">
                    <div class="empty-icon">📊</div>
                    <div class="empty-title">Belum ada data peserta</div>
                    <div class="empty-desc">Tambahkan peserta untuk melihat grafik distribusi nilai</div>
                </div>
            `;
            return;
        }

        const sortedData = [...grouped].sort((a, b) => b.skor - a.skor);
        const displayData = sortedData.slice(0, 10);
        const maxScore = Math.max(...displayData.map(p => p.skor), 1);

        const colors = ['#7c3aed', '#3b82f6', '#059669', '#d97706', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#f59e0b', '#14b8a6'];

        container.innerHTML = displayData.map((p, i) => {
            const percentage = Math.max((p.skor / maxScore) * 100, 5);
            const color = colors[i % colors.length];

            let statusText, statusColor, statusBg;
            if (p.skor > 0) {
                if (p.skor >= 70) {
                    statusText = '✅ Lulus';
                    statusColor = '#059669';
                    statusBg = '#d1fae5';
                } else {
                    statusText = '❌ Tidak Lulus';
                    statusColor = '#dc2626';
                    statusBg = '#fee2e2';
                }
            } else {
                statusText = '⏳ Belum Ujian';
                statusColor = '#d97706';
                statusBg = '#fef3c7';
            }

            return `
                <div class="score-bar-item" style="animation-delay:${i * 0.1}s;">
                    <div style="display:flex;align-items:center;gap:10px;min-width:120px;">
                        <div style="width:32px;height:32px;border-radius:50%;background:${color};display:flex;align-items:center;justify-content:center;color:white;font-weight:700;font-size:0.7em;flex-shrink:0;">
                            ${p.nama.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <div style="font-weight:600;color:#1a2a3a;font-size:0.85em;">${p.nama}</div>
                            <div style="font-size:0.65em;color:#8a9aa8;">${p.nip || '-'}</div>
                        </div>
                    </div>
                    <div style="flex:1;display:flex;align-items:center;gap:12px;">
                        <div class="score-track">
                            <div class="score-fill" style="width:${percentage}%;height:100%;background:${color};border-radius:10px;"></div>
                        </div>
                        <div style="min-width:80px;text-align:right;">
                            <span style="font-weight:700;color:#1a2a3a;font-size:0.9em;">${p.skor}</span>
                            <span style="display:inline-block;font-size:0.6em;padding:2px 10px;border-radius:12px;background:${statusBg};color:${statusColor};font-weight:600;margin-left:6px;">${statusText}</span>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    function renderHasilUjian() {
        const filterType = elements.filterHasilType ? elements.filterHasilType.value : 'all';
        const filterStatus = elements.filterHasilStatus ? elements.filterHasilStatus.value : 'all';
        const search = elements.searchHasil ? elements.searchHasil.value : '';
        const tbody = elements.hasilTableBody;
        const totalSpan = elements.hasilTotalCount;
        let data = getHasilUjianData();

        if (filterType !== 'all') {
            data = data.filter(h => h.type === filterType);
        }

        if (filterStatus !== 'all') {
            data = data.filter(h => h.status === filterStatus);
        }

        if (search) {
            const s = search.toLowerCase();
            data = data.filter(h =>
                h.guru.toLowerCase().includes(s) ||
                (h.nip && h.nip.includes(s)) ||
                h.sekolah.toLowerCase().includes(s)
            );
        }

        data.sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal));

        if (totalSpan) {
            totalSpan.textContent = data.length;
        }

        updateHasilStats(data);

        if (!tbody) return;

        if (data.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="10">
                        <div class="empty-state">
                            <div class="empty-icon">📊</div>
                            <div class="empty-title">Belum ada hasil ujian</div>
                            <div class="empty-desc">Klik tombol "Sample Data" untuk menambahkan data contoh</div>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = data.map((h, i) => {
            const statusLabel = h.status === 'LULUS' ? '✅ Lulus' : '❌ Tidak Lulus';
            const statusClass = h.status === 'LULUS' ? 'lulus' : 'tidak-lulus';
            const typeLabel = h.type === 'pretest' ? '📋 Pretest' : '📝 Posttest';
            const typeClass = h.type === 'pretest' ? 'pretest' : 'posttest';

            return `
                <tr>
                    <td style="text-align:center;font-weight:500;color:#6b7a8a;">${i + 1}</td>
                    <td><strong>${h.guru || '-'}</strong></td>
                    <td>${h.nip || '-'}</td>
                    <td>${h.sekolah || '-'}</td>
                    <td><span class="exam-badge ${typeClass}">${typeLabel}</span></td>
                    <td style="text-align:center;font-weight:600;color:#1a2a3a;">${h.totalSoal || 0}</td>
                    <td style="text-align:center;font-weight:600;color:#059669;">${h.benar || 0}</td>
                    <td style="font-weight:700;color:${h.nilai >= 70 ? '#059669' : '#dc2626'};text-align:center;">${h.nilai || 0}</td>
                    <td><span class="status-badge ${statusClass}">${statusLabel}</span></td>
                    <td>
                        <div class="action-btns">
                            <button class="btn-icon delete" onclick="hapusHasilUjian(${h.id})" title="Hapus Hasil Ujian">🗑️</button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    }

    function updateHasilStats(data) {
        const total = data.length;
        const lulus = data.filter(h => h.status === 'LULUS').length;
        const tidakLulus = data.filter(h => h.status === 'TIDAK LULUS').length;
        const pretest = data.filter(h => h.type === 'pretest').length;
        const posttest = data.filter(h => h.type === 'posttest').length;
        const rataNilai = total > 0 ? Math.round(data.reduce((a, b) => a + (b.nilai || 0), 0) / total) : 0;

        if (elements.statTotalUjian) elements.statTotalUjian.textContent = total;
        if (elements.statRataNilai) elements.statRataNilai.textContent = rataNilai;
        if (elements.statLulus) elements.statLulus.textContent = lulus;
        if (elements.statTidakLulus) elements.statTidakLulus.textContent = tidakLulus;
        if (elements.statPretest) elements.statPretest.textContent = pretest;
        if (elements.statPosttest) elements.statPosttest.textContent = posttest;
    }

    function renderKelolaPretest() {
        const data = pesertaData.filter(p => p.ujian === 'pretest');
        const tbody = elements.kelolaPretestBody;
        
        if (elements.kelolaPretestPeserta) elements.kelolaPretestPeserta.textContent = data.length;
        if (elements.kelolaPretestSoal) elements.kelolaPretestSoal.textContent = soalData.filter(s => s.jenis === 'pretest').length;

        if (!tbody) return;

        if (data.length === 0) {
            tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;padding:20px;color:#8a9aa8;">Belum ada peserta pretest</td></tr>`;
            return;
        }

        tbody.innerHTML = data.map(p => `
            <tr>
                <td><strong>${p.nama}</strong></td>
                <td style="font-weight:700;color:${p.skor > 0 ? (p.skor >= 70 ? '#059669' : '#dc2626') : '#8a9aa8'};font-size:1.1em;">
                    ${p.skor || '-'}
                </td>
                <td><span class="status-badge ${p.status === 'Lulus' ? 'lulus' : p.status === 'Tidak Lulus' ? 'tidak-lulus' : 'pending'}">${p.status}</span></td>
                <td>
                    <div class="action-btns">
                        <button class="btn-icon edit" onclick="editPeserta(${p.id})" title="Edit Skor">✏️</button>
                        <button class="btn-icon view" onclick="viewPeserta(${p.id})" title="Detail">👁️</button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    function renderKelolaPosttest() {
        const data = pesertaData.filter(p => p.ujian === 'posttest');
        const tbody = elements.kelolaPosttestBody;
        
        if (elements.kelolaPosttestPeserta) elements.kelolaPosttestPeserta.textContent = data.length;
        if (elements.kelolaPosttestSoal) elements.kelolaPosttestSoal.textContent = soalData.filter(s => s.jenis === 'posttest').length;

        if (!tbody) return;

        if (data.length === 0) {
            tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;padding:20px;color:#8a9aa8;">Belum ada peserta posttest</td></tr>`;
            return;
        }

        tbody.innerHTML = data.map(p => `
            <tr>
                <td><strong>${p.nama}</strong></td>
                <td style="font-weight:700;color:${p.skor > 0 ? (p.skor >= 70 ? '#059669' : '#dc2626') : '#8a9aa8'};font-size:1.1em;">
                    ${p.skor || '-'}
                </td>
                <td><span class="status-badge ${p.status === 'Lulus' ? 'lulus' : p.status === 'Tidak Lulus' ? 'tidak-lulus' : 'pending'}">${p.status}</span></td>
                <td>
                    <div class="action-btns">
                        <button class="btn-icon edit" onclick="editPeserta(${p.id})" title="Edit Skor">✏️</button>
                        <button class="btn-icon view" onclick="viewPeserta(${p.id})" title="Detail">👁️</button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    // ============================================================
    // CRUD - USER
    // ============================================================

    function tambahUser(event) {
        event.preventDefault();

        const username = document.getElementById('userUsername').value.trim();
        const email = document.getElementById('userEmail').value.trim();
        const fullname = document.getElementById('userFullname').value.trim();
        const password = document.getElementById('userPassword').value.trim();
        const role = document.getElementById('userRole').value;
        const status = document.getElementById('userStatus').value;

        const nip = document.getElementById('userNip').value.trim();
        const nuptk = document.getElementById('userNuptk').value.trim();
        const tempat_lahir = document.getElementById('userTempatLahir').value.trim();
        const tanggal_lahir = document.getElementById('userTanggalLahir').value;
        const nama_sekolah = document.getElementById('userSekolah').value.trim();
        const mapel = document.getElementById('userMapel').value.trim();

        if (!username || !email || !fullname || !password) {
            showToast('error', '⚠️ Semua field wajib harus diisi!');
            return;
        }

        if (password.length < 6) {
            showToast('error', '⚠️ Password minimal 6 karakter!');
            return;
        }

        if (userData.some(u => u.username === username)) {
            showToast('error', '⚠️ Username sudah digunakan!');
            return;
        }

        if (userData.some(u => u.email === email)) {
            showToast('error', '⚠️ Email sudah digunakan!');
            return;
        }

        const newUser = {
            id: nextUserId++,
            username: username,
            email: email,
            fullname: fullname,
            password: password,
            role: role,
            status: status,
            nip: role === 'guru' ? nip : '',
            nuptk: role === 'guru' ? nuptk : '',
            tempat_lahir: role === 'guru' ? tempat_lahir : '',
            tanggal_lahir: role === 'guru' ? tanggal_lahir : '',
            nama_sekolah: role === 'guru' ? nama_sekolah : '',
            mapel: role === 'guru' ? mapel : ''
        };

        userData.push(newUser);
        saveData();
        closeModal('modalTambahUser');
        refreshData();
        showToast('success', `✅ User ${role} berhasil ditambahkan!`);
        
        // Reset form
        document.getElementById('userUsername').value = '';
        document.getElementById('userEmail').value = '';
        document.getElementById('userFullname').value = '';
        document.getElementById('userPassword').value = '';
        document.getElementById('userNip').value = '';
        document.getElementById('userNuptk').value = '';
        document.getElementById('userTempatLahir').value = '';
        document.getElementById('userTanggalLahir').value = '';
        document.getElementById('userSekolah').value = '';
        document.getElementById('userMapel').value = '';
    }

    function editUser(id) {
        const u = userData.find(u => u.id === id);
        if (!u) return;

        const newPassword = prompt(`Edit password untuk ${u.username} (kosongkan jika tidak diubah):`, '');
        if (newPassword !== null && newPassword.length > 0 && newPassword.length < 6) {
            showToast('error', '⚠️ Password minimal 6 karakter!');
            return;
        }
        if (newPassword !== null && newPassword.length > 0) {
            u.password = newPassword;
        }

        const newStatus = confirm(`Ubah status ${u.username}? (OK = Aktif, Cancel = Nonaktif)`);
        if (newStatus !== null) {
            u.status = newStatus ? 'active' : 'inactive';
        }

        if (u.role === 'guru') {
            const newNip = prompt(`Edit NIP untuk ${u.username}:`, u.nip || '');
            if (newNip !== null) u.nip = newNip;
            const newNuptk = prompt(`Edit NUPTK untuk ${u.username}:`, u.nuptk || '');
            if (newNuptk !== null) u.nuptk = newNuptk;
            const newTempat = prompt(`Edit Tempat Lahir untuk ${u.username}:`, u.tempat_lahir || '');
            if (newTempat !== null) u.tempat_lahir = newTempat;
            const newTanggal = prompt(`Edit Tanggal Lahir untuk ${u.username} (YYYY-MM-DD):`, u.tanggal_lahir || '');
            if (newTanggal !== null) u.tanggal_lahir = newTanggal;
            const newSekolah = prompt(`Edit Nama Sekolah untuk ${u.username}:`, u.nama_sekolah || '');
            if (newSekolah !== null) u.nama_sekolah = newSekolah;
            const newMapel = prompt(`Edit Mata Pelajaran untuk ${u.username}:`, u.mapel || '');
            if (newMapel !== null) u.mapel = newMapel;
        }

        saveData();
        refreshData();
        showToast('success', '✅ User berhasil diperbarui!');
    }

    function viewUser(id) {
        const u = userData.find(u => u.id === id);
        if (!u) return;

        let details = `📋 Detail User\n\n`;
        details += `Username: ${u.username}\n`;
        details += `Email: ${u.email}\n`;
        details += `Nama: ${u.fullname}\n`;
        details += `Role: ${u.role.toUpperCase()}\n`;
        details += `Status: ${u.status === 'active' ? 'Aktif' : 'Nonaktif'}\n`;

        if (u.role === 'guru') {
            details += `\n📋 Data Guru:\n`;
            details += `NIP: ${u.nip || '-'}\n`;
            details += `NUPTK: ${u.nuptk || '-'}\n`;
            details += `Tempat Lahir: ${u.tempat_lahir || '-'}\n`;
            details += `Tanggal Lahir: ${u.tanggal_lahir || '-'}\n`;
            details += `Sekolah: ${u.nama_sekolah || '-'}\n`;
            details += `Mapel: ${u.mapel || '-'}`;
        }

        alert(details);
    }

    function deleteUser(id) {
        const u = userData.find(u => u.id === id);
        if (!u) return;

        const adminCount = userData.filter(u => u.role === 'admin').length;
        if (u.role === 'admin' && adminCount <= 1) {
            showToast('error', '⚠️ Tidak bisa menghapus admin terakhir!');
            return;
        }

        if (confirm(`Apakah Anda yakin ingin menghapus user "${u.username}"?`)) {
            userData = userData.filter(u => u.id !== id);
            saveData();
            refreshData();
            showToast('success', '🗑️ User berhasil dihapus!');
        }
    }

    // ============================================================
    // CRUD - PESERTA
    // ============================================================

    function tambahPeserta(event) {
        event.preventDefault();

        const nama = document.getElementById('namaPeserta').value.trim();
        const nip = document.getElementById('nipPeserta').value.trim();
        const ujian = document.getElementById('jenisUjianPeserta').value;
        const kelas = document.getElementById('kelasPeserta').value.trim();

        if (!nama || !nip) {
            showToast('error', '⚠️ Nama dan NIP/NIS harus diisi!');
            return;
        }

        const existing = pesertaData.filter(p => p.nama === nama && p.nip === nip);
        const ujianList = ujian === 'both' ? ['pretest', 'posttest'] : [ujian];
        const existingUjian = existing.map(p => p.ujian);
        const newUjian = ujianList.filter(u => !existingUjian.includes(u));

        if (newUjian.length === 0) {
            showToast('warning', `⚠️ Peserta "${nama}" sudah terdaftar untuk semua ujian!`);
            return;
        }

        newUjian.forEach(jenis => {
            pesertaData.push({
                id: nextPesertaId++,
                nama: nama,
                nip: nip,
                ujian: jenis,
                skor: 0,
                status: 'Pending',
                kelas: kelas || '-'
            });
        });

        saveData();
        closeModal('modalTambahPeserta');
        refreshData();
        showToast('success', `✅ Peserta "${nama}" berhasil ditambahkan! (${newUjian.length} ujian)`);
        
        document.getElementById('namaPeserta').value = '';
        document.getElementById('nipPeserta').value = '';
        document.getElementById('kelasPeserta').value = '';
    }

    function editPesertaGroup(id) {
        const pesertaItems = pesertaData.filter(p => p.id === id);
        if (pesertaItems.length === 0) {
            showToast('error', '⚠️ Peserta tidak ditemukan!');
            return;
        }

        const p = pesertaItems[0];
        const pretestData = pesertaItems.find(item => item.ujian === 'pretest');
        const posttestData = pesertaItems.find(item => item.ujian === 'posttest');

        let message = `✏️ Edit Skor untuk ${p.nama}\n\nNIP: ${p.nip}\nKelas: ${p.kelas || '-'}\n\n`;
        if (pretestData) message += `Pretest: ${pretestData.skor || 0}\n`;
        if (posttestData) message += `Posttest: ${posttestData.skor || 0}\n`;
        message += `\nMasukkan nilai baru (kosongkan untuk skip):`;

        const newSkor = prompt(message, '');
        if (newSkor === null) return;

        const skorValue = parseInt(newSkor);
        if (isNaN(skorValue) || skorValue < 0 || skorValue > 100) {
            showToast('error', '⚠️ Nilai harus antara 0-100!');
            return;
        }

        pesertaItems.forEach(item => {
            item.skor = skorValue;
            item.status = skorValue >= 70 ? 'Lulus' : 'Tidak Lulus';
        });

        saveData();
        refreshData();
        showToast('success', '✅ Skor peserta berhasil diperbarui!');
    }

    function viewPesertaGroup(id) {
        const pesertaItems = pesertaData.filter(p => p.id === id);
        if (pesertaItems.length === 0) {
            showToast('error', '⚠️ Peserta tidak ditemukan!');
            return;
        }

        const p = pesertaItems[0];
        const pretestData = pesertaItems.find(item => item.ujian === 'pretest');
        const posttestData = pesertaItems.find(item => item.ujian === 'posttest');

        let details = `📋 Detail Peserta\n\nNama: ${p.nama}\nNIP: ${p.nip}\nKelas: ${p.kelas || '-'}\n\n📊 Hasil Ujian:\n`;
        details += `  Pretest: ${pretestData ? (pretestData.skor || '-') : '-'}\n`;
        details += `  Posttest: ${posttestData ? (posttestData.skor || '-') : '-'}\n\n`;

        const allSkor = [pretestData?.skor || 0, posttestData?.skor || 0].filter(s => s > 0);
        const rataRata = allSkor.length > 0 ? Math.round(allSkor.reduce((a, b) => a + b, 0) / allSkor.length) : 0;
        const status = rataRata >= 70 ? 'LULUS' : rataRata > 0 ? 'TIDAK LULUS' : 'BELUM UJIAN';

        details += `Rata-rata: ${rataRata > 0 ? rataRata : '-'}\nStatus: ${status}`;
        alert(details);
    }

    function deletePesertaGroup(id) {
        const pesertaItems = pesertaData.filter(p => p.id === id);
        if (pesertaItems.length === 0) {
            showToast('error', '⚠️ Peserta tidak ditemukan!');
            return;
        }

        const nama = pesertaItems[0].nama;
        if (confirm(`Apakah Anda yakin ingin menghapus peserta "${nama}" beserta semua data ujiannya?`)) {
            pesertaData = pesertaData.filter(p => p.id !== id);
            saveData();
            refreshData();
            showToast('success', `🗑️ Peserta "${nama}" berhasil dihapus!`);
        }
    }

    function editPeserta(id) {
        const p = pesertaData.find(p => p.id === id);
        if (p) {
            const newSkor = prompt(`Edit skor untuk ${p.nama} (${p.ujian}):`, p.skor);
            if (newSkor !== null) {
                p.skor = parseInt(newSkor) || 0;
                p.status = p.skor >= 70 ? 'Lulus' : 'Tidak Lulus';
                saveData();
                refreshData();
                showToast('success', '✅ Skor peserta berhasil diperbarui!');
            }
        }
    }

    function viewPeserta(id) {
        const p = pesertaData.find(p => p.id === id);
        if (p) {
            alert(`📋 Detail Peserta\n\nNama: ${p.nama}\nNIP: ${p.nip}\nUjian: ${p.ujian}\nSkor: ${p.skor}\nStatus: ${p.status}\nKelas: ${p.kelas || '-'}`);
        }
    }

    function deletePeserta(id) {
        if (confirm('Apakah Anda yakin ingin menghapus peserta ini?')) {
            pesertaData = pesertaData.filter(p => p.id !== id);
            saveData();
            refreshData();
            showToast('success', '🗑️ Peserta berhasil dihapus!');
        }
    }

    // ============================================================
    // CRUD - SOAL
    // ============================================================

    function tambahSoal(event) {
        event.preventDefault();

        const jenis = document.getElementById('jenisSoal').value;
        const pertanyaan = document.getElementById('pertanyaanSoal').value.trim();
        const a = document.getElementById('pilihanA').value.trim();
        const b = document.getElementById('pilihanB').value.trim();
        const c = document.getElementById('pilihanC').value.trim() || '-';
        const d = document.getElementById('pilihanD').value.trim() || '-';
        const jawaban = document.getElementById('jawabanBenar').value;
        const bobot = parseInt(document.getElementById('bobotSoal').value) || 1;

        if (!pertanyaan || !a || !b) {
            showToast('error', '⚠️ Pertanyaan dan pilihan A,B harus diisi!');
            return;
        }

        soalData.push({
            id: nextSoalId++,
            jenis: jenis,
            pertanyaan: pertanyaan,
            a: a,
            b: b,
            c: c,
            d: d,
            jawaban: jawaban,
            bobot: bobot
        });

        saveData();
        closeModal('modalTambahSoal');
        refreshData();
        showToast('success', '✅ Soal berhasil ditambahkan!');
        
        document.getElementById('pertanyaanSoal').value = '';
        document.getElementById('pilihanA').value = '';
        document.getElementById('pilihanB').value = '';
        document.getElementById('pilihanC').value = '';
        document.getElementById('pilihanD').value = '';
    }

    function deleteSoal(id) {
        if (confirm('Apakah Anda yakin ingin menghapus soal ini?')) {
            soalData = soalData.filter(s => s.id !== id);
            saveData();
            refreshData();
            showToast('success', '🗑️ Soal berhasil dihapus!');
        }
    }

    function hapusSemuaSoal() {
        if (soalData.length === 0) {
            showToast('warning', '⚠️ Tidak ada soal untuk dihapus!');
            return;
        }

        if (confirm(`⚠️ Apakah Anda yakin ingin menghapus semua ${soalData.length} soal? Tindakan ini tidak dapat dibatalkan!`)) {
            soalData = [];
            saveData();
            refreshData();
            showToast('success', `🗑️ Semua soal berhasil dihapus!`);
        }
    }

    // ============================================================
    // UPLOAD SOAL DARI WORD (DIPERBAIKI DENGAN MAMMOTH.JS)
    // ============================================================

    function handleFileUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        // HANYA terima .docx karena Mammoth.js tidak mendukung .doc lama di browser
        if (!file.name.endsWith('.docx') && file.type !== 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
            showToast('error', '❌ Mohon upload file Word format .docx (bukan .doc)');
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            showToast('error', '❌ Ukuran file maksimal 5MB');
            return;
        }

        startUpload(file);
    }

    function startUpload(file) {
        const progress = elements.uploadProgress;
        const fill = elements.progressFill;
        const text = elements.progressText;

        if (progress) progress.classList.add('show');
        isUploading = true;

        // Simulasi progress visual sambil Mammoth memproses file
        let progressValue = 0;
        const interval = setInterval(() => {
            progressValue += 10;
            if (progressValue > 90) progressValue = 90; // Tahan di 90% sampai parsing selesai

            if (fill) fill.style.width = progressValue + '%';
            if (text) text.textContent = `Membaca file ${Math.round(progressValue)}%`;
        }, 100);

        // Proses baca file sebenarnya
        const reader = new FileReader();
        reader.onload = function(loadEvent) {
            const arrayBuffer = loadEvent.target.result;
            
            // Cek apakah library Mammoth tersedia
            if (typeof mammoth === 'undefined') {
                clearInterval(interval);
                showToast('error', '❌ Library Mammoth.js belum dimuat. Periksa tag <script> di HTML Anda.');
                if (progress) progress.classList.remove('show');
                isUploading = false;
                return;
            }

            // Mammoth mengekstrak teks dari .docx
            mammoth.extractRawText({ arrayBuffer: arrayBuffer })
                .then(function(result) {
                    clearInterval(interval);
                    if (fill) fill.style.width = '100%';
                    if (text) text.textContent = `Selesai 100%`;
                    
                    setTimeout(() => {
                        parseWordText(result.value); // Kirim teks hasil ekstrak ke parser
                    }, 500);
                })
                .catch(function(err) {
                    clearInterval(interval);
                    console.error(err);
                    showToast('error', '❌ Gagal membaca file Word. Pastikan format benar dan file tidak rusak.');
                    if (progress) progress.classList.remove('show');
                    isUploading = false;
                });
        };
        reader.readAsArrayBuffer(file);
    }

    function parseWordText(rawText) {
        const text = rawText.trim();
        if (!text) {
            showToast('warning', '⚠️ File Word kosong atau tidak dapat dibaca.');
            return;
        }

        // Pisahkan berdasarkan "Pertanyaan:" atau angka di awal baris (sesuaikan dengan template Anda)
        const soalBlocks = text.split(/(?=Pertanyaan:|^\d+[\.\)]\s)/gm).filter(block => block.trim().length > 0);

        if (soalBlocks.length === 0) {
            showToast('error', '❌ Format soal tidak dikenali. Gunakan template yang disediakan.');
            return;
        }

        uploadedSoalData = soalBlocks.map((block, index) => {
            return extractQuestionData(block, index + 1);
        }).filter(q => q.pertanyaan !== ''); // Hapus yang gagal diparse

        console.log('📝 Hasil parsing Word:', uploadedSoalData);
        showPreview();

        const uploadArea = elements.uploadArea;
        if (uploadArea) {
            uploadArea.style.borderColor = '#059669';
            const title = uploadArea.querySelector('.upload-title');
            const desc = uploadArea.querySelector('.upload-desc');
            if (title) title.textContent = '✅ File berhasil dibaca!';
            if (desc) desc.textContent = `Ditemukan ${uploadedSoalData.length} soal dari file`;
        }

        showToast('success', `📄 ${uploadedSoalData.length} soal berhasil diekstrak!`);
        isUploading = false;
    }

    // Helper: Mengubah teks mentah satu blok soal menjadi Object JSON
    function extractQuestionData(block, defaultId) {
        const lines = block.split('\n').map(line => line.trim()).filter(line => line !== '');
        
        let pertanyaan = '';
        let a = '-', b = '-', c = '-', d = '-';
        let jawaban = 'A';

        lines.forEach(line => {
            const lowerLine = line.toLowerCase();
            if (lowerLine.startsWith('pertanyaan:') || /^\d+[\.\)]\s/.test(line)) {
                pertanyaan = line.replace(/^(pertanyaan:|\d+[\.\)]\s)/i, '').trim();
            } else if (lowerLine.startsWith('pilihan a:') || lowerLine.startsWith('a.')) {
                a = line.replace(/^(pilihan a:|a\.)/i, '').trim();
            } else if (lowerLine.startsWith('pilihan b:') || lowerLine.startsWith('b.')) {
                b = line.replace(/^(pilihan b:|b\.)/i, '').trim();
            } else if (lowerLine.startsWith('pilihan c:') || lowerLine.startsWith('c.')) {
                c = line.replace(/^(pilihan c:|c\.)/i, '').trim();
            } else if (lowerLine.startsWith('pilihan d:') || lowerLine.startsWith('d.')) {
                d = line.replace(/^(pilihan d:|d\.)/i, '').trim();
            } else if (lowerLine.startsWith('jawaban:')) {
                jawaban = line.replace(/^jawaban:/i, '').trim().toUpperCase();
            }
        });

        // Fallback jika regex gagal menangkap pertanyaan tapi ada isinya
        if (!pertanyaan && lines.length > 0) {
            pertanyaan = lines[0];
        }

        return {
            id: 'temp_' + Date.now() + '_' + defaultId,
            pertanyaan: pertanyaan,
            a: a,
            b: b,
            c: c,
            d: d,
            jawaban: jawaban,
            bobot: 1
        };
    }

    function showPreview() {
        const container = elements.soalPreview;
        const list = elements.previewList;
        const count = elements.previewCount;

        if (!container || !list || !count) {
            console.error('❌ Element preview tidak ditemukan');
            return;
        }

        container.style.display = 'block';
        count.textContent = `${uploadedSoalData.length} soal`;

        if (uploadedSoalData.length === 0) {
            list.innerHTML = `<div style="text-align:center;padding:20px;color:#8a9aa8;">Tidak ada soal untuk ditampilkan</div>`;
            return;
        }

        list.innerHTML = uploadedSoalData.map((q, index) => {
            const pertanyaan = q.pertanyaan || '⚠️ Soal tidak memiliki pertanyaan';
            return `
                <div class="preview-item">
                    <div class="preview-question">
                        <span class="q-number">${index + 1}.</span>
                        ${pertanyaan}
                        <br>
                        <small style="color:#8a9aa8;">A. ${q.a || '-'} | B. ${q.b || '-'} | C. ${q.c || '-'} | D. ${q.d || '-'}</small>
                        <br>
                        <small style="color:#059669;">✅ Jawaban: ${q.jawaban || 'A'}</small>
                    </div>
                    <div class="preview-actions">
                        <button class="btn-icon-sm edit-sm" onclick="editUploadedSoal(${index})" title="Edit">✏️</button>
                        <button class="btn-icon-sm delete-sm" onclick="deleteUploadedSoal(${index})" title="Hapus">🗑️</button>
                    </div>
                </div>
            `;
        }).join('');
    }

    function editUploadedSoal(index) {
        const q = uploadedSoalData[index];
        if (!q) return;

        document.getElementById('editSoalId').value = index;
        
        // PERBAIKAN MINOR: Cek keberadaan elemen sebelum mengakses value
        const jenisUploadEl = document.getElementById('jenisSoalUpload');
        document.getElementById('editJenisSoal').value = (jenisUploadEl ? jenisUploadEl.value : 'pretest');
        
        document.getElementById('editPertanyaan').value = q.pertanyaan;
        document.getElementById('editPilihanA').value = q.a;
        document.getElementById('editPilihanB').value = q.b;
        document.getElementById('editPilihanC').value = q.c || '';
        document.getElementById('editPilihanD').value = q.d || '';
        document.getElementById('editJawabanBenar').value = q.jawaban;
        document.getElementById('editBobot').value = q.bobot || 1;

        const form = document.getElementById('editSoalForm');
        form.onsubmit = function(e) {
            e.preventDefault();
            saveEditUploadedSoal(index);
        };
        openModal('editSoal');
    }

    function saveEditUploadedSoal(index) {
        const q = uploadedSoalData[index];
        if (!q) return;

        q.pertanyaan = document.getElementById('editPertanyaan').value.trim();
        q.a = document.getElementById('editPilihanA').value.trim();
        q.b = document.getElementById('editPilihanB').value.trim();
        q.c = document.getElementById('editPilihanC').value.trim() || '-';
        q.d = document.getElementById('editPilihanD').value.trim() || '-';
        q.jawaban = document.getElementById('editJawabanBenar').value;
        q.bobot = parseInt(document.getElementById('editBobot').value) || 1;

        showPreview();
        closeModal('modalEditSoal');
        showToast('success', '✅ Soal berhasil diperbarui!');
    }

    function deleteUploadedSoal(index) {
        if (confirm('Hapus soal ini dari daftar upload?')) {
            uploadedSoalData.splice(index, 1);
            if (uploadedSoalData.length === 0) {
                const container = elements.soalPreview;
                if (container) container.style.display = 'none';
            } else {
                showPreview();
            }
            showToast('success', '🗑️ Soal dihapus dari daftar upload');
        }
    }

    function clearPreview() {
        if (uploadedSoalData.length === 0) return;
        if (confirm('Hapus semua soal dari daftar upload?')) {
            uploadedSoalData = [];
            const container = elements.soalPreview;
            if (container) container.style.display = 'none';
            const uploadArea = elements.uploadArea;
            if (uploadArea) {
                uploadArea.style.borderColor = '#e5e9f0';
                const title = uploadArea.querySelector('.upload-title');
                const desc = uploadArea.querySelector('.upload-desc');
                if (title) title.textContent = 'Klik atau drag & drop file Word';
                if (desc) desc.textContent = 'Upload file .docx dengan format soal';
            }
            showToast('warning', '🗑️ Semua soal dihapus dari daftar upload');
        }
    }

    function saveUploadedSoal() {
        if (!uploadedSoalData || uploadedSoalData.length === 0) {
            showToast('error', '⚠️ Tidak ada soal untuk disimpan!');
            return;
        }

        const jenisUploadEl = document.getElementById('jenisSoalUpload');
        const jenis = (jenisUploadEl ? jenisUploadEl.value : 'pretest');

        let savedCount = 0;
        uploadedSoalData.forEach(q => {
            soalData.push({
                id: nextSoalId++,
                jenis: jenis,
                pertanyaan: q.pertanyaan || 'Soal tidak memiliki pertanyaan',
                a: q.a || '-',
                b: q.b || '-',
                c: q.c || '-',
                d: q.d || '-',
                jawaban: q.jawaban || 'A',
                bobot: q.bobot || 1
            });
            savedCount++;
        });

        saveData();
        uploadedSoalData = [];
        const container = elements.soalPreview;
        if (container) container.style.display = 'none';
        const progress = elements.uploadProgress;
        if (progress) progress.classList.remove('show');
        const fileInput = elements.fileInput;
        if (fileInput) fileInput.value = '';
        const uploadArea = elements.uploadArea;
        if (uploadArea) {
            uploadArea.style.borderColor = '#e5e9f0';
            const title = uploadArea.querySelector('.upload-title');
            const desc = uploadArea.querySelector('.upload-desc');
            if (title) title.textContent = 'Klik atau drag & drop file Word';
            if (desc) desc.textContent = 'Upload file .docx dengan format soal';
        }

        refreshData();
        showToast('success', `✅ ${savedCount} soal berhasil disimpan!`);

        setTimeout(() => {
            closeModal('modalUploadSoal');
        }, 1000);
    }

    function downloadTemplate() {
        const template = `
============================================================
TEMPLATE SOAL UJIAN ONLINE
============================================================

Format: Setiap soal terdiri dari:
1. Pertanyaan
2. Pilihan A
3. Pilihan B
4. Pilihan C (opsional)
5. Pilihan D (opsional)
6. Jawaban Benar (A/B/C/D)

============================================================
CONTOH SOAL:
============================================================

Pertanyaan: Apa ibu kota Indonesia?
Pilihan A: Jakarta
Pilihan B: Bandung
Pilihan C: Surabaya
Pilihan D: Medan
Jawaban: A

Pertanyaan: Siapa presiden pertama Indonesia?
Pilihan A: Soekarno
Pilihan B: Soeharto
Pilihan C: Habibie
Pilihan D: Gus Dur
Jawaban: A

============================================================
CATATAN:
- Pisahkan setiap soal dengan baris baru
- Gunakan format di atas untuk setiap soal
- File HARUS disimpan sebagai .docx (Word 2007+)
============================================================`;

        const blob = new Blob([template], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'template_soal_ujian.docx.txt';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showToast('success', '📄 Template soal berhasil diunduh!');
    }

    // ============================================================
    // EDIT SOAL TERSIMPAN
    // ============================================================

    function editExistingSoal(id) {
        const q = soalData.find(s => s.id === id);
        if (!q) return;

        document.getElementById('editSoalId').value = id;
        document.getElementById('editJenisSoal').value = q.jenis;
        document.getElementById('editPertanyaan').value = q.pertanyaan;
        document.getElementById('editPilihanA').value = q.a;
        document.getElementById('editPilihanB').value = q.b;
        document.getElementById('editPilihanC').value = q.c || '';
        document.getElementById('editPilihanD').value = q.d || '';
        document.getElementById('editJawabanBenar').value = q.jawaban;
        document.getElementById('editBobot').value = q.bobot || 1;

        const form = document.getElementById('editSoalForm');
        form.onsubmit = function(e) {
            e.preventDefault();
            saveEditExistingSoal(id);
        };
        openModal('editSoal');
    }

    function saveEditExistingSoal(id) {
        const q = soalData.find(s => s.id === id);
        if (!q) return;

        q.jenis = document.getElementById('editJenisSoal').value;
        q.pertanyaan = document.getElementById('editPertanyaan').value.trim();
        q.a = document.getElementById('editPilihanA').value.trim();
        q.b = document.getElementById('editPilihanB').value.trim();
        q.c = document.getElementById('editPilihanC').value.trim() || '-';
        q.d = document.getElementById('editPilihanD').value.trim() || '-';
        q.jawaban = document.getElementById('editJawabanBenar').value;
        q.bobot = parseInt(document.getElementById('editBobot').value) || 1;

        saveData();
        closeModal('modalEditSoal');
        refreshData();
        showToast('success', '✅ Soal berhasil diperbarui!');
    }

    // ============================================================
    // UI FUNCTIONS
    // ============================================================

    function switchTab(tab) {
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tab);
        });

        document.querySelectorAll('.tab-panel').forEach(panel => {
            panel.classList.toggle('active', panel.id === `tab-${tab}`);
        });

        if (tab === 'hasil') renderHasilUjian();
        if (tab === 'users') renderUserTable();
        if (tab === 'peserta') renderTable();
        if (tab === 'soal') renderSoalTable();
        if (tab === 'ujian') {
            renderKelolaPretest();
            renderKelolaPosttest();
            renderChart();
        }
    }

    function openModal(type) {
        const modals = {
            'tambahUser': 'modalTambahUser',
            'tambahPeserta': 'modalTambahPeserta',
            'tambahSoal': 'modalTambahSoal',
            'kelolaPretest': 'modalKelolaPretest',
            'kelolaPosttest': 'modalKelolaPosttest',
            'tambahSoalPretest': 'modalTambahSoal',
            'tambahSoalPosttest': 'modalTambahSoal',
            'uploadSoal': 'modalUploadSoal',
            'editSoal': 'modalEditSoal'
        };

        const modalId = modals[type];
        if (modalId) {
            const modal = document.getElementById(modalId);
            if (modal) modal.classList.add('show');

            if (type === 'kelolaPretest') renderKelolaPretest();
            if (type === 'kelolaPosttest') renderKelolaPosttest();
            
            if (type === 'tambahSoal' || type === 'tambahSoalPretest' || type === 'tambahSoalPosttest') {
                const jenisSoal = document.getElementById('jenisSoal');
                if (jenisSoal) {
                    jenisSoal.value = type === 'tambahSoalPretest' ? 'pretest' : type === 'tambahSoalPosttest' ? 'posttest' : 'pretest';
                }
            }
            
            if (type === 'uploadSoal') {
                const progress = elements.uploadProgress;
                if (progress) progress.classList.remove('show');
                const container = elements.soalPreview;
                if (container) container.style.display = 'none';
                const fileInput = elements.fileInput;
                if (fileInput) fileInput.value = '';
                uploadedSoalData = [];
                const list = elements.previewList;
                if (list) list.innerHTML = '';
                const uploadArea = elements.uploadArea;
                if (uploadArea) uploadArea.style.borderColor = '#e5e9f0';
            }

            if (type === 'tambahUser') {
                const guruFields = document.getElementById('guruFields');
                if (guruFields) guruFields.style.display = 'none';
                const userRole = document.getElementById('userRole');
                if (userRole) userRole.value = 'admin';
            }
        }
    }

    function closeModal(id) {
        const modal = document.getElementById(id);
        if (modal) modal.classList.remove('show');
    }

    function refreshData() {
        renderStats();
        renderUserTable();
        renderTable();
        renderSoalTable();
        renderChart();
        renderKelolaPretest();
        renderKelolaPosttest();
        renderHasilUjian();
        updateStorageInfo();
    }

    function filterUserTable() { renderUserTable(); }
    function filterTable() { renderTable(); }
    function filterSoalTable() { renderSoalTable(); }
    function filterHasilTable() { renderHasilUjian(); }
    function updateChart() { renderChart(); }

    function viewDetail(type) {
        alert(`📊 Detail ${type.toUpperCase()}\n\nTotal Peserta: ${pesertaData.filter(p => p.ujian === type).length}\nTotal Soal: ${soalData.filter(s => s.jenis === type).length}`);
    }

    function handleLogout() {
    if (confirm('Apakah Anda yakin ingin keluar?')) {
        saveData();
        if (typeof logoutUser === 'function') {
            logoutUser();
        } else {
            sessionStorage.removeItem('userSession');
            localStorage.removeItem('userSession');
            window.location.href = '../../public/login.html';
        }
    }
}

    function resetData() {
        if (confirm('⚠️ Apakah Anda yakin ingin mereset SEMUA data? Tindakan ini tidak dapat dibatalkan!')) {
            clearAllData();
            createDefaultAdmin();
            refreshData();
            showToast('warning', '🔄 Semua data telah direset!');
        }
    }

    function toggleGuruFields() {
        const role = document.getElementById('userRole');
        const guruFields = document.getElementById('guruFields');
        if (role && guruFields) {
            guruFields.style.display = role.value === 'guru' ? 'block' : 'none';
        }
    }

    function cetakHasilUjian() {
        window.print();
    }

    function refreshHasilUjian() {
        renderHasilUjian();
        showToast('info', '🔄 Data hasil ujian diperbarui!');
    }

    // ============================================================
    // INIT
    // ============================================================

    function init() {
        // Cek session
        let session = sessionStorage.getItem('userSession');
        if (!session) session = localStorage.getItem('userSession');

        if (!session) {
            window.location.href = '../../public/login.html';
            return;
        }

        try {
            const data = JSON.parse(session);
            if (data.user.role !== 'admin') {
                window.location.href = '../../public/login.html';
                return;
            }
            if (elements.adminName) {
                elements.adminName.textContent = data.user.name || 'Administrator';
            }
            console.log('👑 Login sebagai:', data.user.name);
        } catch (e) {
            window.location.href = '../../public/login.html';
        }

        // Load data
        const hasData = loadData();
        if (!hasData) {
            createDefaultAdmin();
        } else {
            const hasAdmin = userData.some(u => u.username === 'admin');
            if (!hasAdmin) createDefaultAdmin();
        }

        // Load status ujian
        loadUjianStatus();

        // Render semua data
        refreshData();

        // Setup drag & drop
        const uploadArea = elements.uploadArea;
        if (uploadArea) {
            uploadArea.addEventListener('dragover', function(e) {
                e.preventDefault();
                this.classList.add('dragover');
            });

            uploadArea.addEventListener('dragleave', function(e) {
                e.preventDefault();
                this.classList.remove('dragover');
            });

            uploadArea.addEventListener('drop', function(e) {
                e.preventDefault();
                this.classList.remove('dragover');
                const files = e.dataTransfer.files;
                if (files.length > 0) {
                    const file = files[0];
                    const input = elements.fileInput;
                    if (input) {
                        const dataTransfer = new DataTransfer();
                        dataTransfer.items.add(file);
                        input.files = dataTransfer.files;
                        handleFileUpload({ target: input });
                    }
                }
            });
        }

        // Close modal on overlay click
        document.querySelectorAll('.modal-overlay').forEach(overlay => {
            overlay.addEventListener('click', function(e) {
                if (e.target === this) {
                    this.classList.remove('show');
                }
            });
        });

        // Toggle guru fields on role change
        const userRole = document.getElementById('userRole');
        if (userRole) {
            userRole.addEventListener('change', toggleGuruFields);
        }

        // Keyboard shortcuts
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                document.querySelectorAll('.modal-overlay.show').forEach(m => m.classList.remove('show'));
            }

            if (e.ctrlKey && e.key === 's') {
                e.preventDefault();
                saveData();
                showToast('success', '💾 Data berhasil disimpan!');
            }
        });

        console.log('✅ Admin Dashboard loaded');
        console.log(`👤 Total User: ${userData.length}`);
        console.log(`👥 Total Peserta: ${pesertaData.length}`);
        console.log(`📝 Total Soal: ${soalData.length}`);
        console.log('💾 Data disimpan di localStorage');
        console.log('🔐 Default Admin: admin / admin123');
        console.log('📋 Status Ujian:', ujianStatus);
        console.log('💡 Keyboard Shortcuts: Ctrl + S = Simpan, Escape = Tutup modal');

        // Expose functions globally
        window.switchTab = switchTab;
        window.openModal = openModal;
        window.closeModal = closeModal;
        window.refreshData = refreshData;
        window.filterUserTable = filterUserTable;
        window.filterTable = filterTable;
        window.filterSoalTable = filterSoalTable;
        window.filterHasilTable = filterHasilTable;
        window.updateChart = updateChart;
        window.viewDetail = viewDetail;
        window.handleLogout = handleLogout;
        window.resetData = resetData;
        window.toggleGuruFields = toggleGuruFields;
        window.tambahUser = tambahUser;
        window.editUser = editUser;
        window.viewUser = viewUser;
        window.deleteUser = deleteUser;
        window.tambahPeserta = tambahPeserta;
        window.editPesertaGroup = editPesertaGroup;
        window.viewPesertaGroup = viewPesertaGroup;
        window.deletePesertaGroup = deletePesertaGroup;
        window.editPeserta = editPeserta;
        window.viewPeserta = viewPeserta;
        window.deletePeserta = deletePeserta;
        window.tambahSoal = tambahSoal;
        window.deleteSoal = deleteSoal;
        window.hapusSemuaSoal = hapusSemuaSoal;
        window.editExistingSoal = editExistingSoal;
        window.saveEditExistingSoal = saveEditExistingSoal;
        window.handleFileUpload = handleFileUpload;
        window.startUpload = startUpload;
        window.parseWordText = parseWordText;
        window.showPreview = showPreview;
        window.editUploadedSoal = editUploadedSoal;
        window.saveEditUploadedSoal = saveEditUploadedSoal;
        window.deleteUploadedSoal = deleteUploadedSoal;
        window.clearPreview = clearPreview;
        window.saveUploadedSoal = saveUploadedSoal;
        window.downloadTemplate = downloadTemplate;
        window.generateSampleHasilUjian = generateSampleHasilUjian;
        window.hapusHasilUjian = hapusHasilUjian;
        window.hapusSemuaHasil = hapusSemuaHasil;
        window.cetakHasilUjian = cetakHasilUjian;
        window.refreshHasilUjian = refreshHasilUjian;
        window.renderHasilUjian = renderHasilUjian;
        window.toggleUjian = toggleUjian;
        window.loadUjianStatus = loadUjianStatus;
        window.getUjianStatus = getUjianStatus;
        window.isUjianAktif = isUjianAktif;
        window.updateUjianUI = updateUjianUI;
        window.renderStats = renderStats;
        window.groupPesertaByName = groupPesertaByName;
    }

    // Run on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();