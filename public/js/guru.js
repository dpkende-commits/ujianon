// ============================================================
// GURU DASHBOARD JS - Ujian Online System
// VERSI: 3.2.0 - FULL INTEGRASI DENGAN ADMIN
// ============================================================

(function() {
    'use strict';

    // ============================================================
    // CONFIG
    // ============================================================
    const CONFIG = {
        sessionKey: 'userSession',
        loginUrl: '../../public/login.html',
        storageKey: 'ujianOnlineData',
        hasilKey: 'hasilUjianData',
        ujianStatusKey: 'ujianStatus',
        pretestDuration: 1800,  // 30 menit
        posttestDuration: 3600  // 60 menit
    };

    // ============================================================
    // STATE
    // ============================================================
    let currentUser = null;
    let guruProfile = null;
    let allPeserta = [];
    let allSoal = [];
    let currentTab = 'test';
    let currentUjianType = 'pretest';
    let soalFilter = 'all';
    let ujianStatus = { pretest: false, posttest: false };
    let hasSubmitted = { pretest: false, posttest: false };
    
    let ujianState = {
        pretest: {
            started: false,
            finished: false,
            timeLeft: CONFIG.pretestDuration,
            timer: null,
            jawaban: {}
        },
        posttest: {
            started: false,
            finished: false,
            timeLeft: CONFIG.posttestDuration,
            timer: null,
            jawaban: {}
        }
    };

    // ============================================================
    // DOM REFERENCES
    // ============================================================
    const elements = {
        guruName: document.getElementById('guruName'),
        guruNip: document.getElementById('guruNip'),
        guruNuptk: document.getElementById('guruNuptk'),
        guruTempatLahir: document.getElementById('guruTempatLahir'),
        guruSekolah: document.getElementById('guruSekolah'),
        guruMapel: document.getElementById('guruMapel'),
        guruAvatar: document.getElementById('guruAvatar'),
        guruNameNav: document.getElementById('guruNameNav'),
        guruAvatarNav: document.getElementById('guruAvatarNav'),
        pretestCount: document.getElementById('pretestCount'),
        posttestCount: document.getElementById('posttestCount'),
        pretestAktif: document.getElementById('pretestAktif'),
        posttestAktif: document.getElementById('posttestAktif'),
        pretestBadge: document.getElementById('pretestBadge'),
        posttestBadge: document.getElementById('posttestBadge'),
        pretestSoalList: document.getElementById('pretestSoalList'),
        posttestSoalList: document.getElementById('posttestSoalList'),
        ujianContainer: document.getElementById('ujianContainer'),
        filterButtons: document.querySelectorAll('.filter-btn')
    };

    // ============================================================
    // STORAGE FUNCTIONS - HANYA BACA DARI ADMIN
    // ============================================================

    function getDataFromStorage() {
        try {
            const stored = localStorage.getItem(CONFIG.storageKey);
            if (stored) {
                return JSON.parse(stored);
            }
            console.warn('⚠️ Tidak ada data di localStorage dengan key:', CONFIG.storageKey);
            return null;
        } catch (e) {
            console.error('❌ Gagal mengambil data:', e);
            return null;
        }
    }

    function getGuruProfile(username) {
        const data = getDataFromStorage();
        if (data && data.userData) {
            const user = data.userData.find(u =>
                u.username === username &&
                u.role === 'guru' &&
                u.status === 'active'
            );

            if (user) {
                return {
                    nama: user.fullname || 'Guru',
                    nip: user.nip || user.username || '-',
                    nuptk: user.nuptk || '-',
                    tempat_lahir: user.tempat_lahir || '-',
                    tanggal_lahir: user.tanggal_lahir || '-',
                    nama_sekolah: user.nama_sekolah || '-',
                    mapel: user.mapel || '-',
                    username: user.username,
                    email: user.email
                };
            }
        }

        // Fallback jika data guru tidak ditemukan di storage
        return {
            nama: 'Guru',
            nip: '-',
            nuptk: '-',
            tempat_lahir: '-',
            tanggal_lahir: '-',
            nama_sekolah: '-',
            mapel: '-',
            username: username || 'guru'
        };
    }

    function getPesertaFromStorage() {
        const data = getDataFromStorage();
        if (data && data.pesertaData) {
            return data.pesertaData;
        }
        return [];
    }

    // ✅ AMBIL SOAL HANYA DARI STORAGE - TIDAK ADA SAMPLE
    function getSoalFromStorage() {
        const data = getDataFromStorage();
        if (data && data.soalData && data.soalData.length > 0) {
            console.log(`📝 Mendapatkan ${data.soalData.length} soal dari storage Admin`);
            return data.soalData;
        }
        console.warn('⚠️ Tidak ada soal di storage. Admin harus upload soal terlebih dahulu.');
        return []; // KEMBALIKAN KOSONG, BUKAN SAMPLE
    }

    function getSoalByJenis(jenis) {
        const semuaSoal = getSoalFromStorage();
        
        if (semuaSoal.length === 0) {
            console.warn('⚠️ Tidak ada soal! Admin harus upload soal terlebih dahulu.');
            return [];
        }
        
        if (jenis === 'all') return semuaSoal;
        return semuaSoal.filter(s => s.jenis === jenis);
    }

    // ============================================================
    // UJIAN STATUS FUNCTIONS (Dari Admin)
    // ============================================================

    function loadUjianStatus() {
        try {
            const stored = localStorage.getItem(CONFIG.ujianStatusKey);
            if (stored) {
                ujianStatus = JSON.parse(stored);
            } else {
                ujianStatus = { pretest: false, posttest: false };
                localStorage.setItem(CONFIG.ujianStatusKey, JSON.stringify(ujianStatus));
            }
            console.log('📋 Status ujian dimuat:', ujianStatus);
            return ujianStatus;
        } catch (e) {
            console.error('❌ Gagal load status ujian:', e);
            ujianStatus = { pretest: false, posttest: false };
            return ujianStatus;
        }
    }

    function isUjianAktif(type) {
        return ujianStatus[type] === true;
    }

    // ============================================================
    // SESSION MANAGEMENT
    // ============================================================

    function getSession() {
        let session = sessionStorage.getItem(CONFIG.sessionKey);
        if (!session) session = localStorage.getItem(CONFIG.sessionKey);
        return session ? JSON.parse(session) : null;
    }

    function clearSession() {
        sessionStorage.removeItem(CONFIG.sessionKey);
        localStorage.removeItem(CONFIG.sessionKey);
    }

    function checkGuruSession() {
        const session = getSession();
        if (!session) {
            window.location.href = CONFIG.loginUrl;
            return false;
        }

        if (session.user.role !== 'guru') {
            window.location.href = CONFIG.loginUrl;
            return false;
        }

        currentUser = session.user;
        return true;
    }

    // ============================================================
    // TAB SWITCHING
    // ============================================================

    function switchTab(tab) {
        currentTab = tab;

        document.querySelectorAll('.tab-btn-guru').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tab);
        });

        document.querySelectorAll('.tab-panel-guru').forEach(panel => {
            panel.classList.toggle('active', panel.id === `tab-${tab}`);
        });

        if (tab === 'ujian') {
            renderUjian();
        }

        console.log(`📌 Tab berubah ke: ${tab}`);
    }

    // ============================================================
    // RENDER PROFILE / TEST
    // ============================================================

    function renderTest() {
        renderProfile();
        renderSoal(soalFilter);
    }

    function renderProfile() {
        guruProfile = getGuruProfile(currentUser.username);

        if (elements.guruName) elements.guruName.textContent = guruProfile.nama;
        if (elements.guruNip) elements.guruNip.textContent = guruProfile.nip;
        if (elements.guruNuptk) elements.guruNuptk.textContent = guruProfile.nuptk;

        let ttlDisplay = '-';
        if (guruProfile.tempat_lahir || guruProfile.tanggal_lahir) {
            let ttlParts = [];
            if (guruProfile.tempat_lahir && guruProfile.tempat_lahir !== '-') {
                ttlParts.push(guruProfile.tempat_lahir);
            }
            if (guruProfile.tanggal_lahir && guruProfile.tanggal_lahir !== '-') {
                try {
                    const date = new Date(guruProfile.tanggal_lahir);
                    if (!isNaN(date.getTime())) {
                        const formattedDate = date.toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric'
                        });
                        ttlParts.push(formattedDate);
                    } else {
                        ttlParts.push(guruProfile.tanggal_lahir);
                    }
                } catch(e) {
                    ttlParts.push(guruProfile.tanggal_lahir);
                }
            }
            if (ttlParts.length > 0) {
                ttlDisplay = ttlParts.join(', ');
            }
        }

        if (elements.guruTempatLahir) {
            elements.guruTempatLahir.innerHTML = `<span class="ttl-date">${ttlDisplay}</span>`;
        }

        if (elements.guruSekolah) elements.guruSekolah.textContent = guruProfile.nama_sekolah;
        if (elements.guruMapel) elements.guruMapel.textContent = '📖 ' + guruProfile.mapel;

        const initial = guruProfile.nama.charAt(0).toUpperCase();
        if (elements.guruAvatar) elements.guruAvatar.textContent = initial;
        if (elements.guruAvatarNav) elements.guruAvatarNav.textContent = initial;
        if (elements.guruNameNav) elements.guruNameNav.textContent = guruProfile.nama;

        console.log('✅ Profile guru berhasil dimuat:', guruProfile.nama);
    }

    function renderSoal(filter = 'all') {
        soalFilter = filter;
        allSoal = getSoalFromStorage(); // ✅ HANYA DARI STORAGE

        const pretestSoal = allSoal.filter(s => s.jenis === 'pretest');
        const posttestSoal = allSoal.filter(s => s.jenis === 'posttest');

        // Update badge status
        updateBadge('pretest', pretestSoal);
        updateBadge('posttest', posttestSoal);

        // Update counts
        if (elements.pretestCount) elements.pretestCount.textContent = pretestSoal.length;
        if (elements.posttestCount) elements.posttestCount.textContent = posttestSoal.length;

        // Update status aktif
        const pretestAktif = pretestSoal.length;
        const posttestAktif = posttestSoal.length;
        if (elements.pretestAktif) elements.pretestAktif.textContent = `Aktif: ${pretestAktif}`;
        if (elements.posttestAktif) elements.posttestAktif.textContent = `Aktif: ${posttestAktif}`;

        renderSoalList(filter);

        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.filter === filter);
        });

        console.log(`📝 Soal berhasil dimuat - Total: ${allSoal.length} soal (dari Admin)`);
    }

    function updateBadge(type, soalList) {
        const badge = type === 'pretest' ? elements.pretestBadge : elements.posttestBadge;
        if (!badge) return;

        if (soalList.length === 0) {
            badge.textContent = '❌ Kosong';
            badge.style.background = '#fee2e2';
            badge.style.color = '#dc2626';
        } else {
            badge.textContent = `✅ ${soalList.length} Soal`;
            badge.style.background = '#d1fae5';
            badge.style.color = '#059669';
        }
    }

    function renderSoalList(filter = 'all') {
        let filteredSoal = [...allSoal];
        if (filter !== 'all') {
            filteredSoal = filteredSoal.filter(s => s.jenis === filter);
        }

        const pretestFiltered = filteredSoal.filter(s => s.jenis === 'pretest');
        const posttestFiltered = filteredSoal.filter(s => s.jenis === 'posttest');

        if (elements.pretestSoalList) {
            if (pretestFiltered.length === 0) {
                elements.pretestSoalList.innerHTML = `
                    <div class="soal-item">
                        <div class="soal-info">
                            <div class="soal-question" style="color:#8a9aa8;">Belum ada soal pretest dari Admin</div>
                        </div>
                    </div>
                `;
            } else {
                elements.pretestSoalList.innerHTML = pretestFiltered.map(s => {
                    const status = s.status || 'aktif';
                    return `
                        <div class="soal-item">
                            <div class="soal-info">
                                <div class="soal-question">${s.pertanyaan}</div>
                                <div class="soal-meta">
                                    <span class="soal-type pretest">PRETEST</span>
                                    <span>ID: SOAL-${String(s.id).padStart(3, '0')}</span>
                                </div>
                            </div>
                            <span class="soal-status ${status}">${status.toUpperCase()}</span>
                        </div>
                    `;
                }).join('');
            }
        }

        if (elements.posttestSoalList) {
            if (posttestFiltered.length === 0) {
                elements.posttestSoalList.innerHTML = `
                    <div class="soal-item">
                        <div class="soal-info">
                            <div class="soal-question" style="color:#8a9aa8;">Belum ada soal posttest dari Admin</div>
                        </div>
                    </div>
                `;
            } else {
                elements.posttestSoalList.innerHTML = posttestFiltered.map(s => {
                    const status = s.status || 'aktif';
                    return `
                        <div class="soal-item">
                            <div class="soal-info">
                                <div class="soal-question">${s.pertanyaan}</div>
                                <div class="soal-meta">
                                    <span class="soal-type posttest">POSTTEST</span>
                                    <span>ID: SOAL-${String(s.id).padStart(3, '0')}</span>
                                </div>
                            </div>
                            <span class="soal-status ${status}">${status.toUpperCase()}</span>
                        </div>
                    `;
                }).join('');
            }
        }
    }

    // ============================================================
    // RENDER UJIAN (Dengan Status Aktif/Nonaktif dari Admin)
    // ============================================================

    function renderUjian() {
        const container = elements.ujianContainer;
        if (!container) return;

        // Load status ujian terbaru dari Admin
        loadUjianStatus();

        const pretestSoal = getSoalByJenis('pretest');
        const posttestSoal = getSoalByJenis('posttest');
        const totalPretest = pretestSoal.length;
        const totalPosttest = posttestSoal.length;

        const isPretestActive = totalPretest > 0;
        const isPosttestActive = totalPosttest > 0;

        // Cek status dari Admin
        const pretestEnabled = isUjianAktif('pretest');
        const posttestEnabled = isUjianAktif('posttest');

        // Cek apakah sudah submit
        const pretestSubmitted = hasSubmitted.pretest;
        const posttestSubmitted = hasSubmitted.posttest;

        if (!isPretestActive && !isPosttestActive) {
            container.innerHTML = `
                <div class="ujian-header">
                    <h3>📝 Ujian</h3>
                    <div class="ujian-timer">
                        <span class="timer-icon">⏱️</span>
                        <span class="timer-time" id="timerDisplay">00:00:00</span>
                    </div>
                </div>
                <div class="ujian-body">
                    <div class="no-data">
                        <div class="no-data-icon">📝</div>
                        <div class="no-data-title">Belum ada soal ujian dari Admin</div>
                        <div class="no-data-desc">Admin harus menambahkan soal terlebih dahulu melalui halaman Admin</div>
                    </div>
                </div>
            `;
            return;
        }

        const currentSoal = currentUjianType === 'pretest' ? pretestSoal : posttestSoal;
        const currentState = ujianState[currentUjianType];
        const totalSoal = currentSoal.length;
        const isStarted = currentState.started;
        const isFinished = currentState.finished;
        const isSubmitted = currentUjianType === 'pretest' ? pretestSubmitted : posttestSubmitted;
        const isEnabled = currentUjianType === 'pretest' ? pretestEnabled : posttestEnabled;
        const durasi = currentUjianType === 'pretest' ? CONFIG.pretestDuration : CONFIG.posttestDuration;
        const waktuLabel = currentUjianType === 'pretest' ? '30 Menit' : '60 Menit';

        // Status info
        let statusInfoHtml = '';
        if (isSubmitted) {
            statusInfoHtml = `
                <div class="ujian-status-info completed">
                    <span class="status-icon">✅</span>
                    <span>Ujian <strong>${currentUjianType === 'pretest' ? 'Pretest' : 'Posttest'}</strong> telah <strong>SELESAI</strong>. Anda sudah mengikuti ujian ini.</span>
                </div>
            `;
        } else if (!isEnabled && totalSoal > 0) {
            statusInfoHtml = `
                <div class="ujian-status-info inactive">
                    <span class="status-icon">🔴</span>
                    <span>Ujian <strong>${currentUjianType === 'pretest' ? 'Pretest' : 'Posttest'}</strong> sedang <strong>NONAKTIF</strong> oleh Admin. Tunggu hingga diaktifkan.</span>
                </div>
            `;
        } else if (isEnabled && totalSoal > 0 && !isSubmitted) {
            statusInfoHtml = `
                <div class="ujian-status-info active">
                    <span class="status-icon">🟢</span>
                    <span>Ujian <strong>${currentUjianType === 'pretest' ? 'Pretest' : 'Posttest'}</strong> sedang <strong>AKTIF</strong>. Silakan mulai ujian.</span>
                </div>
            `;
        }

        let soalHtml = '';
        if (totalSoal === 0) {
            soalHtml = `
                <div class="no-data">
                    <div class="no-data-icon">📝</div>
                    <div class="no-data-title">Belum ada soal ${currentUjianType === 'pretest' ? 'Pretest' : 'Posttest'} dari Admin</div>
                    <div class="no-data-desc">Admin harus menambahkan soal terlebih dahulu</div>
                </div>
            `;
        } else {
            const isDisabled = isSubmitted || isFinished || !isEnabled || !isStarted;
            soalHtml = currentSoal.map((soal, index) => {
                const selected = currentState.jawaban[soal.id] || '';
                return `
                <div class="ujian-soal-item" id="soal-${soal.id}">
                    <div class="soal-text">
                        <span class="soal-number">${index + 1}.</span>
                        ${soal.pertanyaan}
                    </div>
                    <div class="soal-options">
                        <label class="option-item ${selected === 'A' ? 'selected' : ''}">
                            <input type="radio" name="soal_${soal.id}" value="A" onchange="pilihJawaban('${currentUjianType}', ${soal.id}, 'A')" ${isDisabled ? 'disabled' : ''} ${selected === 'A' ? 'checked' : ''}>
                            <span class="option-label">A.</span>
                            <span class="option-text">${soal.a}</span>
                        </label>
                        <label class="option-item ${selected === 'B' ? 'selected' : ''}">
                            <input type="radio" name="soal_${soal.id}" value="B" onchange="pilihJawaban('${currentUjianType}', ${soal.id}, 'B')" ${isDisabled ? 'disabled' : ''} ${selected === 'B' ? 'checked' : ''}>
                            <span class="option-label">B.</span>
                            <span class="option-text">${soal.b}</span>
                        </label>
                        ${soal.c && soal.c !== '-' ? `
                        <label class="option-item ${selected === 'C' ? 'selected' : ''}">
                            <input type="radio" name="soal_${soal.id}" value="C" onchange="pilihJawaban('${currentUjianType}', ${soal.id}, 'C')" ${isDisabled ? 'disabled' : ''} ${selected === 'C' ? 'checked' : ''}>
                            <span class="option-label">C.</span>
                            <span class="option-text">${soal.c}</span>
                        </label>
                        ` : ''}
                        ${soal.d && soal.d !== '-' ? `
                        <label class="option-item ${selected === 'D' ? 'selected' : ''}">
                            <input type="radio" name="soal_${soal.id}" value="D" onchange="pilihJawaban('${currentUjianType}', ${soal.id}, 'D')" ${isDisabled ? 'disabled' : ''} ${selected === 'D' ? 'checked' : ''}>
                            <span class="option-label">D.</span>
                            <span class="option-text">${soal.d}</span>
                        </label>
                        ` : ''}
                    </div>
                </div>
            `}).join('');
        }

        const terjawab = Object.keys(currentState.jawaban).length;
        const progress = totalSoal > 0 ? (terjawab / totalSoal) * 100 : 0;

        let actionButtons = '';
        if (isSubmitted) {
            actionButtons = `
                <span style="color:#059669;font-weight:600;font-size:0.9em;">✅ Ujian Selesai</span>
                <button class="btn btn-outline btn-sm" onclick="resetUjian('${currentUjianType}')">🔄 Reset</button>
            `;
        } else if (!isStarted && !isFinished && totalSoal > 0 && isEnabled) {
            actionButtons = `
                <button class="btn btn-primary btn-sm" onclick="startUjian('${currentUjianType}')" id="startUjianBtn">▶️ Mulai Ujian</button>
            `;
        } else if (isStarted && !isFinished && totalSoal > 0 && isEnabled) {
            actionButtons = `
                <button class="btn btn-success btn-sm" onclick="submitUjian('${currentUjianType}')" id="submitUjianBtn">📤 Selesai & Kirim</button>
            `;
        } else if (!isEnabled && totalSoal > 0 && !isSubmitted) {
            actionButtons = `
                <span style="color:#dc2626;font-weight:600;font-size:0.9em;">🔴 Nonaktif</span>
            `;
        }

        container.innerHTML = `
            <div class="ujian-header">
                <h3>📝 Ujian ${currentUjianType === 'pretest' ? 'Pretest' : 'Posttest'}</h3>
                <div class="ujian-timer">
                    <span class="timer-icon">⏱️</span>
                    <span class="timer-time" id="timerDisplay">${formatTime(currentState.timeLeft)}</span>
                    <span style="font-size:0.6em;color:#8a9aa8;font-weight:400;">(${waktuLabel})</span>
                    ${actionButtons}
                </div>
            </div>
            <div class="ujian-body">
                <div class="ujian-selector">
                    <button class="ujian-type-btn ${currentUjianType === 'pretest' ? 'active' : ''}" onclick="switchUjianType('pretest')">
                        📋 Pretest
                        <span class="type-badge pretest">${totalPretest} Soal</span>
                        <span class="type-status ${isPretestActive ? (pretestEnabled ? 'active' : 'inactive') : 'inactive'}">${isPretestActive ? (pretestEnabled ? '✅ Aktif' : '🔴 Nonaktif') : '❌ Kosong'}</span>
                        ${pretestSubmitted ? '<span class="type-status completed">✅ Selesai</span>' : ''}
                    </button>
                    <button class="ujian-type-btn ${currentUjianType === 'posttest' ? 'active' : ''}" onclick="switchUjianType('posttest')">
                        📝 Posttest
                        <span class="type-badge posttest">${totalPosttest} Soal</span>
                        <span class="type-status ${isPosttestActive ? (posttestEnabled ? 'active' : 'inactive') : 'inactive'}">${isPosttestActive ? (posttestEnabled ? '✅ Aktif' : '🔴 Nonaktif') : '❌ Kosong'}</span>
                        ${posttestSubmitted ? '<span class="type-status completed">✅ Selesai</span>' : ''}
                    </button>
                </div>

                ${statusInfoHtml}

                ${soalHtml}
            </div>
            <div class="ujian-footer">
                <div class="ujian-progress">
                    <span id="jawabanCount">${terjawab}/${totalSoal} terjawab</span>
                    <div class="progress-bar">
                        <div class="progress-fill" id="progressFill" style="width:${Math.min(progress, 100)}%"></div>
                    </div>
                    <span id="progressText">${Math.round(progress)}%</span>
                </div>
                <div class="ujian-actions">
                    ${isFinished && !isSubmitted ? `
                    <button class="btn btn-outline btn-sm" onclick="resetUjian('${currentUjianType}')">🔄 Ulangi</button>
                    ` : ''}
                </div>
            </div>
        `;

        if (isStarted && !isFinished && !isSubmitted) {
            startTimer(currentUjianType);
        }

        // Update status info di modal juga
        updateStatusInfoModal();

        console.log(`📝 Ujian ${currentUjianType} dimuat - ${totalSoal} soal (Aktif: ${isEnabled})`);
    }

    function updateStatusInfoModal() {
        const pretestStatus = document.getElementById('pretestStatusInfoModal');
        const posttestStatus = document.getElementById('posttestStatusInfoModal');
        
        if (pretestStatus) {
            const isActive = isUjianAktif('pretest');
            pretestStatus.textContent = isActive ? '✅ AKTIF' : '🔴 NONAKTIF';
            pretestStatus.style.color = isActive ? '#059669' : '#dc2626';
        }
        
        if (posttestStatus) {
            const isActive = isUjianAktif('posttest');
            posttestStatus.textContent = isActive ? '✅ AKTIF' : '🔴 NONAKTIF';
            posttestStatus.style.color = isActive ? '#059669' : '#dc2626';
        }
    }

    // ============================================================
    // SWITCH UJIAN TYPE
    // ============================================================

    function switchUjianType(type) {
        if (ujianState[currentUjianType].started && !ujianState[currentUjianType].finished) {
            if (!confirm(`⚠️ Ujian ${currentUjianType === 'pretest' ? 'Pretest' : 'Posttest'} sedang berlangsung! Beralih akan menghentikan ujian. Lanjutkan?`)) {
                return;
            }
            if (ujianState[currentUjianType].timer) {
                clearInterval(ujianState[currentUjianType].timer);
                ujianState[currentUjianType].timer = null;
            }
        }

        currentUjianType = type;
        renderUjian();
        console.log(`📌 Beralih ke ujian: ${type}`);
    }

    // ============================================================
    // UJIAN FUNCTIONS
    // ============================================================

    function pilihJawaban(type, soalId, jawaban) {
        const state = ujianState[type];
        if (state.finished || !state.started) return;
        if (hasSubmitted[type]) return;

        state.jawaban[soalId] = jawaban;
        updateProgress(type);

        const soalItem = document.getElementById(`soal-${soalId}`);
        if (soalItem) {
            const options = soalItem.querySelectorAll('.option-item');
            options.forEach(opt => {
                const radio = opt.querySelector('input[type="radio"]');
                if (radio && radio.value === jawaban) {
                    opt.classList.add('selected');
                } else {
                    opt.classList.remove('selected');
                }
            });
        }

        console.log(`📝 Jawaban soal ${soalId} (${type}): ${jawaban}`);
    }

    function updateProgress(type) {
        const state = ujianState[type];
        const soal = getSoalByJenis(type);
        const totalSoal = soal.length;
        const terjawab = Object.keys(state.jawaban).length;
        const progress = totalSoal > 0 ? (terjawab / totalSoal) * 100 : 0;

        const progressFill = document.getElementById('progressFill');
        const progressText = document.getElementById('progressText');
        const jawabanCount = document.getElementById('jawabanCount');

        if (progressFill) progressFill.style.width = `${Math.min(progress, 100)}%`;
        if (progressText) progressText.textContent = `${Math.round(progress)}%`;
        if (jawabanCount) jawabanCount.textContent = `${terjawab}/${totalSoal} terjawab`;
    }

    // ============================================================
    // START UJIAN - DENGAN CEK STATUS
    // ============================================================

    function startUjian(type) {
        if (ujianState[type].started) return;
        if (hasSubmitted[type]) {
            showToast('warning', '⚠️ Anda sudah mengikuti ujian ini!');
            return;
        }

        // CEK APAKAH UJIAN AKTIF DARI ADMIN
        loadUjianStatus();
        const isActive = isUjianAktif(type);
        
        if (!isActive) {
            const label = type === 'pretest' ? 'Pretest' : 'Posttest';
            showToast('error', `⚠️ Ujian ${label} sedang NONAKTIF!`);
            alert(`⚠️ Ujian ${label} saat ini sedang NONAKTIF.\n\nSilakan tunggu admin mengaktifkan ujian terlebih dahulu.`);
            return;
        }

        const soal = getSoalByJenis(type);
        if (soal.length === 0) {
            showToast('error', '⚠️ Tidak ada soal untuk ujian ini!');
            return;
        }

        const label = type === 'pretest' ? 'Pretest' : 'Posttest';
        const durasi = type === 'pretest' ? '30 menit' : '60 menit';

        if (confirm(`Apakah Anda siap memulai ujian ${label}? Durasi: ${durasi}. Timer akan berjalan dan tidak dapat dihentikan!`)) {
            ujianState[type].started = true;
            ujianState[type].finished = false;
            ujianState[type].jawaban = {};
            ujianState[type].timeLeft = type === 'pretest' ? CONFIG.pretestDuration : CONFIG.posttestDuration;

            renderUjian();
            startTimer(type);
            showToast('success', `⏱️ Ujian ${label} dimulai! Selamat mengerjakan.`);
            console.log(`⏱️ Ujian ${label} dimulai`);
        }
    }

    function startTimer(type) {
        const state = ujianState[type];
        if (state.timer) {
            clearInterval(state.timer);
        }

        state.timer = setInterval(() => {
            state.timeLeft--;

            const timerDisplay = document.getElementById('timerDisplay');
            if (timerDisplay) {
                timerDisplay.textContent = formatTime(state.timeLeft);

                if (state.timeLeft < 300) {
                    timerDisplay.classList.add('warning');
                } else {
                    timerDisplay.classList.remove('warning');
                }
            }

            if (state.timeLeft <= 0) {
                clearInterval(state.timer);
                state.timer = null;
                const label = type === 'pretest' ? 'Pretest' : 'Posttest';
                alert(`⏰ Waktu ujian ${label} telah habis!`);
                executeSubmitUjian(type);
            }
        }, 1000);
    }

    function formatTime(seconds) {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    }

    // ============================================================
    // SUBMIT UJIAN
    // ============================================================

    function submitUjian(type) {
        const state = ujianState[type];
        
        if (state.finished) {
            showToast('warning', '⚠️ Ujian ini sudah selesai!');
            return;
        }

        if (!state.started) {
            showToast('error', '⚠️ Ujian belum dimulai!');
            return;
        }

        if (hasSubmitted[type]) {
            showToast('warning', '⚠️ Anda sudah mengikuti ujian ini!');
            return;
        }

        const soal = getSoalByJenis(type);
        const totalSoal = soal.length;
        const terjawab = Object.keys(state.jawaban).length;
        const label = type === 'pretest' ? 'Pretest' : 'Posttest';

        if (confirm(`⚠️ Apakah Anda yakin ingin menyelesaikan ujian ${label}?\n\n` +
            `📊 Statistik:\n` +
            `   Total Soal: ${totalSoal}\n` +
            `   Terjawab: ${terjawab}\n` +
            `   Belum Terjawab: ${totalSoal - terjawab}\n` +
            `   Waktu Tersisa: ${formatTime(state.timeLeft)}\n\n` +
            `${totalSoal - terjawab > 0 ? '⚠️ Ada soal yang belum dijawab!' : '✅ Semua soal sudah terjawab!'}\n\n` +
            `Tindakan ini tidak dapat dibatalkan!`)) {

            executeSubmitUjian(type);
        }
    }

    function executeSubmitUjian(type) {
        const state = ujianState[type];
        state.finished = true;
        hasSubmitted[type] = true;

        if (state.timer) {
            clearInterval(state.timer);
            state.timer = null;
        }

        const soal = getSoalByJenis(type);
        const totalSoal = soal.length;
        const benar = hitungBenar(type);
        const label = type === 'pretest' ? 'Pretest' : 'Posttest';
        const nilai = Math.round((benar / totalSoal) * 100);
        const status = nilai >= 70 ? 'LULUS' : 'TIDAK LULUS';

        const totalDurasi = type === 'pretest' ? CONFIG.pretestDuration : CONFIG.posttestDuration;
        const waktuPengerjaan = totalDurasi - state.timeLeft;

        // Simpan hasil
        saveHasilUjian({
            type: type,
            label: label,
            totalSoal: totalSoal,
            benar: benar,
            salah: totalSoal - benar,
            nilai: nilai,
            status: status,
            waktuPengerjaan: waktuPengerjaan,
            sisaWaktu: state.timeLeft,
            tanggal: new Date().toISOString(),
            guru: guruProfile.nama,
            nip: guruProfile.nip,
            sekolah: guruProfile.nama_sekolah
        });

        showResultModal(
            `📊 Hasil Ujian ${label}`,
            `
            <div style="text-align:center;">
                <div style="font-size:3em;margin-bottom:8px;">${nilai >= 70 ? '🎉' : '💪'}</div>
                <h3 style="color:#1a2a3a;margin-bottom:4px;">Ujian ${label} Selesai!</h3>
                <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin:12px 0;padding:8px;background:#f8fafc;border-radius:8px;">
                    <div><div style="font-size:0.65em;color:#8a9aa8;">Total Soal</div><div style="font-size:1.2em;font-weight:700;">${totalSoal}</div></div>
                    <div><div style="font-size:0.65em;color:#8a9aa8;">Benar</div><div style="font-size:1.2em;font-weight:700;color:#059669;">${benar}</div></div>
                    <div><div style="font-size:0.65em;color:#8a9aa8;">Salah</div><div style="font-size:1.2em;font-weight:700;color:#dc2626;">${totalSoal - benar}</div></div>
                </div>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:12px 0;padding:8px;background:#f8fafc;border-radius:8px;">
                    <div><div style="font-size:0.65em;color:#8a9aa8;">Nilai</div><div style="font-size:1.8em;font-weight:700;color:${nilai >= 70 ? '#059669' : '#dc2626'};">${nilai}</div></div>
                    <div><div style="font-size:0.65em;color:#8a9aa8;">Status</div><div style="background:${nilai >= 70 ? '#d1fae5' : '#fee2e2'};padding:6px;border-radius:6px;margin-top:2px;"><span style="font-weight:700;color:${nilai >= 70 ? '#059669' : '#dc2626'};">${status}</span></div></div>
                </div>
                <div style="font-size:0.8em;color:var(--text-muted);margin-top:8px;padding:8px;background:#fef3c7;border-radius:6px;border:1px solid #fcd34d;">
                    ⚠️ Ujian ini hanya dapat diikuti <strong>1 kali</strong>. Hasil tidak dapat diubah.
                </div>
            </div>
            `,
            function() {
                renderUjian();
                showToast('info', `📋 Ujian ${label} telah selesai`);
            }
        );

        console.log(`📊 Hasil Ujian ${label}: ${benar}/${totalSoal} benar (${nilai}%) - ${status}`);
    }

    function hitungBenar(type) {
        const soal = getSoalByJenis(type);
        const jawaban = ujianState[type].jawaban;
        let benar = 0;

        soal.forEach(soal => {
            if (jawaban[soal.id] === soal.jawaban) {
                benar++;
            }
        });

        return benar;
    }

    function resetUjian(type) {
        const label = type === 'pretest' ? 'Pretest' : 'Posttest';
        if (confirm(`Reset ujian ${label}? Semua jawaban akan dihapus dan Anda dapat mengikuti ulang.`)) {
            const state = ujianState[type];
            state.started = false;
            state.finished = false;
            state.timeLeft = type === 'pretest' ? CONFIG.pretestDuration : CONFIG.posttestDuration;
            state.jawaban = {};
            hasSubmitted[type] = false;
            if (state.timer) {
                clearInterval(state.timer);
                state.timer = null;
            }
            renderUjian();
            showToast('info', `🔄 Ujian ${label} telah direset`);
        }
    }

    // ============================================================
    // SAVE HASIL UJIAN
    // ============================================================

    function saveHasilUjian(data) {
        try {
            let hasilUjian = [];
            const stored = localStorage.getItem(CONFIG.hasilKey);
            if (stored) {
                hasilUjian = JSON.parse(stored);
            }

            // Cek duplikat (hindari double submit)
            const exists = hasilUjian.some(h => 
                h.guru === data.guru && 
                h.type === data.type && 
                h.tanggal === data.tanggal
            );

            if (exists) {
                console.log('⚠️ Hasil ujian sudah tersimpan, skip duplikasi');
                return true;
            }

            hasilUjian.push({
                id: Date.now(),
                type: data.type,
                label: data.label,
                totalSoal: data.totalSoal,
                benar: data.benar,
                salah: data.salah,
                nilai: data.nilai,
                status: data.status,
                waktuPengerjaan: data.waktuPengerjaan,
                sisaWaktu: data.sisaWaktu,
                tanggal: data.tanggal,
                guru: data.guru || 'Guru',
                nip: data.nip || '-',
                sekolah: data.sekolah || '-'
            });

            localStorage.setItem(CONFIG.hasilKey, JSON.stringify(hasilUjian));
            console.log('✅ Hasil ujian berhasil disimpan');
            return true;
        } catch (e) {
            console.error('❌ Gagal menyimpan hasil ujian:', e);
            return false;
        }
    }

    // ============================================================
    // MODAL HASIL
    // ============================================================

    function showResultModal(title, message, onOk) {
        let modal = document.getElementById('modalResult');
        
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'modalResult';
            modal.className = 'modal-overlay';
            modal.innerHTML = `
                <div class="modal">
                    <div class="modal-header" style="justify-content:center;border-bottom:none;padding-bottom:0;">
                        <h2 id="resultTitle" style="text-align:center;">Hasil Ujian</h2>
                    </div>
                    <div class="modal-message" id="resultMessage"></div>
                    <div class="modal-actions">
                        <button class="btn btn-primary" id="resultOkBtn" style="min-width:140px;">✅ OK</button>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
        }

        document.getElementById('resultTitle').textContent = title || 'Hasil Ujian';
        document.getElementById('resultMessage').innerHTML = message || 'Hasil ujian Anda';

        const okBtn = document.getElementById('resultOkBtn');
        const newOkBtn = okBtn.cloneNode(true);
        okBtn.parentNode.replaceChild(newOkBtn, okBtn);

        newOkBtn.addEventListener('click', function() {
            closeResultModal();
            if (typeof onOk === 'function') {
                onOk();
            }
        });

        modal.classList.add('show');
    }

    function closeResultModal() {
        const modal = document.getElementById('modalResult');
        if (modal) {
            modal.classList.remove('show');
        }
    }

    // ============================================================
    // TOAST NOTIFICATION
    // ============================================================

    function showToast(type, message) {
        const toast = document.getElementById('toast');
        if (!toast) return;
        toast.className = `toast ${type}`;
        const msgElement = toast.querySelector('.toast-message');
        if (msgElement) {
            msgElement.textContent = message;
        } else {
            toast.textContent = message;
        }
        toast.classList.add('show');

        clearTimeout(toast._timeout);
        toast._timeout = setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }

    // ============================================================
    // FILTER SOAL
    // ============================================================

    function filterSoal(filter) {
        renderSoal(filter);
    }

    // ============================================================
    // CETAK HASIL & SERTIFIKAT
    // ============================================================

    function printHasil() {
        window.print();
    }

    function printSertifikat() {
        const profile = guruProfile || { nama: 'Guru', nip: '-', nuptk: '-', nama_sekolah: '-' };
        const peserta = getPesertaFromStorage();
        const skorList = peserta.filter(p => p.skor > 0).map(p => p.skor);
        const avgSkor = skorList.length > 0 ? Math.round(skorList.reduce((a, b) => a + b, 0) / skorList.length) : 0;
        const status = avgSkor >= 70 ? 'LULUS' : 'TIDAK LULUS';
        const statusColor = avgSkor >= 70 ? '#059669' : '#dc2626';

        const certContent = `
            <div style="padding:40px;text-align:center;font-family:Arial,sans-serif;border:5px double #059669;border-radius:20px;max-width:700px;margin:20px auto;background:white;">
                <div style="font-size:3em;margin-bottom:10px;">📜</div>
                <h1 style="color:#059669;font-size:2em;margin-bottom:5px;">SERTIFIKAT</h1>
                <h2 style="color:#1a2a3a;font-size:1.4em;margin-bottom:20px;">Ujian Kompetensi Guru</h2>
                <hr style="border:1px solid #eef2f7;margin:20px 0;">
                <p style="font-size:1.1em;color:#6b7a8a;">Diberikan kepada:</p>
                <h3 style="font-size:1.8em;color:#1a2a3a;margin:10px 0;">${profile.nama}</h3>
                <p style="color:#6b7a8a;">NIP: ${profile.nip}</p>
                <p style="color:#6b7a8a;">NUPTK: ${profile.nuptk}</p>
                <p style="color:#6b7a8a;">Sekolah: ${profile.nama_sekolah}</p>
                <hr style="border:1px solid #eef2f7;margin:20px 0;">
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin:20px 0;text-align:center;">
                    <div style="background:#f8fafc;padding:15px;border-radius:10px;">
                        <div style="font-size:0.8em;color:#8a9aa8;">Total Peserta</div>
                        <div style="font-size:2em;font-weight:700;color:#1a2a3a;">${peserta.length}</div>
                    </div>
                    <div style="background:#f8fafc;padding:15px;border-radius:10px;">
                        <div style="font-size:0.8em;color:#8a9aa8;">Rata-rata Nilai</div>
                        <div style="font-size:2em;font-weight:700;color:#1a2a3a;">${avgSkor}</div>
                    </div>
                </div>
                <div style="background:${statusColor}22;padding:15px;border-radius:10px;margin:10px 0;border:2px solid ${statusColor};">
                    <span style="font-size:1.2em;font-weight:700;color:${statusColor};">✅ ${status}</span>
                </div>
                <hr style="border:1px solid #eef2f7;margin:20px 0;">
                <p style="font-size:0.8em;color:#8a9aa8;">
                    Diterbitkan oleh: Sistem Ujian Online<br>
                    Tanggal: ${new Date().toLocaleDateString('id-ID', { day:'numeric', month:'long', year:'numeric' })}
                </p>
            </div>
        `;

        const win = window.open('', '_blank', 'width=800,height=600');
        if (win) {
            win.document.write(`
                <html>
                    <head><title>Sertifikat - Ujian Online</title></head>
                    <body style="margin:0;padding:0;display:flex;justify-content:center;align-items:center;min-height:100vh;background:#f0f4f8;">
                        ${certContent}
                        <script>setTimeout(() => { window.print(); }, 500);</script>
                    </body>
                </html>
            `);
            win.document.close();
        } else {
            alert('⚠️ Mohon izinkan pop-up untuk mencetak sertifikat.');
        }
    }

    // ============================================================
    // HANDLE LOGOUT
    // ============================================================

    function handleLogout() {
        if (confirm('Apakah Anda yakin ingin keluar?')) {
            for (const type of ['pretest', 'posttest']) {
                if (ujianState[type].timer) {
                    clearInterval(ujianState[type].timer);
                }
            }
            clearSession();
            window.location.href = CONFIG.loginUrl;
        }
    }

    // ============================================================
    // KEYBOARD SHORTCUTS
    // ============================================================

    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeResultModal();
        }
    });

    // ============================================================
    // INIT
    // ============================================================

    function init() {
        if (!checkGuruSession()) {
            return;
        }

        console.log('👨‍🏫 Guru Dashboard loaded');
        console.log('📌 Login sebagai:', currentUser.name);

        // Load status ujian dari Admin
        loadUjianStatus();

        renderTest();
        renderUjian();

        // Expose functions globally
        window.switchTab = switchTab;
        window.filterSoal = filterSoal;
        window.printHasil = printHasil;
        window.printSertifikat = printSertifikat;
        window.handleLogout = handleLogout;
        window.startUjian = startUjian;
        window.submitUjian = submitUjian;
        window.pilihJawaban = pilihJawaban;
        window.resetUjian = resetUjian;
        window.switchUjianType = switchUjianType;
        window.renderUjian = renderUjian;
        window.renderTest = renderTest;
        window.closeResultModal = closeResultModal;
        window.loadUjianStatus = loadUjianStatus;

        const data = getDataFromStorage();
        if (data) {
            console.log(`📊 Data dari localStorage:`);
            console.log(`  👤 User: ${data.userData ? data.userData.length : 0}`);
            console.log(`  👥 Peserta: ${data.pesertaData ? data.pesertaData.length : 0}`);
            console.log(`  📝 Soal: ${data.soalData ? data.soalData.length : 0}`);
        }

        console.log('✅ Guru Dashboard ready');
        console.log('📋 2 Halaman: Test (Profil + Soal) dan Ujian');
        console.log(`⏱️ Pretest: ${CONFIG.pretestDuration/60} menit | Posttest: ${CONFIG.posttestDuration/60} menit`);
        console.log('📋 Status ujian terintegrasi dengan Admin');
        console.log('💡 Shortcut: Escape = Tutup modal');
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
