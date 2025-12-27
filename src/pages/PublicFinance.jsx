import React, { useState, useEffect } from 'react';
import { dbHelper } from '../utils/db';
import { Wallet, ArrowLeft, TrendingUp, TrendingDown, CreditCard, UploadCloud, X, Check, Loader2, FileText, User } from 'lucide-react';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid } from 'recharts';

export default function PublicFinance() {
  const [transaksiList, setTransaksiList] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // State Modal Bayar
  const [showPayModal, setShowPayModal] = useState(false);
  const [payForm, setPayForm] = useState({ nik: '', nama: '', bulan: new Date().toISOString().slice(0,7), file: null });
  const [uploading, setUploading] = useState(false);

  // State Tambahan untuk UX
  const [checkingNik, setCheckingNik] = useState(false); // Loading saat cari NIK
  const [detectedName, setDetectedName] = useState(''); // Nama yang ditemukan

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const data = await dbHelper.getKeuangan();
      setTransaksiList(data || []);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  // --- LOGIKA 1: AUTO DETECT NAMA ---
  const handleNikChange = async (e) => {
    const val = e.target.value;
    setPayForm({ ...payForm, nik: val });

    // Reset nama jika user menghapus NIK
    if (val.length < 16) {
        setDetectedName('');
    }

    // Jika sudah 16 digit, cari di database
    if (val.length === 16) {
        setCheckingNik(true);
        try {
            const warga = await dbHelper.getWargaByNIK(val);
            if (warga) {
                setDetectedName(warga.nama);
                setPayForm(prev => ({ ...prev, nama: warga.nama })); // Simpan nama ke form state
            } else {
                setDetectedName('');
                alert("NIK tidak ditemukan dalam data warga.");
            }
        } catch (error) {
            console.error(error);
        } finally {
            setCheckingNik(false);
        }
    }
  };

  const handlePaySubmit = async (e) => {
      e.preventDefault();
      if (!payForm.file) return alert("Bukti transfer wajib diupload!");
      if (!detectedName) return alert("NIK tidak valid atau nama tidak ditemukan.");

      setUploading(true);
      try {
          // 1. Upload Bukti
          const url = await dbHelper.uploadBuktiTransfer(payForm.file, payForm.nik);
          
          // 2. Simpan Data
          await dbHelper.bayarIuran({
              nik: payForm.nik,
              nama: detectedName, // Pakai nama yang terdeteksi
              bulan_tahun: payForm.bulan,
              nominal: 200000,
              bukti_url: url,
              status: 'Pending'
          });
          
          alert("Pembayaran berhasil dikirim! Menunggu verifikasi admin.");
          setShowPayModal(false);
          setPayForm({ nik: '', nama: '', bulan: new Date().toISOString().slice(0,7), file: null });
          setDetectedName('');
      } catch (err) {
          alert("Gagal: " + err.message);
      } finally {
          setUploading(false);
      }
  };

  const totalPemasukan = transaksiList.filter(t => t.tipe === 'Pemasukan').reduce((acc, curr) => acc + Number(curr.nominal), 0);
  const totalPengeluaran = transaksiList.filter(t => t.tipe === 'Pengeluaran').reduce((acc, curr) => acc + Number(curr.nominal), 0);
  const saldo = totalPemasukan - totalPengeluaran;

  const chartData = [
    { name: 'Pemasukan', value: totalPemasukan, color: '#16a34a' },
    { name: 'Pengeluaran', value: totalPengeluaran, color: '#dc2626' }
  ];

  return (
    <div className="min-h-screen bg-gray-50 font-sans pb-20">
      <div className="bg-teal-800 text-white p-6 pb-24 relative overflow-hidden">
        <div className="max-w-3xl mx-auto relative z-10">
           <Link to="/" className="inline-flex items-center gap-2 text-teal-200 hover:text-white mb-4 transition-colors"><ArrowLeft size={16}/> Kembali ke Beranda</Link>
           <h1 className="text-3xl font-bold flex items-center gap-3"><Wallet /> Transparansi Kas RT</h1>
           <p className="text-teal-200 mt-2">Laporan keuangan real-time yang dapat diakses oleh seluruh warga.</p>
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-teal-700 rounded-full mix-blend-multiply filter blur-3xl opacity-50 -translate-y-1/2 translate-x-1/2"></div>
      </div>

      <div className="max-w-3xl mx-auto px-4 -mt-16 relative z-20">
        <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100 mb-8">
           <div className="text-center">
              <p className="text-gray-500 font-bold uppercase tracking-wider text-xs mb-1">Total Saldo Kas Saat Ini</p>
              <h2 className="text-4xl font-extrabold text-gray-800">Rp {saldo.toLocaleString('id-ID')}</h2>
           </div>
           
           {/* TOMBOL BAYAR IURAN */}
           <div className="mt-6 flex justify-center">
               <button onClick={() => setShowPayModal(true)} className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-3 rounded-xl font-bold shadow-lg flex items-center gap-2 transform hover:-translate-y-1 transition-all animate-pulse">
                   <CreditCard size={20}/> Bayar Iuran Air & Listrik
               </button>
           </div>

           <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-gray-100">
              <div className="text-center">
                 <div className="flex items-center justify-center gap-1 text-green-600 mb-1 font-medium"><TrendingUp size={16}/> Pemasukan</div>
                 <p className="font-bold text-gray-700">Rp {totalPemasukan.toLocaleString('id-ID')}</p>
              </div>
              <div className="text-center border-l border-gray-100">
                 <div className="flex items-center justify-center gap-1 text-red-500 mb-1 font-medium"><TrendingDown size={16}/> Pengeluaran</div>
                 <p className="font-bold text-gray-700">Rp {totalPengeluaran.toLocaleString('id-ID')}</p>
              </div>
           </div>
        </div>

        {/* GRAFIK */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
            <h3 className="font-bold text-gray-700 mb-4 text-sm uppercase tracking-wide">Grafik Arus Kas</h3>
            <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fontWeight: 'bold', fill: '#6b7280'}} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tickFormatter={(value) => `${(value/1000000).toFixed(1)}jt`} tick={{fontSize: 10, fill: '#9ca3af'}} />
                        <Tooltip cursor={{fill: '#f3f4f6'}} formatter={(value) => `Rp ${value.toLocaleString('id-ID')}`} />
                        <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={60}>
                             {chartData.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.color} />))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>

        {/* List Transaksi */}
        <h3 className="font-bold text-gray-800 mb-4 text-lg">Riwayat Mutasi Terakhir</h3>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {loading ? (
             <div className="p-8 text-center text-gray-500">Memuat data keuangan...</div>
          ) : transaksiList.length === 0 ? (
             <div className="p-8 text-center text-gray-500">Belum ada data transaksi.</div>
          ) : (
            <div className="divide-y divide-gray-100">
               {transaksiList.map(item => (
                 <div key={item.id} className="p-4 flex justify-between items-center hover:bg-gray-50 transition-colors">
                    <div className="flex items-start gap-3">
                       <div className={`mt-1 p-2 rounded-full ${item.tipe === 'Pemasukan' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                          {item.tipe === 'Pemasukan' ? <TrendingUp size={16}/> : <TrendingDown size={16}/>}
                       </div>
                       <div>
                          <p className="font-bold text-gray-800 text-sm">{item.keterangan}</p>
                          <p className="text-xs text-gray-500 mt-0.5">{new Date(item.created_at).toLocaleDateString('id-ID', {weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'})} • <span className="text-gray-400">{item.kategori}</span></p>
                       </div>
                    </div>
                    <div className={`font-mono font-bold text-sm ${item.tipe === 'Pemasukan' ? 'text-green-600' : 'text-red-500'}`}>
                       {item.tipe === 'Pemasukan' ? '+' : '-'} Rp {Number(item.nominal).toLocaleString('id-ID')}
                    </div>
                 </div>
               ))}
            </div>
          )}
        </div>
      </div>

      {/* MODAL FORM BAYAR */}
      {showPayModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
            <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
                <div className="bg-teal-700 p-4 text-white flex justify-between items-center">
                    <h3 className="font-bold flex items-center gap-2"><CreditCard size={18}/> Bayar Iuran Bulanan</h3>
                    <button onClick={() => setShowPayModal(false)}><X size={20}/></button>
                </div>
                <form onSubmit={handlePaySubmit} className="p-6 space-y-4">
                    <div className="bg-teal-50 text-teal-800 p-3 rounded-lg text-sm mb-2 border border-teal-100">
                        Pembayaran untuk <b>Air & Listrik</b> sebesar <b>Rp 200.000</b>. Silakan transfer ke Bank RW dan upload buktinya.
                    </div>
                    
                    {/* INPUT NIK (Auto Check) */}
                    <div>
                        <label className="text-xs font-bold uppercase text-gray-500">NIK Anda</label>
                        <div className="relative mt-1">
                            <input 
                                className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none transition-all" 
                                type="number" 
                                placeholder="Masukkan 16 Digit NIK" 
                                value={payForm.nik} 
                                onChange={handleNikChange} 
                                required
                            />
                            {checkingNik && (
                                <div className="absolute right-3 top-3 text-teal-600">
                                    <Loader2 size={20} className="animate-spin" />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* NAMA (Auto Filled) */}
                    <div className={`transition-all duration-300 ${detectedName ? 'opacity-100 max-h-20' : 'opacity-0 max-h-0 overflow-hidden'}`}>
                        <label className="text-xs font-bold uppercase text-gray-500">Nama Warga</label>
                        <div className="flex items-center gap-2 bg-gray-100 p-3 rounded-lg border border-gray-200 mt-1">
                            <User size={18} className="text-gray-500" />
                            <span className="font-bold text-gray-700">{detectedName}</span>
                            <Check size={18} className="text-green-500 ml-auto" />
                        </div>
                    </div>

                    <div>
                        <label className="text-xs font-bold uppercase text-gray-500">Untuk Bulan</label>
                        <input 
                            className="w-full border border-gray-300 p-3 rounded-lg mt-1 focus:ring-2 focus:ring-teal-500 outline-none" 
                            type="month" 
                            value={payForm.bulan} 
                            onChange={e => setPayForm({...payForm, bulan: e.target.value})} 
                            required
                        />
                    </div>

                    {/* CUSTOM FILE INPUT */}
                    <div>
                        <label className="text-xs font-bold uppercase text-gray-500">Bukti Transfer</label>
                        <label className={`mt-1 flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${payForm.file ? 'border-teal-500 bg-teal-50' : 'border-gray-300 hover:bg-gray-50'}`}>
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                {payForm.file ? (
                                    <>
                                        <FileText size={32} className="text-teal-600 mb-2" />
                                        <p className="text-sm font-bold text-teal-700">{payForm.file.name}</p>
                                        <p className="text-xs text-teal-500">Klik untuk ganti file</p>
                                    </>
                                ) : (
                                    <>
                                        <UploadCloud size={32} className="text-gray-400 mb-2" />
                                        <p className="text-sm text-gray-500"><span className="font-bold">Klik untuk upload</span> bukti transfer</p>
                                        <p className="text-xs text-gray-400">PNG, JPG (Max. 2MB)</p>
                                    </>
                                )}
                            </div>
                            <input 
                                type="file" 
                                accept="image/*" 
                                className="hidden" 
                                onChange={e => setPayForm({...payForm, file: e.target.files[0]})} 
                            />
                        </label>
                    </div>

                    <button 
                        disabled={uploading || !detectedName} 
                        className="w-full bg-teal-600 text-white font-bold py-3 rounded-xl hover:bg-teal-700 transition-colors shadow flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {uploading ? (
                            <><Loader2 size={20} className="animate-spin"/> Mengirim...</>
                        ) : (
                            'Kirim Bukti Pembayaran'
                        )}
                    </button>
                </form>
            </div>
        </div>
      )}
    </div>
  );
}