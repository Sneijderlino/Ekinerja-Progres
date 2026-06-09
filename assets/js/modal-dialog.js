/**
 * Modern Modal Dialog System
 * Menggantikan alert() dan confirm() dengan desain yang lebih keren
 */

// Inject modal HTML ke dalam dokumen
function initModalSystem() {
    if (document.getElementById('custom-modal-wrapper')) return;
    
    const modalHTML = `
    <!-- Custom Modal Wrapper -->
    <div id="custom-modal-wrapper">
        <!-- Alert/Info/Success/Error Modal -->
        <div id="alertModal" class="modal-overlay" style="display: none;">
            <div class="modal-container modal-alert">
                <div class="modal-icon" id="alertIcon">
                    <i class="fas fa-check-circle"></i>
                </div>
                <h2 class="modal-title" id="alertTitle">Notifikasi</h2>
                <p class="modal-message" id="alertMessage">Pesan akan muncul di sini</p>
                <div class="modal-footer">
                    <button class="modal-btn modal-btn-primary" onclick="closeAlertModal()">
                        Baik
                    </button>
                </div>
            </div>
        </div>

        <!-- Confirm Modal -->
        <div id="confirmModal" class="modal-overlay" style="display: none;">
            <div class="modal-container modal-confirm">
                <div class="modal-icon" id="confirmIcon">
                    <i class="fas fa-question-circle"></i>
                </div>
                <h2 class="modal-title" id="confirmTitle">Konfirmasi</h2>
                <p class="modal-message" id="confirmMessage">Apakah Anda yakin?</p>
                <div class="modal-footer">
                    <button class="modal-btn modal-btn-secondary" onclick="closeConfirmModal(false)">
                        Batal
                    </button>
                    <button class="modal-btn modal-btn-primary" id="confirmBtnYes" onclick="closeConfirmModal(true)">
                        Ya, Lanjutkan
                    </button>
                </div>
            </div>
        </div>

        <!-- Prompt Modal -->
        <div id="promptModal" class="modal-overlay" style="display: none;">
            <div class="modal-container modal-confirm">
                <div class="modal-icon"><i class="fas fa-edit"></i></div>
                <h2 class="modal-title" id="promptTitle">Input Data</h2>
                <p class="modal-message" id="promptMessage">Masukkan nilai di bawah ini:</p>
                <input type="text" id="promptInput" class="modal-input" style="width:100%; margin-bottom:20px;">
                <div class="modal-footer">
                    <button class="modal-btn modal-btn-secondary" onclick="closePromptModal(false)">Batal</button>
                    <button class="modal-btn modal-btn-primary" onclick="closePromptModal(true)">OK</button>
                </div>
            </div>
        </div>

        <!-- Loading Modal -->
        <div id="loadingModal" class="modal-overlay" style="display: none;">
            <div class="modal-container" style="background: none; border: none; box-shadow: none;">
                <div class="loading-spinner-glow"></div>
                <p class="modal-message" id="loadingMessage" style="color: white; font-weight: bold; margin-top: 20px; text-shadow: 0 0 10px rgba(59, 130, 246, 0.5);">Memproses...</p>
            </div>
        </div>

        <!-- Toast Container -->
        <div id="toast-container" style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); z-index: 10003; display: flex; flex-direction: column; align-items: center; gap: 10px; pointer-events: none;"></div>
    </div>

    <style>
        /* Modal System Styles */
        #custom-modal-wrapper {
            --modal-primary: #3b82f6;
            --modal-secondary: #34d399;
            --modal-danger: #ef4444;
            --modal-warning: #f59e0b;
            --modal-success: #22c55e;
            --modal-surface: rgba(15, 23, 42, 0.8);
            --modal-border: rgba(255, 255, 255, 0.08);
            --modal-text: #f8fafc;
            --modal-text-dim: #94a3b8;
        }

        .modal-input {
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid var(--modal-border);
            padding: 12px 16px;
            border-radius: 12px;
            color: white;
            font-family: inherit;
            outline: none;
            transition: 0.3s;
        }
        .modal-input:focus {
            border-color: var(--modal-primary);
            background: rgba(255, 255, 255, 0.1);
        }

        .modal-overlay {
            position: fixed;
            inset: 0;
            background: rgba(0, 0, 0, 0.6);
            backdrop-filter: blur(15px) saturate(160%);
            -webkit-backdrop-filter: blur(15px) saturate(160%);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 9999999;
            animation: modalOverlayFadeIn 0.2s ease;
        }

        @keyframes modalOverlayFadeIn {
            from {
                opacity: 0;
            }
            to {
                opacity: 1;
            }
        }

        .modal-container {
            background: var(--modal-surface);
            border: 1px solid var(--modal-border);
            border-radius: 20px;
            padding: 35px 25px;
            max-width: 420px;
            width: 90%;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7),
                        inset 0 1px 1px rgba(255, 255, 255, 0.05),
                        0 0 40px rgba(59, 130, 246, 0.1);
            animation: modalContainerSlideIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
            text-align: center;
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
        }

        @keyframes modalContainerSlideIn {
            from {
                opacity: 0;
                transform: scale(0.9) translateY(-20px);
            }
            to {
                opacity: 1;
                transform: scale(1) translateY(0);
            }
        }

        .modal-icon {
            font-size: 4rem;
            margin-bottom: 20px;
            display: inline-block;
            animation: iconBounce 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        @keyframes iconBounce {
            0%, 100% {
                transform: translateY(0) scale(1);
            }
            40% {
                transform: translateY(-15px) scale(1.05);
            }
        }

        .modal-icon i {
            background: linear-gradient(135deg, var(--modal-primary), var(--modal-secondary));
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }

        .modal-alert .modal-icon i {
            color: var(--modal-success);
            -webkit-text-fill-color: var(--modal-success);
        }

        .modal-confirm .modal-icon i {
            color: var(--modal-warning);
            -webkit-text-fill-color: var(--modal-warning);
        }

        .modal-title {
            font-size: 1.4rem;
            font-weight: 700;
            margin: 16px 0;
            color: var(--modal-text);
            letter-spacing: -0.5px;
        }

        .modal-message {
            font-size: 0.95rem;
            color: var(--modal-text-dim);
            margin: 12px 0 24px;
            line-height: 1.6;
        }

        .modal-footer {
            display: flex;
            gap: 12px;
            margin-top: 28px;
            justify-content: center;
        }

        .modal-btn {
            padding: 12px 24px;
            border: none;
            border-radius: 12px;
            font-weight: 600;
            font-size: 0.9rem;
            cursor: pointer;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            text-transform: uppercase;
            letter-spacing: 0.5px;
            flex: 1;
            max-width: 160px;
            border: 1px solid transparent;
            text-decoration: none;
            display: inline-block;
        }

        .modal-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 20px rgba(0, 0, 0, 0.3);
        }

        .modal-btn:active {
            transform: translateY(0);
        }

        .modal-btn-primary {
            background: linear-gradient(135deg, var(--modal-primary), #1d4ed8);
            color: white;
        }

        .modal-btn-primary:hover {
            box-shadow: 0 8px 25px rgba(59, 130, 246, 0.4);
        }

        .modal-alert.error .modal-btn-primary {
            background: linear-gradient(135deg, var(--modal-danger), #b91c1c);
        }
        .modal-alert.error .modal-btn-primary:hover {
            box-shadow: 0 8px 25px rgba(239, 68, 68, 0.4);
        }

        .modal-btn-secondary {
            background: rgba(255, 255, 255, 0.1);
            border: 1px solid var(--modal-border);
            color: var(--modal-text);
        }

        .modal-btn-secondary:hover {
            background: rgba(255, 255, 255, 0.15);
            border-color: rgba(255, 255, 255, 0.2);
        }

        /* Error variant */
        .modal-alert.error .modal-icon i {
            color: var(--modal-danger);
            -webkit-text-fill-color: var(--modal-danger);
        }

        /* Loading Spinner Glow */
        .loading-spinner-glow {
            width: 70px;
            height: 70px;
            display: inline-block;
            border-radius: 50%;
            border: 3px solid transparent;
            border-top-color: var(--modal-primary);
            border-right-color: var(--modal-secondary);
            animation: modalSpin 1s linear infinite;
            filter: drop-shadow(0 0 20px var(--modal-primary));
        }
        @keyframes modalSpin { to { transform: rotate(360deg); } }

        /* Dynamic Toasts */
        .dynamic-toast {
            background: var(--modal-surface);
            backdrop-filter: blur(10px);
            border: 1px solid var(--modal-border);
            color: white;
            padding: 12px 24px;
            border-radius: 50px;
            font-weight: 600;
            font-size: 0.85rem;
            box-shadow: 0 10px 25px rgba(0,0,0,0.2);
            animation: toastIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
            opacity: 0;
            text-align: center;
            min-width: 200px;
            pointer-events: auto;
        }
        .dynamic-toast.success { border-color: var(--modal-success); box-shadow: 0 10px 25px rgba(34, 197, 94, 0.2); }
        .dynamic-toast.error { border-color: var(--modal-danger); box-shadow: 0 10px 25px rgba(239, 68, 68, 0.2); }
        
        @keyframes toastIn { from { transform: scale(0.8); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        @keyframes toastOut { to { transform: scale(0.9); opacity: 0; } }

        /* Responsive */
        @media (max-width: 480px) {
            .modal-container {
                padding: 24px;
                max-width: 90vw;
            }

            .modal-icon {
                font-size: 2.5rem;
                margin-bottom: 16px;
            }

            .modal-title {
                font-size: 1.2rem;
            }

            .modal-message {
                font-size: 0.9rem;
            }

            .modal-btn {
                padding: 10px 16px;
                font-size: 0.8rem;
                max-width: none;
            }

            .modal-footer {
                flex-direction: column;
            }
        }
    </style>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

// Global state untuk confirm callback
let confirmCallback = null;
let promptCallback = null;
let currentLoadingOverlay = null;

/**
 * Show Alert Dialog
 * @param {string} message - Pesan alert
 * @param {string} title - Judul (default: "Notifikasi")
 * @param {string} type - Tipe: 'success', 'error', 'info', 'warning' (default: 'info')
 */
function showAlert(message, title = 'Notifikasi', type = 'info') {
    // Ensure modal system is initialized
    if (!document.getElementById('alertModal')) {
        initModalSystem();
    }

    const modal = document.getElementById('alertModal');
    const icon = document.getElementById('alertIcon');
    const titleEl = document.getElementById('alertTitle');
    const messageEl = document.getElementById('alertMessage');
    const container = modal.querySelector('.modal-container');

    // Set title dan message
    titleEl.textContent = title;
    messageEl.textContent = message;

    // Set icon berdasarkan type
    const iconMap = {
        'success': '<i class="fas fa-check-circle" style="color:var(--modal-success);-webkit-text-fill-color:var(--modal-success)"></i>',
        'error': '<i class="fas fa-times-circle" style="color:var(--modal-danger);-webkit-text-fill-color:var(--modal-danger)"></i>',
        'warning': '<i class="fas fa-exclamation-circle" style="color:var(--modal-warning);-webkit-text-fill-color:var(--modal-warning)"></i>',
        'info': '<i class="fas fa-info-circle" style="color:var(--modal-primary);-webkit-text-fill-color:var(--modal-primary)"></i>',
        'question': '<i class="fas fa-question-circle" style="color:var(--modal-warning);-webkit-text-fill-color:var(--modal-warning)"></i>'
    };

    icon.innerHTML = iconMap[type] || iconMap['info'];

    // Update container class
    container.className = `modal-container modal-alert ${type}`;

    // Show modal dengan animation
    modal.style.display = 'flex';
    requestAnimationFrame(() => {
        modal.style.animation = 'modalOverlayFadeIn 0.2s ease';
    });
}

/**
 * Close Alert Modal
 */
function closeAlertModal() {
    const modal = document.getElementById('alertModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

/**
 * Show Confirm Dialog
 * @param {string} message - Pesan konfirmasi
 * @param {Function} callback - Fungsi yang dipanggil dengan true/false
 * @param {string} title - Judul (default: "Konfirmasi")
 * @param {Object} options - Opsi tambahan {yesText, noText, isDangerous}
 */
function showConfirm(message, callback, title = 'Konfirmasi', options = {}) {
    // Ensure modal system is initialized
    if (!document.getElementById('confirmModal')) {
        initModalSystem();
    }

    const {
        yesText = 'Ya, Lanjutkan',
        noText = 'Batal',
        isDangerous = false
    } = options;

    const modal = document.getElementById('confirmModal');
    const titleEl = document.getElementById('confirmTitle');
    const messageEl = document.getElementById('confirmMessage');
    const btnYes = document.getElementById('confirmBtnYes');
    const btnNo = modal.querySelector('.modal-btn-secondary');
    const container = modal.querySelector('.modal-container');

    // Set title dan message
    titleEl.textContent = title;
    messageEl.textContent = message;
    btnYes.textContent = yesText;
    btnNo.textContent = noText;

    // Update button style jika dangerous
    if (isDangerous) {
        btnYes.style.background = 'linear-gradient(135deg, #ef4444, #dc2626)';
        btnYes.style.color = 'white';
    } else {
        btnYes.style.background = 'linear-gradient(135deg, #3b82f6, #2563eb)';
        btnYes.style.color = 'white';
    }

    // Store callback
    confirmCallback = callback;

    // Show modal
    modal.style.display = 'flex';
    requestAnimationFrame(() => {
        modal.style.animation = 'modalOverlayFadeIn 0.2s ease';
    });

    // Focus yes button
    setTimeout(() => btnYes.focus(), 100);
}

/**
 * Close Confirm Modal
 * @param {boolean} confirmed - true jika user klik yes, false jika batal
 */
function closeConfirmModal(confirmed = false) {
    const modal = document.getElementById('confirmModal');
    if (modal) {
        modal.style.display = 'none';
    }

    // Call callback jika ada
    if (confirmCallback) {
        const cb = confirmCallback;
        confirmCallback = null;
        setTimeout(() => cb(confirmed), 100);
    }
}

/**
 * Show Prompt Dialog
 */
function showPrompt(message, callback, defaultValue = '', title = 'Input Data') {
    if (!document.getElementById('promptModal')) initModalSystem();
    const modal = document.getElementById('promptModal');
    const input = document.getElementById('promptInput');
    document.getElementById('promptTitle').textContent = title;
    document.getElementById('promptMessage').textContent = message;
    input.value = defaultValue;
    promptCallback = callback;
    modal.style.display = 'flex';
    setTimeout(() => input.focus(), 200);
}

function closePromptModal(confirmed = false) {
    const modal = document.getElementById('promptModal');
    const val = document.getElementById('promptInput').value;
    modal.style.display = 'none';
    if (promptCallback) {
        const cb = promptCallback;
        promptCallback = null;
        cb(confirmed ? val : null);
    }
}

/**
 * Show Loading Overlay
 */
function showLoading(message = 'Memproses...') {
    if (!document.getElementById('loadingModal')) initModalSystem();
    document.getElementById('loadingMessage').textContent = message;
    document.getElementById('loadingModal').style.display = 'flex';
}

function hideLoading() {
    const modal = document.getElementById('loadingModal');
    if (modal) modal.style.display = 'none';
}

/**
 * Show Unified Toast
 */
function showToast(message, type = 'info') {
    if (!document.getElementById('toast-container')) initModalSystem();
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `dynamic-toast ${type}`;
    
    const iconMap = {
        'success': '<i class="fas fa-check-circle" style="color:#22c55e; margin-right:8px;"></i>',
        'error': '<i class="fas fa-exclamation-triangle" style="color:#ef4444; margin-right:8px;"></i>'
    };
    
    toast.innerHTML = (iconMap[type] || '') + message;
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'toastOut 0.4s ease forwards';
        setTimeout(() => toast.remove(), 400);
    }, 4000);
}

/**
 * Override native alert dengan custom modal
 */
window.alert = function(message) {
    showAlert(message, 'Informasi', 'info');
};

/**
 * Override native confirm dengan custom modal
 */
window.confirm = function(message) {
    // Karena window.confirm bersifat synchronous, kita tidak bisa 100% menggantinya 
    // tanpa merubah flow (harus async/await). Namun kita arahkan ke sistem dialog.
    console.warn("Browser confirm() digantikan dengan showConfirm(). Pastikan logika Anda menggunakan callback.");
    showConfirm(message, (res) => { console.log("Confirm result:", res); });
    return false; // Selalu return false untuk mencegah eksekusi default
};

/**
 * Global export
 */
window.EkinToast = showToast;
window.EkinLoading = { show: showLoading, hide: hideLoading };
window.EkinPrompt = showPrompt;

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initModalSystem);
} else {
    initModalSystem();
}
