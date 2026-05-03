/**
 * Service Worker Controller
 * Membantu manage cache dan service worker dari client-side
 * 
 * Usage:
 * - SWController.skipWaiting()     // Force activate new SW
 * - SWController.clearCache()      // Clear all caches
 * - SWController.getInfo()         // Get SW info
 * - SWController.onUpdate()        // Listen for updates
 */

class ServiceWorkerController {
  constructor() {
    this.registration = null;
    this.updateAvailable = false;
  }

  /**
   * Register service worker dan setup listeners
   */
  async register() {
    if (!('serviceWorker' in navigator)) {
      console.warn('[SW Controller] Service Worker tidak didukung browser');
      return;
    }

    try {
      this.registration = await navigator.serviceWorker.register('/service-worker.js', {
        scope: '/',
        updateViaCache: 'none' // Force check server untuk update
      });

      console.log('[SW Controller] Registered successfully:', this.registration.scope);

      // Listen untuk update
      this.registration.addEventListener('updatefound', () => {
        const newWorker = this.registration.installing;
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'activated') {
            this.updateAvailable = true;
            this._notifyUpdate();
          }
        });
      });

      // Listen untuk controller change
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        console.log('[SW Controller] Controller changed - refresh page');
      });

      // Check untuk update setiap 1 jam
      setInterval(() => this.checkForUpdates(), 3600000);

    } catch (error) {
      console.error('[SW Controller] Registration failed:', error);
    }
  }

  /**
   * Check untuk update dari server
   */
  async checkForUpdates() {
    if (!this.registration) {
      await this.register();
      return;
    }

    try {
      await this.registration.update();
      console.log('[SW Controller] Update check complete');
    } catch (error) {
      console.error('[SW Controller] Update check failed:', error);
    }
  }

  /**
   * Skip waiting - activate new service worker immediately
   */
  async skipWaiting() {
    if (!this.registration) {
      console.warn('[SW Controller] No registration found');
      return false;
    }

    const worker = this.registration.waiting;
    if (!worker) {
      console.warn('[SW Controller] No waiting worker found');
      return false;
    }

    console.log('[SW Controller] Skipping waiting - activating new worker');
    worker.postMessage({ type: 'SKIP_WAITING' });
    return true;
  }

  /**
   * Clear all caches
   */
  async clearCache() {
    try {
      const cacheNames = await caches.keys();
      console.log('[SW Controller] Clearing caches:', cacheNames);
      
      await Promise.all(
        cacheNames.map(name => caches.delete(name))
      );

      // Notify SW
      if (navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({ type: 'CLEAR_CACHE' });
      }

      console.log('[SW Controller] All caches cleared');
      return true;
    } catch (error) {
      console.error('[SW Controller] Clear cache failed:', error);
      return false;
    }
  }

  /**
   * Unregister service worker
   */
  async unregister() {
    if (!this.registration) {
      console.warn('[SW Controller] No registration found');
      return false;
    }

    try {
      const unregistered = await this.registration.unregister();
      if (unregistered) {
        console.log('[SW Controller] Unregistered successfully');
        this.registration = null;
      }
      return unregistered;
    } catch (error) {
      console.error('[SW Controller] Unregister failed:', error);
      return false;
    }
  }

  /**
   * Get service worker info
   */
  async getInfo() {
    const info = {
      supported: 'serviceWorker' in navigator,
      registered: !!this.registration,
      active: !!this.registration?.active,
      waiting: !!this.registration?.waiting,
      installing: !!this.registration?.installing,
      updateAvailable: this.updateAvailable,
      scope: this.registration?.scope || null,
      caches: [],
      controller: !!navigator.serviceWorker.controller
    };

    try {
      info.caches = await caches.keys();
    } catch (error) {
      console.error('[SW Controller] Failed to get cache names:', error);
    }

    return info;
  }

  /**
   * Get cache content details
   */
  async getCacheDetails() {
    try {
      const cacheNames = await caches.keys();
      const details = {};

      for (const name of cacheNames) {
        const cache = await caches.open(name);
        const requests = await cache.keys();
        details[name] = requests.map(req => req.url);
      }

      return details;
    } catch (error) {
      console.error('[SW Controller] Failed to get cache details:', error);
      return {};
    }
  }

  /**
   * Clear specific cache
   */
  async clearSpecificCache(cacheName) {
    try {
      const deleted = await caches.delete(cacheName);
      console.log(`[SW Controller] Cache "${cacheName}" cleared:`, deleted);
      return deleted;
    } catch (error) {
      console.error('[SW Controller] Failed to clear cache:', error);
      return false;
    }
  }

  /**
   * Notify update tersedia (bisa di-override)
   */
  _notifyUpdate() {
    console.log('[SW Controller] ⚠️ Update tersedia! Silakan refresh halaman.');
    // Trigger custom event
    window.dispatchEvent(new CustomEvent('sw-update-available'));
  }

  /**
   * Force full update dan reload
   */
  async forceUpdate() {
    console.log('[SW Controller] Forcing update...');
    
    // Clear semua cache
    await this.clearCache();
    
    // Check untuk update
    await this.checkForUpdates();
    
    // Reload halaman
    window.location.reload(true);
  }

  /**
   * Handle messages dari service worker
   */
  onMessage(callback) {
    navigator.serviceWorker.addEventListener('message', (event) => {
      callback(event.data);
    });
  }

  /**
   * Send message ke service worker
   */
  postMessage(message) {
    if (navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage(message);
    } else {
      console.warn('[SW Controller] No service worker controller available');
    }
  }
}

// Initialize global instance
const SWController = new ServiceWorkerController();

// Auto-register saat DOM ready
document.addEventListener('DOMContentLoaded', () => {
  SWController.register();

  // Listen untuk update tersedia
  window.addEventListener('sw-update-available', () => {
    // Show notification ke user
    console.log('✅ Update tersedia! Silakan refresh atau klik link di bawah');
    // Bisa implement toast notification di sini
  });
});

// Export untuk use di module
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SWController;
}
