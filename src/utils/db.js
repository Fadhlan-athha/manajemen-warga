import { supabase } from './supabaseClient';

// Helper Format Data
const toDbPayload = (data, householdData) => {
  return {
    nik: data.nik,
    nama: data.nama,
    kk: householdData.kk,       
    no_rumah: householdData.noRumah, 
    rt: householdData.rt,       
    alamat: householdData.alamat, 
    foto_kk_url: householdData.fotoUrl, 
    latitude: householdData.latitude,
    longitude: householdData.longitude,
    jenis_kelamin: data.jenisKelamin,
    status: data.status,
    no_hp: data.noHp,
    email: data.email,          
    peran_keluarga: data.peran  
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
  longitude: data.longitude
});

// --- FUNGSI WA ---
const sendWhatsApp = async (laporan) => {
  const token = import.meta.env.VITE_WA_API_TOKEN;
  const targetGroup = import.meta.env.VITE_WA_TARGET_GROUP;
  if (!token || !targetGroup) return;

  const message = `🚨 *DARURAT RW* 🚨\n${laporan.jenis_kejadian} di ${laporan.lokasi}\nPelapor: ${laporan.pelapor_nama}`;
  
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
    return data;
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
      no_rumah: formData.noRumah, rt: formData.rt, alamat: formData.alamat,
      jenis_kelamin: formData.jenisKelamin, status: formData.status,
      no_hp: formData.noHp, email: formData.email, peran_keluarga: formData.peran,
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
    if (error) throw error; sendWhatsApp(laporan); return data[0];
  },
  updateStatusLaporan: async (id, status) => {
    const { data, error } = await supabase.from('laporan_darurat').update({ status }).eq('id', id).select();
    if (error) throw error; return data[0];
  },
  deleteLaporan: async (id) => {
    const { error } = await supabase.from('laporan_darurat').delete().eq('id', id);
    if (error) throw error; return true;
  },

  // --- SURAT PENGANTAR (UPDATED) ---
  getSurat: async () => {
    const { data, error } = await supabase.from('pengajuan_surat').select('*').order('created_at', { ascending: false });
    if (error) throw error; return data;
  },
  getSuratByNIK: async (nik) => {
    // Pastikan select mengambil SEMUA kolom termasuk file_url dan status
    const { data, error } = await supabase.from('pengajuan_surat').select('*').eq('nik', nik).order('created_at', { ascending: false });
    if (error) throw error; return data;
  },
  addSurat: async (surat) => {
    const { data, error } = await supabase.from('pengajuan_surat').insert([surat]).select();
    if (error) throw error; return data[0];
  },
  
  // Fungsi Baru: Upload File Surat
  uploadFileSurat: async (file) => {
    if (!file) return null;
    const fileExt = file.name.split('.').pop();
    const fileName = `surat-${Date.now()}.${fileExt}`;
    const { error } = await supabase.storage.from('surat-resmi').upload(fileName, file);
    if (error) throw error;
    const { data } = supabase.storage.from('surat-resmi').getPublicUrl(fileName);
    return data.publicUrl;
  },

  // Fungsi Update Status (Menerima URL File)
  updateStatusSurat: async (id, status, nomor_surat = null, file_url = null) => {
    const payload = { status, nomor_surat };
    if (file_url) payload.file_url = file_url; // Simpan link file jika ada

    const { data, error } = await supabase.from('pengajuan_surat').update(payload).eq('id', id).select();
    if (error) throw error; return data[0];
  }
};