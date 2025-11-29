import { supabase } from './supabaseClient';

// Helper Format Data (Mapping Database <-> Aplikasi)
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
    // Data Baru
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
  // Data Baru
  tempatLahir: data.tempat_lahir,
  tanggalLahir: data.tanggal_lahir,
  statusPerkawinan: data.status_perkawinan,
  golonganDarah: data.golongan_darah
});

// --- FUNGSI WA (FORMAT PESAN DIPERBAIKI) ---
const sendWhatsApp = async (laporan) => {
  const token = import.meta.env.VITE_WA_API_TOKEN;
  const targetGroup = import.meta.env.VITE_WA_TARGET_GROUP;
  if (!token || !targetGroup) return;

  // Format Waktu Indonesia (Contoh: Kamis, 27/11/2025, 09.48.10)
  const waktu = new Date().toLocaleString('id-ID', {
    weekday: 'long', 
    year: 'numeric', 
    month: 'numeric', 
    day: 'numeric',
    hour: '2-digit', 
    minute: '2-digit', 
    second: '2-digit'
  });

  // Template Pesan Profesional Sesuai Gambar
  const message = `🔴 *PERINGATAN DINI - SISTEM RW* 🔴\n\n` +
    `Telah diterima laporan darurat baru!\n\n` +
    `🔴 *JENIS:* ${laporan.jenis_kejadian}\n` +
    `📍 *LOKASI:* ${laporan.lokasi}\n` +
    `👤 *PELAPOR:* ${laporan.pelapor_nama || 'Anonim'}\n` +
    `📝 *KET:* ${laporan.deskripsi || '-'}\n` +
    `🕒 *WAKTU:* ${waktu}\n\n` +
    `Mohon petugas keamanan / warga terdekat segera merapat!`;
  
  try {
    const formData = new FormData();
    formData.append('target', targetGroup);
    formData.append('message', message);
    
    // Khusus Fonnte: Jika lokasi adalah link Google Maps, biasanya akan otomatis preview
    // Jika ingin mengirim lokasi sebagai attachment location, itu butuh API khusus, 
    // tapi mengirim Link di dalam body text sudah cukup untuk memunculkan preview peta di WA.

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
    if (error) throw error;
    return data;
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
    // Kirim Notif WA setelah simpan ke DB
    sendWhatsApp(laporan); 
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
  }
};