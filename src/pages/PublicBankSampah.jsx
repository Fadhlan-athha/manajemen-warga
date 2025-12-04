import React, { useState, useEffect } from 'react';
import { dbHelper } from '../utils/db.js'; //
import { ArrowLeft, Search, Recycle, Coins, History, TrendingUp, Trophy } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function PublicBankSampah() {
  const [nik, setNik] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null); 
  const [searched, setSearched] = useState(false);
  
  // State untuk Leaderboard
  const [leaderboard, setLeaderboard] = useState([]);

  // Load Leaderboard saat halaman dibuka
  useEffect(() => {
    const fetchLeaderboard = async () => {
        try {
            const data = await dbHelper.getLeaderboard();
            setLeaderboard(data);
        } catch(err) { 
            console.error("Gagal load leaderboard", err); 
        }
    };
    fetchLeaderboard();
  }, []);

  const handleCheck = async (e) => {
    e.preventDefault();
    if (nik.length < 16) return alert("Mohon isi NIK 16 digit dengan benar.");
    
    setLoading(true);
    try {
      const allData = await dbHelper.getRiwayatSampah();
      const myData = allData.filter(item => item.nik === nik);
      
      const totalRp = myData.reduce((acc, curr) => acc + Number(curr.total_rp), 0);
      const totalKg = myData.reduce((acc, curr) => acc + Number(curr.berat_kg), 0);
      
      let namaWarga = myData.length > 0 ? myData[0].nama : '';
      if (!namaWarga) {
          const warga = await dbHelper.getWargaByNIK(nik);
          if (warga) namaWarga = warga.nama;
      }

      setResult({ riwayat: myData, totalRp, totalKg, nama: namaWarga });
      setSearched(true);
    } catch (err) {
      alert("Gagal memuat data: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans pb-20">
      {/* Header */}
      <div className="bg-green-700 text-white p-6 pb-24 relative overflow-hidden">
        <div className="max-w-2xl mx-auto relative z-10">
           <Link to="/" className="inline-flex items-center gap-2 text-green-100 hover:text-white mb-4 transition-colors"><ArrowLeft size={16}/> Kembali</Link>
           <h1 className="text-3xl font-bold flex items-center gap-3"><Recycle /> Bank Sampah Warga</h1>
           <p className="text-green-100 mt-2">Ubah sampah jadi rupiah & selamatkan lingkungan.</p>
        </div>
        <Recycle className="absolute -top-10 -right-10 text-green-600/50 w-64 h-64 rotate-12" />
      </div>

      <div className="max-w-2xl mx-auto px-4 -mt-16 relative z-20">
        
        {/* --- FITUR BARU: LEADERBOARD --- */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 mb-6 overflow-hidden">
            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-4 border-b border-orange-100 flex items-center gap-2">
                <Trophy className="text-yellow-600" size={20} />
                <h3 className="font-bold text-gray-800">Top Pahlawan Lingkungan</h3>
            </div>
            <div className="p-4 space-y-3">
                {leaderboard.length === 0 ? (
                    <p className="text-center text-gray-400 text-sm py-2">Belum ada data pahlawan.</p>
                ) : (
                    leaderboard.map((user, idx) => (
                        <div key={idx} className="flex items-center justify-between bg-white border border-gray-100 p-3 rounded-lg hover:shadow-sm transition-shadow">
                            <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white text-sm shadow-sm
                                    ${idx === 0 ? 'bg-yellow-500' : idx === 1 ? 'bg-gray-400' : idx === 2 ? 'bg-orange-700' : 'bg-teal-500'}`}>
                                    {idx + 1}
                                </div>
                                <div>
                                    <p className="font-bold text-gray-800 text-sm">{user.nama}</p>
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${user.color}`}>
                                        {user.badge}
                                    </span>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="font-bold text-green-600 text-sm">{user.total.toFixed(1)} <span className="text-gray-400 text-xs">Kg</span></p>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
        {/* ---------------------------------- */}

        <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-100 mb-6">
           <h3 className="font-bold text-gray-700 mb-3 text-sm uppercase">Cek Saldo Tabungan</h3>
           <form onSubmit={handleCheck} className="flex gap-2">
               <input 
                 type="number" 
                 className="flex-1 border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-green-500 outline-none"
                 placeholder="Masukkan NIK Anda..." 
                 value={nik}
                 onChange={e => setNik(e.target.value)}
               />
               <button disabled={loading} className="bg-green-600 hover:bg-green-700 text-white px-6 rounded-xl font-bold transition-colors shadow-lg disabled:opacity-50">
                 {loading ? '...' : <Search />}
               </button>
           </form>
        </div>

        {searched && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                {result.nama ? (
                    <>
                        <div className="bg-gradient-to-r from-green-600 to-teal-700 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
                            <div className="relative z-10">
                                <p className="text-green-100 text-sm font-medium mb-1">Halo, {result.nama}</p>
                                <p className="text-green-50 text-xs uppercase tracking-wider opacity-80">Total Saldo Terkumpul</p>
                                <h2 className="text-4xl font-bold mt-1">Rp {result.totalRp.toLocaleString('id-ID')}</h2>
                                <div className="mt-4 flex gap-4 text-sm font-medium bg-white/10 p-3 rounded-lg inline-flex backdrop-blur-sm border border-white/10">
                                    <span className="flex items-center gap-1"><Recycle size={16}/> {result.totalKg.toFixed(1)} Kg</span>
                                    <span className="w-px bg-white/20"></span>
                                    <span className="flex items-center gap-1"><TrendingUp size={16}/> {result.riwayat.length}x Setor</span>
                                </div>
                            </div>
                            <Coins className="absolute bottom-4 right-4 text-white/10 w-32 h-32" />
                        </div>

                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                            <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex items-center gap-2 text-gray-600 font-bold text-sm">
                                <History size={16}/> Riwayat Setoran
                            </div>
                            <div className="divide-y divide-gray-100">
                                {result.riwayat.length === 0 ? (
                                    <div className="p-8 text-center text-gray-400">Belum ada riwayat setoran.</div>
                                ) : (
                                    result.riwayat.map(item => (
                                        <div key={item.id} className="p-4 flex justify-between items-center hover:bg-gray-50">
                                            <div>
                                                <p className="font-bold text-gray-800">{item.jenis_sampah}</p>
                                                <p className="text-xs text-gray-500 mt-0.5">
                                                    {new Date(item.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-bold text-green-600">+ Rp {Number(item.total_rp).toLocaleString('id-ID')}</p>
                                                <p className="text-xs text-gray-500">{item.berat_kg} Kg</p>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="text-center py-10 bg-white rounded-xl border border-gray-200 shadow-sm">
                        <div className="bg-red-50 text-red-500 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3">
                            <Search size={32}/>
                        </div>
                        <h3 className="font-bold text-gray-800">Data Tidak Ditemukan</h3>
                        <p className="text-gray-500 text-sm mt-1">NIK tersebut belum terdaftar di Bank Sampah.</p>
                    </div>
                )}
            </div>
        )}
      </div>
    </div>
  );
}