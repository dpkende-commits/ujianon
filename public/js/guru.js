// ============================================================
// GURU DASHBOARD JS - Ujian Online System
// VERSI: 3.3.0 - STABIL, ANTI-REFRESH, AUTO-SYNC
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
        pretestDuration: 1800,   // 30 menit
        posttestDuration: 3600   // 60 menit
    };

    // ============================================================
    // STATE
    // ============================================================
    let currentUser = null;
    let guruProfile = null;
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
    // STORAGE & PERSISTENCE FUNCTIONS
    // ============================================================

    function getDataFromStorage() {
        try {
            const stored = localStorage.getItem(CONFIG.storageKey);
            return stored ? JSON.parse(stored) : null;
        } catch (e) {
            console.error('❌ Gagal mengambil data:', e);
            return null;
        }
    }

    function getGuruProfile(username) {
        const data = getDataFromStorage();
        if (data && data.userData) {
            const user = data.userData.find(u => u.username === username && u.role === 'guru' && u.status === 'active');
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
        return { nama: 'Guru', nip: '-', nuptk: '-', tempat_lahir: '-', tanggal_lahir: '-', nama_sekolah: '-', mapel: '-', username: username || 'guru' };
    }

    function getSoalFromStorage() {
        const data = getDataFromStorage();
        return (data && data.soalData) ? data.soalData : [];
    }

    function getSoalByJenis(jenis) {
        const semuaSoal = getSoalFromStorage();
        return jenis === 'all' ? semuaSoal : semuaSoal.filter(s => s.jenis === jenis);
    }

    // --- BARU: Simpan & Muat State Ujian (Anti-Refresh) ---
    function saveExamStateToSession() {
        if (!currentUser) return;
        const stateToSave = {
            ujianState: {
                pretest: { ...ujianState.pretest, timer: null }, // Jangan simpan objek interval
                posttest: { ...ujianState.posttest, timer: null }
            },
            hasSubmitted: hasSubmitted
        };
        sessionStorage.setItem(`examState_${currentUser.username}`, JSON.stringify(stateToSave));
    }

    function loadExamStateFromSession() {
        if (!currentUser) return;
        const saved = sessionStorage.getItem(`examState_${currentUser.username}`);
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                ujianState = parsed.ujianState;
                hasSubmitted = parsed.hasSubmitted;
                
                // Restart timer jika ujian sedang berlangsung saat refresh
                if (ujianState.pretest.started && !ujianState.pretest.finished && !hasSubmitted.pretest) {
                    startTimer('pretest');
                }
                if (ujianState.posttest.started && !ujianState.posttest.finished && !hasSubmitted.posttest) {
                    startTimer('posttest');
                }
                console.log('✅ State ujian dipulihkan dari session (Anti-Refresh)');
            } catch (e) {
                console.error('❌ Gagal memulihkan state ujian:', e);
            }
        }
    }

    function clearExamStateFromSession() {
        if (currentUser) {
            sessionStorage.removeItem(`examState_${currentUser.username}`);
        }
    }

    // ============================================================
    // UJIAN STATUS
    // ============================================================

    function loadUjianStatus() {
        try {
            const stored = localStorage.getItem(CONFIG.ujianStatusKey);
            if (stored) {
                ujianStatus = JSON.parse(stored);
            } else {
                ujianStatus = { pretest: false, posttest: false };
            }
            return ujianStatus;
        } catch (e) {
            console.error('❌ Gagal load status ujian:', e);
            return { pretest: false, posttest: false };
        }
    }

    function isUjianAktif(type) {
        return ujianStatus[type] === true;
    }

    // ============================================================
    // SESSION
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
        if (!session || session.user.role !== 'guru') {
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
            if (guruProfile.tempat_lahir && guruProfile.tempat_lahir !== '-') ttlParts.push(guruProfile.tempat_lahir);
            if (guruProfile.tanggal_lahir && guruProfile.tanggal_lahir !== '-') {
                try {
                    const date = new Date(guruProfile.tanggal_lahir);
                    if (!isNaN(date.getTime())) {
                        ttlParts.push(date.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }));
                    } else {
                        ttlParts.push(guruProfile.tanggal_lahir);
                    }
                } catch(e) {
                    ttlParts.push(guruProfile.tanggal_lahir);
                }
            }
            if (ttlParts.length > 0) ttlDisplay = ttlParts.join(', ');
        }
        if (elements.guruTempatLahir) elements.guruTempatLahir.innerHTML = `<span class="ttl-date">${ttlDisplay}</span>`;
        if (elements.guruSekolah) elements.guruSekolah.textContent = guruProfile.nama_sekolah;
        if (elements.guruMapel) elements.guruMapel.textContent = '📖 ' + guruProfile.mapel;

        const initial = guruProfile.nama.charAt(0).toUpperCase();
        if (elements.guruAvatar) elements.guruAvatar.textContent = initial;
        if (elements.guruAvatarNav) elements.guruAvatarNav.textContent = initial;
        if (elements.guruNameNav) elements.guruNameNav.textContent = guruProfile.nama;
    }

    function renderSoal(filter = 'all') {
        soalFilter = filter;
        allSoal = getSoalFromStorage();

        const pretestSoal = allSoal.filter(s => s.jenis === 'pretest');
        const posttestSoal = allSoal.filter(s => s.jenis === 'posttest');

        updateBadge('pretest', pretestSoal);
        updateBadge('posttest', posttestSoal);

        if (elements.pretestCount) elements.pretestCount.textContent = pretestSoal.length;
        if (elements.posttestCount) elements.posttestCount.textContent = posttestSoal.length;
        if (elements.pretestAktif) elements.pretestAktif.textContent = `Aktif: ${pretestSoal.length}`;
        if (elements.posttestAktif) elements.posttestAktif.textContent = `Aktif: ${posttestSoal.length}`;

        renderSoalList(filter);

        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.filter === filter);
        });
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
            elements.pretestSoalList.innerHTML = pretestFiltered.length === 0 
                ? `<div class="soal-item"><div class="soal-info"><div class="soal-question" style="color:#8a9aa8;">Belum ada soal pretest dari Admin</div></div></div>`
                : pretestFiltered.map(s => `
                    <div class="soal-item">
                        <div class="soal-info">
                            <div class="soal-question">${s.pertanyaan || 'Soal tanpa teks'}</div>
                            <div class="soal-meta">
                                <span class="soal-type pretest">PRETEST</span>
                                <span>ID: SOAL-${String(s.id).padStart(3, '0')}</span>
                            </div>
                        </div>
                        <span class="soal-status ${s.status || 'aktif'}">${(s.status || 'aktif').toUpperCase()}</span>
                    </div>
                `).join('');
        }

        if (elements.posttestSoalList) {
            elements.posttestSoalList.innerHTML = posttestFiltered.length === 0 
                ? `<div class="soal-item"><div class="soal-info"><div class="soal-question" style="color:#8a9aa8;">Belum ada soal posttest dari Admin</div></div></div>`
                : posttestFiltered.map(s => `
                    <div class="soal-item">
                        <div class="soal-info">
                            <div class="soal-question">${s.pertanyaan || 'Soal tanpa teks'}</div>
                            <div class="soal-meta">
                                <span class="soal-type posttest">POSTTEST</span>
                                <span>ID: SOAL-${String(s.id).padStart(3, '0')}</span>
                            </div>
                        </div>
                        <span class="soal-status ${s.status || 'aktif'}">${(s.status || 'aktif').toUpperCase()}</span>
                    </div>
                `).join('');
        }
    }

    // ============================================================
    // RENDER UJIAN
    // ============================================================

    function renderUjian() {
        const container = elements.ujianContainer;
        if (!container) return;

        loadUjianStatus();

        const pretestSoal = getSoalByJenis('pretest');
        const posttestSoal = getSoalByJenis('posttest');
        const totalPretest = pretestSoal.length;
        const totalPosttest = posttestSoal.length;

        const pretestEnabled = isUjianAktif('pretest');
        const posttestEnabled = isUjianAktif('posttest');
        const pretestSubmitted = hasSubmitted.pretest;
        const posttestSubmitted = hasSubmitted.posttest;

        if (totalPretest === 0 && totalPosttest === 0) {
            container.innerHTML = `
                <div class="ujian-header"><h3>📝 Ujian</h3></div>
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
        const waktuLabel = currentUjianType === 'pretest' ? '30 Menit' : '60 Menit';

        let statusInfoHtml = '';
        if (isSubmitted) {
            statusInfoHtml = `<div class="ujian-status-info completed"><span class="status-icon">✅</span><span>Ujian <strong>${currentUjianType === 'pretest' ? 'Pretest' : 'Posttest'}</strong> telah <strong>SELESAI</strong>.</span></div>`;
        } else if (!isEnabled && totalSoal > 0) {
            statusInfoHtml = `<div class="ujian-status-info inactive"><span class="status-icon">🔴</span><span>Ujian <strong>${currentUjianType === 'pretest' ? 'Pretest' : 'Posttest'}</strong> sedang <strong>NONAKTIF</strong> oleh Admin.</span></div>`;
        } else if (isEnabled && totalSoal > 0 && !isSubmitted) {
            statusInfoHtml = `<div class="ujian-status-info active"><span class="status-icon">🟢</span><span>Ujian <strong>${currentUjianType === 'pretest' ? 'Pretest' : 'Posttest'}</strong> sedang <strong>AKTIF</strong>. Silakan mulai.</span></div>`;
        }

        let soalHtml = '';
        if (totalSoal === 0) {
            soalHtml = `<div class="no-data"><div class="no-data-icon">📝</div><div class="no-data-title">Belum ada soal ${currentUjianType} dari Admin</div></div>`;
        } else {
            const isDisabled = isSubmitted || isFinished || !isEnabled || !isStarted;
            soalHtml = currentSoal.map((soal, index) => {
                const selected = currentState.jawaban[soal.id] || '';
                return `
                <div class="ujian-soal-item" id="soal-${soal.id}">
                    <div class="soal-text"><span class="soal-number">${index + 1}.</span> ${soal.pertanyaan || 'Soal tanpa teks'}</div>
                    <div class="soal-options">
                        <label class="option-item ${selected === 'A' ? 'selected' : ''}">
                            <input type="radio" name="soal_${soal.id}" value="A" onchange="pilihJawaban('${currentUjianType}', ${soal.id}, 'A')" ${isDisabled ? 'disabled' : ''} ${selected === 'A' ? 'checked' : ''}>
                            <span class="option-label">A.</span><span class="option-text">${soal.a || '-'}</span>
                        </label>
                        <label class="option-item ${selected === 'B' ? 'selected' : ''}">
                            <input type="radio" name="soal_${soal.id}" value="B" onchange="pilihJawaban('${currentUjianType}', ${soal.id}, 'B')" ${isDisabled ? 'disabled' : ''} ${selected === 'B' ? 'checked' : ''}>
                            <span class="option-label">B.</span><span class="option-text">${soal.b || '-'}</span>
                        </label>
                        ${soal.c && soal.c !== '-' ? `<label class="option-item ${selected === 'C' ? 'selected' : ''}">
                            <input type="radio" name="soal_${soal.id}" value="C" onchange="pilihJawaban('${currentUjianType}', ${soal.id}, 'C')" ${isDisabled ? 'disabled' : ''} ${selected === 'C' ? 'checked' : ''}>
                            <span class="option-label">C.</span><span class="option-text">${soal.c}</span>
                        </label>` : ''}
                        ${soal.d && soal.d !== '-' ? `<label class="option-item ${selected === 'D' ? 'selected' : ''}">
                            <input type="radio" name="soal_${soal.id}" value="D" onchange="pilihJawaban('${currentUjianType}', ${soal.id}, 'D')" ${isDisabled ? 'disabled' : ''} ${selected === 'D' ? 'checked' : ''}>
                            <span class="option-label">D.</span><span class="option-text">${soal.d}</span>
                        </label>` : ''}
                    </div>
                </div>`;
            }).join('');
        }

        const terjawab = Object.keys(currentState.jawaban).length;
        const progress = totalSoal > 0 ? (terjawab / totalSoal) * 100 : 0;

        let actionButtons = '';
        if (isSubmitted) {
            actionButtons = `<span style="color:#059669;font-weight:600;font-size:0.9em;">✅ Ujian Selesai</span>
                             <button class="btn btn-outline btn-sm" onclick="resetUjian('${currentUjianType}')">🔄 Reset</button>`;
        } else if (!isStarted && !isFinished && totalSoal > 0 && isEnabled) {
            actionButtons = `<button class="btn btn-primary btn-sm" onclick="startUjian('${currentUjianType}')" id="startUjianBtn">▶️ Mulai Ujian</button>`;
        } else if (isStarted && !isFinished && totalSoal > 0 && isEnabled) {
            actionButtons = `<button class="btn btn-success btn-sm" onclick="submitUjian('${currentUjianType}')" id="submitUjianBtn">📤 Selesai & Kirim</button>`;
        } else if (!isEnabled && totalSoal > 0 && !isSubmitted) {
            actionButtons = `<span style="color:#dc2626;font-weight:600;font-size:0.9em;">🔴 Nonaktif</span>`;
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
                        📋 Pretest <span class="type-badge pretest">${totalPretest} Soal</span>
                        <span class="type-status ${pretestEnabled ? 'active' : 'inactive'}">${pretestEnabled ? '✅ Aktif' : '🔴 Nonaktif'}</span>
                        ${pretestSubmitted ? '<span class="type-status completed">✅ Selesai</span>' : ''}
                    </button>
                    <button class="ujian-type-btn ${currentUjianType === 'posttest' ? 'active' : ''}" onclick="switchUjianType('posttest')">
                        📝 Posttest <span class="type-badge posttest">${totalPosttest} Soal</span>
                        <span class="type-status ${posttestEnabled ? 'active' : 'inactive'}">${posttestEnabled ? '✅ Aktif' : '🔴 Nonaktif'}</span>
                        ${posttestSubmitted ? '<span class="type-status completed">✅ Selesai</span>' : ''}
                    </button>
                </div>
                ${statusInfoHtml}
                ${soalHtml}
            </div>
            <div class="ujian-footer">
                <div class="ujian-progress">
                    <span id="jawabanCount">${terjawab}/${totalSoal} terjawab</span>
                    <div class="progress-bar"><div class="progress-fill" id="progressFill" style="width:${Math.min(progress, 100)}%"></div></div>
                    <span id="progressText">${Math.round(progress)}%</span>
                </div>
                <div class="ujian-actions">
                    ${isFinished && !isSubmitted ? `<button class="btn btn-outline btn-sm" onclick="resetUjian('${currentUjianType}')">🔄 Ulangi</button>` : ''}
                </div>
            </div>
        `;

        if (isStarted && !isFinished && !isSubmitted) {
            startTimer(currentUjianType);
        }
        updateStatusInfoModal();
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
    }

    // ============================================================
    // UJIAN FUNCTIONS
    // ============================================================

    function pilihJawaban(type, soalId, jawaban) {
        const state = ujianState[type];
        if (state.finished || !state.started || hasSubmitted[type]) return;

        state.jawaban[soalId] = jawaban;
        saveExamStateToSession(); // Simpan progres
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

    function startUjian(type) {
        if (ujianState[type].started || hasSubmitted[type]) return;

        loadUjianStatus();
        if (!isUjianAktif(type)) {
            showToast('error', `⚠️ Ujian ${type === 'pretest' ? 'Pretest' : 'Posttest'} sedang NONAKTIF!`);
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
            
            saveExamStateToSession();
            renderUjian();
            startTimer(type);
            showToast('success', `⏱️ Ujian ${label} dimulai! Selamat mengerjakan.`);
        }
    }

    function startTimer(type) {
        const state = ujianState[type];
        if (state.timer) clearInterval(state.timer);

        state.timer = setInterval(() => {
            state.timeLeft--;
            saveExamStateToSession(); // Update waktu tersisa di session
            
            const timerDisplay = document.getElementById('timerDisplay');
            if (timerDisplay) {
                timerDisplay.textContent = formatTime(state.timeLeft);
                if (state.timeLeft < 300) { // Kurang dari 5 menit
                    timerDisplay.style.color = '#dc2626';
                    timerDisplay.style.fontWeight = 'bold';
                }
            }
            
            if (state.timeLeft <= 0) {
                clearInterval(state.timer);
                state.timer = null;
                showToast('error', '⏰ Waktu ujian telah habis! Jawaban otomatis dikirim.');
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

    function submitUjian(type) {
        const state = ujianState[type];
        if (state.finished || !state.started || hasSubmitted[type]) return;

        const soal = getSoalByJenis(type);
        const totalSoal = soal.length;
        const terjawab = Object.keys(state.jawaban).length;
        const label = type === 'pretest' ? 'Pretest' : 'Posttest';

        if (confirm(`⚠️ Apakah Anda yakin ingin menyelesaikan ujian ${label}?\n\n` +
            `📊 Statistik:\nTotal Soal: ${totalSoal}\nTerjawab: ${terjawab}\nBelum Terjawab: ${totalSoal - terjawab}\nWaktu Tersisa: ${formatTime(state.timeLeft)}\n\n` +
            `${totalSoal - terjawab > 0 ? '⚠️ Ada soal yang belum dijawab!' : '✅ Semua soal sudah terjawab!'}\n\nTindakan ini tidak dapat dibatalkan!`)) {
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
        const nilai = totalSoal > 0 ? Math.round((benar / totalSoal) * 100) : 0;
        const status = nilai >= 70 ? 'LULUS' : 'TIDAK LULUS';

        const totalDurasi = type === 'pretest' ? CONFIG.pretestDuration : CONFIG.posttestDuration;
        const waktuPengerjaan = totalDurasi - state.timeLeft;

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

        // Hapus state ujian dari session karena sudah selesai
        clearExamStateFromSession();

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
            </div>
            `,
            function() {
                renderUjian();
                showToast('info', `📋 Ujian ${label} telah selesai dan disimpan.`);
            }
        );
    }

    function hitungBenar(type) {
        const soal = getSoalByJenis(type);
        const jawaban = ujianState[type].jawaban;
        let benar = 0;
        soal.forEach(s => {
            if (jawaban[s.id] === s.jawaban) benar++;
        });
        return benar;
    }

    function resetUjian(type) {
        const label = type === 'pretest' ? 'Pretest' : 'Posttest';
        if (confirm(`⚠️ Reset ujian ${label}? Semua jawaban dan progres akan dihapus. Lanjutkan?`)) {
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
            clearExamStateFromSession();
            renderUjian();
            showToast('info', `🔄 Ujian ${label} telah direset.`);
        }
    }

    // ============================================================
    // SAVE HASIL UJIAN (DIPERBAIKI: CEK HARI, BUKAN DETIK)
    // ============================================================

    function saveHasilUjian(data) {
        try {
            let hasilUjian = [];
            const stored = localStorage.getItem(CONFIG.hasilKey);
            if (stored) hasilUjian = JSON.parse(stored);

            // PERBAIKAN: Cek duplikasi berdasarkan Tanggal (YYYY-MM-DD), bukan timestamp penuh
            const today = new Date().toISOString().split('T')[0];
            const exists = hasilUjian.some(h => 
                h.guru === data.guru && 
                h.type === data.type && 
                h.tanggal.startsWith(today)
            );

            if (exists) {
                console.warn('⚠️ Hasil ujian untuk hari ini sudah tersimpan, skip duplikasi.');
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
    // MODAL & TOAST
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
            if (typeof onOk === 'function') onOk();
        });

        modal.classList.add('show');
    }

    function closeResultModal() {
        const modal = document.getElementById('modalResult');
        if (modal) modal.classList.remove('show');
    }

    function showToast(type, message) {
        const toast = document.getElementById('toast');
        if (!toast) return;
        toast.className = `toast ${type}`;
        const msgElement = toast.querySelector('.toast-message');
        if (msgElement) msgElement.textContent = message;
        else toast.textContent = message;
        
        toast.classList.add('show');
        clearTimeout(toast._timeout);
        toast._timeout = setTimeout(() => toast.classList.remove('show'), 3000);
    }

    // ============================================================
    // FILTER & CETAK
    // ============================================================

    function filterSoal(filter) {
        renderSoal(filter);
    }

    function printHasil() {
        window.print();
    }

    function printSertifikat() {
        const profile = guruProfile || { nama: 'Guru', nip: '-', nuptk: '-', nama_sekolah: '-' };
        // Catatan: Di sistem nyata, data peserta harusnya diambil dari tabel khusus, bukan dari localStorage global
        // Ini hanya simulasi berdasarkan data yang ada
        const data = getDataFromStorage();
        const peserta = data ? (data.pesertaData || []) : [];
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
                        <div style="font-size:0.8em;color:#8a9aa8;">Rata-rata Nilai Sistem</div>
                        <div style="font-size:2em;font-weight:700;color:#1a2a3a;">${avgSkor}</div>
                    </div>
                    <div style="background:#f8fafc;padding:15px;border-radius:10px;">
                        <div style="font-size:0.8em;color:#8a9aa8;">Tanggal Terbit</div>
                        <div style="font-size:1.2em;font-weight:700;color:#1a2a3a;">${new Date().toLocaleDateString('id-ID')}</div>
                    </div>
                </div>
                <div style="background:${statusColor}22;padding:15px;border-radius:10px;margin:10px 0;border:2px solid ${statusColor};">
                    <span style="font-size:1.2em;font-weight:700;color:${statusColor};">✅ ${status}</span>
                </div>
            </div>
        `;

        const win = window.open('', '_blank', 'width=800,height=600');
        if (win) {
            win.document.write(`<html><head><title>Sertifikat</title></head><body style="margin:0;padding:0;display:flex;justify-content:center;align-items:center;min-height:100vh;background:#f0f4f8;">${certContent}<script>setTimeout(() => { window.print(); }, 500);<\/script></body></html>`);
            win.document.close();
        } else {
            alert('⚠️ Mohon izinkan pop-up untuk mencetak sertifikat.');
        }
    }

    function handleLogout() {
        if (confirm('Apakah Anda yakin ingin keluar?')) {
            for (const type of ['pretest', 'posttest']) {
                if (ujianState[type].timer) clearInterval(ujianState[type].timer);
            }
            clearExamStateFromSession();
            clearSession();
            window.location.href = CONFIG.loginUrl;
        }
    }

    // ============================================================
    // EVENT LISTENERS (ANTI-CURANG & AUTO-SYNC)
    // ============================================================

    // 1. Peringatan jika pindah tab saat ujian berlangsung
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            const isExamRunning = (ujianState.pretest.started && !ujianState.pretest.finished) || 
                                  (ujianState.posttest.started && !ujianState.posttest.finished);
            if (isExamRunning) {
                console.warn('⚠️ Pengguna meninggalkan tab saat ujian berlangsung!');
                // Opsional: Bisa ditambahkan log pelanggaran atau pengurangan nilai di sini
            }
        }
    });

    // 2. Auto-Sync jika Admin mengubah data di tab/browser yang sama
    window.addEventListener('storage', (e) => {
        if (e.key === CONFIG.storageKey || e.key === CONFIG.ujianStatusKey) {
            console.log('🔄 Data diperbarui oleh proses lain (Admin). Menyinkronkan...');
            loadUjianStatus();
            renderTest();
            renderUjian();
            showToast('info', '🔄 Data soal atau status ujian diperbarui oleh Admin!');
        }
    });

    // 3. Keyboard Shortcuts
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeResultModal();
        }
    });

    // ============================================================
    // INIT
    // ============================================================

    async function init() {
        if (!checkGuruSession()) return;

        console.log('👨‍🏫 Guru Dashboard loaded');
        console.log('📌 Login sebagai:', currentUser.name);

        // 1. Muat State Ujian (Anti-Refresh)
        loadExamStateFromSession();

        // 2. Load Data dari GitHub (Jika tersedia)
        try {
            if (typeof loadDataFromGitHub === 'function') {
                const loaded = await loadDataFromGitHub();
                if (loaded) {
                    console.log('✅ Data berhasil disinkronisasi dari GitHub');
                    showToast('success', '☁️ Data berhasil disinkronisasi dari GitHub!');
                }
            }
        } catch (error) {
            console.error('❌ Gagal sync dari GitHub:', error);
        }

        // 3. Load Status Ujian & Render
        loadUjianStatus();
        renderTest();
        renderUjian();

        // 4. Update UI Sync Status
        const syncStatus = document.getElementById('syncStatus');
        if (syncStatus && typeof getSyncStatus === 'function') {
            syncStatus.textContent = getSyncStatus();
        }

        // 5. Expose Functions Globally
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
        
        if (typeof loadDataFromGitHub === 'function') window.loadDataFromGitHub = loadDataFromGitHub;
        if (typeof saveDataToGitHub === 'function') window.saveDataToGitHub = saveDataToGitHub;
        if (typeof getSyncStatus === 'function') window.getSyncStatus = getSyncStatus;

        console.log('✅ Guru Dashboard ready');
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();