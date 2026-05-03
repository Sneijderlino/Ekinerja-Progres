/**
 * E-Kinerja Auth Module
 * Centralized authentication using LocalStorage
 * No backend required
 */

(function () {
  'use strict';

  const STORAGE_KEYS = {
    USERS: 'ekin_users',
    SESSION: 'ekin_session',
  };

  /* ========================
     AUTH CORE
     ======================== */

  function getUsers() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS)) || [];
    } catch {
      return [];
    }
  }

  function saveUsers(users) {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  }

  function getSession() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.SESSION)) || null;
    } catch {
      return null;
    }
  }

  function saveSession(user) {
    localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(user));
  }

  function clearSession() {
    localStorage.removeItem(STORAGE_KEYS.SESSION);
  }

  /* ========================
     PUBLIC API
     ======================== */

  const Auth = {
    register(data) {
      const { username, email, password } = data;
      if (!username || !email || !password) {
        return { success: false, message: 'Semua field wajib diisi!' };
      }
      if (password.length < 6) {
        return { success: false, message: 'Password minimal 6 karakter!' };
      }

      const users = getUsers();
      const exists = users.find(
        (u) => u.email.toLowerCase() === email.toLowerCase() || u.username.toLowerCase() === username.toLowerCase()
      );
      if (exists) {
        return { success: false, message: 'Email atau username sudah terdaftar!' };
      }

      const newUser = {
        id: 'u_' + Date.now().toString(36),
        username: username.trim(),
        email: email.trim().toLowerCase(),
        password,
        createdAt: new Date().toISOString(),
      };
      users.push(newUser);
      saveUsers(users);
      return { success: true, message: 'Akun berhasil dibuat! Silakan login.' };
    },

    login(credentials) {
      const { identifier, password } = credentials;
      if (!identifier || !password) {
        return { success: false, message: 'Email/Username dan password harus diisi!' };
      }

      const users = getUsers();
      const user = users.find(
        (u) =>
          u.email.toLowerCase() === identifier.toLowerCase() ||
          u.username.toLowerCase() === identifier.toLowerCase()
      );

      if (!user) {
        return { success: false, message: 'Akun tidak ditemukan!' };
      }
      if (user.password !== password) {
        return { success: false, message: 'Password salah!' };
      }

      saveSession(user);
      return { success: true, message: 'Login berhasil!', user };
    },

    logout() {
      clearSession();
      // Dispatch event untuk update UI
      window.dispatchEvent(new CustomEvent('authStateChanged'));
      window.location.href = '/index.html';
    },

    isLoggedIn() {
      return !!getSession();
    },

    getCurrentUser() {
      return getSession();
    },

    forgotPassword(data) {
      const { email, newPassword, confirmPassword } = data;
      if (!email) {
        return { success: false, message: 'Email harus diisi!' };
      }
      if (!newPassword || !confirmPassword) {
        return { success: false, message: 'Password baru dan konfirmasi harus diisi!' };
      }
      if (newPassword !== confirmPassword) {
        return { success: false, message: 'Password baru dan konfirmasi tidak cocok!' };
      }
      if (newPassword.length < 6) {
        return { success: false, message: 'Password minimal 6 karakter!' };
      }

      const users = getUsers();
      const idx = users.findIndex((u) => u.email.toLowerCase() === email.toLowerCase());
      if (idx === -1) {
        return { success: false, message: 'Email tidak ditemukan!' };
      }

      users[idx].password = newPassword;
      saveUsers(users);

      const session = getSession();
      if (session && session.email.toLowerCase() === email.toLowerCase()) {
        saveSession(users[idx]);
      }

      return { success: true, message: 'Password berhasil diubah! Silakan login.' };
    },

    updateProfile(updates) {
      const session = getSession();
      if (!session) return { success: false, message: 'Belum login!' };

      const users = getUsers();
      const idx = users.findIndex((u) => u.id === session.id);
      if (idx === -1) return { success: false, message: 'User tidak ditemukan!' };

      if (updates.username) users[idx].username = updates.username.trim();
      if (updates.email) users[idx].email = updates.email.trim().toLowerCase();
      if (updates.password) users[idx].password = updates.password;

      saveUsers(users);
      const updated = { ...users[idx] };
      delete updated.password;
      saveSession(updated);
      return { success: true, message: 'Profil berhasil diperbarui!', user: updated };
    },
  };

  /* ========================
     UI HELPERS
     ======================== */

  function showToast(message, type = 'info') {
    const existing = document.getElementById('ekin-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.id = 'ekin-toast';
    toast.style.cssText = `
      position: fixed;
      bottom: 30px;
      left: 50%;
      transform: translateX(-50%) translateY(100px);
      background: ${type === 'error' ? 'linear-gradient(135deg, #ef4444, #dc2626)' : type === 'success' ? 'linear-gradient(135deg, #22c55e, #15803d)' : 'linear-gradient(135deg, #0f9fff, #0d7fcc)'};
      color: white;
      padding: 14px 28px;
      border-radius: 50px;
      z-index: 10001;
      transition: transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275), opacity 0.4s;
      font-weight: 700;
      font-size: 0.9rem;
      box-shadow: 0 8px 25px rgba(0,0,0,0.3);
      opacity: 0;
      pointer-events: none;
      text-align: center;
      max-width: 90vw;
      word-break: break-word;
    `;
    toast.textContent = message;
    document.body.appendChild(toast);

    requestAnimationFrame(() => {
      toast.style.transform = 'translateX(-50%) translateY(0)';
      toast.style.opacity = '1';
    });

    setTimeout(() => {
      toast.style.transform = 'translateX(-50%) translateY(100px)';
      toast.style.opacity = '0';
      setTimeout(() => toast.remove(), 400);
    }, 3000);
  }

  // Auto-init when DOM is ready if data-auth-init attribute is present on body
  document.addEventListener('DOMContentLoaded', function () {
    // Only init on pages that need auth UI
    if (document.body.dataset.authInit !== undefined) {
      initAuthUI();
    }
  });

  function initAuthUI() {
    const navbar = document.querySelector('.navbar');
    if (!navbar) return;

    if (navbar.dataset.authInit === '1') return;
    navbar.dataset.authInit = '1';

    const navContainer = navbar.querySelector('.nav-container');
    if (!navContainer) return;

    // Detect if we're in a subfolder (like auth/)
    const isInSubfolder = window.location.pathname.includes('/auth/');
    const prefix = isInSubfolder ? '../' : '';

    // 1. Hamburger button for mobile
    let hamburger = navContainer.querySelector('.nav-hamburger');
    if (!hamburger) {
      hamburger = document.createElement('button');
      hamburger.className = 'nav-hamburger';
      hamburger.setAttribute('aria-label', 'Menu');
      hamburger.innerHTML = '<i class="fas fa-bars"></i>';
      hamburger.onclick = function (e) {
        e.preventDefault();
        toggleMobileNav();
      };
      navContainer.appendChild(hamburger);
    }

    // 2. Mobile nav menu container
    let mobileNav = document.getElementById('mobileNav');
    if (!mobileNav) {
      mobileNav = document.createElement('div');
      mobileNav.id = 'mobileNav';
      mobileNav.className = 'mobile-nav';
      navContainer.appendChild(mobileNav);
    }

    // 3. Desktop auth area
    let desktopAuth = navContainer.querySelector('.desktop-auth');
    if (!desktopAuth) {
      desktopAuth = document.createElement('div');
      desktopAuth.className = 'desktop-auth';
      navContainer.appendChild(desktopAuth);
    }

    const user = Auth.getCurrentUser();

    // Populate desktop auth
    if (user) {
      desktopAuth.innerHTML = `
        <div class="nav-dropdown" style="position:relative;display:inline-block;">
          <button class="nav-link dropdown-btn" style="background:rgba(59,130,246,0.15);border:1px solid rgba(59,130,246,0.3);color:#fff;">
            <i class="fas fa-user-circle"></i> ${user.username} <i class="fas fa-chevron-down" style="font-size:0.7rem;margin-left:4px;"></i>
          </button>
          <div class="dropdown-content" style="min-width:180px;">
            <div style="padding:12px 16px;border-bottom:1px solid rgba(255,255,255,0.08);color:#94a3b8;font-size:0.8rem;">
              <div style="font-weight:700;color:#fff;">${user.username}</div>
              <div>${user.email}</div>
            <a href="#" onclick="event.preventDefault();if(confirm('Yakin ingin keluar?')){window.EkinAuth.logout();}"><i class="fas fa-sign-out-alt"></i> Keluar</a>
          </div>
      `;
    } else {
      desktopAuth.innerHTML = `
        <a href="${prefix}login.html" class="nav-link" style="margin-right:4px;"><i class="fas fa-sign-in-alt"></i> Masuk</a>
        <a href="${prefix}register.html" class="nav-link" style="background:linear-gradient(135deg,var(--primary,#3b82f6),#2563eb);color:#fff;border:none;"><i class="fas fa-user-plus"></i> Buat Akun</a>
      `;
    }

    // Populate mobile nav
    // Clone existing nav links
    const existingLinks = Array.from(navContainer.querySelectorAll('.nav-link:not(.dropdown-btn)'));
    mobileNav.innerHTML = '';
    existingLinks.forEach((link) => {
      if (link.closest('.desktop-auth')) return;
      const clone = link.cloneNode(true);
      clone.style.width = '100%';
      clone.style.justifyContent = 'flex-start';
      clone.style.marginBottom = '4px';
      mobileNav.appendChild(clone);
    });

    // Auth links for mobile
    const authSection = document.createElement('div');
    authSection.className = 'mobile-auth-section';
    authSection.style.cssText = 'border-top:1px solid rgba(255,255,255,0.1);padding-top:10px;margin-top:6px;display:flex;flex-direction:column;gap:8px;';

    if (user) {
      const profileLine = document.createElement('div');
      profileLine.style.cssText = 'color:#fff;font-weight:700;font-size:0.85rem;padding:8px 12px;';
      profileLine.innerHTML = `<i class="fas fa-user-circle" style="margin-right:8px;color:var(--primary,#3b82f6)"></i>${user.username}`;
      authSection.appendChild(profileLine);

      const logoutBtn = document.createElement('a');
      logoutBtn.href = '#';
      logoutBtn.className = 'nav-link';
      logoutBtn.style.cssText = 'width:100%;justify-content:flex-start;color:#ef4444;';
      logoutBtn.innerHTML = '<i class="fas fa-sign-out-alt"></i> Keluar';
      logoutBtn.onclick = function (e) {
        e.preventDefault();
        if (confirm('Yakin ingin keluar?')) Auth.logout();
      };
      authSection.appendChild(logoutBtn);
    } else {
      const loginBtn = document.createElement('a');
      loginBtn.href = prefix + 'login.html';
      loginBtn.className = 'nav-link';
      loginBtn.style.cssText = 'width:100%;justify-content:flex-start;';
      loginBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Masuk';
      authSection.appendChild(loginBtn);

      const regBtn = document.createElement('a');
      regBtn.href = prefix + 'register.html';
      regBtn.className = 'nav-link';
      regBtn.style.cssText = 'width:100%;justify-content:flex-start;';
      regBtn.innerHTML = '<i class="fas fa-user-plus"></i> Buat Akun';
      authSection.appendChild(regBtn);
    }

    mobileNav.appendChild(authSection);
  }

  function toggleMobileNav() {
    const nav = document.getElementById('mobileNav');
    if (!nav) return;
    nav.classList.toggle('open');
  }

  window.EkinAuth = Auth;
  window.EkinToast = showToast;
  window.EkinToggleMobileNav = toggleMobileNav;
})();
