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
        <!-- Alert Modal -->
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
    </div>

    <style>
        /* Modal System Styles */
        #custom-modal-wrapper {
            --modal-primary: #3b82f6;
            --modal-secondary: #2dd4bf;
            --modal-danger: #ef4444;
            --modal-warning: #f59e0b;
            --modal-success: #22c55e;
            --modal-bg: #060912;
            --modal-surface: #111827;
            --modal-border: rgba(255, 255, 255, 0.06);
            --modal-text: #f8fafc;
            --modal-text-dim: #94a3b8;
        }

        .modal-overlay {
            position: fixed;
            inset: 0;
            background: rgba(0, 0, 0, 0.6);
            backdrop-filter: blur(8px);
            -webkit-backdrop-filter: blur(8px);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 9999;
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
            padding: 32px;
            max-width: 420px;
            width: 90%;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5), 
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
            font-size: 3.5rem;
            margin-bottom: 20px;
            display: inline-block;
            animation: iconBounce 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        @keyframes iconBounce {
            0%, 100% {
                transform: translateY(0) scale(1);
            }
            50% {
                transform: translateY(-10px) scale(1.1);
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
            transition: all 0.2s ease;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            flex: 1;
            max-width: 160px;
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
            background: linear-gradient(135deg, var(--modal-primary), #2563eb);
            color: white;
        }

        .modal-btn-primary:hover {
            box-shadow: 0 8px 25px rgba(59, 130, 246, 0.4);
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
        'success': '<i class="fas fa-check-circle"></i>',
        'error': '<i class="fas fa-times-circle"></i>',
        'warning': '<i class="fas fa-exclamation-circle"></i>',
        'info': '<i class="fas fa-info-circle"></i>',
        'question': '<i class="fas fa-question-circle"></i>'
    };

    icon.innerHTML = iconMap[type] || iconMap['info'];

    // Update container class
    container.className = `modal-container modal-alert ${type === 'error' ? 'error' : ''}`;

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
 * Override native alert dengan custom modal
 * OPTIONAL: Uncomment untuk menggantikan alert global
 */
// window.alert = function(message) {
//     showAlert(message, 'Notifikasi', 'info');
// };

/**
 * Override native confirm dengan custom modal
 * OPTIONAL: Uncomment untuk menggantikan confirm global
 */
// window.confirm = function(message) {
//     return new Promise((resolve) => {
//         showConfirm(message, (result) => resolve(result));
//     });
// };

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initModalSystem);
} else {
    initModalSystem();
}
