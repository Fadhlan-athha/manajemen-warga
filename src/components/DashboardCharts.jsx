import React from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';

export default function DashboardCharts({ wargaList, transaksiList, laporanList }) {
  
  // DATA 1: DEMOGRAFI
  const laki = wargaList.filter(w => w.jenisKelamin === 'Laki-laki').length;
  const perempuan = wargaList.filter(w => w.jenisKelamin === 'Perempuan').length;
  const dataGender = [
    { name: 'Laki-laki', value: laki },
    { name: 'Perempuan', value: perempuan },
  ];
  const COLORS_GENDER = ['#3b82f6', '#ec4899'];

  // DATA 2: KEUANGAN
  const pemasukan = transaksiList
    .filter(t => t.tipe === 'Pemasukan')
    .reduce((acc, curr) => acc + Number(curr.nominal), 0);
  const pengeluaran = transaksiList
    .filter(t => t.tipe === 'Pengeluaran')
    .reduce((acc, curr) => acc + Number(curr.nominal), 0);
  const dataKeuangan = [
    { name: 'Masuk', nominal: pemasukan },
    { name: 'Keluar', nominal: pengeluaran },
  ];

  // DATA 3: STATUS LAPORAN
  const selesai = laporanList.filter(l => l.status === 'Selesai').length;
  const pending = laporanList.filter(l => l.status !== 'Selesai').length;
  const dataLaporan = [
    { name: 'Selesai', value: selesai },
    { name: 'Pending', value: pending },
  ];
  const COLORS_LAPORAN = ['#10b981', '#ef4444'];

  return (
    // PERBAIKAN: Menambahkan w-full agar tidak menabrak layout grid
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8 w-full">
      
      {/* GRAFIK 1: KEUANGAN */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col">
        <h3 className="font-bold text-gray-700 mb-4">Ringkasan Keuangan</h3>
        {/* PERBAIKAN: Menggunakan aspect-ratio atau min-height yang fix */}
        <div className="w-full h-64 min-h-[250px]"> 
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dataKeuangan}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" axisLine={false} tickLine={false} />
              <YAxis tickFormatter={(val) => `${val/1000}k`} axisLine={false} tickLine={false} />
              <Tooltip formatter={(value) => `Rp ${value.toLocaleString('id-ID')}`} />
              <Bar dataKey="nominal" fill="#0d9488" radius={[4, 4, 0, 0]} barSize={50} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* GRAFIK 2: DEMOGRAFI */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col">
        <h3 className="font-bold text-gray-700 mb-4">Demografi Warga</h3>
        <div className="w-full h-64 min-h-[250px] flex justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={dataGender}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {dataGender.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS_GENDER[index % COLORS_GENDER.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend verticalAlign="bottom" height={36}/>
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

       {/* GRAFIK 3: LAPORAN (Full Width) */}
       <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 lg:col-span-2 flex flex-col">
          <div className="flex justify-between items-center mb-4">
             <h3 className="font-bold text-gray-700">Status Laporan</h3>
             <span className="text-xs text-gray-400">Total: {laporanList.length}</span>
          </div>
          <div className="w-full h-48 min-h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
                {/* Layout vertical untuk bar mendatar agar variatif */}
                <BarChart layout="vertical" data={dataLaporan} barSize={20}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false}/>
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" width={80} tickLine={false} axisLine={false}/>
                    <Tooltip />
                    <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                        {dataLaporan.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS_LAPORAN[index]} />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
          </div>
       </div>

    </div>
  );
}