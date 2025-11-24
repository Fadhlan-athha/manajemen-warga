import React, { useState, useEffect } from 'react';
import { Users, Home, Plus, Search, Trash2, Edit, Download, Upload, Menu, X, FileText } from 'lucide-react';

// Import komponen dan utils kita
import { dbHelper } from './utils/db';
import Sidebar from './components/Sidebar';
import StatCard from './components/StatCard';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [wargaList, setWargaList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // State untuk Form Modal
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentId, setCurrentId] = useState(null);
  const [formData, setFormData] = useState({
    nik: '', nama: '', kk: '', rt: '01', 
    alamat: '', jenisKelamin: 'Laki-laki', 
    status: 'Tetap', noHp: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await dbHelper.getAll();
      setWargaList(data);
    } catch (error) {
      console.error("Gagal memuat data:", error);
    } finally {
      setLoading(false);
    }
  };

  // ... (Logic handleInputChange, handleSubmit, handleDelete, exportData, importData)
  // ... (Gunakan logika yang sama seperti kode sebelumnya, namun panggil dbHelper yang diimport)
  
  // Contoh handler submit yang dipersingkat (Anda perlu melengkapi isinya dari kode referensi sebelumnya)
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
        if (editMode) {
            await dbHelper.update({ ...formData, id: currentId });
        } else {
            await dbHelper.add(formData);
        }
        setShowModal(false);
        loadData();
        resetForm();
    } catch (err) {
        alert("Error: " + err);
    }
  };

  const resetForm = () => {
    setFormData({
      nik: '', nama: '', kk: '', rt: '01',
      alamat: '', jenisKelamin: 'Laki-laki',
      status: 'Tetap', noHp: ''
    });
    setEditMode(false);
    setCurrentId(null);
  };

  // Kalkulasi Statistik
  const stats = {
    total: wargaList.length,
    laki: wargaList.filter(w => w.jenisKelamin === 'Laki-laki').length,
    perempuan: wargaList.filter(w => w.jenisKelamin === 'Perempuan').length,
    kk: new Set(wargaList.map(w => w.kk)).size
  };

  // Filtering Logic
  const filteredWarga = wargaList.filter(w => 
    w.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
    w.nik.includes(searchTerm)
  );

  return (
    <div className="flex h-screen bg-gray-50 font-sans text-gray-800 overflow-hidden">
      
      {/* Panggil Component Sidebar */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        isOpen={isSidebarOpen} 
        setIsOpen={setIsSidebarOpen} 
      />

      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Header Mobile */}
        <header className="bg-white shadow-sm p-4 flex items-center justify-between lg:hidden">
          <button onClick={() => setIsSidebarOpen(true)} className="text-gray-600">
            <Menu size={24} />
          </button>
          <span className="font-bold text-gray-700">RW Management</span>
          <div className="w-6"></div>
        </header>

        <div className="flex-1 overflow-auto p-4 lg:p-8">
          
          {/* ----- TAB DASHBOARD ----- */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-800">Dashboard Statistik</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard title="Total Warga" value={stats.total} icon={<Users className="w-8 h-8 text-blue-500" />} color="bg-blue-50 border-blue-200" />
                <StatCard title="Kepala Keluarga" value={stats.kk} icon={<Home className="w-8 h-8 text-purple-500" />} color="bg-purple-50 border-purple-200" />
                <StatCard title="Laki-laki" value={stats.laki} icon={<span>👨</span>} color="bg-green-50 border-green-200" />
                <StatCard title="Perempuan" value={stats.perempuan} icon={<span>👩</span>} color="bg-pink-50 border-pink-200" />
              </div>
            </div>
          )}

          {/* ----- TAB DATA WARGA ----- */}
          {activeTab === 'warga' && (
            <div>
               {/* Render tabel dan search bar di sini (sama seperti kode referensi sebelumnya) */}
               {/* Gunakan variabel `filteredWarga` untuk mapping data */}
               <div className="mb-4 flex gap-2">
                 <input 
                   className="border p-2 rounded w-full" 
                   placeholder="Cari..." 
                   value={searchTerm} 
                   onChange={e => setSearchTerm(e.target.value)} 
                 />
                 <button onClick={() => {setShowModal(true); resetForm();}} className="bg-teal-600 text-white px-4 py-2 rounded">
                    <Plus size={18} />
                 </button>
               </div>
               
               {/* Tabel sederhana sebagai representasi */}
               <div className="bg-white rounded shadow overflow-auto">
                 <table className="w-full text-left">
                   <thead className="bg-gray-100">
                     <tr>
                        <th className="p-3">Nama</th>
                        <th className="p-3">NIK</th>
                        <th className="p-3">Aksi</th>
                     </tr>
                   </thead>
                   <tbody>
                     {filteredWarga.map(w => (
                       <tr key={w.id} className="border-t">
                         <td className="p-3">{w.nama}</td>
                         <td className="p-3">{w.nik}</td>
                         <td className="p-3">
                           <button onClick={() => { setFormData(w); setCurrentId(w.id); setEditMode(true); setShowModal(true); }} className="text-blue-500 mr-2"><Edit size={16}/></button>
                           <button onClick={async () => { if(confirm('Hapus?')) { await dbHelper.delete(w.id); loadData(); }}} className="text-red-500"><Trash2 size={16}/></button>
                         </td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
               </div>
            </div>
          )}

          {/* ----- TAB SETTINGS ----- */}
          {activeTab === 'settings' && (
             <div className="p-6 bg-white rounded shadow">
                <h2 className="text-xl font-bold mb-4">Backup & Restore</h2>
                <div className="flex gap-4">
                  <button onClick={() => { /* panggil fungsi exportData */ }} className="flex items-center gap-2 bg-blue-50 p-4 rounded border border-blue-200">
                    <Download className="text-blue-600"/> Download Data JSON
                  </button>
                  <label className="flex items-center gap-2 bg-green-50 p-4 rounded border border-green-200 cursor-pointer">
                    <Upload className="text-green-600"/> Restore Data JSON
                    <input type="file" accept=".json" onChange={(e) => { /* panggil fungsi importData(e) */ }} className="hidden" />
                  </label>
                </div>
             </div>
          )}

        </div>
      </main>

      {/* MODAL FORM */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
           <div className="bg-white p-6 rounded-lg w-full max-w-lg">
              <h3 className="text-xl font-bold mb-4">{editMode ? 'Edit' : 'Tambah'} Warga</h3>
              <form onSubmit={handleSubmit} className="space-y-3">
                 <input className="w-full border p-2 rounded" placeholder="Nama" value={formData.nama} onChange={e => setFormData({...formData, nama: e.target.value})} required />
                 <input className="w-full border p-2 rounded" placeholder="NIK" value={formData.nik} onChange={e => setFormData({...formData, nik: e.target.value})} required />
                 {/* Tambahkan input lain sesuai kebutuhan (KK, RT, HP, dll) */}
                 
                 <div className="flex justify-end gap-2 mt-4">
                   <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 bg-gray-200 rounded">Batal</button>
                   <button type="submit" className="px-4 py-2 bg-teal-600 text-white rounded">Simpan</button>
                 </div>
              </form>
           </div>
        </div>
      )}

    </div>
  );
}
