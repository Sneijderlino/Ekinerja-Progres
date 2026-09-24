/**
 * GHOST-TEAM | CENTRAL MONITORING HUB CLIENT
 * Telemetry & Auto Location Tracker
 * File: APLIKASI MONITORING-PWA/monitoring.js
 */

async function sendLocationToServer() {
    // 1. Ambil data user dari sesi login
    const user = (function() {
        try {
            if (window.EkinAuth && typeof window.EkinAuth.getCurrentUser === 'function') {
                return window.EkinAuth.getCurrentUser();
            }
            const session = localStorage.getItem('ekin_session');
            return session ? JSON.parse(session) : null;
        } catch (e) { return null; }
    })();

    if (!user) return;

    if (!navigator.geolocation) {
        console.warn("Monitoring: Geolocation tidak didukung.");
        return;
    }

    // 2. Ambil data Telemetry (Baterai & Jaringan)
    let batteryLevel = "N/A";
    let isCharging = "N/A";
    try {
        if (navigator.getBattery) {
            const battery = await navigator.getBattery();
            batteryLevel = Math.floor(battery.level * 100) + "%";
            isCharging = battery.charging ? "Charging" : "Discharging";
        }
    } catch (e) {}

    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    const networkType = connection ? connection.effectiveType : "Online";

    // 3. Ambil data IP & ISP (Menggunakan API publik ipapi.co)
    let ip = "N/A", isp = "N/A";
    try {
        const res = await fetch('https://ipapi.co/json/');
        if (res.ok) {
            const data = await res.json();
            ip = data.ip;
            isp = data.org;
        }
    } catch (e) {}

    // 4. Ambil Geolocation dan Kirim ke Apps Script
    navigator.geolocation.getCurrentPosition(async (position) => {
        const payload = {
            action: 'saveLocation',
            gmail: user.email,
            nama: user.username,
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            speed: position.coords.speed ? (position.coords.speed * 3.6).toFixed(2) + " km/h" : "0 km/h",
            battery: batteryLevel,
            isCharging: isCharging,
            network: networkType,
            ip: ip,
            isp: isp,
            appName: "E-Kinerja PWA"
        };

        const WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbymZlvZgsCvjpIRaSDlN_3NGZ9aTSRErEy7BDPVvlpN0x_eGxWa1AHhCdI54krE8KSevw/exec';

        try {
            await fetch(WEB_APP_URL, {
                method: 'POST',
                mode: 'no-cors', // Mode aman untuk Google Apps Script
                body: JSON.stringify(payload)
            });
            console.log('✓ Monitoring: Data telemetry berhasil disinkronisasi otomatis');
        } catch (error) {
            console.error('× Monitoring: Gagal sinkronisasi telemetry');
        }
    }, (error) => {
        console.error('× Monitoring: Gagal mengambil lokasi.', error.message);
        console.log('Catatan: Geolocation biasanya membutuhkan koneksi HTTPS agar berfungsi.');
    }, { enableHighAccuracy: true, timeout: 10000 });
}