

/* ========== KONFIGURASI NAV LINKS ========== */
const NAV_CONFIG = {
  links: [
    {
      url: "/index.html",
      icon: "fas fa-tower-broadcast",
      label: "Dash",
      id: "nav-dash"
    },
    {
      url: "/inputan.html",
      icon: "fas fa-edit",
      label: "Input",
      id: "nav-input"
    },
    {
      url: "/inputan-tabel.html",
      icon: "fas fa-table",
      label: "Inputan Tabel",
      id: "nav-tabel"
    },
    {
      url: "/rekapan.html",
      icon: "fas fa-database",
      label: "Rekapan",
      id: "nav-rekapan"
    },
    {
      url: "/panduan-penggunaan.html",
      icon: "fas fa-book-open",
      label: "Info",
      id: "nav-info"
    }
  ]
};

/* ========== SIDE DRAWER FUNCTIONS ========== */

/**
 * Toggle side drawer open/close
 */
function toggleSideDrawer() {
  var overlay = document.getElementById("sideDrawerOverlay");
  var drawer = document.getElementById("sideDrawer");
  
  if (!overlay || !drawer) {
    console.warn("Side drawer elements not found");
    return;
  }

  var isOpen = overlay.classList.contains("open");
  
  if (isOpen) {
    closeSideDrawer();
  } else {
    overlay.classList.add("open");
    drawer.classList.add("open");
    injectSideDrawerAuth();
  }
}

/**
 * Close side drawer
 */
function closeSideDrawer() {
  var overlay = document.getElementById("sideDrawerOverlay");
  var drawer = document.getElementById("sideDrawer");
  
  if (!overlay || !drawer) {
    console.warn("Side drawer elements not found");
    return;
  }
  
  overlay.classList.remove("open");
  drawer.classList.remove("open");
}

/**
 * Inject authentication section ke side drawer
 */
function injectSideDrawerAuth() {
  var container = document.getElementById("sideDrawerAuth");
  if (!container) return;

  var user = null;
  
  // Try to get user dari EkinAuth module
  try {
    if (
      window.EkinAuth &&
      typeof window.EkinAuth.getCurrentUser === "function"
    ) {
      user = window.EkinAuth.getCurrentUser();
    }
    // Fallback ke localStorage jika EkinAuth tidak tersedia
    if (!user) {
      var session = localStorage.getItem("ekin_session");
      if (session) {
        user = JSON.parse(session);
      }
    }
  } catch (e) {
    user = null;
  }

  // Render auth buttons berdasarkan status user
  if (user) {
    // User sudah login - tampilkan tombol Keluar
    container.innerHTML =
      '<a href="login.html" class="side-drawer-auth-btn keluar" onclick="if(confirm(\'Yakin ingin keluar?\')){window.EkinAuth.logout();closeSideDrawer();}">' +
      '<i class="fas fa-sign-out-alt"></i> Keluar' +
      "</a>";
  } else {
    // User belum login - tampilkan tombol Masuk dan Buat Akun
    container.innerHTML =
      '<a href="login.html" class="side-drawer-auth-btn masuk" onclick="closeSideDrawer()">' +
      '<i class="fas fa-sign-in-alt"></i> Masuk' +
      "</a>" +
      '<a href="register.html" class="side-drawer-auth-btn daftar" onclick="closeSideDrawer()">' +
      '<i class="fas fa-user-plus"></i> Buat Akun' +
      "</a>";
  }
}

/* ========== ACTIVE STATE DETECTION ========== */

/**
 * Get current page filename - robust untuk PWA dan web
 */
function getCurrentPageFile() {
  var pathname = window.location.pathname;
  
  // Handle PWA dan web path
  var filename = pathname.substring(pathname.lastIndexOf("/") + 1);
  
  // Jika kosong atau path tertentu, anggap index.html
  if (!filename || filename === "") {
    filename = "index.html";
  }
  
  return filename;
}

/**
 * Set active state pada nav links berdasarkan current page
 */
function setActiveNavLink() {
  var currentFile = getCurrentPageFile();
  
  // Set active pada nav-container links
  var navLinks = document.querySelectorAll(".nav-container .nav-link");
  navLinks.forEach(function (link) {
    link.classList.remove("active");
    if (link.getAttribute("href") === currentFile) {
      link.classList.add("active");
    }
  });
  
  // Set active pada mobile-nav links
  var mobileLinks = document.querySelectorAll(".mobile-nav .nav-link");
  mobileLinks.forEach(function (link) {
    link.classList.remove("active");
    if (link.getAttribute("href") === currentFile) {
      link.classList.add("active");
    }
  });
  
  // Set active pada side-drawer links
  var drawerLinks = document.querySelectorAll(".side-drawer-links .side-drawer-link");
  drawerLinks.forEach(function (link) {
    link.classList.remove("active");
    if (link.getAttribute("href") === currentFile) {
      link.classList.add("active");
    }
  });
}

/**
 * Toggle mobile nav (untuk EkinToggleMobileNav)
 */
window.EkinToggleMobileNav = function () {
  var nav = document.getElementById("mobileNav");
  if (!nav) {
    console.warn("Mobile nav element not found");
    return;
  }
  nav.classList.toggle("open");
};

/* ========== INITIALIZATION ========== */

/**
 * Handle navigation link clicks - support PWA dan web biasa
 */
function handleNavClick(event) {
  var href = event.currentTarget.getAttribute("href");
  
  if (!href || href === "#") {
    event.preventDefault();
    return;
  }
  
  // Close drawer sebelum navigate
  closeSideDrawer();
  
  // Jika link eksternal atau anchor, biarkan browser handle
  if (href.startsWith("http") || href.startsWith("#")) {
    return;
  }
  
  // Untuk PWA dan relative links, handle dengan proper
  event.preventDefault();
  
  var basePath = getBasePath();
  var fullPath = basePath + href;
  
  // Navigate ke path
  window.location.href = fullPath;
}

/**
 * Get base path - handle untuk PWA dan web biasa
 */
function getBasePath() {
  var pathname = window.location.pathname;
  var basePath = pathname.substring(0, pathname.lastIndexOf("/") + 1);
  
  // Handle jika running sebagai PWA (path lebih panjang)
  // atau web biasa (path standar)
  return basePath;
}

/**
 * Initialize navigation on page load
 */
function initNavigation() {
  // Set active links
  setActiveNavLink();
  
  // Setup click handlers untuk semua nav links
  var allNavLinks = document.querySelectorAll(
    ".side-drawer-links .side-drawer-link, " +
    ".mobile-nav .nav-link, " +
    ".nav-container .nav-link"
  );
  
  allNavLinks.forEach(function (link) {
    link.addEventListener("click", handleNavClick);
  });
}

// Initialize saat DOM sudah ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initNavigation);
} else {
  initNavigation();
}
