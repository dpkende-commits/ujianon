// ============================================================
// FIREBASE CRUD - Fungsi untuk menyimpan data di cloud
// ============================================================

// ============================================================
// SIMPAN DATA (Admin)
// ============================================================
async function saveDataToFirebase(data) {
    try {
        const user = auth.currentUser;
        if (!user) {
            console.warn('⚠️ User belum login!');
            return false;
        }

        const dataRef = doc(db, 'ujian_data', user.uid);
        await setDoc(dataRef, {
            ...data,
            updatedAt: new Date().toISOString()
        });

        console.log('✅ Data berhasil disimpan ke Firebase!');
        return true;
    } catch (error) {
        console.error('❌ Gagal simpan ke Firebase:', error);
        return false;
    }
}

// ============================================================
// AMBIL DATA
// ============================================================
async function loadDataFromFirebase() {
    try {
        const user = auth.currentUser;
        if (!user) {
            console.warn('⚠️ User belum login!');
            return null;
        }

        const dataRef = doc(db, 'ujian_data', user.uid);
        const docSnap = await getDoc(dataRef);

        if (docSnap.exists()) {
            console.log('✅ Data berhasil dimuat dari Firebase');
            return docSnap.data();
        } else {
            console.log('ℹ️ Tidak ada data di Firebase');
            return null;
        }
    } catch (error) {
        console.error('❌ Gagal ambil data dari Firebase:', error);
        return null;
    }
}

// ============================================================
// LOGIN
// ============================================================
async function loginWithEmail(email, password) {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        console.log('✅ Login berhasil:', userCredential.user.email);
        return userCredential.user;
    } catch (error) {
        console.error('❌ Login gagal:', error.message);
        alert('❌ Login gagal: ' + error.message);
        return null;
    }
}

// ============================================================
// REGISTRASI
// ============================================================
async function registerWithEmail(email, password) {
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        console.log('✅ Registrasi berhasil:', userCredential.user.email);
        return userCredential.user;
    } catch (error) {
        console.error('❌ Registrasi gagal:', error.message);
        alert('❌ Registrasi gagal: ' + error.message);
        return null;
    }
}

// ============================================================
// LOGOUT
// ============================================================
async function logoutUser() {
    try {
        await signOut(auth);
        console.log('✅ Logout berhasil');
        window.location.href = '../../public/login.html';
    } catch (error) {
        console.error('❌ Logout gagal:', error);
    }
}

// ============================================================
// CEK STATUS LOGIN (Auto)
// ============================================================
function onAuthStateChangedListener(callback) {
    onAuthStateChanged(auth, callback);
}

// ============================================================
// EXPOSE KE WINDOW
// ============================================================
window.saveDataToFirebase = saveDataToFirebase;
window.loadDataFromFirebase = loadDataFromFirebase;
window.loginWithEmail = loginWithEmail;
window.registerWithEmail = registerWithEmail;
window.logoutUser = logoutUser;
window.onAuthStateChangedListener = onAuthStateChangedListener;

console.log('🔥 Firebase CRUD siap digunakan!');