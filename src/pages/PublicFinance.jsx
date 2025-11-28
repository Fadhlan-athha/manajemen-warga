import React, { useState, useEffect } from 'react';
import { dbHelper } from '../utils/db';
import { Wallet, ArrowLeft, TrendingUp, TrendingDown } from 'lucide-react';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid } from 'recharts';
export default function PublicFinance() {
  const [transaksiList, setTransaksiList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const data = await dbHelper.getKeuangan();
      setTransaksiList(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const totalPemasukan = transaksiList.filter(t => t.tipe === 'Pemasukan').reduce((acc, curr) => acc + Number(curr.nominal), 0);
  const totalPengeluaran = transaksiList.filter(t => t.tipe === 'Pengeluaran').reduce((acc, curr) => acc + Number(curr.nominal), 0);
  const saldo = totalPemasukan - totalPengeluaran;

  const chartData = [
    { name: 'Pemasukan', value: totalPemasukan, color: '#16a34a' }, // Green
    { name: 'Pengeluaran', value: totalPengeluaran, color: '#dc2626' } // Red
  ];

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* Header */}
      <div className="bg-teal-800 text-white p-6 pb-24 relative overflow-hidden">
        <div className="max-w-3xl mx-auto relative z-10">
           <Link to="/" className="inline-flex items-center gap-2 text-teal-200 hover:text-white mb-4 transition-colors"><ArrowLeft size={16}/> Kembali ke Beranda</Link>
           <h1 className="text-3xl font-bold flex items-center gap-3"><Wallet /> Transparansi Kas RT</h1>
           <p className="text-teal-200 mt-2">Laporan keuangan real-time yang dapat diakses oleh seluruh warga.</p>
        </div>
        {/* Dekorasi Background */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-teal-700 rounded-full mix-blend-multiply filter blur-3xl opacity-50 -translate-y-1/2 translate-x-1/2"></div>
      </div>

      <div className="max-w-3xl mx-auto px-4 -mt-16 relative z-20">
        {/* Kartu Saldo Utama */}
        <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100 mb-8">
           <div className="text-center">
              <p className="text-gray-500 font-bold uppercase tracking-wider text-xs mb-1">Total Saldo Kas Saat Ini</p>
              <h2 className="text-4xl font-extrabold text-gray-800">Rp {saldo.toLocaleString('id-ID')}</h2>
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

        {/* --- GRAFIK BARU --- */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
            <h3 className="font-bold text-gray-700 mb-4 text-sm uppercase tracking-wide">Grafik Arus Kas</h3>
            <div className="h-64 w-full"> {/* Ubah tinggi jadi h-64 agar lebih proporsional */}
                <ResponsiveContainer width="100%" height="100%">
                    {/* HAPUS layout="vertical" agar bar berdiri tegak */}
                    <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        
                        {/* XAxis: Menampilkan Nama (Pemasukan/Pengeluaran) di BAWAH */}
                        <XAxis 
                            dataKey="name" 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{fontSize: 12, fontWeight: 'bold', fill: '#6b7280'}} 
                            dy={10} // Jarak tulisan ke chart
                        />

                        {/* YAxis: Menampilkan Angka di KIRI */}
                        <YAxis 
                            axisLine={false} 
                            tickLine={false} 
                            tickFormatter={(value) => `${(value/1000000).toFixed(1)}jt`} // Format jadi Juta biar ringkas
                            tick={{fontSize: 10, fill: '#9ca3af'}}
                        />

                        <Tooltip 
                            cursor={{fill: '#f3f4f6'}}
                            formatter={(value) => `Rp ${value.toLocaleString('id-ID')}`} 
                            contentStyle={{borderRadius: '8px', border: 'none',boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                        />

                        <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={60}>
                             {chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                             ))}
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
        
        <div className="mt-8 text-center text-xs text-gray-400 pb-8">
           Data diperbarui secara real-time dari sistem kas RT.
        </div>
      </div>
    </div>
  );
}