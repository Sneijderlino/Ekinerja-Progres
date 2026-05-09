// --- GHOST-SEC ANTI-PIRACY CORE ---
const SALT = "SNEJDER_PRO_2026";

function generateUUID() {
    const storageKey = 'ghost_device_id';
    const storedId = localStorage.getItem(storageKey);
    if (storedId) {
        return storedId;
    }

    let randomPart = '';
    if (window.crypto && typeof crypto.randomUUID === 'function') {
        randomPart = crypto.randomUUID();
    } else if (window.crypto && typeof crypto.getRandomValues === 'function') {
        const array = new Uint8Array(16);
        crypto.getRandomValues(array);
        randomPart = Array.from(array, (b) => ('0' + b.toString(16)).slice(-2)).join('');
    } else {
        randomPart = Math.random().toString(36).slice(2) + Date.now().toString(36);
    }

    const deviceId = 'GHOST-' + randomPart.replace(/[^A-Za-z0-9]/g, '').substring(0, 24).toUpperCase();
    localStorage.setItem(storageKey, deviceId);
    return deviceId;
}

function checkLicense() {
    const uuid = document.getElementById('display-uuid').innerText;
    const input = document.getElementById('input-license').value.trim();
    
    // Algoritma Validasi: key harus persis sama dengan base64(UUID + SALT) 16 karakter pertama
    const validKey = btoa(uuid + SALT).substring(0, 16).toUpperCase();
    const isValid = input === validKey;

    if (isValid) {
        localStorage.setItem('ghost_pro_activated', 'true');
        showToast("SYSTEM ACTIVATED!");
        unlockApp();
    } else {
        alert("ACCESS DENIED: KODE LISENSI SALAH!");
    }
}

function copyDeviceId() {
    const uuidElement = document.getElementById('display-uuid');
    const deviceId = uuidElement ? uuidElement.innerText.trim() : '';
    if (!deviceId || deviceId === 'MENGAMBIL DATA...') {
        return showToast('ID perangkat belum tersedia.');
    }

    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(deviceId).then(() => {
            alert('ID tersalin, kirimkan ke admin 082292964110');
        }).catch(() => {
            fallbackCopyText(deviceId);
        });
    } else {
        fallbackCopyText(deviceId);
    }
}

function fallbackCopyText(text) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.left = '-9999px';
    document.body.appendChild(textarea);
    textarea.select();
    try {
        document.execCommand('copy');
        alert('ID tersalin, kirimkan ke admin 082292964110');
    } catch (err) {
        alert('Gagal menyalin ID perangkat. Silakan salin secara manual.');
    }
    document.body.removeChild(textarea);
}

function unlockApp() {
    document.getElementById('license-screen').style.display = 'none';
    document.getElementById('app-shell').style.visibility = 'visible';
    document.getElementById('loading-overlay').style.display = 'flex';
    
    setTimeout(() => {
        document.getElementById('loading-overlay').style.opacity = '0';
        setTimeout(() => {
            document.getElementById('loading-overlay').style.display = 'none';
            // Check login setelah loading selesai
            checkLoginAccess();
        }, 500);
    }, 1500);
}

// Helper function untuk mendapatkan current user (robust dengan fallback)
function getCurrentLoginUser() {
    try {
        let currentUser = null;
        
        if (window.EkinAuth && typeof window.EkinAuth.getCurrentUser === 'function') {
            currentUser = window.EkinAuth.getCurrentUser();
        }
        
        if (!currentUser) {
            try {
                const session = localStorage.getItem('ekin_session');
                if (session) {
                    currentUser = JSON.parse(session);
                }
            } catch (e) {
                console.warn('Could not parse session from localStorage:', e);
            }
        }
        
        return currentUser;
    } catch (error) {
        console.error('Error getting current user:', error);
        return null;
    }
}

function checkLoginAccess() {
    const currentUser = getCurrentLoginUser();
    
    if (!currentUser) {
        console.warn('No user session found');
        alert('Harap login terlebih dahulu untuk mengakses fitur input laporan!');
        window.location.href = 'login.html';
        return;
    }
    
    // User sudah login - allow access
    console.log('✓ User ' + currentUser.username + ' berhasil mengakses fitur input');
}


const inputs = ['in-instansi', 'in-kab', 'in-kota', 'in-gmail', 'in-nama', 'in-nip', 'in-jabatan', 'in-uraian', 'in-report-title', 'in-report-subtitle'];


const ttdInputs = ['in-ttd-tempat', 'in-ttd-tanggal', 'in-ttd-jabatan', 'in-ttd-nama', 'in-ttd-pangkat', 'in-ttd-nip'];
let savedReportFilter = { query: '', type: 'all' };

const REPORT_DB_NAME = 'EkinLaporanDB';
const REPORT_DB_VERSION = 1;
const REPORT_STORE_NAME = 'laporan_store';
let reportDB = null;
let reportDBReady = false;
let savedReportsCache = {};
let pendingReportWrites = [];

function openReportDB() {
    return new Promise((resolve, reject) => {
        if (!window.indexedDB) {
            console.warn('IndexedDB tidak tersedia. fallback ke localStorage.');
            return reject(new Error('IndexedDB tidak tersedia'));
        }

        const request = indexedDB.open(REPORT_DB_NAME, REPORT_DB_VERSION);

        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains(REPORT_STORE_NAME)) {
                db.createObjectStore(REPORT_STORE_NAME, { keyPath: 'key' });
            }
        };

        request.onsuccess = (event) => {
            reportDB = event.target.result;
            reportDBReady = true;
            reportDB.onversionchange = () => reportDB.close();
            resolve(reportDB);
        };

        request.onerror = () => reject(request.error);
    });
}

function persistReportData(key, reports) {
    if (!window.indexedDB) {
        return;
    }

    if (!reportDBReady || !reportDB) {
        pendingReportWrites.push({ key, reports });
        return;
    }

    try {
        const tx = reportDB.transaction(REPORT_STORE_NAME, 'readwrite');
        const store = tx.objectStore(REPORT_STORE_NAME);
        store.put({ key, reports });

        tx.onerror = () => {
            console.warn('Gagal menyimpan laporan ke IndexedDB.', tx.error);
            localStorage.setItem(key, JSON.stringify(reports));
        };
    } catch (err) {
        console.warn('IndexedDB write error:', err);
        localStorage.setItem(key, JSON.stringify(reports));
    }
}

function loadReportCacheForUser(user) {
    return new Promise((resolve) => {
        if (!user || !reportDBReady || !reportDB) {
            const localReports = JSON.parse(localStorage.getItem(`laporan_${user ? user.username : ''}`) || '[]');
            if (user) {
                savedReportsCache[`laporan_${user.username}`] = localReports;
            }
            return resolve();
        }

        const key = `laporan_${user.username}`;
        try {
            const tx = reportDB.transaction(REPORT_STORE_NAME, 'readonly');
            const store = tx.objectStore(REPORT_STORE_NAME);
            const request = store.get(key);

            request.onsuccess = () => {
                const result = request.result;
                if (result && Array.isArray(result.reports)) {
                    savedReportsCache[key] = result.reports;
                } else {
                    const localData = JSON.parse(localStorage.getItem(key) || '[]');
                    savedReportsCache[key] = localData;
                    if (localData.length) persistReportData(key, localData);
                }
                resolve();
            };

            request.onerror = () => {
                savedReportsCache[key] = JSON.parse(localStorage.getItem(key) || '[]');
                resolve();
            };
        } catch (err) {
            savedReportsCache[key] = JSON.parse(localStorage.getItem(key) || '[]');
            resolve();
        }
    });
}

function initReportStorage() {
    const user = getCurrentLoginUser();
    if (!window.indexedDB) {
        console.warn('IndexedDB tidak didukung di browser ini.');
        return Promise.resolve();
    }

    return openReportDB()
        .then(() => loadReportCacheForUser(user))
        .then(() => {
            pendingReportWrites.forEach(({ key, reports }) => persistReportData(key, reports));
            pendingReportWrites = [];
        })
        .catch((error) => {
            console.warn('Inisialisasi IndexedDB gagal:', error);
        });
}

function getSavedReports() {
    const currentUser = getCurrentLoginUser();
    if (!currentUser) return [];
    const key = `laporan_${currentUser.username}`;
    if (Object.prototype.hasOwnProperty.call(savedReportsCache, key)) {
        return savedReportsCache[key];
    }
    const reports = JSON.parse(localStorage.getItem(key) || '[]');
    savedReportsCache[key] = reports;
    return reports;
}

function setSavedReports(reports) {
    const currentUser = getCurrentLoginUser();
    if (!currentUser) return;
    const key = `laporan_${currentUser.username}`;
    savedReportsCache[key] = reports;
    localStorage.setItem(key, JSON.stringify(reports));
    persistReportData(key, reports);
}

function normalizeValue(value) {
    return (value || '').toString().trim().toLowerCase();
}

function isEmptyValue(value) {
    return !value || !value.toString().trim();
}

function showToast(msg) {
    const toast = document.getElementById('toast');
    toast.innerText = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2500);
}

inputs.forEach(id => {
    const el = document.getElementById(id);
    if(el) {
        el.addEventListener('input', function() {
            const outId = id.replace('in-', 'out-');
            let val = this.value;
            if (['in-nama', 'in-instansi', 'in-kab'].includes(id)) val = val.toUpperCase();
            if (document.getElementById(outId)) {
                document.getElementById(outId).innerText = val || "-";
            }
        });
    }
});

ttdInputs.forEach(id => {
    const el = document.getElementById(id);
    if(el) {
        el.addEventListener('input', function() {
            updateTtdPreview();
        });
    }
});

function getTodayDateValue() {
    return new Date().toISOString().slice(0, 10);
}

function updateTanggal() {
    const dateInput = document.getElementById('in-report-date');
    const useCustom = document.getElementById('use-custom-date')?.checked;
    let dateValue = getTodayDateValue();

    if (useCustom && dateInput && dateInput.value) {
        dateValue = dateInput.value;
    }

    const tanggal = new Date(dateValue).toLocaleDateString('id-ID', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
    document.getElementById('out-tanggal').innerText = tanggal;
}

function previewLogo(input) {
    if (input.files && input.files[0]) {
        try {
            const reader = new FileReader();
            reader.onload = (e) => {
                const base64Logo = e.target.result;
                document.getElementById('out-logo').src = base64Logo;
                localStorage.setItem('ghost_logo', base64Logo);
                showToast('Foto berhasil ditambahkan!');
            };
            reader.onerror = () => {
                showToast('Error: File logo terlalu besar atau tidak valid. Coba file yang lebih kecil.');
            };
            reader.readAsDataURL(input.files[0]);
        } catch (error) {
            showToast('Error: Gagal memuat logo. Ukuran file mungkin terlalu besar.');
        }
    }
}

function lockIdentity() {
    const data = {
        nama: document.getElementById('in-nama').value,
        nip: document.getElementById('in-nip').value,
        jabatan: document.getElementById('in-jabatan').value
    };
    if(!data.nama || !data.nip) return alert("Isi nama dan NIP dulu!");
    localStorage.setItem('ghost_identity_new', JSON.stringify(data));
    renderIdentity();
    showToast("Profil Pegawai Berhasil Dikunci!");
}

function unlockIdentity() {
    document.getElementById('identitas-display').style.display = 'none';
    document.getElementById('identitas-inputs').style.display = 'block';
}

function lockKop() {
    const data = {
        instansi: document.getElementById('in-instansi').value,
        kab: document.getElementById('in-kab').value,
        kota: document.getElementById('in-kota').value,
        gmail: document.getElementById('in-gmail').value
    };


    localStorage.setItem('ghost_kop', JSON.stringify(data));
    renderKop();
    showToast("Kop Instansi Berhasil Dikunci!");
}

function updateTtdPreview() {
    const tempat = document.getElementById('in-ttd-tempat')?.value || 'Tiakur';
    const tanggalVal = document.getElementById('in-ttd-tanggal')?.value;
    const jabatan = document.getElementById('in-ttd-jabatan')?.value || '';
    const nama = document.getElementById('in-ttd-nama')?.value || '-';
    const pangkat = document.getElementById('in-ttd-pangkat')?.value || '-';
    const nip = document.getElementById('in-ttd-nip')?.value || '-';

    const outTempat = document.getElementById('out-ttd-tempat');
    const outTanggal = document.getElementById('out-ttd-tanggal');
    const outJabatan = document.getElementById('out-ttd-jabatan');
    const outNama = document.getElementById('out-ttd-nama');
    const outPangkat = document.getElementById('out-ttd-pangkat');
    const outNip = document.getElementById('out-ttd-nip');

    if (outTempat) outTempat.innerText = tempat;
    if (outTanggal) {
        if (tanggalVal) {
            outTanggal.innerText = new Date(tanggalVal).toLocaleDateString('id-ID', {
                weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
            });
        } else {
            outTanggal.innerText = new Date().toLocaleDateString('id-ID', {
                weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
            });
        }
    }
    if (outJabatan) outJabatan.innerHTML = jabatan.replace(/\n/g, '<br>') || '-';
    if (outNama) outNama.innerText = nama;
    if (outPangkat) outPangkat.innerText = pangkat;
    if (outNip) outNip.innerText = nip;
}

function lockTtd() {
    const data = {
        tempat: document.getElementById('in-ttd-tempat').value,
        tanggal: document.getElementById('in-ttd-tanggal').value,
        jabatan: document.getElementById('in-ttd-jabatan').value,
        nama: document.getElementById('in-ttd-nama').value,
        pangkat: document.getElementById('in-ttd-pangkat').value,
        nip: document.getElementById('in-ttd-nip').value
    };
    if (!data.nama || !data.nip) return alert("Isi nama dan NIP pejabat penandatangan dulu!");
    localStorage.setItem('ghost_ttd', JSON.stringify(data));
    renderTtd();
    showToast("Tanda Tangan Berhasil Dikunci!");
}

function unlockTtd() {
    document.getElementById('ttd-display').style.display = 'none';
    document.getElementById('ttd-inputs').style.display = 'block';
}

function renderTtd() {
    const saved = localStorage.getItem('ghost_ttd');
    if (saved) {
        const data = JSON.parse(saved);
        document.getElementById('txt-ttd-nama').innerText = data.nama ? data.nama.toUpperCase() : '-';
        document.getElementById('txt-ttd-jabatan').innerText = (data.jabatan || '-').replace(/\n/g, ', ');

        document.getElementById('in-ttd-tempat').value = data.tempat || 'Tiakur';
        document.getElementById('in-ttd-tanggal').value = data.tanggal || '';
        document.getElementById('in-ttd-jabatan').value = data.jabatan || '';
        document.getElementById('in-ttd-nama').value = data.nama || '';
        document.getElementById('in-ttd-pangkat').value = data.pangkat || '';
        document.getElementById('in-ttd-nip').value = data.nip || '';

        document.getElementById('ttd-display').style.display = 'block';
        document.getElementById('ttd-inputs').style.display = 'none';
    } else {
        document.getElementById('ttd-display').style.display = 'none';
        document.getElementById('ttd-inputs').style.display = 'block';
    }
    updateTtdPreview();
}

function toggleTtdFeature() {
    const checkbox = document.getElementById('use-ttd-feature');
    const wrapper = document.getElementById('ttd-section-wrapper');
    const previewBlock = document.getElementById('out-ttd-block');
    const isEnabled = checkbox ? checkbox.checked : false;

    localStorage.setItem('ghost_ttd_enabled', isEnabled ? 'true' : 'false');

    if (wrapper) wrapper.style.display = isEnabled ? 'block' : 'none';
    if (previewBlock) {
        if (isEnabled) {
            previewBlock.classList.remove('hidden');
        } else {
            previewBlock.classList.add('hidden');
        }
    }
}

function renderTtdFeatureState() {
    const checkbox = document.getElementById('use-ttd-feature');
    const wrapper = document.getElementById('ttd-section-wrapper');
    const previewBlock = document.getElementById('out-ttd-block');
    const isEnabled = localStorage.getItem('ghost_ttd_enabled') === 'true';

    if (checkbox) checkbox.checked = isEnabled;
    if (wrapper) wrapper.style.display = isEnabled ? 'block' : 'none';
    if (previewBlock) {
        if (isEnabled) {
            previewBlock.classList.remove('hidden');
        } else {
            previewBlock.classList.add('hidden');
        }
    }
}

function previewTtdImage(input) {
    if (input.files && input.files[0]) {
        try {
            const reader = new FileReader();
            reader.onload = async (e) => {
                const base64 = e.target.result;
                const compressed = await compressImageDataUrl(base64, 400, 200, 0.8);
                localStorage.setItem('ghost_ttd_image', compressed);
                renderTtdImagePreview();
                showToast('Foto tanda tangan berhasil ditambahkan!');
            };
            reader.onerror = () => {
                showToast('Error: File tanda tangan terlalu besar atau tidak valid. Coba file yang lebih kecil.');
            };
            reader.readAsDataURL(input.files[0]);
        } catch (error) {
            showToast('Error: Gagal memuat tanda tangan. Ukuran file mungkin terlalu besar.');
        }
    }
}

function renderTtdImagePreview() {
    const container = document.getElementById('out-ttd-image');
    const saved = localStorage.getItem('ghost_ttd_image');
    if (container) {
        if (saved) {
            container.innerHTML = `<img src="${saved}" alt="Tanda Tangan" />`;
        } else {
            container.innerHTML = '<span class="ttd-image-placeholder">(Tanda tangan)</span>';
        }
    }
    const previewName = document.getElementById('ttd-image-preview-name');
    if (previewName) {
        previewName.innerText = saved ? 'Foto tanda tangan telah dipilih.' : '';
    }
}

function clearTtdImage() {
    if (!confirm('Anda yakin ingin menghapus foto tanda tangan?')) return;
    localStorage.removeItem('ghost_ttd_image');
    renderTtdImagePreview();
    const fileInput = document.getElementById('in-ttd-image');
    if (fileInput) fileInput.value = '';
}

function addTask() {
    const input = document.getElementById('task-input');
    const value = input.value.trim();
    if (!value) return alert('Masukkan item kegiatan terlebih dahulu.');

    const tasks = JSON.parse(localStorage.getItem('ghost_tasks') || '[]');
    tasks.push(value);
    localStorage.setItem('ghost_tasks', JSON.stringify(tasks));
    input.value = '';
    renderTaskList();
    showToast('Item kegiatan berhasil ditambahkan!');
}

function clearReportPhotos() {
    ['img1', 'img2', 'img3', 'img4'].forEach((targetId) => {
        const previewBox = document.getElementById(targetId);
        if (previewBox) previewBox.innerText = targetId.toUpperCase();
        const uploadBox = document.querySelector(`.upload-box[data-target="${targetId}"]`);
        if (uploadBox) uploadBox.classList.remove('uploaded');
        const fileInput = document.getElementById(targetId.replace('img', 'f'));
        if (fileInput) fileInput.value = '';
    });
}

function isQuotaExceeded(error) {
    return error && (
        error.name === 'QuotaExceededError' ||
        error.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
        error.code === 22 ||
        error.code === 1014 ||
        (error.message && error.message.toLowerCase().includes('quota'))
    );
}

function compressImageDataUrl(dataUrl, maxWidth = 1200, maxHeight = 1200, quality = 0.75) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            const ratio = Math.min(1, maxWidth / img.width, maxHeight / img.height);
            const width = Math.round(img.width * ratio);
            const height = Math.round(img.height * ratio);
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);
            try {
                const compressed = canvas.toDataURL('image/jpeg', quality);
                resolve(compressed);
            } catch (err) {
                resolve(dataUrl);
            }
        };
        img.onerror = () => reject(new Error('Gagal memproses foto.'));
        img.src = dataUrl;
    });
}

async function compressReportPhotos(photoSrcs) {
    const compressed = [];
    for (const src of photoSrcs) {
        if (!src) continue;
        try {
            // Compress dengan dimensi lebih kecil untuk menghemat storage
            compressed.push(await compressImageDataUrl(src, 600, 600, 0.6));
        } catch (err) {
            compressed.push(src);
        }
    }
    return compressed;
}

function getReportPhotoSources() {
    return ['img1', 'img2', 'img3', 'img4']
        .flatMap((id) => Array.from(document.querySelectorAll(`#${id} img`)).map((img) => img.src || ''))
        .filter(Boolean);
}

function resetReportForm(preserveTitleSubtitle = false) {
    if (!preserveTitleSubtitle) {
        document.getElementById('in-report-title').value = '';
        document.getElementById('in-report-subtitle').value = '';
        document.getElementById('out-report-title').innerText = '-';
        document.getElementById('out-report-subtitle').innerText = '-';
    } else {
        const titleValue = document.getElementById('in-report-title').value.trim();
        const subtitleValue = document.getElementById('in-report-subtitle').value.trim();
        document.getElementById('out-report-title').innerText = titleValue || '-';
        document.getElementById('out-report-subtitle').innerText = subtitleValue || '-';
    }

    const dateInput = document.getElementById('in-report-date');
    const customCheckbox = document.getElementById('use-custom-date');
    if (dateInput) {
        dateInput.value = getTodayDateValue();
        dateInput.disabled = true;
    }
    if (customCheckbox) {
        customCheckbox.checked = false;
    }
    document.getElementById('in-uraian').value = '';
    document.getElementById('task-input').value = '';
    updateTanggal();
    localStorage.setItem('ghost_tasks', JSON.stringify([]));
    renderTaskList();
    clearReportPhotos();

    // Data TTD sengaja tidak direset agar tetap tersimpan untuk laporan baru
    renderTtd();
    renderTtdImagePreview();
}

function startNewReport() {
    resetReportForm(true);
    showToast('Form laporan baru siap diisi.');
}

function editTask(index) {
    const tasks = JSON.parse(localStorage.getItem('ghost_tasks') || '[]');
    const newValue = prompt('Ubah detail kegiatan:', tasks[index]);
    if (newValue === null) return;
    const trimmed = newValue.trim();
    if (!trimmed) return alert('Isi tidak boleh kosong.');
    tasks[index] = trimmed;
    localStorage.setItem('ghost_tasks', JSON.stringify(tasks));
    renderTaskList();
    showToast('Item kegiatan berhasil diperbarui!');
}

function deleteTask(index) {
    if (!confirm('Anda yakin ingin menghapus item kegiatan ini?')) return;
    const tasks = JSON.parse(localStorage.getItem('ghost_tasks') || '[]');
    tasks.splice(index, 1);
    localStorage.setItem('ghost_tasks', JSON.stringify(tasks));
    renderTaskList();
    showToast('Item kegiatan berhasil dihapus!');
}

async function saveReport() {
    const currentUser = getCurrentLoginUser();
    if (!currentUser) {
        alert('Harap login terlebih dahulu untuk menyimpan laporan!');
        window.location.href = 'login.html';
        return;
    }
    const dateInput = document.getElementById('in-report-date');
    const ttdData = {
        tempat: document.getElementById('in-ttd-tempat').value.trim(),
        tanggal: document.getElementById('in-ttd-tanggal').value,
        jabatan: document.getElementById('in-ttd-jabatan').value.trim(),
        nama: document.getElementById('in-ttd-nama').value.trim(),
        pangkat: document.getElementById('in-ttd-pangkat').value.trim(),
        nip: document.getElementById('in-ttd-nip').value.trim(),
        image: localStorage.getItem('ghost_ttd_image') || ''
    };
    const report = {
        id: Date.now(),
        title: document.getElementById('in-report-title').value.trim(),
        subtitle: document.getElementById('in-report-subtitle').value.trim(),
        date: dateInput && dateInput.value ? dateInput.value : getTodayDateValue(),
        nama: document.getElementById('in-nama').value.trim(),
        nip: document.getElementById('in-nip').value.trim(),
        jabatan: document.getElementById('in-jabatan').value.trim(),
        instansi: document.getElementById('in-instansi').value.trim(),
        kab: document.getElementById('in-kab').value.trim(),
        kota: document.getElementById('in-kota').value.trim(),
        uraian: document.getElementById('in-uraian').value.trim(),
        tasks: JSON.parse(localStorage.getItem('ghost_tasks') || '[]'),
        logo: localStorage.getItem('ghost_logo') || document.getElementById('out-logo').src,
        photos: await compressReportPhotos(getReportPhotoSources()),
        ttd: ttdData,
        ttdEnabled: document.getElementById('use-ttd-feature')?.checked || false,
        createdAt: new Date().toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })
    };

    if (isEmptyValue(report.title)) {
        return alert('Isi judul laporan sebelum menyimpan.');
    }
    if (isEmptyValue(report.subtitle)) {
        return alert('Isi subjudul laporan sebelum menyimpan.');
    }
    if (isEmptyValue(report.date)) {
        return alert('Pilih tanggal laporan terlebih dahulu.');
    }
    if (isEmptyValue(report.nama) || isEmptyValue(report.nip)) {
        return alert('Isi nama dan NIP dulu sebelum menyimpan laporan!');
    }
    if (isEmptyValue(report.instansi) || isEmptyValue(report.kab) || isEmptyValue(report.kota)) {
        return alert('Lengkapi data instansi sebelum menyimpan laporan!');
    }
    if (isEmptyValue(report.uraian)) {
        return alert('Tuliskan uraian kegiatan sebelum menyimpan laporan!');
    }

    const savedReports = getSavedReports();
    savedReports.unshift(report);

    try {
        setSavedReports(savedReports);
    } catch (err) {
        if (isQuotaExceeded(err)) {
            // Hapus beberapa laporan lama jika penyimpanan gagal karena quota
            let deletedCount = 0;
            while (savedReports.length > 1 && deletedCount < 3) {
                savedReports.splice(1, 1); // Hapus laporan terlama (index 1)
                deletedCount++;
                try {
                    setSavedReports(savedReports);
                    showToast(`Laporan tersimpan. ${deletedCount} laporan lama dihapus untuk menghemat ruang penyimpanan.`);
                    return;
                } catch (retryErr) {
                    if (!isQuotaExceeded(retryErr)) throw retryErr;
                    // Lanjut ke loop untuk hapus lebih banyak
                }
            }
            return alert('Penyimpanan gagal: ruang penyimpanan penuh. Silakan hapus beberapa laporan secara manual.');
        } else {
            throw err;
        }
    }

    renderSavedReports();
    resetReportForm(true);
    showToast('Laporan tersimpan dan form otomatis disiapkan untuk laporan baru.');
}

function previewReport(index) {
    const savedReports = getSavedReports();
    const report = savedReports[index];
    if (!report) return;
    renderPreviewData(report);
    if (!document.body.classList.contains('fullscreen-active')) {
        togglePreview();
    }
}

function editReport(index) {
    const savedReports = getSavedReports();
    const report = savedReports[index];
    if (!report) return;

    const dateInput = document.getElementById('in-report-date');
    const customCheckbox = document.getElementById('use-custom-date');
    document.getElementById('in-report-title').value = report.title || 'LAPORAN E-KINERJA HARIAN';
    document.getElementById('in-report-subtitle').value = report.subtitle || 'Koordinasi Dengan Kepala Regu Terkait Informasi Kejadian Kebakaran';
    if (dateInput) {
        dateInput.value = report.date || getTodayDateValue();
        dateInput.disabled = false;
    }
    if (customCheckbox) {
        customCheckbox.checked = true;
    }
    document.getElementById('in-nama').value = report.nama;
    document.getElementById('in-nip').value = report.nip;
    document.getElementById('in-jabatan').value = report.jabatan;
    document.getElementById('in-instansi').value = report.instansi;
    document.getElementById('in-kab').value = report.kab;
    document.getElementById('in-kota').value = report.kota;
    document.getElementById('in-uraian').value = report.uraian;

    if (report.ttd) {
        document.getElementById('in-ttd-tempat').value = report.ttd.tempat || 'Tiakur';
        document.getElementById('in-ttd-tanggal').value = report.ttd.tanggal || '';
        document.getElementById('in-ttd-jabatan').value = report.ttd.jabatan || '';
        document.getElementById('in-ttd-nama').value = report.ttd.nama || '';
        document.getElementById('in-ttd-pangkat').value = report.ttd.pangkat || '';
        document.getElementById('in-ttd-nip').value = report.ttd.nip || '';
        localStorage.setItem('ghost_ttd', JSON.stringify(report.ttd));
        if (report.ttd.image) {
            localStorage.setItem('ghost_ttd_image', report.ttd.image);
        } else {
            localStorage.removeItem('ghost_ttd_image');
        }
        renderTtdImagePreview();
    }

    const useTtdCheckbox = document.getElementById('use-ttd-feature');
    if (useTtdCheckbox) {
        useTtdCheckbox.checked = report.ttdEnabled || false;
    }
    toggleTtdFeature();

    localStorage.setItem('ghost_tasks', JSON.stringify(report.tasks));
    renderTaskList();
    renderIdentity();
    renderKop();
    renderTtd();
    document.getElementById('out-report-title').innerText = report.title || 'LAPORAN E-KINERJA HARIAN';
    document.getElementById('out-report-subtitle').innerText = report.subtitle || 'Koordinasi Dengan Kepala Regu Terkait Informasi Kejadian Kebakaran';
    showToast('Laporan berhasil dimuat untuk diedit.');
}

function deleteSavedReport(index) {
    if (!confirm('Anda yakin ingin menghapus laporan ini?')) return;
    const savedReports = getSavedReports();
    savedReports.splice(index, 1);
    setSavedReports(savedReports);
    renderSavedReports();
    showToast('Laporan tersimpan berhasil dihapus.');
}

function renderPreviewData(report) {
    document.getElementById('out-nama').innerText = report.nama.toUpperCase() || '-';
    document.getElementById('out-nip').innerText = report.nip || '-';
    document.getElementById('out-jabatan').innerText = report.jabatan || '-';
    document.getElementById('out-instansi').innerText = report.instansi.toUpperCase() || '-';
    document.getElementById('out-kab').innerText = report.kab.toUpperCase() || '-';
    document.getElementById('out-kota').innerText = report.kota || '-';
    document.getElementById('out-uraian').innerText = report.uraian || '-';

    const outListEl = document.getElementById('out-task-list');
    const outContainer = document.getElementById('out-task-list-container');
    outListEl.innerHTML = '';

    if (report.tasks && report.tasks.length) {
        report.tasks.forEach(task => {
            const item = document.createElement('li');
            item.style.marginBottom = '6px';
            item.innerText = task;
            outListEl.appendChild(item);
        });
        outContainer.style.display = 'block';
    } else {
        outContainer.style.display = 'none';
    }

    document.getElementById('out-report-title').innerText = report.title || 'LAPORAN E-KINERJA HARIAN';
    document.getElementById('out-report-subtitle').innerText = report.subtitle || 'Koordinasi Dengan Kepala Regu Terkait Informasi Kejadian Kebakaran';
    const tanggal = report.date ? new Date(report.date) : new Date();
    document.getElementById('out-tanggal').innerText = tanggal.toLocaleDateString('id-ID', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
    document.getElementById('out-logo').src = report.logo || document.getElementById('out-logo').src;
    ['img1','img2','img3','img4'].forEach((id, i) => {
        const target = document.getElementById(id);
        if (report.photos && report.photos[i]) {
            target.innerHTML = `<img src="${report.photos[i]}">`;
        } else {
            target.innerHTML = id.toUpperCase();
        }
    });

    if (report.ttd) {
        const ttd = report.ttd;
        document.getElementById('out-ttd-tempat').innerText = ttd.tempat || 'Tiakur';
        const ttdTanggal = ttd.tanggal ? new Date(ttd.tanggal) : new Date();
        document.getElementById('out-ttd-tanggal').innerText = ttdTanggal.toLocaleDateString('id-ID', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
        });
        document.getElementById('out-ttd-jabatan').innerHTML = (ttd.jabatan || '-').replace(/\n/g, '<br>');
        document.getElementById('out-ttd-nama').innerText = ttd.nama || '-';
        document.getElementById('out-ttd-pangkat').innerText = ttd.pangkat || '-';
        document.getElementById('out-ttd-nip').innerText = ttd.nip || '-';
        const ttdImageContainer = document.getElementById('out-ttd-image');
        if (ttdImageContainer) {
            if (ttd.image) {
                ttdImageContainer.innerHTML = `<img src="${ttd.image}" alt="Tanda Tangan" />`;
            } else {
                ttdImageContainer.innerHTML = '<span class="ttd-image-placeholder">(Tanda tangan)</span>';
            }
        }
    }
    const previewBlock = document.getElementById('out-ttd-block');
    if (report.ttdEnabled && previewBlock) {
        previewBlock.classList.remove('hidden');
    } else if (previewBlock) {
        previewBlock.classList.add('hidden');
    }
}

function exportSavedReportPDF(index) {
    showPdfLoading();
    const savedReports = getSavedReports();
    const report = savedReports[index];
    if (!report) {
        hidePdfLoading();
        alert('Laporan tidak ditemukan. Silakan refresh halaman dan coba lagi.');
        return;
    }

    const currentPreview = {
        nama: document.getElementById('out-nama').innerText,
        nip: document.getElementById('out-nip').innerText,
        jabatan: document.getElementById('out-jabatan').innerText,
        instansi: document.getElementById('out-instansi').innerText,
        kab: document.getElementById('out-kab').innerText,
        kota: document.getElementById('out-kota').innerText,
        uraian: document.getElementById('out-uraian').innerText,
        tasksHtml: document.getElementById('out-task-list').innerHTML,
        logoSrc: document.getElementById('out-logo').src,
        photos: ['img1','img2','img3','img4'].map(id => document.querySelector(`#${id} img`)?.src || ''),
        ttd: {
            tempat: document.getElementById('out-ttd-tempat').innerText,
            tanggal: document.getElementById('out-ttd-tanggal').innerText,
            jabatan: document.getElementById('out-ttd-jabatan').innerHTML,
            nama: document.getElementById('out-ttd-nama').innerText,
            pangkat: document.getElementById('out-ttd-pangkat').innerText,
            nip: document.getElementById('out-ttd-nip').innerText,
            imageHtml: document.getElementById('out-ttd-image').innerHTML
        },
        ttdEnabled: !document.getElementById('out-ttd-block').classList.contains('hidden')
    };

    renderPreviewData(report);

const filename = `${new Date().toLocaleDateString('id-ID').replace(/\//g, '-')}_E-Kinerja_${report.nama || 'Laporan'}.pdf`;
    const element = document.getElementById('printable-area');
    const opt = {
        margin: 10,
        filename,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    createPdfBlob(element, opt).then(async (blob) => {
        await savePdfFile(blob, filename);
    }).catch((err) => {
        console.error(err);
        alert('Gagal ekspor PDF dari laporan tersimpan. Pastikan koneksi internet tersedia atau gunakan browser Android dengan dukungan download.');
    }).finally(() => {
        hidePdfLoading();
        document.getElementById('out-nama').innerText = currentPreview.nama;
        document.getElementById('out-nip').innerText = currentPreview.nip;
        document.getElementById('out-jabatan').innerText = currentPreview.jabatan;
        document.getElementById('out-instansi').innerText = currentPreview.instansi;
        document.getElementById('out-kab').innerText = currentPreview.kab;
        document.getElementById('out-kota').innerText = currentPreview.kota;
        document.getElementById('out-uraian').innerText = currentPreview.uraian;
        document.getElementById('out-task-list').innerHTML = currentPreview.tasksHtml;
        document.getElementById('out-task-list-container').style.display = currentPreview.tasksHtml ? 'block' : 'none';
        document.getElementById('out-logo').src = currentPreview.logoSrc;
        ['img1','img2','img3','img4'].forEach((id, i) => {
            const target = document.getElementById(id);
            if (currentPreview.photos[i]) {
                target.innerHTML = `<img src="${currentPreview.photos[i]}">`;
            } else {
                target.innerHTML = id.toUpperCase();
            }
        });
        if (currentPreview.ttd) {
            document.getElementById('out-ttd-tempat').innerText = currentPreview.ttd.tempat;
            document.getElementById('out-ttd-tanggal').innerText = currentPreview.ttd.tanggal;
            document.getElementById('out-ttd-jabatan').innerHTML = currentPreview.ttd.jabatan;
            document.getElementById('out-ttd-nama').innerText = currentPreview.ttd.nama;
            document.getElementById('out-ttd-pangkat').innerText = currentPreview.ttd.pangkat;
            document.getElementById('out-ttd-nip').innerText = currentPreview.ttd.nip;
            document.getElementById('out-ttd-image').innerHTML = currentPreview.ttd.imageHtml;
        }
        const previewBlock = document.getElementById('out-ttd-block');
        if (previewBlock) {
            if (currentPreview.ttdEnabled) {
                previewBlock.classList.remove('hidden');
            } else {
                previewBlock.classList.add('hidden');
            }
        }
    });
}

function filterSavedReports(reports) {
    const query = normalizeValue(savedReportFilter.query);
    const type = savedReportFilter.type;

    return reports
        .map((report, index) => ({ report, index }))
        .filter(({ report }) => {
            if (!query) return true;
            if (type === 'all') {
                const searchFields = [report.nama, report.nip, report.jabatan, report.instansi, report.uraian];
                return searchFields.some(value => normalizeValue(value).includes(query));
            }
            return normalizeValue(report[type]).includes(query);
        });
}

function renderSavedReports() {
    const currentUser = getCurrentLoginUser();
    if (!currentUser) {
        const container = document.getElementById('saved-reports');
        container.innerHTML = '<div style="text-align: center; padding: 40px; color: var(--text-dim);"><i class="fas fa-lock" style="font-size: 3rem; margin-bottom: 20px;"></i><p>Harap login terlebih dahulu untuk melihat laporan</p></div>';
        return;
    }

    const savedReports = getSavedReports();
    const filtered = filterSavedReports(savedReports);
    const container = document.getElementById('saved-reports');
    container.innerHTML = '';

    if (!filtered.length) {
        container.innerHTML = '<p style="color: #64748b; margin: 0;">Tidak ada laporan sesuai pencarian.</p>';
        return;
    }

    filtered.forEach(({ report, index }) => {
        const card = document.createElement('div');
        card.className = 'saved-report-card';

        const title = document.createElement('p');
        title.className = 'report-title';
        title.innerText = report.nama ? `${report.nama} — ${report.createdAt}` : `Laporan ${report.createdAt}`;

        const meta = document.createElement('p');
        meta.className = 'report-meta';
        meta.innerText = report.uraian ? report.uraian.substring(0, 60) + (report.uraian.length > 60 ? '...' : '') : 'Tidak ada uraian singkat.';

        const actions = document.createElement('div');
        actions.className = 'saved-report-actions';

        const previewBtn = document.createElement('button');
        previewBtn.type = 'button';
        previewBtn.className = 'preview-report';
        previewBtn.innerText = 'Preview Laporan';
        previewBtn.onclick = () => previewReport(index);

        const editBtn = document.createElement('button');
        editBtn.type = 'button';
        editBtn.className = 'edit-report';
        editBtn.innerText = 'Edit Laporan';
        editBtn.onclick = () => editReport(index);

        const pdfBtn = document.createElement('button');
        pdfBtn.type = 'button';
        pdfBtn.className = 'preview-report';
        pdfBtn.innerText = 'Simpan PDF';
        pdfBtn.onclick = () => exportSavedReportPDF(index);

        const deleteBtn = document.createElement('button');
        deleteBtn.type = 'button';
        deleteBtn.className = 'delete-report';
        deleteBtn.innerText = 'Hapus';
        deleteBtn.onclick = () => deleteSavedReport(index);

        actions.appendChild(previewBtn);
        actions.appendChild(editBtn);
        actions.appendChild(pdfBtn);
        actions.appendChild(deleteBtn);

        card.appendChild(title);
        card.appendChild(meta);
        card.appendChild(actions);
        container.appendChild(card);
    });
}

function renderTaskList() {
    const tasks = JSON.parse(localStorage.getItem('ghost_tasks') || '[]');
    const listEl = document.getElementById('task-list');
    const outListEl = document.getElementById('out-task-list');
    const outContainer = document.getElementById('out-task-list-container');

    listEl.innerHTML = '';
    outListEl.innerHTML = '';

    if (!tasks.length) {
        listEl.innerHTML = '<li style="justify-content: center; color: #64748b;">Belum ada item kegiatan.</li>';
        outContainer.style.display = 'none';
        return;
    }

    tasks.forEach((task, index) => {
        const li = document.createElement('li');
        const text = document.createElement('span');
        text.innerText = task;

        const actions = document.createElement('div');
        actions.style.display = 'flex';
        actions.style.gap = '8px';

        const editBtn = document.createElement('button');
        editBtn.type = 'button';
        editBtn.className = 'edit-btn';
        editBtn.innerText = 'Edit';
        editBtn.onclick = () => editTask(index);

        const deleteBtn = document.createElement('button');
        deleteBtn.type = 'button';
        deleteBtn.className = 'delete-btn';
        deleteBtn.innerText = 'Hapus';
        deleteBtn.onclick = () => deleteTask(index);

        actions.appendChild(editBtn);
        actions.appendChild(deleteBtn);
        li.appendChild(text);
        li.appendChild(actions);
        listEl.appendChild(li);

        const outItem = document.createElement('li');
        outItem.style.marginBottom = '6px';
        outItem.innerText = task;
        outListEl.appendChild(outItem);
    });

    outContainer.style.display = 'block';
}

function unlockKop() {
    document.getElementById('kop-display').style.display = 'none';
    document.getElementById('kop-inputs').style.display = 'block';

    // Inisialisasi panel tampilan kop (jika elemen sudah ada)
    kopInitTampilanKop();
}

function renderIdentity() {
    const saved = localStorage.getItem('ghost_identity_new');
    if (saved) {
        const data = JSON.parse(saved);
        document.getElementById('txt-nama').innerText = data.nama.toUpperCase();
        document.getElementById('txt-nip').innerText = "NIP: " + data.nip;
        document.getElementById('in-nama').value = data.nama;
        document.getElementById('in-nip').value = data.nip;
        document.getElementById('in-jabatan').value = data.jabatan;
        
        document.getElementById('out-nama').innerText = data.nama.toUpperCase();
        document.getElementById('out-nip').innerText = data.nip;
        document.getElementById('out-jabatan').innerText = data.jabatan;

        document.getElementById('identitas-display').style.display = 'block';
        document.getElementById('identitas-inputs').style.display = 'none';
    }
}

function renderKop() {
    const savedKop = localStorage.getItem('ghost_kop');
    if (savedKop) {
        const data = JSON.parse(savedKop);
        document.getElementById('txt-instansi').innerText = data.instansi.toUpperCase();
        document.getElementById('txt-kab').innerText = data.kab.toUpperCase();
        
        document.getElementById('in-instansi').value = data.instansi;
        document.getElementById('in-kab').value = data.kab;
        document.getElementById('in-kota').value = data.kota;
        document.getElementById('in-gmail').value = data.gmail || '';

        document.getElementById('out-instansi').innerText = data.instansi.toUpperCase();
        document.getElementById('out-kab').innerText = data.kab.toUpperCase();
        document.getElementById('out-kota').innerText = data.kota;
        document.getElementById('out-gmail').innerText = data.gmail || '-';


        document.getElementById('kop-display').style.display = 'block';
        document.getElementById('kop-inputs').style.display = 'none';
    }

    const savedLogo = localStorage.getItem('ghost_logo');
    if (savedLogo) document.getElementById('out-logo').src = savedLogo;

    // Pastikan panel tampilan kop tetap sesuai default
    kopInitTampilanKop();
}

function previewImg(input, targetId) {
    const target = document.getElementById(targetId);
    if (!target) return;

    target.innerHTML = '';
    const uploadBox = document.querySelector(`.upload-box[data-target="${targetId}"]`);
    if (uploadBox) uploadBox.classList.add('uploaded');

    if (!input.files || !input.files.length) {
        target.innerText = targetId.toUpperCase();
        return;
    }

    Array.from(input.files).forEach((file) => {
        try {
            const reader = new FileReader();
            reader.onload = (e) => {
                const image = document.createElement('img');
                image.src = e.target.result;
                target.appendChild(image);
            };
            reader.onerror = () => {
                showToast('Error: File foto terlalu besar atau tidak valid. Coba file yang lebih kecil.');
            };
            reader.readAsDataURL(file);
        } catch (error) {
            showToast('Error: Gagal memuat foto. Ukuran file mungkin terlalu besar.');
        }
    });
    showToast('Foto berhasil dimuat!');
}

function createPdfBlob(element, opt) {
    if (typeof html2pdf === 'undefined') {
        return Promise.reject(new Error('Library html2pdf tidak tersedia. Pastikan koneksi internet tersedia.'));
    }
    
    return new Promise((resolve, reject) => {
        try {
            html2pdf()
                .set(opt)
                .from(element)
                .toPdf()
                .get('pdf')
                .then(pdf => {
                    try {
                        const blob = pdf.output('blob');
                        resolve(blob);
                    } catch (e) {
                        reject(new Error('Gagal menghasilkan blob PDF: ' + e.message));
                    }
                })
                .catch(err => reject(new Error('Gagal dalam proses konversi PDF: ' + err.message)));
        } catch (e) {
            reject(new Error('Error saat membuat PDF: ' + e.message));
        }
    });
}

function downloadPdfBlob(blob, filename) {
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(link.href), 1000);
}

async function trySharePdf(blob, filename) {
    if (navigator.canShare && navigator.share) {
        const file = new File([blob], filename, { type: 'application/pdf' });
        if (navigator.canShare({ files: [file] })) {
            try {
                await navigator.share({ files: [file], title: 'E-Kinerja', text: 'Simpan atau bagikan file PDF E-Kinerja.' });
                return true;
            } catch (err) {
                console.warn('Share API gagal:', err);
            }
        }
    }
    return false;
}

function openPdfBlob(blob) {
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
    setTimeout(() => URL.revokeObjectURL(url), 10000);
}

async function savePdfFile(blob, filename) {
    try {
        // Method 1: Try browser download API
        downloadPdfBlob(blob, filename);
        return true;
    } catch (err) {
        console.warn('Download method gagal:', err);
    }

    try {
        // Method 2: Try Web Share API if available (untuk mobile)
        if (await trySharePdf(blob, filename)) {
            return true;
        }
    } catch (err) {
        console.warn('Share method gagal:', err);
    }

    try {
        // Method 3: Open PDF in new tab for manual saving
        openPdfBlob(blob);
        return false;
    } catch (err) {
        console.warn('Open method gagal:', err);
        throw new Error('Semua metode penyimpanan PDF gagal. Silakan coba lagi.');
    }
}

function togglePreview() {
    document.getElementById('main-body').classList.toggle('fullscreen-active');
    window.scrollTo(0,0);
}

function showPdfLoading() {
    const overlay = document.getElementById('pdf-loading-overlay');
    if (overlay) overlay.style.display = 'flex';
}

function hidePdfLoading() {
    const overlay = document.getElementById('pdf-loading-overlay');
    if (overlay) overlay.style.display = 'none';
}

// ================== TAMBAHAN: PENGATURAN TAMPILAN KOP ==================
const KOP_TAMPILAN_DEFAULT = {
    fontBold: false,
    fontSize: 10,
    fontSpacing: 0.5,
    logoPosition: 'kiri'
};

const kopTampilanState = {
    fontBold: KOP_TAMPILAN_DEFAULT.fontBold,
    fontSize: KOP_TAMPILAN_DEFAULT.fontSize,
    fontSpacing: KOP_TAMPILAN_DEFAULT.fontSpacing,
    // line spacing untuk line-height
    lineSpacing: 1.2,
    logoPosition: KOP_TAMPILAN_DEFAULT.logoPosition,
    underline: false,
};


function kopGetCheckedElements() {
    const checked = {
        instansi: !!document.getElementById('kop-opt-instansi')?.checked,
        kab: !!document.getElementById('kop-opt-kab')?.checked,
        kota: !!document.getElementById('kop-opt-kota')?.checked,
        gmail: !!document.getElementById('kop-opt-gmail')?.checked,
        logo: !!document.getElementById('kop-opt-logo')?.checked
    };

    const targets = [];
    if (checked.instansi) targets.push(document.getElementById('out-instansi'));
    if (checked.kab) targets.push(document.getElementById('out-kab'));
    if (checked.kota) targets.push(document.getElementById('out-kota'));
    if (checked.gmail) targets.push(document.getElementById('out-gmail'));

    return {
        targets: targets.filter(Boolean),
        logoEnabled: checked.logo
    };
}

function kopInitTampilanKop() {
    // Jika panel belum ada, stop
    const panelFont = document.getElementById('kop-font-panel');
    const panelLogo = document.getElementById('kop-logo-panel');
    const panelWrap = document.getElementById('kop-tampilan-settings');
    if (!panelFont || !panelLogo || !panelWrap) return;

    // default: panel tersembunyi sampai ada checkbox aktif
    // isi nilai input kontrol
    const sizeInput = document.getElementById('kop-font-size');
    const spacingInput = document.getElementById('kop-font-spacing');
    if (sizeInput && !sizeInput.value) sizeInput.value = KOP_TAMPILAN_DEFAULT.fontSize;
    if (spacingInput && !spacingInput.value) spacingInput.value = KOP_TAMPILAN_DEFAULT.fontSpacing;

    // default state untuk logo
    kopTampilanState.fontBold = KOP_TAMPILAN_DEFAULT.fontBold;
    kopTampilanState.fontSize = Number(sizeInput?.value || KOP_TAMPILAN_DEFAULT.fontSize);
    kopTampilanState.fontSpacing = Number(spacingInput?.value || KOP_TAMPILAN_DEFAULT.fontSpacing);
    kopTampilanState.logoPosition = KOP_TAMPILAN_DEFAULT.logoPosition;

    // tombol reset ke default
    updateKopTampilanFokus();
}

function updateKopTampilanFokus() {
    const { targets, logoEnabled } = kopGetCheckedElements();

    const fontPanel = document.getElementById('kop-font-panel');
    const logoPanel = document.getElementById('kop-logo-panel');

    const hasFontTargets = targets.length > 0;
    if (fontPanel) fontPanel.style.display = hasFontTargets ? 'block' : 'none';
    if (logoPanel) logoPanel.style.display = logoEnabled ? 'block' : 'none';

    // Jika logo dicentang, pastikan posisi diterapkan
    if (logoEnabled) {
        kopSetLogoPosition(kopTampilanState.logoPosition);
    }
}

function kopSetFontBold(isBold) {
    kopTampilanState.fontBold = !!isBold;
    // Terapkan langsung ke elemen yang diceklis
    const { targets } = kopGetCheckedElements();
    targets.forEach((el) => {
        if (!el) return;
        el.style.fontWeight = kopTampilanState.fontBold ? 'bold' : 'normal';
    });
}

function kopApplyFontSettings() {
    const sizeInput = document.getElementById('kop-font-size');
    const spacingInput = document.getElementById('kop-font-spacing');
    const lineSpacingInput = document.getElementById('kop-line-spacing');

    if (sizeInput) kopTampilanState.fontSize = Number(sizeInput.value);
    if (spacingInput) kopTampilanState.fontSpacing = Number(spacingInput.value);
    if (lineSpacingInput) kopTampilanState.lineSpacing = Number(lineSpacingInput.value);

    const { targets } = kopGetCheckedElements();
    targets.forEach((el) => {
        if (!el) return;
        el.style.fontSize = `${kopTampilanState.fontSize}pt`;
        el.style.letterSpacing = `${kopTampilanState.fontSpacing}px`;
        // Line spacing hanya satu kontrol sesuai permintaan: pakai line-height
        el.style.lineHeight = String(kopTampilanState.lineSpacing);
    });
}

function kopSetLineSpacingQuick(type) {
    // nilai cepat untuk line-height
    // dekat=1.0, sedang=1.2, renggang=1.5
    let val = 1.2;
    if (type === 'dekat') val = 1.0;
    if (type === 'sedang') val = 1.2;

    const input = document.getElementById('kop-line-spacing');
    if (input) input.value = String(val);
    kopApplyFontSettings();
}

function kopSetLogoPosition(pos) {
    const logo = document.getElementById('out-logo');
    if (!logo) return;

    const next = pos === 'kanan' ? 'kanan' : 'kiri';
    kopTampilanState.logoPosition = next;

    // geser logo
    if (next === 'kiri') {
        logo.style.left = '0';
        logo.style.right = '';
    } else {
        logo.style.left = '';
        logo.style.right = '0';
    }
}

function kopToggleUnderline(onOff) {
    kopTampilanState.underline = onOff === 'on' || onOff === true;
    const { targets } = kopGetCheckedElements();

    // Garis bawah (underline) untuk elemen KOP yang dipilih.
    targets.forEach((el) => {
        if (!el) return;
        el.style.textDecoration = kopTampilanState.underline ? 'underline' : '';
        // Agar ketebalan underline konsisten saat export PDF
        el.style.textDecorationThickness = kopTampilanState.underline ? '2px' : '';
    });
}

// Support alias: tombol pengguna biasanya menyebut "garis bawa".
function kopToggleGarisBawa(onOff) {
    kopToggleUnderline(onOff);
}



function kopResetTampilanAwal() {

    // Reset state kontrol
    kopTampilanState.fontBold = KOP_TAMPILAN_DEFAULT.fontBold;
    kopTampilanState.underline = false;

    kopTampilanState.fontSize = KOP_TAMPILAN_DEFAULT.fontSize;
    kopTampilanState.fontSpacing = KOP_TAMPILAN_DEFAULT.fontSpacing;
    kopTampilanState.logoPosition = KOP_TAMPILAN_DEFAULT.logoPosition;

    const sizeInput = document.getElementById('kop-font-size');
    const spacingInput = document.getElementById('kop-font-spacing');
    if (sizeInput) sizeInput.value = KOP_TAMPILAN_DEFAULT.fontSize;
    if (spacingInput) spacingInput.value = KOP_TAMPILAN_DEFAULT.fontSpacing;

    // Uncheck semua checkbox
    ['kop-opt-instansi','kop-opt-kab','kop-opt-kota','kop-opt-gmail','kop-opt-logo'].forEach((id)=>{
        const el = document.getElementById(id);
        if (el) el.checked = false;
    });

    // Reset style pada target elemen sesuai mapping
    ['out-instansi','out-kab','out-kota','out-gmail'].forEach((id) => {
        const el = document.getElementById(id);
        if (!el) return;
        el.style.fontWeight = '';
        el.style.fontSize = '';
        el.style.letterSpacing = '';
        el.style.lineHeight = '';
        el.style.textDecoration = '';
        el.style.textDecorationThickness = '';
    });


    const logo = document.getElementById('out-logo');
    if (logo) {
        logo.style.left = '0';
        logo.style.right = '';
    }

    updateKopTampilanFokus();
}

async function exportToPDF() {
    showPdfLoading();
    
    // Tunggu html2pdf library siap dengan retry
    let retries = 0;
    while (typeof html2pdf === 'undefined' && retries < 10) {
        await new Promise(resolve => setTimeout(resolve, 100));
        retries++;
    }
    
    if (typeof html2pdf === 'undefined') {
        hidePdfLoading();
        alert('Library html2pdf gagal dimuat. Periksa koneksi internet dan coba lagi.');
        return;
    }
    
    const element = document.getElementById('printable-area');
    if (!element) {
        hidePdfLoading();
        alert('Elemen laporan tidak ditemukan. Silakan refresh halaman.');
        return;
    }
    
    const nama = document.getElementById('in-nama').value || 'Laporan-E-Kinerja';
const filename = `${new Date().toLocaleDateString('id-ID').replace(/\//g, '-')}_E-Kinerja_${nama}.pdf`;

    const opt = {
        margin: 10,
        filename: filename,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, logging: false },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    try {
        const blob = await createPdfBlob(element, opt);
        const saved = await savePdfFile(blob, filename);
        showToast(saved ? "PDF Berhasil Diunduh!" : "PDF dibuat, silakan simpan dari tampilan PDF.");
    } catch (err) {
        console.error('PDF Export Error:', err);
        alert('Gagal ekspor PDF: ' + (err.message || 'Terjadi kesalahan tidak terduga. Coba lagi.'));
    } finally {
        hidePdfLoading();
    }
}

// INITIALIZATION
window.onload = () => {
    const currentUUID = generateUUID();
    document.getElementById('display-uuid').innerText = currentUUID;

    // Cek Aktivasi Permanen
    if(localStorage.getItem('ghost_pro_activated') === 'true') {
        unlockApp();
    }

    updateTanggal();
    renderIdentity();
    renderKop();
    renderTtd();
    renderTtdImagePreview();
    renderTtdFeatureState();
    renderTaskList();
    initReportStorage().finally(() => {
        renderSavedReports();
    });

    const ttdTanggalInput = document.getElementById('in-ttd-tanggal');
    if (ttdTanggalInput && !ttdTanggalInput.value) {
        ttdTanggalInput.value = getTodayDateValue();
    }

    const dateInput = document.getElementById('in-report-date');
    const customCheckbox = document.getElementById('use-custom-date');
    if (dateInput) {
        dateInput.value = getTodayDateValue();
        dateInput.disabled = true;
        dateInput.addEventListener('change', updateTanggal);
    }
    if (customCheckbox) {
        customCheckbox.addEventListener('change', () => {
            if (dateInput) {
                dateInput.disabled = !customCheckbox.checked;
                if (!customCheckbox.checked) {
                    dateInput.value = getTodayDateValue();
                }
            }
            updateTanggal();
        });
    }
    updateTanggal();



    // Agar user bisa menekan Enter untuk pindah/ubah baris saat mengisi teks area laporan
    const uraianEl = document.getElementById('in-uraian');
    if (uraianEl) {
        uraianEl.addEventListener('keydown', (event) => {
            // Biarkan default pada textarea (Enter = baris baru)
            // Tidak ada preventDefault di sini.
            // Tambahan: Ctrl+Enter bisa digunakan untuk memindahkan fokus ke textarea/subjudul berikutnya jika ada.
            if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
                event.preventDefault();
                const subtitleEl = document.getElementById('in-report-subtitle');
                if (subtitleEl) subtitleEl.focus();
            }
        });
    }

    const taskInput = document.getElementById('task-input');
    if (taskInput) {
        taskInput.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') {
                event.preventDefault();
                addTask();
            }
        });
    }

    const searchInput = document.getElementById('report-search');
    const filterSelect = document.getElementById('report-filter');
    const navSearchInput = document.getElementById('nav-search');
    if (searchInput) {
        searchInput.addEventListener('input', (event) => {
            savedReportFilter.query = event.target.value;
            // Sinkronisasi dengan nav search
            if (navSearchInput) navSearchInput.value = event.target.value;
            renderSavedReports();
        });
    }
    if (navSearchInput) {
        navSearchInput.addEventListener('input', (event) => {
            savedReportFilter.query = event.target.value;
            // Sinkronisasi dengan report search
            if (searchInput) searchInput.value = event.target.value;
            renderSavedReports();
        });
    }
    if (filterSelect) {
        filterSelect.addEventListener('change', (event) => {
            savedReportFilter.type = event.target.value;
            renderSavedReports();
        });
    }
};