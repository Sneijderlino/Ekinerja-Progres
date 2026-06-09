function doPost(e) {
  // Masukkan URL Google Sheet Anda di sini
  var ss = SpreadsheetApp.openByUrl(
    "https://docs.google.com/spreadsheets/d/1tPeky6-B3hUl5mB8Ww2RT6JSjxzJ1d-U-1gBN6yPvJM/edit",
  );

  // Membaca data JSON yang dikirim oleh halaman HTML
  if (!e || !e.postData || !e.postData.contents) {
    return ContentService.createTextOutput(
      JSON.stringify({
        success: false,
        message:
          "Error: Tidak ada data yang diterima. Pastikan fungsi ini dipanggil melalui HTTP POST.",
      }),
    ).setMimeType(ContentService.MimeType.JSON);
  }

  var params = JSON.parse(e.postData.contents);
  var action = params.action; // Menerima aksi: 'login', 'register', atau 'forgot'
  var inputUsername = params.username ? params.username.trim() : "";
  var inputGmail = params.gmail ? params.gmail.trim() : "";
  var inputPass = params.password ? params.password.trim() : "";

  var response = {
    success: false,
    message: "Aksi tidak dikenali oleh server.",
  };

  // ================= 1. LOGIKA SIMPAN LOKASI (Sheet: Data Lokasi) =================
  if (action === "saveLocation") {
    var locSheetName = "Data Lokasi";
    var locSheet = ss.getSheetByName(locSheetName);

    // Buat sheet jika belum ada
    if (!locSheet) {
      locSheet = ss.insertSheet(locSheetName);
      locSheet.appendRow([
        "Email",
        "Latitude",
        "Longitude",
        "Maps Link",
        "Waktu",
      ]);
    }

    locSheet.appendRow([
      inputGmail,
      params.lat || "-",
      params.lng || "-",
      params.mapsLink || "-",
      new Date(),
    ]);

    return ContentService.createTextOutput(
      JSON.stringify({
        success: true,
        message: "Data lokasi berhasil dikirim ke server!",
      }),
    ).setMimeType(ContentService.MimeType.JSON);
  }

  // ================= LOGIKA AUTH (Sheet: LOGIN USERS-APLIKASI e-KINERJA) =================
  var authSheetName = "LOGIN USERS-APLIKASI e-KINERJA";
  var sheet = ss.getSheetByName(authSheetName);

  if (!sheet) {
    return ContentService.createTextOutput(
      JSON.stringify({
        success: false,
        message: "Error: Tab '" + authSheetName + "' tidak ditemukan.",
      }),
    ).setMimeType(ContentService.MimeType.JSON);
  }

  var data = sheet.getDataRange().getValues();

  // ================= 2. LOGIKA PROSES LOGIN =================
  if (action === "login") {
    // Memeriksa baris demi baris di Google Sheets (dimulai dari baris ke-2)
    for (var i = 1; i < data.length; i++) {
      // Cek Gmail di Kolom B (index 1)
      var sheetEmail = data[i][1].toString().trim().toLowerCase();
      var inputLower = inputGmail.toLowerCase();

      if (sheetEmail === inputLower) {
        // Jika email ditemukan, cek password
        if (data[i][2].toString().trim() === inputPass) {
          response = {
            success: true,
            message: "Login berhasil!",
            user: {
              username: data[i][0],
              email: data[i][1],
            },
          };
          return ContentService.createTextOutput(
            JSON.stringify(response),
          ).setMimeType(ContentService.MimeType.JSON);
        } else {
          response = {
            success: false,
            message: "Password salah!",
          };
          return ContentService.createTextOutput(
            JSON.stringify(response),
          ).setMimeType(ContentService.MimeType.JSON);
        }
      }
    }
    // Jika loop selesai tanpa return, berarti user tidak ada
    response = {
      success: false,
      message: "data user tidak ada di data base, silahkan buat akun baru",
    };
    return ContentService.createTextOutput(
      JSON.stringify(response),
    ).setMimeType(ContentService.MimeType.JSON);
  }

  // ================= 3. LOGIKA PROSES BUAT AKUN (REGISTER) =================
  else if (action === "register") {
    // Validasi: Cek apakah jumlah user sudah mencapai batas maksimal (7 user)
    // data.length - 1 digunakan karena baris pertama adalah header (Username, Gmail, Password)
    if (data.length - 1 >= 7) {
      response = {
        success: false,
        message:
          "Pendaftaran gagal! Kuota admin sudah penuh (maksimal 7 user).",
      };
      return ContentService.createTextOutput(
        JSON.stringify(response),
      ).setMimeType(ContentService.MimeType.JSON);
    }

    // Validasi: Cek apakah Gmail sudah digunakan sebelumnya
    for (var i = 1; i < data.length; i++) {
      if (
        data[i][1].toString().trim().toLowerCase() === inputGmail.toLowerCase()
      ) {
        response = {
          success: false,
          message: "Email Gmail sudah terdaftar dalam sistem!",
        };
        return ContentService.createTextOutput(
          JSON.stringify(response),
        ).setMimeType(ContentService.MimeType.JSON);
      }
    }
    // Masukkan data baru: Username (A), Gmail (B), Password (C)
    sheet.appendRow([inputUsername, inputGmail, inputPass]);
    response = {
      success: true,
      message:
        "Akun admin berhasil didaftarkan! Silakan kembali ke menu login.",
    };
  }

  // ================= 4. LOGIKA PROSES LUPA KATA SANDI =================
  else if (action === "forgot") {
    // Mencari apakah email ada di database
    for (var i = 1; i < data.length; i++) {
      if (
        data[i][1].toString().trim().toLowerCase() === inputGmail.toLowerCase()
      ) {
        // Mengembalikan informasi sukses bahwa user terdaftar (bisa dikembangkan untuk sinkronisasi email)
        response = {
          success: true,
          message:
            "Petugas ditemukan. Silakan hubungi Super Admin untuk reset password Anda.",
        };
        return ContentService.createTextOutput(
          JSON.stringify(response),
        ).setMimeType(ContentService.MimeType.JSON);
      }
    }
    response = {
      success: false,
      message: "data user tidak ada di data base, silahkan buat akun baru",
    };
  }

  // Mengirim kembali respon ke HTML
  return ContentService.createTextOutput(JSON.stringify(response)).setMimeType(
    ContentService.MimeType.JSON,
  );
}

// Mengatasi kendala pembatasan keamanan browser (CORS) saat berinteraksi dengan HTML luar
function doOptions(e) {
  return ContentService.createTextOutput("").setMimeType(
    ContentService.MimeType.TEXT,
  );
}
