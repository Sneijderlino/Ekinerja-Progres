/**
 * Alert & Confirm Replacements untuk Modal Dialog System
 * File ini berisi semua wrapper functions untuk mengganti native alert/confirm
 */

/**
 * License System Alerts
 */
function showLicenseError(keyInput) {
    showAlert(
        'Kode lisensi yang Anda masukkan salah. Silakan coba lagi atau hubungi admin.',
        'Akses Ditolak',
        'error'
    );
}

function showLicenseSuccess() {
    showAlert(
        'Sistem berhasil diaktifkan! Selamat menggunakan aplikasi E-Kinerja.',
        'Aktivasi Berhasil',
        'success'
    );
}

/**
 * Copy ID Alerts
 */
function showCopySuccess(adminNumber = '082292964110') {
    showAlert(
        `ID perangkat berhasil disalin. Kirimkan ke admin WhatsApp: ${adminNumber}`,
        'ID TERSALIN',
        'success'
    );
}

function showCopyFailed() {
    showAlert(
        'Gagal menyalin ID perangkat. Silakan salin secara manual dari kotak di atas.',
        'COPY GAGAL',
        'error'
    );
}

function showIdUnavailable() {
    showAlert(
        'ID perangkat belum tersedia. Tunggu sebentar dan coba lagi.',
        'ID TIDAK TERSEDIA',
        'warning'
    );
}

/**
 * Login & Auth Alerts
 */
function showLoginRequired(featureName = 'fitur ini') {
    showAlert(
        `Anda harus login terlebih dahulu untuk mengakses ${featureName}.`,
        'LOGIN DIPERLUKAN',
        'warning'
    );
}

function showLogoutConfirm(callback) {
    showConfirm(
        'Anda akan keluar dari akun ini. Lanjutkan?',
        callback,
        'Konfirmasi Keluar',
        {
            yesText: 'Ya, Keluar',
            noText: 'Batal',
            isDangerous: true
        }
    );
}

/**
 * Form Validation Alerts
 */
function showValidationError(fieldName, message) {
    showAlert(
        message || `Silakan isi ${fieldName} terlebih dahulu.`,
        'DATA TIDAK LENGKAP',
        'warning'
    );
}

function showFieldRequired(fields) {
    const fieldList = Array.isArray(fields) ? fields.join(', ') : fields;
    showAlert(
        `Silakan isi ${fieldList} sebelum melanjutkan.`,
        'FIELD WAJIB DIISI',
        'warning'
    );
}

/**
 * Photo & File Upload Alerts
 */
function showInvalidImageFile() {
    showAlert(
        'Silakan pilih file gambar yang valid (JPG, PNG, GIF, WebP).',
        'FILE TIDAK VALID',
        'error'
    );
}

function showImageTooLarge() {
    showAlert(
        'Ukuran file foto terlalu besar. Silakan gunakan file yang lebih kecil (max 5MB) atau kompres terlebih dahulu.',
        'FILE TERLALU BESAR',
        'error'
    );
}

function showImageUploadError() {
    showAlert(
        'Gagal memuat foto. Silakan coba lagi atau gunakan file yang berbeda.',
        'UPLOAD GAGAL',
        'error'
    );
}

function showImageUploadSuccess(itemType = 'Foto') {
    showAlert(
        `${itemType} berhasil diupload! Pratinjau telah diperbarui.`,
        'UPLOAD BERHASIL',
        'success'
    );
}

/**
 * Task Management Alerts
 */
function showTaskAddSuccess() {
    showAlert(
        'Item kegiatan berhasil ditambahkan ke daftar.',
        'ITEM DITAMBAHKAN',
        'success'
    );
}

function showTaskUpdateSuccess() {
    showAlert(
        'Item kegiatan berhasil diperbarui.',
        'ITEM DIPERBARUI',
        'success'
    );
}

function showTaskDeleteSuccess() {
    showAlert(
        'Item kegiatan berhasil dihapus dari daftar.',
        'ITEM DIHAPUS',
        'success'
    );
}

function showTaskEmpty() {
    showAlert(
        'Silakan masukkan deskripsi kegiatan sebelum menambahkannya.',
        'FORM KOSONG',
        'warning'
    );
}

function showDeleteTaskConfirm(callback) {
    showConfirm(
        'Hapus item kegiatan ini? Tindakan tidak dapat dikembalikan.',
        callback,
        'Konfirmasi Hapus',
        {
            yesText: 'Hapus',
            noText: 'Batal',
            isDangerous: true
        }
    );
}

function showDeleteSignatureConfirm(callback) {
    showConfirm(
        'Hapus foto tanda tangan? Anda dapat mengupload foto baru nanti.',
        callback,
        'Konfirmasi Hapus',
        {
            yesText: 'Hapus',
            noText: 'Batal',
            isDangerous: true
        }
    );
}

/**
 * Report Management Alerts
 */
function showReportSaveSuccess() {
    showAlert(
        'Laporan berhasil disimpan! Form otomatis disiapkan untuk laporan baru.',
        'LAPORAN TERSIMPAN',
        'success'
    );
}

function showReportSaveFailed(reason = '') {
    showAlert(
        `Gagal menyimpan laporan. ${reason || 'Silakan coba lagi.'}`,
        'SIMPAN GAGAL',
        'error'
    );
}

function showStorageQuotaExceeded() {
    showAlert(
        'Penyimpanan penuh! Silakan hapus beberapa laporan lama untuk membuat ruang baru.',
        'STORAGE PENUH',
        'error'
    );
}

function showReportDeleteConfirm(callback) {
    showConfirm(
        'Hapus laporan ini secara permanen? Data akan hilang dan tidak dapat dipulihkan.',
        callback,
        'Konfirmasi Hapus Laporan',
        {
            yesText: 'Hapus Sekarang',
            noText: 'Batal',
            isDangerous: true
        }
    );
}

function showReportNotFound() {
    showAlert(
        'Laporan tidak ditemukan. Silakan refresh halaman dan coba lagi.',
        'LAPORAN TIDAK DITEMUKAN',
        'error'
    );
}

/**
 * PDF Export Alerts
 */
function showPdfGenerating() {
    showAlert(
        'Proses pembuatan PDF sedang berjalan. Harap tunggu sebentar...',
        'MEMBUAT PDF',
        'info'
    );
}

function showPdfSuccess() {
    showAlert(
        'PDF berhasil dibuat dan diunduh!',
        'PDF SIAP',
        'success'
    );
}

function showPdfError(errorMsg = '') {
    showAlert(
        `Gagal membuat PDF. ${errorMsg || 'Pastikan koneksi internet tersedia dan coba lagi.'}`,
        'EXPORT PDF GAGAL',
        'error'
    );
}

function showLibraryLoadError(libraryName = 'html2pdf') {
    showAlert(
        `Gagal memuat library ${libraryName}. Periksa koneksi internet dan coba lagi.`,
        'LIBRARY TIDAK TERSEDIA',
        'error'
    );
}

/**
 * Data Lock/Unlock Alerts
 */
function showProfileLocked() {
    showAlert(
        'Profil pegawai berhasil dikunci. Anda dapat mengubahnya kapan saja.',
        'PROFIL DIKUNCI',
        'success'
    );
}

function showKopLocked() {
    showAlert(
        'Kop instansi berhasil dikunci. Gunakan tombol "Ubah Kop" untuk mengubahnya.',
        'KOP DIKUNCI',
        'success'
    );
}

function showTableHeaderLocked() {
    showAlert(
        'Kop tabel berhasil dikunci dan siap digunakan.',
        'KOP TABEL DIKUNCI',
        'success'
    );
}

function showSignatureLocked() {
    showAlert(
        'Data tanda tangan berhasil dikunci. Pratinjau telah diperbarui.',
        'TANDA TANGAN DIKUNCI',
        'success'
    );
}

/**
 * Generic Errors
 */
function showGenericError(errorMsg = 'Terjadi kesalahan. Silakan coba lagi.') {
    showAlert(errorMsg, 'KESALAHAN', 'error');
}

function showGenericSuccess(successMsg = 'Operasi berhasil!') {
    showAlert(successMsg, 'BERHASIL', 'success');
}

function showGenericInfo(infoMsg = 'Informasi penting') {
    showAlert(infoMsg, 'INFORMASI', 'info');
}

/**
 * Batch operations
 */
function showBatchDeleteSuccess(count) {
    showAlert(
        `${count} laporan lama berhasil dihapus untuk menghemat ruang penyimpanan.`,
        'OPTIMISASI STORAGE',
        'success'
    );
}
