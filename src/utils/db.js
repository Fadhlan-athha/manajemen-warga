import { supabase } from './supabaseClient';

// Helper: Ubah format React (camelCase) ke Database (snake_case)
const toDbPayload = (data, householdData) => {
  return {
    nik: data.nik,
    nama: data.nama,
    kk: householdData.kk,       // Dari data rumah
    no_rumah: householdData.noRumah, // Data baru
    rt: householdData.rt,       // Dari data rumah
    alamat: householdData.alamat, // Dari data rumah
    foto_kk_url: householdData.fotoUrl, // URL Foto
    jenis_kelamin: data.jenisKelamin,
    status: data.status,
    no_hp: data.noHp,
    email: data.email,          // Data baru
    peran_keluarga: data.peran  // Data baru (Kepala/Istri/Anak)
  };
};

const fromDbPayload = (data) => ({
  ...data,
  jenisKelamin: data.jenis_kelamin,
  noHp: data.no_hp,
  noRumah: data.no_rumah,
  fotoUrl: data.foto_kk_url,
  peran: data.peran_keluarga
});

export const dbHelper = {
  getAll: async () => {
    const { data, error } = await supabase
      .from('warga')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data.map(fromDbPayload);
  },

  // Fungsi Upload Foto ke Supabase Storage
  uploadKK: async (file, noKK) => {
    if (!file) return null;
    const fileExt = file.name.split('.').pop();
    const fileName = `${noKK}-${Date.now()}.${fileExt}`;
    const filePath = `kk/${fileName}`;

    const { error } = await supabase.storage
      .from('dokumen-warga')
      .upload(filePath, file);

    if (error) throw error;

    // Ambil URL Publik
    const { data } = supabase.storage
      .from('dokumen-warga')
      .getPublicUrl(filePath);
      
    return data.publicUrl;
  },

  // Fungsi Tambah Keluarga (Bulk Insert / Upsert)
  addFamily: async (members, householdData) => {
    // Gabungkan data individu dengan data rumah (alamat, foto, dll)
    const payload = members.map(member => toDbPayload(member, householdData));

    // Upsert: Jika NIK sama, data akan diupdate. Jika baru, akan ditambah.
    const { data, error } = await supabase
      .from('warga')
      .upsert(payload, { onConflict: 'nik' }) 
      .select();

    if (error) throw error;
    return data;
  },
  
  // Fungsi update satu orang (untuk Admin)
  update: async (formData) => {
    // Mapping manual karena strukturnya flat di form admin
    const payload = {
      nama: formData.nama,
      nik: formData.nik,
      kk: formData.kk,
      no_rumah: formData.noRumah,
      rt: formData.rt,
      alamat: formData.alamat,
      jenis_kelamin: formData.jenisKelamin,
      status: formData.status,
      no_hp: formData.noHp,
      email: formData.email,
      peran_keluarga: formData.peran
    };
    
    const { data, error } = await supabase
      .from('warga')
      .update(payload)
      .eq('id', formData.id)
      .select();

    if (error) throw error;
    return data[0];
  },

  delete: async (id) => {
    const { error } = await supabase.from('warga').delete().eq('id', id);
    if (error) throw error;
    return true;
  }
};