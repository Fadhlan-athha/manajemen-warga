import XLSX from 'xlsx-js-style';

export const exportToExcel = (data, fileName) => {
  if (!data || data.length === 0) {
    alert("Tidak ada data untuk diexport!");
    return;
  }

  let formattedData = [];
  let wscols = [];

  // --- 1. DETEKSI TIPE DATA & FORMATTING ---
  const isWarga = data[0].hasOwnProperty('kk');
  const isKeuangan = data[0].hasOwnProperty('tipe');

  if (isWarga) {
    // SORTING & MAPPING DATA WARGA
    const sortedData = [...data].sort((a, b) => {
        if ((a.kk || '') < (b.kk || '')) return -1;
        if ((a.kk || '') > (b.kk || '')) return 1;
        if (a.peran === 'Kepala Keluarga') return -1;
        if (b.peran === 'Kepala Keluarga') return 1;
        return 0;
    });

    formattedData = sortedData.map(item => ({
        "NO. KK": item.kk ? `${item.kk}` : '-',
        "NAMA LENGKAP": item.nama?.toUpperCase(),
        "NIK": item.nik ? `${item.nik}` : '-',
        "PERAN": item.peran,
        "JENIS KELAMIN": item.jenisKelamin,
        "TEMPAT LAHIR": item.tempatLahir || '-',
        "TANGGAL LAHIR": item.tanggalLahir ? new Date(item.tanggalLahir).toLocaleDateString('id-ID') : '-',
        "AGAMA": item.agama || '-',
        "PEKERJAAN": item.pekerjaan || '-',
        "STATUS KAWIN": item.statusPerkawinan || '-',
        "GOL. DARAH": item.golonganDarah || '-',
        "NO. HP": item.noHp ? `${item.noHp}` : '-',
        "EMAIL": item.email || '-',
        "ALAMAT LENGKAP": `${item.alamat || ''} No.${item.noRumah || ''} RT ${item.rt} / RW ${item.rw || '03'}`
    }));

    // Atur Lebar Kolom
    wscols = [
        { wch: 20 }, { wch: 30 }, { wch: 20 }, { wch: 15 }, { wch: 15 },
        { wch: 15 }, { wch: 15 }, { wch: 10 }, { wch: 20 }, { wch: 15 },
        { wch: 8 },  { wch: 15 }, { wch: 25 }, { wch: 50 }
    ];

  } else if (isKeuangan) {
    // SORTING & MAPPING DATA KEUANGAN
    const sortedData = [...data].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    formattedData = sortedData.map(item => ({
        "TANGGAL": new Date(item.created_at).toLocaleDateString('id-ID', {day: '2-digit', month: 'long', year: 'numeric'}),
        "TIPE": item.tipe?.toUpperCase(),
        "KATEGORI": item.kategori,
        "NOMINAL (Rp)": Number(item.nominal),
        "KETERANGAN": item.keterangan || '-'
    }));

    wscols = [{ wch: 20 }, { wch: 15 }, { wch: 20 }, { wch: 20 }, { wch: 50 }];
  } else {
    formattedData = data;
  }

  // --- 2. BUAT WORKSHEET ---
  const ws = XLSX.utils.json_to_sheet(formattedData);

  // --- 3. STYLING (WARNA & BORDER) ---
  const range = XLSX.utils.decode_range(ws['!ref']); // Ambil range sel (A1:E10 misal)

  // Style Header (Baris Pertama)
  const headerStyle = {
    font: { bold: true, color: { rgb: "FFFFFF" }, name: "Arial", sz: 11 },
    fill: { fgColor: { rgb: "0D9488" } }, // Warna Teal/Hijau Tua
    alignment: { horizontal: "center", vertical: "center" },
    border: {
      top: { style: "medium", color: { auto: 1 } },
      bottom: { style: "medium", color: { auto: 1 } },
      left: { style: "medium", color: { auto: 1 } },
      right: { style: "medium", color: { auto: 1 } }
    }
  };

  // Style Data (Baris Selanjutnya)
  const dataStyle = {
    font: { name: "Arial", sz: 10 },
    alignment: { vertical: "center", wrapText: true },
    border: {
      top: { style: "thin", color: { auto: 1 } },
      bottom: { style: "thin", color: { auto: 1 } },
      left: { style: "thin", color: { auto: 1 } },
      right: { style: "thin", color: { auto: 1 } }
    }
  };

  // Loop semua sel untuk menerapkan style
  for (let R = range.s.r; R <= range.e.r; ++R) {
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
      if (!ws[cellAddress]) continue;

      if (R === 0) {
        // Apply Header Style
        ws[cellAddress].s = headerStyle;
      } else {
        // Apply Data Style
        ws[cellAddress].s = dataStyle;
        
        // Khusus kolom Nominal (Keuangan), format currency
        if (isKeuangan && C === 3) { 
            ws[cellAddress].z = '#,##0'; // Format angka 10.000
        }
      }
    }
  }

  // Set Lebar Kolom
  if (wscols.length > 0) ws['!cols'] = wscols;

  // --- 4. EXPORT FILE ---
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Data Export");
  const dateStr = new Date().toISOString().slice(0,10);
  XLSX.writeFile(wb, `${fileName}_${dateStr}.xlsx`);
};