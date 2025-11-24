import React, { useState } from 'react';
import { dbHelper } from '../utils/db'; // Menggunakan dbHelper yang sama
import { Send, CheckCircle, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function PublicForm() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    nik: '', nama: '', kk: '', rt: '01', 
    alamat: '', jenisKelamin: 'Laki-laki', 
    status: 'Tetap', noHp: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await dbHelper.add(formData);
      setSuccess(true);
      // Reset form
      setFormData({
        nik: '', nama: '', kk: '', rt: '01', 
        alamat: '', jenisKelamin: 'Laki-laki', 
        status: 'Tetap', noHp: ''
      });
    } catch (err) {
      alert("Gagal mengirim data: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-xl shadow-lg text-center max-w-md w-full animate-in fade-in zoom-in">
          <div className="bg-green-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Data Berhasil Terkirim!</h2>
          <p className="text-gray-600 mb-6">Terima kasih telah memperbarui data warga. Data Anda telah aman tersimpan di sistem Database RW.</p>
          <button onClick={() => setSuccess(false)} className="bg-teal-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-teal-700 transition-colors w-full">
            Isi Data Lagi (Keluarga Lain)
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-10 px-4 font-sans">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
        
        {/* Header Form */}
        <div className="bg-teal-700 p-8 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 -mr-10 -mt-10 w-40 h-40 bg-white opacity-10 rounded-full blur-3xl"></div>
          <h1 className="text-3xl font-bold relative z-10">Formulir Data Warga</h1>
          <p className="text-teal-100 mt-2 relative z-10">Silakan lengkapi data diri Anda untuk pendataan RW digital.</p>
        </div>
        
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          
          {/* Section Data Diri */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Identitas Diri</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap (Sesuai KTP)</label>
                    <input className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none transition-all" value={formData.nama} onChange={e => setFormData({...formData, nama: e.target.value})} required placeholder="Nama Lengkap" />
                </div>
                
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">NIK (16 Digit)</label>
                    <input type="number" className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none transition-all" value={formData.nik} onChange={e => setFormData({...formData, nik: e.target.value})} required placeholder="Contoh: 3201xxxxxxxxxxxx" />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nomor Kartu Keluarga</label>
                    <input type="number" className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none transition-all" value={formData.kk} onChange={e => setFormData({...formData, kk: e.target.value})} placeholder="Nomor KK" />
                </div>
            </div>
          </div>

          {/* Section Kontak & Alamat */}
          <div className="space-y-4 mt-6">
            <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Kontak & Alamat</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nomor Handphone (WhatsApp)</label>
                    <input type="tel" className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none transition-all" value={formData.noHp} onChange={e => setFormData({...formData, noHp: e.target.value})} placeholder="08xxxxxxxxxx" />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">RT</label>
                    <select className="w-full border border-gray-300 p-3 rounded-lg bg-white focus:ring-2 focus:ring-teal-500 outline-none" value={formData.rt} onChange={e => setFormData({...formData, rt: e.target.value})}>
                      <option value="01">RT 01</option>
                      <option value="02">RT 02</option>
                      <option value="03">RT 03</option>
                      <option value="04">RT 04</option>
                      <option value="05">RT 05</option>
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Jenis Kelamin</label>
                    <div className="flex gap-4 mt-2 bg-gray-50 p-3 rounded-lg border border-gray-200">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" name="jk" value="Laki-laki" checked={formData.jenisKelamin === 'Laki-laki'} onChange={() => setFormData({...formData, jenisKelamin: 'Laki-laki'})} className="accent-teal-600 w-5 h-5" />
                        <span className="text-gray-700">Laki-laki</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" name="jk" value="Perempuan" checked={formData.jenisKelamin === 'Perempuan'} onChange={() => setFormData({...formData, jenisKelamin: 'Perempuan'})} className="accent-teal-600 w-5 h-5" />
                        <span className="text-gray-700">Perempuan</span>
                      </label>
                    </div>
                </div>

                <div>
                     <label className="block text-sm font-medium text-gray-700 mb-1">Status Tempat Tinggal</label>
                     <select className="w-full border border-gray-300 p-3 rounded-lg bg-white focus:ring-2 focus:ring-teal-500 outline-none" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
                       <option value="Tetap">Warga Tetap (KTP Sini)</option>
                       <option value="Kontrak">Kontrak / Sewa</option>
                       <option value="Kos">Anak Kos</option>
                     </select>
                </div>

                <div className="col-span-1 md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Alamat Lengkap</label>
                    <textarea className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none transition-all" rows="3" value={formData.alamat} onChange={e => setFormData({...formData, alamat: e.target.value})} placeholder="Nama jalan, nomor rumah, blok, patokan..." required></textarea>
                </div>
            </div>
          </div>

          <div className="pt-4">
            <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-teal-600 text-white font-bold py-4 rounded-xl hover:bg-teal-700 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex justify-center items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
                {loading ? 'Mengirim Data...' : <><Send size={20} /> Kirim Data Saya</>}
            </button>
          </div>
        </form>
        
        <div className="bg-gray-50 p-4 text-center border-t border-gray-100 flex justify-center gap-4 text-sm text-gray-500">
           <span>&copy; Sistem RW Digital</span>
           <span className="text-gray-300">|</span>
           <Link to="/admin" className="text-gray-400 hover:text-teal-600 transition-colors">Login Admin</Link>
        </div>
      </div>
    </div>
  );
}