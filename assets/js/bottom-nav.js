(function() {
  function getCurrentAuthUser() {
    var user = null;
    if (window.EkinAuth && typeof window.EkinAuth.getCurrentUser === 'function') {
      try {
        user = window.EkinAuth.getCurrentUser();
      } catch (e) {
        user = null;
      }
    }
    if (!user) {
      var session = localStorage.getItem('ekin_session');
      if (session) {
        try {
          user = JSON.parse(session);
        } catch (e) {
          user = null;
        }
      }
    }
    return user;
  }

  function createProfilePopupOverlay() {
    if (document.getElementById('profilePopupOverlay')) return;

    var html = '' +
      '<div class="profile-popup-overlay" id="profilePopupOverlay" aria-hidden="true" role="dialog" aria-modal="true">' +
      '  <div class="profile-popup-card">' +
      '    <div class="profile-popup-header">' +
      '      <div>' +
      '        <p class="profile-popup-tag">Profil Pengguna</p>' +
      '        <h3 class="profile-popup-title">Detail akun saat ini</h3>' +
      '      </div>' +
      '      <button class="profile-popup-close" id="profilePopupClose" type="button" aria-label="Tutup profil">' +
      '        <i class="fas fa-times"></i>' +
      '      </button>' +
      '    </div>' +
      '    <div class="profile-popup-content" id="profilePopupContent"></div>' +
      '    <div class="profile-popup-actions" id="profilePopupActions"></div>' +
      '  </div>' +
      '</div>';

    document.body.insertAdjacentHTML('beforeend', html);

    var overlay = document.getElementById('profilePopupOverlay');
    var closeBtn = document.getElementById('profilePopupClose');

    if (overlay) {
      overlay.addEventListener('click', function(event) {
        if (event.target === overlay) closeProfilePopup();
      });
    }

    if (closeBtn) {
      closeBtn.addEventListener('click', closeProfilePopup);
    }
  }

  function updateProfilePopupOverlay() {
    var contentEl = document.getElementById('profilePopupContent');
    var actionsEl = document.getElementById('profilePopupActions');
    if (!contentEl || !actionsEl) return;

    var user = getCurrentAuthUser();
    contentEl.innerHTML = '';
    actionsEl.innerHTML = '';

    if (!user) {
      contentEl.innerHTML =
        '<div class="profile-popup-empty">' +
        '  <p>Belum ada pengguna yang masuk.</p>' +
        '  <p>Silakan masuk untuk melihat detail profil Anda.</p>' +
        '</div>';
      actionsEl.innerHTML =
        '<a href="login.html" class="profile-popup-link">' +
        '  <i class="fas fa-sign-in-alt"></i> Masuk Sekarang' +
        '</a>';
      return;
    }

    var profilePhotoUrl = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120"%3E%3Crect width="120" height="120" rx="60" fill="%23256cf0"/%3E%3Cpath d="M60 38c10.5 0 19 8.5 19 19s-8.5 19-19 19-19-8.5-19-19 8.5-19 19-19zm0 42c16.8 0 32 8.3 32 18.4V102H28v-3.6C28 88.3 43.2 80 60 80z" fill="%23fff"/%3E%3C/svg%3E';
    var dashboardPhotoKey = 'dashboard_profile_photo_' + (user.username || 'guest');
    var savedPhoto = localStorage.getItem(dashboardPhotoKey);
    if (savedPhoto) {
      profilePhotoUrl = savedPhoto;
    }

    contentEl.innerHTML =
      '<div class="profile-popup-avatar-wrap">' +
      '  <div class="profile-popup-avatar-frame">' +
      '    <img src="' + profilePhotoUrl + '" alt="Foto profil" class="profile-popup-avatar" />' +
      '  </div>' +
      '  <div class="profile-popup-meta">' +
      '    <p class="profile-popup-name">' + (user.username || 'User') + '</p>' +
      '    <p class="profile-popup-email">' + (user.email || 'Tidak tersedia') + '</p>' +
      '  </div>' +
      '</div>' +
      '<div class="profile-popup-row"><span class="profile-popup-label">Username</span><span class="profile-popup-value">' + (user.username || '-') + '</span></div>' +
      '<div class="profile-popup-row"><span class="profile-popup-label">Email</span><span class="profile-popup-value">' + (user.email || '-') + '</span></div>';

    actionsEl.innerHTML =
      '<button type="button" class="profile-popup-link profile-popup-my-nav" id="profilePopupMyNav">' +
      '  <i class="fas fa-user-circle"></i> Saya' +
      '</button>' +
      '<button type="button" class="profile-popup-link" id="profilePopupChangePhoto">' +
      '  <i class="fas fa-camera"></i> Ubah Foto' +
      '</button>' +
      '<button type="button" class="profile-popup-link profile-popup-logout" id="profilePopupLogout">' +
      '  <i class="fas fa-sign-out-alt"></i> Keluar' +
      '</button>' +
      '<input type="file" id="profilePopupPhotoInput" accept="image/*" style="display:none" />';

    var changePhotoBtn = document.getElementById('profilePopupChangePhoto');
    var logoutBtn = document.getElementById('profilePopupLogout');
    var myNavBtn = document.getElementById('profilePopupMyNav');
    var fileInput = document.getElementById('profilePopupPhotoInput');

    if (changePhotoBtn && fileInput) {
      changePhotoBtn.addEventListener('click', function() {
        fileInput.click();
      });

      fileInput.addEventListener('change', function(event) {
        var file = event.target.files && event.target.files[0];
        if (!file || !file.type.startsWith('image/')) return;
        var reader = new FileReader();
        reader.onload = function(e) {
          var dataUrl = e.target.result;
          localStorage.setItem(dashboardPhotoKey, dataUrl);
          openProfilePopup();
          if (document.getElementById('dashboardProfilePhotoImg')) {
            document.getElementById('dashboardProfilePhotoImg').src = dataUrl;
          }
        };
        reader.readAsDataURL(file);
      });
    }

    if (logoutBtn) {
      logoutBtn.addEventListener('click', function() {
        if (window.EkinAuth && typeof window.EkinAuth.logout === 'function') {
          window.EkinAuth.logout();
        }
        localStorage.removeItem('ekin_session');
        closeProfilePopup();
        window.location.href = 'login.html';
      });
    }

    if (myNavBtn) {
      myNavBtn.addEventListener('click', function() {
        var profileNav = document.querySelector('.bottom-nav-link[data-nav="profil"]');
        if (profileNav) {
          setActiveBottomNav(profileNav);
        }
        closeProfilePopup();
      });
    }
  }

  function openProfilePopup() {
    createProfilePopupOverlay();
    updateProfilePopupOverlay();
    var overlay = document.getElementById('profilePopupOverlay');
    if (overlay) {
      overlay.classList.add('open');
      overlay.setAttribute('aria-hidden', 'false');
      document.body.classList.add('profile-popup-open');
    }
  }

  function closeProfilePopup() {
    var overlay = document.getElementById('profilePopupOverlay');
    if (overlay) {
      overlay.classList.remove('open');
      overlay.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('profile-popup-open');
    }
  }

  document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
      closeProfilePopup();
    }
  });

  function setActiveBottomNav(item) {
    var links = document.querySelectorAll('.bottom-nav-link');
    links.forEach(function(link) {
      link.classList.toggle('active', link === item);
    });
  }

  function setupBottomNavHandlers() {
    var bottomFab = document.getElementById('bottomNavFab');
    var fabMenu = document.getElementById('fabMenu');
    var links = document.querySelectorAll('.bottom-nav-link');

    function toggleFabMenu() {
      if (!fabMenu || !bottomFab) return;
      fabMenu.classList.toggle('open');
      bottomFab.classList.toggle('open');
      bottomFab.setAttribute('aria-expanded', fabMenu.classList.contains('open'));
    }

    function closeFabMenu() {
      if (!fabMenu || !bottomFab) return;
      fabMenu.classList.remove('open');
      bottomFab.classList.remove('open');
      bottomFab.setAttribute('aria-expanded', 'false');
    }

    if (bottomFab) {
      bottomFab.addEventListener('click', function(event) {
        event.preventDefault();
        toggleFabMenu();
      });
    }

    if (fabMenu) {
      fabMenu.addEventListener('click', function(event) {
        var item = event.target.closest('.fab-menu-item');
        if (item) {
          closeFabMenu();
        }
      });
    }

    document.addEventListener('click', function(event) {
      if (!fabMenu || !bottomFab) return;
      if (fabMenu.classList.contains('open')) {
        var clickedFab = bottomFab.contains(event.target) || fabMenu.contains(event.target);
        if (!clickedFab) closeFabMenu();
      }
    });

    links.forEach(function(link) {
      if (link.getAttribute('href') === '#') {
        link.addEventListener('click', function(event) {
          event.preventDefault();
          setActiveBottomNav(link);
          try {
            localStorage.setItem('appBottomNavActive', link.dataset.nav);
          } catch (e) {}
        });
      }

      if (link.dataset.nav === 'profil') {
        link.addEventListener('click', function(event) {
          event.preventDefault();
          openProfilePopup();
          setActiveBottomNav(link);
          try {
            localStorage.setItem('appBottomNavActive', link.dataset.nav);
          } catch (e) {}
        });
      }

      // 'riwayat' links should navigate to the riwayat page (no overlay)
    });

    try {
      var savedNav = localStorage.getItem('appBottomNavActive');
      if (savedNav) {
        var savedLink = document.querySelector('.bottom-nav-link[data-nav="' + savedNav + '"]');
        if (savedLink) setActiveBottomNav(savedLink);
      }
    } catch (e) {
      // ignore storage issues
    }
  }

  function createBottomNav() {
    if (document.querySelector('.bottom-nav-shell')) {
      setupBottomNavHandlers();
      return;
    }

    var navHtml = "" +
      '<div class="bottom-nav-shell" aria-label="Bottom Navigation">' +
      '  <div class="bottom-nav-glass">' +
      '    <div class="bottom-nav-tabs">' +
      '      <a href="index.html" class="bottom-nav-link" data-nav="home">' +
      '        <span class="bottom-nav-icon"><i class="fas fa-home"></i></span>' +
      '        <span class="bottom-nav-text">Home</span>' +
      '      </a>' +
      '      <a href="riwayat.html" class="bottom-nav-link" data-nav="riwayat">' +
      '        <span class="bottom-nav-icon"><i class="fas fa-file-pdf"></i></span>' +
      '        <span class="bottom-nav-text multiline">Riwayat<br>&amp; PDF</span>' +
      '      </a>' +
      '      <div class="bottom-nav-center-placeholder">' +
      '        <button class="bottom-nav-fab" type="button" id="bottomNavFab" aria-label="Tambah" aria-expanded="false">' +
      '          <i class="fas fa-plus"></i>' +
      '        </button>' +
      '      </div>' +
      '      <a href="https://drive.google.com/drive/u/0/my-drive" class="bottom-nav-link" data-nav="drive" target="_blank" rel="noopener">' +
      '        <span class="bottom-nav-icon"><i class="fab fa-google-drive"></i></span>' +
      '        <span class="bottom-nav-text">Google Drive</span>' +
      '      </a>' +
      '      <a href="#" class="bottom-nav-link" data-nav="profil" aria-label="Profil Pengguna">' +
      '        <span class="bottom-nav-icon"><i class="fas fa-user"></i></span>' +
      '        <span class="bottom-nav-text">Profil</span>' +
      '      </a>' +
      '    </div>' +
      '  </div>' +
      '</div>' +
      '<div class="fab-menu" id="fabMenu">' +
      '  <a href="inputan.html" class="fab-menu-item" data-action="inputnon">' +
      '    <i class="fas fa-edit"></i>' +
      '    <span>Input Non Tabel</span>' +
      '  </a>' +
      '  <a href="inputan-tabel.html" class="fab-menu-item" data-action="inputtable">' +
      '    <i class="fas fa-table"></i>' +
      '    <span>Inputan Tabel</span>' +
      '  </a>' +
      '</div>';

    document.body.insertAdjacentHTML('beforeend', navHtml);
    document.body.classList.add('has-bottom-nav');
    setupBottomNavHandlers();
  }

  /* Riwayat overlay: show only the "DAFTAR LAPORAN TERSIMPAN" from inputan.html */
  function createRiwayatOverlay() {
    if (document.getElementById('riwayatOverlay')) return;
    var html = '' +
      '<div id="riwayatOverlay" class="riwayat-overlay" aria-hidden="true" role="dialog">' +
      '  <div class="riwayat-panel">' +
      '    <div class="riwayat-header">' +
      '      <h3>Riwayat Laporan</h3>' +
      '      <button id="riwayatClose" class="riwayat-close" aria-label="Tutup">&times;</button>' +
      '    </div>' +
      '    <div class="riwayat-body">' +
      '      <div class="saved-report-toolbar">' +
      '        <input type="text" id="report-search" placeholder="Cari laporan..." />' +
      '        <select id="report-filter">' +
      '          <option value="all">Semua</option>' +
      '          <option value="nama">Nama</option>' +
      '          <option value="nip">NIP</option>' +
      '          <option value="jabatan">Jabatan</option>' +
      '          <option value="instansi">Instansi</option>' +
      '        </select>' +
      '      </div>' +
      '      <div id="saved-reports" class="saved-report-list">Memuat daftar laporan tersimpan...</div>' +
      '    </div>' +
      '  </div>' +
      '</div>';
    document.body.insertAdjacentHTML('beforeend', html);

    var overlay = document.getElementById('riwayatOverlay');
    var closeBtn = document.getElementById('riwayatClose');
    if (overlay) {
      overlay.addEventListener('click', function(e) {
        if (e.target === overlay) closeRiwayatOverlay();
      });
    }
    if (closeBtn) closeBtn.addEventListener('click', closeRiwayatOverlay);

    var search = document.getElementById('report-search');
    var filter = document.getElementById('report-filter');
    function refresh() {
      if (typeof renderSavedReports === 'function') {
        try { renderSavedReports(); } catch (e) {}
      }
    }
    if (search) search.addEventListener('input', refresh);
    if (filter) filter.addEventListener('change', refresh);
  }

  function openRiwayatOverlay() {
    createRiwayatOverlay();
    var overlay = document.getElementById('riwayatOverlay');
    if (!overlay) return;
    overlay.classList.add('open');
    overlay.setAttribute('aria-hidden', 'false');
    if (typeof renderSavedReports === 'function') {
      try { renderSavedReports(); } catch (e) {}
    }
    document.body.classList.add('profile-popup-open');
  }

  function closeRiwayatOverlay() {
    var overlay = document.getElementById('riwayatOverlay');
    if (!overlay) return;
    overlay.classList.remove('open');
    overlay.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('profile-popup-open');
  }

  document.addEventListener('DOMContentLoaded', createBottomNav);
})();
