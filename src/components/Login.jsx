import React, { useState } from 'react';
import { supabase } from '../utils/supabaseClient'; 
import { dbHelper } from '../utils/db'; // Import dbHelper
import { Lock, Mail } from 'lucide-react';

export default function Login() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // 1. Proses Login ke Supabase Auth
      const { data: { user }, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // 2. Cek Role/Jabatan di Database
      const role = await dbHelper.getAdminRole(user.id);

      if (!role) {
        // Jika login berhasil tapi tidak terdaftar sebagai admin di tabel admin_users
        await supabase.auth.signOut();
        throw new Error("Akun ini tidak memiliki akses Admin.");
      }

      // 3. Simpan Role ke LocalStorage agar bisa dibaca Sidebar
      localStorage.setItem('userRole', role);
      
      // Reload halaman agar AdminDashboard mendeteksi session baru
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
          <h1 className="text-2xl font-bold text-gray-800">Login Sistem RW</h1>
          <p className="text-gray-500 text-sm mt-2">Masuk sesuai jabatan Anda</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 text-gray-400 h-5 w-5" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10 w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all"
                placeholder="jabatan@warga.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 text-gray-400 h-5 w-5" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10 w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 px-4 rounded-lg transition duration-200 disabled:opacity-70 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
          >
            {loading ? 'Memeriksa Akses...' : 'Masuk Dashboard'}
          </button>
        </form>
      </div>
    </div>
  );
}