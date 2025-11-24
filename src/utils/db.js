/**
 * src/utils/db.js
 * Wrapper untuk Supabase (Cloud Database)
 */
import { supabase } from './supabaseClient';

// Helper untuk mapping camelCase (React) ke snake_case (Database)
const toDbPayload = (data) => {
  return {
    nama: data.nama,
    nik: data.nik,
    kk: data.kk,
    rt: data.rt,
    alamat: data.alamat,
    jenis_kelamin: data.jenisKelamin, // Mapping kunci
    status: data.status,
    no_hp: data.noHp // Mapping kunci
  };
};

// Helper untuk mapping snake_case (Database) ke camelCase (React)
const fromDbPayload = (data) => {
  return {
    ...data,
    jenisKelamin: data.jenis_kelamin,
    noHp: data.no_hp
  };
};

export const dbHelper = {
  // Mengambil semua data
  getAll: async () => {
    const { data, error } = await supabase
      .from('warga')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data.map(fromDbPayload);
  },

  // Menambah data baru
  add: async (formData) => {
    const payload = toDbPayload(formData);
    const { data, error } = await supabase
      .from('warga')
      .insert([payload])
      .select();
      
    if (error) throw error;
    return data[0];
  },

  // Update data
  update: async (formData) => {
    const payload = toDbPayload(formData);
    // Hapus ID dari payload update karena ID tidak boleh diubah manual
    const { id } = formData;
    
    const { data, error } = await supabase
      .from('warga')
      .update(payload)
      .eq('id', id)
      .select();

    if (error) throw error;
    return data[0];
  },

  // Hapus data
  delete: async (id) => {
    const { error } = await supabase
      .from('warga')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  },

  // Fitur backup (opsional, bisa dimodifikasi nanti)
  // Untuk cloud, biasanya kita tidak perlu clear manual seperti IndexedDB
  clear: async () => {
    console.warn("Fitur clear dimatikan untuk keamanan database Cloud.");
    return false; 
  }
};