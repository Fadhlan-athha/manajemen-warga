import { supabase } from './supabaseClient';

// --- HELPER FORMAT DATA ---
const toDbPayload = (data, householdData) => {
  return {
    nik: data.nik,
    nama: data.nama,
    kk: householdData.kk,       
    no_rumah: householdData.noRumah, 
    rt: householdData.rt,
    rw: householdData.rw,       
    alamat: householdData.alamat, 
    foto_kk_url: householdData.fotoUrl, 
    latitude: householdData.latitude,
    longitude: householdData.longitude,
    jenis_kelamin: data.jenisKelamin,
    status: data.status,
    no_hp: data.noHp,
    email: data.email,          
    peran_keluarga: data.peran,
    tempat_lahir: data.tempatLahir,
    tanggal_lahir: data.tanggalLahir,
    agama: data.agama,
    pekerjaan: data.pekerjaan,
    status_perkawinan: data.statusPerkawinan,
    golongan_darah: data.golonganDarah
  };
};

const fromDbPayload = (data) => ({
  ...data,
  jenisKelamin: data.jenis_kelamin,
  noHp: data.no_hp,
  noRumah: data.no_rumah,
  fotoUrl: data.foto_kk_url,
  peran: data.peran_keluarga,
  latitude: data.latitude,
  longitude: data.longitude,
  tempatLahir: data.tempat_lahir,
  tanggalLahir: data.tanggal_lahir,
  statusPerkawinan: data.status_perkawinan,
  golongan_darah: data.golongan_darah
});

// --- SMART CONTENT GENERATOR ---
const generateSmartContent = (judul, kategori, tanggal) => {
  const tglStr = tanggal ? new Date(tanggal).toLocaleDateString('id-ID', {weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'}) : 'Waktu akan diinformasikan menyusul';
  
  if (kategori === 'Penting') {
    return `🚨 *PENGUMUMAN PENTING WARGA* 🚨\n\nKepada seluruh warga, diinformasikan:\n\n*${judul.toUpperCase()}*\n\n📅 Berlaku: ${tglStr}\n\nTerima kasih.\n_~ Pengurus RT/RW_`;
  } else if (kategori === 'Agenda') {
    return `🗓️ *UNDANGAN KEGIATAN WARGA* 🗓️\n\nKami mengundang warga pada:\n\n✨ *${judul}* ✨\n\n📅 Tanggal: ${tglStr}\n📍 Tempat: Lingkungan RT/RW\n\n_~ Panitia Kegiatan_`;
  } else { 
    return `📢 *INFORMASI WARGA* 📢\n\nSekilas info:\n\n*${judul}*\n\n_~ Admin Sistem RW_`;
  }
};

// --- FUNGSI KIRIM WA ---
const sendWhatsAppMessage = async (message) => {
  const token = import.meta.env.VITE_WA_API_TOKEN;
  const targetGroup = import.meta.env.VITE_WA_TARGET_GROUP;
  if (!token || !targetGroup) return;

  try {
    const formData = new FormData();
    formData.append('target', targetGroup);
    formData.append('message', message);
    await fetch('https://api.fonnte.com/send', {
      method: 'POST',
      headers: { Authorization: token },
      body: formData,
    });
  } catch (error) { console.error('Gagal WA:', error); }
};

export const dbHelper = {
  // --- WARGA ---
  getAll: async () => {
    const { data, error } = await supabase.from('warga').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return data.map(fromDbPayload);
  },
  getWargaByNIK: async (nik) => {
    const { data, error } = await supabase.from('warga').select('*').eq('nik', nik).single();
    if (error && error.code !== 'PGRST116') throw error; 
    return data ? fromDbPayload(data) : null;
  },
  // FUNGSI BARU: Cek NIK (Ringan, cuma ambil nama)
  checkNIK: async (nik) => {
    const { data, error } = await supabase.from('warga').select('nama').eq('nik', nik).maybeSingle();
    if (error) return null;
    return data; // Mengembalikan { nama: '...' } jika ada, atau null jika tidak
  },
  uploadKK: async (file, noKK) => {
    if (!file) return null;
    const fileExt = file.name.split('.').pop();
    const filePath = `kk/${noKK}-${Date.now()}.${fileExt}`;
    const { error } = await supabase.storage.from('dokumen-warga').upload(filePath, file);
    if (error) throw error;
    const { data } = supabase.storage.from('dokumen-warga').getPublicUrl(filePath);
    return data.publicUrl;
  },
  addFamily: async (members, householdData) => {
    const payload = members.map(member => toDbPayload(member, householdData));
    const { data, error } = await supabase.from('warga').upsert(payload, { onConflict: 'nik' }).select();
    if (error) throw error; return data;
  },
  update: async (formData) => {
    const payload = {
      nama: formData.nama, nik: formData.nik, kk: formData.kk,
      no_rumah: formData.noRumah, rt: formData.rt, rw: formData.rw, alamat: formData.alamat,
      jenis_kelamin: formData.jenisKelamin, status: formData.status,
      no_hp: formData.noHp, email: formData.email, peran_keluarga: formData.peran,
      tempat_lahir: formData.tempatLahir, tanggal_lahir: formData.tanggalLahir,
      agama: formData.agama, pekerjaan: formData.pekerjaan,
      status_perkawinan: formData.statusPerkawinan, golongan_darah: formData.golonganDarah,
      latitude: formData.latitude, longitude: formData.longitude
    };
    const { data, error } = await supabase.from('warga').update(payload).eq('id', formData.id).select();
    if (error) throw error; return data[0];
  },
  delete: async (id) => {
    const { error } = await supabase.from('warga').delete().eq('id', id);
    if (error) throw error; return true;
  },

  // --- KEUANGAN ---
  getKeuangan: async () => {
    const { data, error } = await supabase.from('transaksi_keuangan').select('*').order('created_at', { ascending: false });
    if (error) throw error; return data;
  },
  addTransaksi: async (transaksi) => {
    const { data, error } = await supabase.from('transaksi_keuangan').insert([transaksi]).select();
    if (error) throw error; return data[0];
  },
  deleteTransaksi: async (id) => {
    const { error } = await supabase.from('transaksi_keuangan').delete().eq('id', id);
    if (error) throw error; return true;
  },

  // --- LAPORAN DARURAT ---
  getLaporan: async () => {
    const { data, error } = await supabase.from('laporan_darurat').select('*').order('created_at', { ascending: false });
    if (error) throw error; return data;
  },
  addLaporan: async (laporan) => {
    const { data, error } = await supabase.from('laporan_darurat').insert([laporan]).select();
    if (error) throw error; 
    
    const waktu = new Date().toLocaleString('id-ID');
    const msg = `🔴 *PERINGATAN DINI - SISTEM RW* 🔴\n\n` +
      `Telah diterima laporan darurat baru!\n\n` +
      `🔴 *JENIS:* ${laporan.jenis_kejadian}\n` +
      `📍 *LOKASI:* ${laporan.lokasi}\n` +
      `👤 *PELAPOR:* ${laporan.pelapor_nama || 'Anonim'}\n` +
      `🕒 *WAKTU:* ${waktu}\n\n` +
      `Mohon petugas keamanan segera merapat!`;
    sendWhatsAppMessage(msg); 
    return data[0];
  },
  updateStatusLaporan: async (id, status) => {
    const { data, error } = await supabase.from('laporan_darurat').update({ status }).eq('id', id).select();
    if (error) throw error; return data[0];
  },
  deleteLaporan: async (id) => {
    const { error } = await supabase.from('laporan_darurat').delete().eq('id', id);
    if (error) throw error; return true;
  },

  // --- SURAT PENGANTAR ---
  getSurat: async () => {
    const { data, error } = await supabase.from('pengajuan_surat').select('*').order('created_at', { ascending: false });
    if (error) throw error; return data;
  },
  getSuratByNIK: async (nik) => {
    const { data, error } = await supabase.from('pengajuan_surat').select('*').eq('nik', nik).order('created_at', { ascending: false });
    if (error) throw error; return data;
  },
  addSurat: async (surat) => {
    const { data, error } = await supabase.from('pengajuan_surat').insert([surat]).select();
    if (error) throw error; return data[0];
  },
  uploadFileSurat: async (file) => {
    if (!file) return null;
    const fileExt = file.name.split('.').pop();
    const fileName = `surat-${Date.now()}.${fileExt}`;
    const { error } = await supabase.storage.from('surat-resmi').upload(fileName, file);
    if (error) throw error;
    const { data } = supabase.storage.from('surat-resmi').getPublicUrl(fileName);
    return data.publicUrl;
  },
  updateStatusSurat: async (id, status, nomor_surat = null, file_url = null) => {
    const payload = { status, nomor_surat };
    if (file_url) payload.file_url = file_url;
    const { data, error } = await supabase.from('pengajuan_surat').update(payload).eq('id', id).select();
    if (error) throw error; return data[0];
  },

  // --- TAMBAHKAN FUNGSI BARU INI ---
  checkDuplicate: async (column, value) => {
    // Mengecek apakah nilai pada kolom tertentu (nik atau kk) sudah ada
    // Menggunakan count: 'exact' dan head: true agar lebih ringan/cepat
    const { count, error } = await supabase
      .from('warga')
      .select('*', { count: 'exact', head: true })
      .eq(column, value);
    
    if (error) throw error;
    return count > 0; // Mengembalikan true jika duplikat ditemukan
  },

  // --- PENGUMUMAN ---
  getPengumuman: async () => {
    const { data, error } = await supabase.from('pengumuman').select('*').order('created_at', { ascending: false });
    if (error) throw error; return data;
  },
  addPengumuman: async (item, autoGenerateAI = false) => {
    const { useAI, ...restItem } = item;
    const dbPayload = { ...restItem, tanggal_kegiatan: restItem.tanggal_kegiatan || null };

    let finalContent = dbPayload.isi;
    if (autoGenerateAI || !finalContent) {
        finalContent = generateSmartContent(dbPayload.judul, dbPayload.kategori, dbPayload.tanggal_kegiatan);
    }
    dbPayload.isi = finalContent;

    const { data, error } = await supabase.from('pengumuman').insert([dbPayload]).select();
    if (error) throw error;
    if (autoGenerateAI) await sendWhatsAppMessage(finalContent);
    return data[0];
  },
  deletePengumuman: async (id) => {
    const { error } = await supabase.from('pengumuman').delete().eq('id', id);
    if (error) throw error; return true;
  },

  // --- IURAN WARGA ---
  getIuran: async () => {
    const { data, error } = await supabase.from('iuran_warga').select('*').order('created_at', { ascending: false });
    if (error) throw error; return data;
  },
  uploadBuktiTransfer: async (file, nik) => {
    if (!file) return null;
    const fileExt = file.name.split('.').pop();
    const fileName = `bukti-${nik}-${Date.now()}.${fileExt}`;
    const { error } = await supabase.storage.from('dokumen-warga').upload(fileName, file); 
    if (error) throw error;
    const { data } = supabase.storage.from('dokumen-warga').getPublicUrl(fileName);
    return data.publicUrl;
  },
  bayarIuran: async (form) => {
    const { data, error } = await supabase.from('iuran_warga').insert([form]).select();
    if (error) throw error; return data[0];
  },
  verifikasiIuran: async (idIuran, dataIuran) => {
    const { error: errUpdate } = await supabase.from('iuran_warga').update({ status: 'Lunas' }).eq('id', idIuran);
    if (errUpdate) throw errUpdate;

    const transaksiPayload = {
        tipe: 'Pemasukan',
        kategori: 'Iuran Air & Listrik',
        nominal: dataIuran.nominal,
        keterangan: `Pembayaran ${dataIuran.nama} (${dataIuran.bulan_tahun})`
    };
    const { error: errKas } = await supabase.from('transaksi_keuangan').insert([transaksiPayload]);
    if (errKas) throw errKas;
    return true;
  },
  broadcastTagihan: async (hariKe) => {
    const bankInfo = "BCA 1234567890 a.n Bendahara RW"; 
    const bulanIni = new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
    
    let msgHeader = "";
    if(hariKe === 1) msgHeader = "🔔 *REMINDER PEMBAYARAN IURAN (HARI 1)* 🔔";
    else if(hariKe === 2) msgHeader = "⚠️ *REMINDER PEMBAYARAN IURAN (HARI 2)* ⚠️";
    else msgHeader = "🔥 *PERINGATAN TERAKHIR PEMBAYARAN* 🔥";

    const message = `${msgHeader}\n\n` +
      `Kepada seluruh warga, diingatkan kembali untuk melakukan pembayaran iuran:\n` +
      `💧⚡ *AIR & LISTRIK BULAN ${bulanIni.toUpperCase()}*\n\n` +
      `💰 Nominal: *Rp 200.000*\n` +
      `🏦 Transfer ke: *${bankInfo}*\n\n` +
      `Mohon segera transfer dan upload bukti pembayaran melalui aplikasi warga.\n` +
      `Terima kasih bagi yang sudah membayar.\n_~ Bendahara RW_`;

    await sendWhatsAppMessage(message);
  }
};