import { jsPDF } from "jspdf";

// Fungsi untuk mendapatkan detail teks berdasarkan jenis surat
const getSuratDetails = (jenisSurat, keperluan) => {
  switch (jenisSurat) {
    case 'Pengantar KTP':
      return {
        judul: 'SURAT PENGANTAR KTP',
        isi: 'Menerangkan bahwa orang tersebut adalah benar warga kami yang sedang mengajukan permohonan pembuatan/perpanjangan Kartu Tanda Penduduk (KTP).',
        penutup: 'Demikian surat pengantar ini dibuat sebagai syarat pengurusan KTP di Kelurahan.'
      };

    case 'Pengantar KK':
      return {
        judul: 'SURAT PENGANTAR KK',
        isi: 'Menerangkan bahwa orang tersebut adalah benar warga kami yang sedang mengajukan permohonan pembuatan/perubahan Kartu Keluarga (KK).',
        penutup: 'Demikian surat pengantar ini dibuat sebagai syarat pengurusan KK di Kelurahan.'
      };

    case 'Surat Keterangan Domisili':
      return {
        judul: 'SURAT KETERANGAN DOMISILI',
        isi: 'Menerangkan bahwa orang tersebut adalah benar-benar penduduk yang berdomisili dan tinggal menetap di lingkungan RT 01 / RW 03 Kelurahan Sukamaju.',
        penutup: 'Demikian surat keterangan ini dibuat untuk dipergunakan sebagaimana mestinya.'
      };

    case 'Surat Keterangan Tidak Mampu (SKTM)':
      return {
        judul: 'SURAT KETERANGAN TIDAK MAMPU',
        isi: 'Menerangkan bahwa orang tersebut adalah benar warga kami dan berdasarkan pengamatan kami tergolong dalam keluarga PRA-SEJAHTERA (Tidak Mampu).',
        penutup: 'Surat ini diberikan untuk keperluan: Persyaratan Bantuan/Beasiswa/Keringanan Biaya.'
      };

    case 'Surat Pengantar SKCK':
      return {
        judul: 'PENGANTAR CATATAN KEPOLISIAN',
        isi: 'Menerangkan bahwa orang tersebut adalah warga kami yang berkelakuan baik dan tidak pernah terlibat dalam tindak pidana kriminal di lingkungan kami.',
        penutup: 'Surat ini diberikan sebagai pengantar untuk pengurusan SKCK di Kepolisian.'
      };

    case 'Surat Keterangan Kematian':
      return {
        judul: 'SURAT KETERANGAN KEMATIAN',
        isi: 'Menerangkan bahwa nama tersebut di atas telah meninggal dunia. Surat ini diterbitkan atas permintaan keluarga untuk keperluan administrasi.',
        penutup: 'Demikian surat keterangan ini dibuat untuk dipergunakan sebagai syarat pengurusan Akta Kematian.'
      };

    case 'Surat Izin Keramaian':
      return {
        judul: 'SURAT PENGANTAR IZIN KERAMAIAN',
        isi: 'Menerangkan bahwa warga tersebut bermaksud mengadakan kegiatan keramaian/hajatan di lingkungan kami dan telah berkoordinasi dengan pengurus RT.',
        penutup: 'Demikian surat ini dibuat sebagai pengantar izin ke instansi terkait.'
      };

    default: // Untuk 'Lainnya'
      return {
        judul: 'SURAT PENGANTAR',
        isi: 'Menerangkan bahwa orang tersebut adalah benar-benar warga kami yang berdomisili di alamat tersebut di atas.',
        penutup: `Surat ini diberikan untuk keperluan: "${keperluan}".`
      };
  }
};

export const generateSuratPDF = (warga, suratData, nomorSurat) => {
  const doc = new jsPDF();

  // --- 1. KOP SURAT (TETAP SAMA UNTUK SEMUA) ---
  doc.setFont("times", "bold");
  doc.setFontSize(16);
  doc.text("RUKUN TETANGGA 01 / RW 03", 105, 20, { align: "center" });
  doc.setFontSize(12);
  doc.text("KELURAHAN SUKAMAJU, KECAMATAN SUKAJAYA", 105, 28, { align: "center" });
  doc.text("KOTA JAKARTA SELATAN", 105, 34, { align: "center" });
  
  doc.setLineWidth(0.5);
  doc.line(20, 38, 190, 38);

  // --- 2. LOGIKA JUDUL & ISI (DINAMIS) ---
  // Kita panggil fungsi switch-case di atas
  const detailSurat = getSuratDetails(suratData.jenis_surat, suratData.keperluan);

  // Render Judul
  doc.setFont("times", "bold");
  doc.setFontSize(14);
  doc.text(detailSurat.judul, 105, 50, { align: "center" });
  
  doc.setFont("times", "normal");
  doc.setFontSize(11);
  doc.text(`Nomor: ${nomorSurat}/RT.01/RW.03/${new Date().getFullYear()}`, 105, 56, { align: "center" });

  // --- 3. DATA DIRI (TETAP SAMA) ---
  const startY = 70;
  const lineHeight = 8;
  
  doc.setFontSize(12);
  doc.text("Yang bertanda tangan di bawah ini Ketua RT 01 / RW 03, menerangkan bahwa:", 20, startY);

  const detailY = startY + 15;
  const labels = [
      { label: "Nama Lengkap", value: ": " + (warga?.nama || suratData.nama).toUpperCase() },
      { label: "NIK", value: ": " + suratData.nik },
      { label: "Jenis Kelamin", value: ": " + (warga?.jenis_kelamin || "-") },
      { label: "Pekerjaan", value: ": " + (warga?.pekerjaan || "Wiraswasta") },
      { label: "Alamat", value: ": " + (warga ? `${warga.alamat} No. ${warga.no_rumah} RT ${warga.rt}` : "-") }
  ];

  labels.forEach((item, index) => {
      doc.text(item.label, 20, detailY + (index * lineHeight));
      doc.text(item.value, 60, detailY + (index * lineHeight));
  });

  // --- 4. ISI SURAT (CUSTOM PER JENIS) ---
  const contentY = detailY + (labels.length * lineHeight) + 10;
  
  // Render paragraf isi utama (Auto wrap text agar rapi)
  const isiLines = doc.splitTextToSize(detailSurat.isi, 170);
  doc.text(isiLines, 20, contentY);

  // Render detail keperluan tambahan jika bukan 'Lainnya' (karena 'Lainnya' sudah masuk di penutup)
  let nextY = contentY + (isiLines.length * 7);
  
  if (suratData.jenis_surat !== 'Lainnya' && suratData.keperluan) {
     doc.text("Keperluan Spesifik:", 20, nextY);
     doc.setFont("times", "bold");
     doc.text(`"${suratData.keperluan}"`, 20, nextY + 7);
     doc.setFont("times", "normal");
     nextY += 15;
  } else {
     nextY += 5;
  }

  // Render Penutup
  const penutupLines = doc.splitTextToSize(detailSurat.penutup, 170);
  doc.text(penutupLines, 20, nextY);

  // --- 5. TTD (TETAP SAMA) ---
  const ttdY = nextY + 30; // Jarak dinamis dari penutup
  const tanggal = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  
  doc.text(`Jakarta, ${tanggal}`, 140, ttdY, { align: "center" });
  doc.text("Ketua RT 01", 140, ttdY + 6, { align: "center" });
  
  doc.setFont("times", "bold");
  doc.text("( BAPAK KETUA RT )", 140, ttdY + 30, { align: "center" });

  return doc.output('blob');
};