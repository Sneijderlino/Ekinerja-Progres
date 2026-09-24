/**
 * GHOST-TEAM | CENTRAL MONITORING HUB BACKEND
 * Pasang script ini di Google Apps Script yang terhubung dengan Spreadsheet Anda.
 */

function doGet(e) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("Telemetry") || ss.insertSheet("Telemetry");
  var data = sheet.getDataRange().getValues();
  var results = [];

  if (data.length > 1) {
    for (var i = 1; i < data.length; i++) {
      results.push({
        appName: data[i][0],
        userId: data[i][1],
        nama: data[i][2],
        lat: data[i][3],
        lng: data[i][4],
        baterai: data[i][5],
        isCharging: data[i][6],
        kecepatan: data[i][7],
        jaringan: data[i][8],
        ip: data[i][9],
        isp: data[i][10],
        waktu: data[i][11],
        status: data[i][12],
      });
    }
  }
  return ContentService.createTextOutput(JSON.stringify(results)).setMimeType(
    ContentService.MimeType.JSON,
  );
}

function doPost(e) {
  // Pengaman agar tidak error saat dijalankan manual di editor
  if (!e || !e.postData || !e.postData.contents) {
    return ContentService.createTextOutput(
      JSON.stringify({
        success: false,
        message:
          "Error: Data tidak ditemukan. Pemicu harus via HTTP POST dari aplikasi.",
      }),
    ).setMimeType(ContentService.MimeType.JSON);
  }

  var params = JSON.parse(e.postData.contents);
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("Telemetry") || ss.insertSheet("Telemetry");

  if (sheet.getLastRow() === 0) {
    sheet.appendRow([
      "AppName",
      "UserID",
      "Nama",
      "Lat",
      "Lng",
      "Baterai",
      "Charging",
      "Speed",
      "Network",
      "IP",
      "ISP",
      "Time",
      "Status",
    ]);
  }

  if (params.action === "saveLocation") {
    var userId = params.gmail;
    var values = sheet.getDataRange().getValues();
    var rowToUpdate = -1;

    for (var i = 1; i < values.length; i++) {
      if (values[i][1] === userId) {
        rowToUpdate = i + 1;
        break;
      }
    }

    var timestamp = Utilities.formatDate(
      new Date(),
      "GMT+9",
      "dd/MM/yyyy HH:mm:ss",
    );
    var rowData = [
      params.appName || "E-Kinerja",
      userId,
      params.nama || userId.split("@")[0],
      params.lat,
      params.lng,
      params.battery || "N/A",
      params.isCharging || "N/A",
      params.speed || "0 km/h",
      params.network || "Online",
      params.ip || "N/A",
      params.isp || "N/A",
      timestamp,
      "Online",
    ];

    if (rowToUpdate > -1) {
      sheet.getRange(rowToUpdate, 1, 1, rowData.length).setValues([rowData]);
    } else {
      sheet.appendRow(rowData);
    }

    return ContentService.createTextOutput(
      JSON.stringify({ success: true }),
    ).setMimeType(ContentService.MimeType.JSON);
  }
}
