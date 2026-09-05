// ============================================================
// GITHUB SYNC - Sinkronisasi Data Antar Perangkat
// ============================================================

const GITHUB_CONFIG = {
    // ============================================================
    // ⚠️ GANTI DENGAN DATA REPO KAMU ⚠️
    // ============================================================
    owner: 'dpkende-commits',        // Username GitHub kamu
    repo: 'ujianon',                 // Nama repository
    path: 'data/data.json',          // Path file data.json
    branch: 'main',                  // Branch utama
    token: '' // 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
};

// ============================================================
// AMBIL DATA DARI GITHUB
// ============================================================
async function loadDataFromGitHub() {
    try {
        const url = `https://raw.githubusercontent.com/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/${GITHUB_CONFIG.branch}/${GITHUB_CONFIG.path}`;
        console.log('📥 Mengambil data dari GitHub...');
        
        const response = await fetch(url);
        
        if (!response.ok) {
            console.warn('⚠️ Gagal mengambil data dari GitHub (status:', response.status, ')');
            return false;
        }
        
        const data = await response.json();
        
        // Simpan ke localStorage
        localStorage.setItem('ujianOnlineData', JSON.stringify(data));
        
        if (data.ujianStatus) {
            localStorage.setItem('ujianStatus', JSON.stringify(data.ujianStatus));
        }
        
        if (data.hasilUjianData) {
            localStorage.setItem('hasilUjianData', JSON.stringify(data.hasilUjianData));
        }
        
        console.log('✅ Data berhasil dimuat dari GitHub, updatedAt:', data.updatedAt);
        return true;
    } catch (error) {
        console.error('❌ Gagal load data dari GitHub:', error);
        return false;
    }
}

// ============================================================
// AMBIL SHA FILE (untuk update)
// ============================================================
async function getFileSha() {
    try {
        const url = `https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/contents/${GITHUB_CONFIG.path}`;
        const response = await fetch(url, {
            headers: {
                'Accept': 'application/vnd.github.v3+json'
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            return data.sha;
        }
        return null;
    } catch (error) {
        console.warn('⚠️ Gagal mendapatkan SHA:', error);
        return null;
    }
}

// ============================================================
// SIMPAN DATA KE GITHUB
// ============================================================
async function saveDataToGitHub() {
    // Cek token
    if (!GITHUB_CONFIG.token || GITHUB_CONFIG.token === '') {
        alert('⚠️ Token GitHub belum diisi!\n\n' +
              '1. Buka public/js/github-sync.js\n' +
              '2. Isi GITHUB_CONFIG.token dengan token dari GitHub\n' +
              '3. Upload ulang file ke repository');
        return false;
    }
    
    try {
        // Ambil data dari localStorage
        const ujianData = JSON.parse(localStorage.getItem('ujianOnlineData') || '{}');
        const ujianStatus = JSON.parse(localStorage.getItem('ujianStatus') || '{"pretest":false,"posttest":false}');
        const hasilUjian = JSON.parse(localStorage.getItem('hasilUjianData') || '[]');
        
        // Gabungkan semua data
        const fullData = {
            ...ujianData,
            ujianStatus: ujianStatus,
            hasilUjianData: hasilUjian,
            updatedAt: new Date().toISOString()
        };
        
        // Dapatkan SHA file
        const sha = await getFileSha();
        
        const url = `https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/contents/${GITHUB_CONFIG.path}`;
        
        const response = await fetch(url, {
            method: 'PUT',
            headers: {
                'Authorization': `token ${GITHUB_CONFIG.token}`,
                'Content-Type': 'application/json',
                'Accept': 'application/vnd.github.v3+json'
            },
            body: JSON.stringify({
                message: `Update data ${new Date().toLocaleString('id-ID')}`,
                content: btoa(unescape(encodeURIComponent(JSON.stringify(fullData, null, 2)))),
                sha: sha,
                branch: GITHUB_CONFIG.branch
            })
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Gagal menyimpan ke GitHub');
        }
        
        console.log('✅ Data berhasil disimpan ke GitHub');
        alert('✅ Data berhasil disimpan ke GitHub!');
        return true;
    } catch (error) {
        console.error('❌ Gagal simpan ke GitHub:', error);
        alert('❌ Gagal menyimpan ke GitHub: ' + error.message);
        return false;
    }
}

// ============================================================
// CEK STATUS SINKRONISASI
// ============================================================
function getSyncStatus() {
    try {
        const data = JSON.parse(localStorage.getItem('ujianOnlineData') || '{}');
        if (data.updatedAt) {
            const date = new Date(data.updatedAt);
            return `🔄 Terakhir sync: ${date.toLocaleString('id-ID')}`;
        }
        return '🔄 Belum sync ke GitHub';
    } catch (e) {
        return '🔄 Belum sync ke GitHub';
    }
}

// ============================================================
// INISIALISASI
// ============================================================
async function initGitHubSync() {
    await loadDataFromGitHub();
    
    // Update status di UI
    const syncStatus = document.getElementById('syncStatus');
    if (syncStatus) {
        syncStatus.textContent = getSyncStatus();
    }
}

// ============================================================
// EXPOSE FUNCTIONS
// ============================================================
window.loadDataFromGitHub = loadDataFromGitHub;
window.saveDataToGitHub = saveDataToGitHub;
window.initGitHubSync = initGitHubSync;
window.getSyncStatus = getSyncStatus;