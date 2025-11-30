import React, { useState } from 'react';
import { supabase } from '../utils/supabaseClient'; 
import { dbHelper } from '../utils/db'; 
import { Lock, Mail } from 'lucide-react';

export default function Login() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // 1. Login ke Supabase
      const { data: { user }, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // 2. Ambil Data Role & RT dari Database
      const adminData = await dbHelper.getAdminRole(user.id);

      if (!adminData) {
        await supabase.auth.signOut();
        throw new Error("Akun ini tidak terdaftar sebagai Admin.");
      }

      // 3. SIMPAN KE LOCAL STORAGE (Perbaikan Di Sini)
      localStorage.setItem('userRole', adminData.role);
      localStorage.setItem('userName', adminData.nama);
      
      // Pastikan tersimpan string kosong jika null (untuk RW), atau '01' (untuk RT)
      const rtValue = adminData.rt ? adminData.rt : ''; 
      localStorage.setItem('adminRT', rtValue);
      
      // Debugging (Cek di console saat login nanti)
      console.log("LOGIN SUKSES! Menyimpan RT:", rtValue);

      window.location.reload();

    } catch (error) {
      alert("Gagal Login: " + (error.error_description || error.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center h-screen bg-gray-100">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md border border-gray-100">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-800">Login Admin RW</h1>
          <p className="text-gray-500 text-sm mt-2">Masuk untuk mengelola data warga</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 text-gray-400 h-5 w-5" />
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="pl-10 w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-teal-500" placeholder="admin@warga.com" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 text-gray-400 h-5 w-5" />
              <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="pl-10 w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-teal-500" placeholder="••••••••" />
            </div>
          </div>

          <button type="submit" disabled={loading} className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 px-4 rounded-lg transition shadow-md disabled:opacity-70">
            {loading ? 'Memeriksa...' : 'Masuk Dashboard'}
          </button>
        </form>
      </div>
    </div>
  );
}