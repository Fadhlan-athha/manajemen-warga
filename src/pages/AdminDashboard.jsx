import React, { useState, useEffect } from 'react';
import { 
  Users, Home, Plus, Trash2, Edit, Menu, Search, ExternalLink, 
  Wallet, TrendingUp, TrendingDown, AlertTriangle, FileText, Check, X as XIcon, Map as MapIcon, MapPin
} from 'lucide-react';
import { dbHelper } from '../utils/db';
import { supabase } from '../utils/supabaseClient';
import Sidebar from '../components/Sidebar';
import StatCard from '../components/StatCard';
import Login from '../components/Login';
import DashboardCharts from '../components/DashboardCharts';

// Leaflet Imports
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

// Fix Icon Leaflet Default yang sering hilang di React
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: markerIcon2x,
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
});

export default function AdminDashboard() {
  // --- STATE ---
  const [session, setSession] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Data Lists
  const [wargaList, setWargaList] = useState([]);
  const [transaksiList, setTransaksiList] = useState([]);
  const [laporanList, setLaporanList] = useState([]);
  const [suratList, setSuratList] = useState([]);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentId, setCurrentId] = useState(null); // 'finance' | warga_id | null

  // Form Data Warga (Update: ada latitude & longitude)
  const [formData, setFormData] = useState({
    nik: '', nama: '', kk: '', 
    noRumah: '', rt: '01', 
    alamat: '', jenisKelamin: 'Laki-laki', 
    status: 'Tetap', noHp: '', 
    email: '', peran: 'Anggota',
    latitude: '', longitude: ''
  });

  // Form Data Keuangan
  const [financeForm, setFinanceForm] = useState({
    tipe: 'Pemasukan',
    kategori: 'Iuran Warga',
    nominal: '',
    keterangan: ''
  });

  // --- AUTH CHECK ---
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    return () => subscription.unsubscribe();
  }, []);

  // --- LOAD DATA ---
  useEffect(() => {
    if (session) loadData();
  }, [session]);

  // --- REALTIME LISTENER (LAPORAN DARURAT) ---
  useEffect(() => {
    if (!session) return;
    const channel = supabase
      .channel('public:laporan_darurat')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'laporan_darurat' }, (payload) => {
        alert(`⚠️ DARURAT BARU: ${payload.new.jenis_kejadian} di ${payload.new.lokasi}`);
        loadData();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [session]);

  const loadData = async () => {
    setLoading(true);
    try {
      const dataWarga = await dbHelper.getAll();
      setWargaList(dataWarga || []);
      const dataKeuangan = await dbHelper.getKeuangan();
      setTransaksiList(dataKeuangan || []);
      const dataLaporan = await dbHelper.getLaporan();
      setLaporanList(dataLaporan || []);
      const dataSurat = await dbHelper.getSurat();
      setSuratList(dataSurat || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // --- HANDLERS: WARGA ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
        if (editMode) {
            await dbHelper.update({ ...formData, id: currentId });
        } else {
            const memberData = [{
                nama: formData.nama,
                nik: formData.nik,
                email: formData.email,
                noHp: formData.noHp,
                jenisKelamin: formData.jenisKelamin,
                peran: formData.peran,
                status: formData.status
            }];
            const householdData = {
                kk: formData.kk,
                noRumah: formData.noRumah,
                rt: formData.rt,
                alamat: formData.alamat,
                fotoUrl: null,
                latitude: formData.latitude,
                longitude: formData.longitude
            };
            await dbHelper.addFamily(memberData, householdData);
        }
        setShowModal(false);
        resetForm();
        await loadData();
        alert("Data warga berhasil disimpan!");
    } catch (err) {
        alert("Gagal: " + err.message);
    } finally {
        setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if(confirm('Hapus data warga ini?')) { 
      try {
        await dbHelper.delete(id); 
        loadData();
      } catch (err) {
        alert("Error: " + err.message);
      }
    }
  };

  // --- HANDLERS LAINNYA ---
  const handleFinanceSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await dbHelper.addTransaksi(financeForm);
      alert("Transaksi berhasil dicatat!");
      setFinanceForm({ tipe: 'Pemasukan', kategori: 'Iuran Warga', nominal: '', keterangan: '' });
      setShowModal(false);
      loadData();
    } catch (err) { alert("Gagal catat transaksi: " + err.message); } finally { setLoading(false); }
  };

  const handleDeleteTransaksi = async (id) => {
    if(confirm('Hapus catatan transaksi ini?')) {
      try { await dbHelper.deleteTransaksi(id); loadData(); } catch(err) { alert(err.message) }
    }
  };

  const handleStatusLaporan = async (id, statusBaru) => {
    try { await dbHelper.updateStatusLaporan(id, statusBaru); loadData(); } catch(err) { alert(err.message); }
  };

  const handleDeleteLaporan = async (id) => {
    if(confirm('Hapus laporan ini?')) { await dbHelper.deleteLaporan(id); loadData(); }
  };

  const handleStatusSurat = async (id, status, nomor = null) => {
    try { await dbHelper.updateStatusSurat(id, status, nomor); loadData(); } catch(err) { alert(err.message); }
  };

  const resetForm = () => {
    setFormData({
        nik: '', nama: '', kk: '', noRumah: '', rt: '01', alamat: '', 
        jenisKelamin: 'Laki-laki', status: 'Tetap', noHp: '', email: '', peran: 'Anggota',
        latitude: '', longitude: ''
    });
    setEditMode(false);
    setCurrentId(null);
  };

  // Logic Grouping Warga (untuk Peta)
  const groupedFamilies = {};
  wargaList.forEach(person => {
    const kkKey = person.kk || 'unknown';
    if (!groupedFamilies[kkKey]) {
        groupedFamilies[kkKey] = { head: null, members: [] };
    }
    if (person.peran === 'Kepala Keluarga') {
        if (groupedFamilies[kkKey].head) groupedFamilies[kkKey].members.push(person);
        else groupedFamilies[kkKey].head = person;
    } else {
        groupedFamilies[kkKey].members.push(person);
    }
  });

  const totalPemasukan = transaksiList.filter(t => t.tipe === 'Pemasukan').reduce((acc, curr) => acc + Number(curr.nominal), 0);
  const totalPengeluaran = transaksiList.filter(t => t.tipe === 'Pengeluaran').reduce((acc, curr) => acc + Number(curr.nominal), 0);
  const saldoAkhir = totalPemasukan - totalPengeluaran;

  if (!session) return <Login />;

  return (
    <div className="flex h-screen bg-gray-50 font-sans text-gray-800 overflow-hidden">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} onLogout={() => supabase.auth.signOut()} />

      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        <header className="bg-white shadow-sm p-4 flex items-center justify-between lg:hidden z-10">
          <button onClick={() => setIsSidebarOpen(true)} className="text-gray-600"><Menu size={24} /></button>
          <span className="font-bold text-gray-700">Admin Panel</span>
          <div className="w-6"></div>
        </header>

        <div className="flex-1 overflow-auto p-4 lg:p-8">
          
          {activeTab === 'dashboard' && (
            <div className="space-y-6 animate-in fade-in duration-500">
               <h2 className="text-2xl font-bold text-gray-800">Dashboard Overview</h2>
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <StatCard title="Total Warga" value={wargaList.length} icon={<Users className="text-blue-500" />} color="bg-blue-50 border-blue-200" />
                  <StatCard title="Kepala Keluarga" value={Object.keys(groupedFamilies).length} icon={<Home className="text-purple-500" />} color="bg-purple-50 border-purple-200" />
                  <StatCard title="Saldo Kas" value={`Rp ${saldoAkhir.toLocaleString('id-ID')}`} icon={<Wallet className="text-teal-500" />} color="bg-teal-50 border-teal-200" />
                  <StatCard title="Laporan Aktif" value={laporanList.filter(l => l.status !== 'Selesai').length} icon={<AlertTriangle className="text-red-500" />} color="bg-red-50 border-red-200" />
                </div>
               <div className="mt-8 w-full">
                  <DashboardCharts 
                      wargaList={wargaList} 
                      transaksiList={transaksiList} 
                      laporanList={laporanList} 
                  />
               </div>
               </div>
          )}

          {activeTab === 'warga' && (
            <div className="animate-in fade-in duration-300">
               <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                 <h2 className="text-2xl font-bold text-gray-800">Data Keluarga</h2>
                 <button onClick={() => {setShowModal(true); resetForm();}} className="bg-teal-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow hover:bg-teal-700 transition-colors w-full md:w-auto justify-center cursor-pointer">
                    <Plus size={18} /> Tambah Manual
                 </button>
               </div>
               <div className="relative mb-6">
                 <Search className="absolute left-3 top-3 text-gray-400" size={20}/>
                 <input className="pl-10 border border-gray-300 p-2.5 rounded-lg w-full md:w-1/3 focus:ring-2 focus:ring-teal-500 outline-none shadow-sm" placeholder="Cari nama, NIK, atau No Rumah..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
               </div>
               <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                 <div className="overflow-x-auto">
                   <table className="w-full text-left whitespace-nowrap text-sm">
                     <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 font-semibold uppercase tracking-wider">
                       <tr>
                          <th className="p-4">Rumah & KK</th>
                          <th className="p-4">Nama Lengkap</th>
                          <th className="p-4">Identitas</th>
                          <th className="p-4">Kontak</th>
                          <th className="p-4 text-right">Aksi</th>
                       </tr>
                     </thead>
                     <tbody className="divide-y divide-gray-100">
                       {Object.keys(groupedFamilies).map(kkKey => {
                           const family = groupedFamilies[kkKey];
                           const head = family.head || family.members[0]; 
                           const members = family.members;
                           if (!head) return null;
                           // Filter logic
                           if (searchTerm && !head.nama.toLowerCase().includes(searchTerm.toLowerCase()) && !head.noRumah.toLowerCase().includes(searchTerm.toLowerCase())) return null;

                           return (
                               <React.Fragment key={kkKey}>
                                   <tr className="bg-white hover:bg-gray-50 border-l-4 border-l-teal-500">
                                     <td className="p-4 align-top">
                                        <div className="font-bold text-teal-800 text-lg">{head.noRumah || '-'}</div>
                                        <div className="text-gray-500 text-xs mb-1">RT {head.rt}</div>
                                        <div className="text-xs font-mono bg-gray-100 inline-block px-1 rounded text-gray-600">{head.kk}</div>
                                     </td>
                                     <td className="p-4 align-top">
                                        <div className="font-bold text-gray-900">{head.nama}</div>
                                        <div className="text-[10px] bg-teal-100 text-teal-700 px-2 py-0.5 rounded-full inline-block mt-1">{head.peran}</div>
                                     </td>
                                     <td className="p-4 align-top font-mono text-gray-600">{head.nik}</td>
                                     <td className="p-4 align-top">{head.noHp || '-'}</td>
                                     <td className="p-4 text-right space-x-2">
                                       <button onClick={() => { setFormData(head); setCurrentId(head.id); setEditMode(true); setShowModal(true); }} className="text-blue-600 hover:bg-blue-50 p-2 rounded"><Edit size={16}/></button>
                                       <button onClick={() => handleDelete(head.id)} className="text-red-500 hover:bg-red-50 p-2 rounded"><Trash2 size={16}/></button>
                                     </td>
                                   </tr>
                                   {members.map((member) => (
                                       <tr key={member.id} className="bg-gray-50/50 hover:bg-gray-100">
                                          <td className="p-4 border-r border-gray-100"></td>
                                          <td className="p-4 pl-8 relative">
                                              <div className="absolute left-0 top-1/2 w-6 h-px bg-gray-300"></div>
                                              <div className="absolute left-0 top-0 bottom-1/2 w-px bg-gray-300"></div>
                                              <div className="text-gray-700">{member.nama} <span className="text-xs bg-gray-200 px-1 rounded">{member.peran}</span></div>
                                          </td>
                                          <td className="p-4 font-mono text-gray-500 text-sm">{member.nik}</td>
                                          <td className="p-4 text-gray-500 text-sm">{member.noHp || '-'}</td>
                                          <td className="p-4 text-right space-x-2 opacity-60 hover:opacity-100">
                                              <button onClick={() => { setFormData(member); setCurrentId(member.id); setEditMode(true); setShowModal(true); }} className="text-blue-600 hover:bg-blue-100 p-1.5 rounded"><Edit size={14}/></button>
                                              <button onClick={() => handleDelete(member.id)} className="text-red-500 hover:bg-red-100 p-1.5 rounded"><Trash2 size={14}/></button>
                                          </td>
                                       </tr>
                                   ))}
                               </React.Fragment>
                           );
                       })}
                     </tbody>
                   </table>
                 </div>
               </div>
            </div>
          )}

          {/* TAB 3: PETA SEBARAN (BARU) */}
          {activeTab === 'peta' && (
            <div className="h-[80vh] bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col animate-in fade-in">
                <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                    <h3 className="font-bold text-gray-700 flex items-center gap-2"><MapIcon size={20}/> Peta Sebaran Warga</h3>
                    <div className="text-xs text-gray-500">Klik marker untuk detail.</div>
                </div>
                <div className="flex-1 z-0 relative">
                    <MapContainer center={[-6.200000, 106.816666]} zoom={15} style={{ height: '100%', width: '100%' }}>
                        <TileLayer
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            attribution='&copy; OpenStreetMap contributors'
                        />
                        {Object.keys(groupedFamilies).map(kkKey => {
                            const head = groupedFamilies[kkKey].head;
                            if (!head || !head.latitude || !head.longitude) return null;
                            
                            return (
                                <Marker key={head.id} position={[head.latitude, head.longitude]}>
                                    <Popup>
                                        <div className="min-w-[150px]">
                                            <h4 className="font-bold text-sm mb-1">{head.nama}</h4>
                                            <div className="text-xs text-gray-600 mb-2">
                                                Rumah: <b>{head.noRumah}</b> (RT {head.rt})
                                            </div>
                                            <div className="text-xs">
                                                Anggota: {groupedFamilies[kkKey].members.length + 1} Orang
                                            </div>
                                            <button onClick={() => { setFormData(head); setCurrentId(head.id); setEditMode(true); setShowModal(true); }} className="mt-2 text-teal-600 text-xs underline">Edit Data</button>
                                        </div>
                                    </Popup>
                                </Marker>
                            )
                        })}
                    </MapContainer>
                </div>
            </div>
          )}

          {activeTab === 'keuangan' && (
            <div className="animate-in fade-in duration-300">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                  <div><h2 className="text-2xl font-bold text-gray-800">Kas RT/RW</h2></div>
                  <div className="bg-white p-4 rounded-xl shadow border border-teal-100 flex items-center gap-4">
                      <div className="p-3 bg-teal-50 rounded-full text-teal-600"><Wallet /></div>
                      <div><p className="text-xs text-gray-500 font-bold uppercase">Saldo</p><p className="text-2xl font-bold text-teal-700">Rp {saldoAkhir.toLocaleString('id-ID')}</p></div>
                  </div>
                </div>
                <div className="flex gap-2 mb-6"><button onClick={() => { setEditMode(false); setCurrentId('finance'); setShowModal(true); }} className="bg-teal-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow hover:bg-teal-700 cursor-pointer"><Plus size={18} /> Catat Transaksi</button></div>
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  <table className="w-full text-left text-sm">
                      <thead className="bg-gray-50 border-b border-gray-200 uppercase text-xs font-bold text-gray-500"><tr><th className="p-4">Tanggal</th><th className="p-4">Keterangan</th><th className="p-4">Nominal</th><th className="p-4">Aksi</th></tr></thead>
                      <tbody className="divide-y divide-gray-100">
                      {transaksiList.map((item) => (
                          <tr key={item.id} className="hover:bg-gray-50">
                          <td className="p-4 text-gray-500">{new Date(item.created_at).toLocaleDateString()}</td>
                          <td className="p-4"><div>{item.keterangan}</div><div className="text-xs text-gray-400">{item.kategori}</div></td>
                          <td className={`p-4 font-mono font-bold ${item.tipe === 'Pemasukan' ? 'text-green-600' : 'text-red-500'}`}>{item.tipe === 'Pemasukan' ? '+' : '-'} Rp {Number(item.nominal).toLocaleString('id-ID')}</td>
                          <td className="p-4"><button onClick={() => handleDeleteTransaksi(item.id)} className="text-red-400"><Trash2 size={16} /></button></td>
                          </tr>
                      ))}
                      </tbody>
                  </table>
                </div>
            </div>
          )}

          {activeTab === 'laporan' && (
            <div className="animate-in fade-in duration-300">
                <div className="flex justify-between items-center mb-6">
                   <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2"><AlertTriangle className="text-red-500" /> Laporan Darurat</h2>
                   <button onClick={loadData} className="text-sm text-teal-600 underline cursor-pointer">Refresh</button>
                </div>
                <div className="grid grid-cols-1 gap-4">
                  {laporanList.map(item => (
                    <div key={item.id} className={`p-4 rounded-xl border-l-8 shadow-sm bg-white flex justify-between gap-4 ${item.status === 'Selesai' ? 'border-l-gray-300' : 'border-l-red-500'}`}>
                        <div>
                           <div className="flex items-center gap-3 mb-1"><span className="px-2 py-0.5 rounded text-xs font-bold bg-red-100 text-red-800 uppercase">{item.jenis_kejadian}</span><span className="text-xs text-gray-400">{new Date(item.created_at).toLocaleString()}</span></div>
                           <h3 className="font-bold text-lg">{item.lokasi}</h3>
                           <p className="text-gray-600 text-sm">Pelapor: {item.pelapor_nama || 'Anonim'}</p>
                        </div>
                        <div className="flex gap-2">
                           {item.status !== 'Selesai' && <button onClick={() => handleStatusLaporan(item.id, 'Selesai')} className="px-3 py-1 bg-green-600 text-white rounded text-xs font-bold">Selesai</button>}
                           <button onClick={() => handleDeleteLaporan(item.id)}><Trash2 className="text-gray-300 hover:text-red-500" size={18}/></button>
                        </div>
                    </div>
                  ))}
                </div>
            </div>
          )}

          {activeTab === 'surat' && (
            <div className="animate-in fade-in duration-300">
               <div className="flex justify-between items-center mb-6"><h2 className="text-2xl font-bold text-gray-800">Pengajuan Surat</h2><button onClick={loadData} className="text-sm text-teal-600 underline">Refresh</button></div>
               <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                 <table className="w-full text-left text-sm">
                   <thead className="bg-gray-50 border-b border-gray-200 uppercase text-xs font-bold text-gray-500"><tr><th className="p-4">Tanggal</th><th className="p-4">Pemohon</th><th className="p-4">Jenis</th><th className="p-4">Status</th><th className="p-4">Aksi</th></tr></thead>
                   <tbody className="divide-y divide-gray-100">
                     {suratList.map((item) => (
                       <tr key={item.id} className="hover:bg-gray-50">
                         <td className="p-4 text-gray-500">{new Date(item.created_at).toLocaleDateString()}</td>
                         <td className="p-4"><div>{item.nama}</div><div className="text-xs text-gray-500">{item.nik}</div></td>
                         <td className="p-4"><b>{item.jenis_surat}</b><p className="text-xs text-gray-600">{item.keperluan}</p></td>
                         <td className="p-4"><span className={`px-2 py-1 rounded text-xs font-bold ${item.status === 'Disetujui' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{item.status}</span></td>
                         <td className="p-4">
                           {item.status === 'Pending' && (
                             <div className="flex gap-2">
                               <button onClick={() => { const no = prompt("No Surat:"); if(no) handleStatusSurat(item.id, 'Disetujui', no); }} className="bg-green-100 text-green-700 p-2 rounded"><Check size={16}/></button>
                               <button onClick={() => { if(confirm("Tolak?")) handleStatusSurat(item.id, 'Ditolak'); }} className="bg-red-100 text-red-700 p-2 rounded"><XIcon size={16}/></button>
                             </div>
                           )}
                         </td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
               </div>
            </div>
          )}

          {activeTab === 'settings' && (<div className="p-6 bg-white rounded-xl border border-gray-200"><h2 className="text-xl font-bold">Pengaturan</h2><p className="text-gray-500">Dalam pengembangan.</p></div>)}
        </div>
      </main>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50 p-4">
           <div className="bg-white p-6 rounded-2xl w-full max-w-3xl shadow-2xl overflow-y-auto max-h-[90vh]">
              <div className="flex justify-between items-center mb-6 border-b pb-4">
                <h3 className="text-xl font-bold text-gray-800">{currentId === 'finance' ? 'Catat Transaksi' : (editMode ? 'Edit Data Warga' : 'Tambah Warga')}</h3>
                <button onClick={() => setShowModal(false)} className="text-3xl">&times;</button>
              </div>
              <form onSubmit={currentId === 'finance' ? handleFinanceSubmit : handleSubmit}>
                 {currentId === 'finance' ? (
                    <div className="space-y-4">
                       <div className="flex gap-4"><label className="flex items-center gap-2 border p-3 rounded w-full has-[:checked]:bg-green-50"><input type="radio" name="tipe" value="Pemasukan" checked={financeForm.tipe === 'Pemasukan'} onChange={e => setFinanceForm({...financeForm, tipe: e.target.value})} /> Pemasukan</label><label className="flex items-center gap-2 border p-3 rounded w-full has-[:checked]:bg-red-50"><input type="radio" name="tipe" value="Pengeluaran" checked={financeForm.tipe === 'Pengeluaran'} onChange={e => setFinanceForm({...financeForm, tipe: e.target.value})} /> Pengeluaran</label></div>
                       <div className="grid grid-cols-2 gap-4">
                         <div><label className="text-xs font-bold uppercase">Kategori</label><select className="w-full border p-2 rounded mt-1" value={financeForm.kategori} onChange={e => setFinanceForm({...financeForm, kategori: e.target.value})}><option>Iuran Warga</option><option>Sumbangan</option><option>Lain-lain</option></select></div>
                         <div><label className="text-xs font-bold uppercase">Nominal</label><input type="number" className="w-full border p-2 rounded mt-1" value={financeForm.nominal} onChange={e => setFinanceForm({...financeForm, nominal: e.target.value})} /></div>
                       </div>
                       <div><label className="text-xs font-bold uppercase">Keterangan</label><textarea className="w-full border p-2 rounded mt-1" value={financeForm.keterangan} onChange={e => setFinanceForm({...financeForm, keterangan: e.target.value})}></textarea></div>
                    </div>
                 ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="md:col-span-2 bg-gray-50 p-4 rounded-lg border border-gray-200">
                            <h4 className="text-sm font-bold text-gray-700 mb-3 uppercase">Data Rumah & KK</h4>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div><label className="text-xs font-bold text-gray-500 uppercase">No. KK</label><input className="w-full border p-2 rounded mt-1" value={formData.kk} onChange={e => setFormData({...formData, kk: e.target.value})} /></div>
                                <div><label className="text-xs font-bold text-gray-500 uppercase">No. Rumah</label><input className="w-full border p-2 rounded mt-1" value={formData.noRumah} onChange={e => setFormData({...formData, noRumah: e.target.value})} /></div>
                                <div><label className="text-xs font-bold text-gray-500 uppercase">RT</label><select className="w-full border p-2 rounded mt-1" value={formData.rt} onChange={e => setFormData({...formData, rt: e.target.value})}><option>01</option><option>02</option></select></div>
                                <div className="md:col-span-3"><label className="text-xs font-bold text-gray-500 uppercase">Alamat</label><input className="w-full border p-2 rounded mt-1" value={formData.alamat} onChange={e => setFormData({...formData, alamat: e.target.value})} /></div>
                                
                                {/* INPUT KOORDINAT BARU */}
                                <div className="md:col-span-3 grid grid-cols-2 gap-4 mt-2">
                                    <div><label className="text-xs font-bold text-teal-600 uppercase flex items-center gap-1"><MapPin size={12}/> Latitude</label><input className="w-full border border-teal-200 bg-teal-50 p-2 rounded mt-1" placeholder="-6.200000" value={formData.latitude || ''} onChange={e => setFormData({...formData, latitude: e.target.value})} /></div>
                                    <div><label className="text-xs font-bold text-teal-600 uppercase flex items-center gap-1"><MapPin size={12}/> Longitude</label><input className="w-full border border-teal-200 bg-teal-50 p-2 rounded mt-1" placeholder="106.816666" value={formData.longitude || ''} onChange={e => setFormData({...formData, longitude: e.target.value})} /></div>
                                    <p className="col-span-2 text-[10px] text-gray-400">*Gunakan Google Maps untuk menyalin koordinat (klik kanan di peta -> pilih angka koordinat).</p>
                                </div>
                            </div>
                        </div>
                        {/* Data Personal */}
                        <div><label className="text-xs font-bold text-gray-500 uppercase">Nama</label><input className="w-full border p-2 rounded mt-1" value={formData.nama} onChange={e => setFormData({...formData, nama: e.target.value})} /></div>
                        <div><label className="text-xs font-bold text-gray-500 uppercase">NIK</label><input className="w-full border p-2 rounded mt-1" value={formData.nik} onChange={e => setFormData({...formData, nik: e.target.value})} disabled={editMode} /></div>
                        <div><label className="text-xs font-bold text-gray-500 uppercase">Peran</label><select className="w-full border p-2 rounded mt-1" value={formData.peran} onChange={e => setFormData({...formData, peran: e.target.value})}><option>Kepala Keluarga</option><option>Anggota</option></select></div>
                        <div><label className="text-xs font-bold text-gray-500 uppercase">No HP</label><input className="w-full border p-2 rounded mt-1" value={formData.noHp} onChange={e => setFormData({...formData, noHp: e.target.value})} /></div>
                    </div>
                 )}
                 <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
                   <button type="button" onClick={() => setShowModal(false)} className="px-5 py-2.5 bg-gray-100 rounded-lg">Batal</button>
                   <button type="submit" className="px-6 py-2.5 bg-teal-600 text-white rounded-lg shadow">Simpan</button>
                 </div>
              </form>
           </div>
        </div>
      )}
    </div>
  );
}