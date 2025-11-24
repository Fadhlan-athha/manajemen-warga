import React, { useState, useEffect } from 'react';
import { Users, Home, Plus, Trash2, Edit, Download, Upload, Menu, Search } from 'lucide-react';
import { dbHelper } from '../utils/db';
import { supabase } from '../utils/supabaseClient';
import Sidebar from '../components/Sidebar';
import StatCard from '../components/StatCard';
import Login from '../components/Login';

export default function AdminDashboard() {
  const [session, setSession] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [wargaList, setWargaList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentId, setCurrentId] = useState(null);
  const [formData, setFormData] = useState({
    nik: '', nama: '', kk: '', rt: '01', 
    alamat: '', jenisKelamin: 'Laki-laki', 
    status: 'Tetap', noHp: ''
  });

  // Auth Check
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    return () => subscription.unsubscribe();
  }, []);

  // Load Data
  useEffect(() => {
    if (session) loadData();
  }, [session]);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await dbHelper.getAll();
      setWargaList(data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
        if (editMode) {
            await dbHelper.update({ ...formData, id: currentId });
        } else {
            await dbHelper.add(formData);
        }
        setShowModal(false);
        resetForm();
        await loadData();
        alert("Data berhasil disimpan!");
    } catch (err) {
        alert("Gagal: " + err.message);
    } finally {
        setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if(confirm('Hapus data ini?')) { 
      try {
        await dbHelper.delete(id); 
        loadData();
      } catch (err) {
        alert("Error: " + err.message);
      }
    }
  };

  const resetForm = () => {
    setFormData({ nik: '', nama: '', kk: '', rt: '01', alamat: '', jenisKelamin: 'Laki-laki', status: 'Tetap', noHp: '' });
    setEditMode(false);
    setCurrentId(null);
  };

  // Stats Logic
  const stats = {
    total: wargaList.length,
    laki: wargaList.filter(w => w.jenisKelamin === 'Laki-laki').length,
    perempuan: wargaList.filter(w => w.jenisKelamin === 'Perempuan').length,
    kk: new Set(wargaList.map(w => w.kk)).size
  };

  const filteredWarga = wargaList.filter(w => 
    (w.nama && w.nama.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (w.nik && w.nik.includes(searchTerm))
  );

  // --- RENDER LOGIC ---
  
  if (!session) {
    return <Login />;
  }

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
                <StatCard title="Total Warga" value={stats.total} icon={<Users className="text-blue-500" />} color="bg-blue-50 border-blue-200" />
                <StatCard title="Kepala Keluarga" value={stats.kk} icon={<Home className="text-purple-500" />} color="bg-purple-50 border-purple-200" />
                <StatCard title="Laki-laki" value={stats.laki} icon={<span>👨</span>} color="bg-green-50 border-green-200" />
                <StatCard title="Perempuan" value={stats.perempuan} icon={<span>👩</span>} color="bg-pink-50 border-pink-200" />
              </div>
            </div>
          )}

          {activeTab === 'warga' && (
            <div className="animate-in fade-in duration-300">
               <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                 <h2 className="text-2xl font-bold text-gray-800">Data Warga</h2>
                 <button onClick={() => {setShowModal(true); resetForm();}} className="bg-teal-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow hover:bg-teal-700 transition-colors w-full md:w-auto justify-center">
                    <Plus size={18} /> Tambah Data
                 </button>
               </div>

               <div className="relative mb-6">
                 <Search className="absolute left-3 top-3 text-gray-400" size={20}/>
                 <input className="pl-10 border border-gray-300 p-2.5 rounded-lg w-full md:w-1/3 focus:ring-2 focus:ring-teal-500 outline-none shadow-sm" placeholder="Cari nama atau NIK..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
               </div>
               
               <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                 <div className="overflow-x-auto">
                   <table className="w-full text-left whitespace-nowrap">
                     <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 font-semibold text-sm uppercase tracking-wider">
                       <tr>
                          <th className="p-4">Nama</th>
                          <th className="p-4">NIK</th>
                          <th className="p-4">JK</th>
                          <th className="p-4">RT</th>
                          <th className="p-4 text-right">Aksi</th>
                       </tr>
                     </thead>
                     <tbody className="divide-y divide-gray-100">
                       {filteredWarga.map(w => (
                           <tr key={w.id} className="hover:bg-gray-50 transition-colors">
                             <td className="p-4 font-medium text-gray-900">{w.nama}</td>
                             <td className="p-4 font-mono text-sm text-gray-500">{w.nik}</td>
                             <td className="p-4 text-gray-600">{w.jenisKelamin}</td>
                             <td className="p-4 text-gray-600">{w.rt}</td>
                             <td className="p-4 text-right space-x-2">
                               <button onClick={() => { setFormData(w); setCurrentId(w.id); setEditMode(true); setShowModal(true); }} className="text-blue-600 hover:bg-blue-50 p-2 rounded transition-colors"><Edit size={18}/></button>
                               <button onClick={() => handleDelete(w.id)} className="text-red-500 hover:bg-red-50 p-2 rounded transition-colors"><Trash2 size={18}/></button>
                             </td>
                           </tr>
                       ))}
                     </tbody>
                   </table>
                   {filteredWarga.length === 0 && <div className="p-8 text-center text-gray-500">Data tidak ditemukan.</div>}
                 </div>
               </div>
            </div>
          )}

          {activeTab === 'settings' && (
             <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-200 animate-in fade-in">
                <h2 className="text-xl font-bold mb-4">Pengaturan</h2>
                <p className="text-gray-500">Fitur export/import sedang disesuaikan untuk Cloud Database.</p>
             </div>
          )}
        </div>
      </main>

      {/* MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50 p-4">
           <div className="bg-white p-6 rounded-2xl w-full max-w-2xl shadow-2xl overflow-y-auto max-h-[90vh] animate-in zoom-in duration-200">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-800">{editMode ? 'Edit' : 'Tambah'} Data Warga</h3>
                <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600"><Trash2 className="hidden" /><span className="text-2xl">&times;</span></button>
              </div>
              
              <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div className="col-span-2 md:col-span-1">
                   <label className="text-xs font-bold text-gray-500 uppercase">Nama Lengkap</label>
                   <input className="w-full border border-gray-300 p-2.5 rounded-lg mt-1 focus:ring-2 focus:ring-teal-500 outline-none" value={formData.nama} onChange={e => setFormData({...formData, nama: e.target.value})} required />
                 </div>
                 <div className="col-span-2 md:col-span-1">
                   <label className="text-xs font-bold text-gray-500 uppercase">NIK</label>
                   <input className="w-full border border-gray-300 p-2.5 rounded-lg mt-1 focus:ring-2 focus:ring-teal-500 outline-none" value={formData.nik} onChange={e => setFormData({...formData, nik: e.target.value})} required />
                 </div>
                 <div>
                   <label className="text-xs font-bold text-gray-500 uppercase">No. KK</label>
                   <input className="w-full border border-gray-300 p-2.5 rounded-lg mt-1 focus:ring-2 focus:ring-teal-500 outline-none" value={formData.kk} onChange={e => setFormData({...formData, kk: e.target.value})} />
                 </div>
                 <div>
                   <label className="text-xs font-bold text-gray-500 uppercase">No. HP</label>
                   <input className="w-full border border-gray-300 p-2.5 rounded-lg mt-1 focus:ring-2 focus:ring-teal-500 outline-none" value={formData.noHp} onChange={e => setFormData({...formData, noHp: e.target.value})} />
                 </div>
                 <div>
                   <label className="text-xs font-bold text-gray-500 uppercase">RT</label>
                   <select className="w-full border border-gray-300 p-2.5 rounded-lg mt-1 bg-white" value={formData.rt} onChange={e => setFormData({...formData, rt: e.target.value})}>
                     <option value="01">RT 01</option> <option value="02">RT 02</option> <option value="03">RT 03</option>
                   </select>
                 </div>
                 <div>
                   <label className="text-xs font-bold text-gray-500 uppercase">Status</label>
                   <select className="w-full border border-gray-300 p-2.5 rounded-lg mt-1 bg-white" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
                     <option value="Tetap">Tetap</option> <option value="Kontrak">Kontrak</option> <option value="Kos">Kos</option>
                   </select>
                 </div>
                 <div className="col-span-2">
                   <label className="text-xs font-bold text-gray-500 uppercase">Alamat</label>
                   <textarea className="w-full border border-gray-300 p-2.5 rounded-lg mt-1 focus:ring-2 focus:ring-teal-500 outline-none" rows="2" value={formData.alamat} onChange={e => setFormData({...formData, alamat: e.target.value})}></textarea>
                 </div>

                 <div className="col-span-2 flex justify-end gap-3 mt-4 pt-4 border-t border-gray-100">
                   <button type="button" onClick={() => setShowModal(false)} className="px-5 py-2.5 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors font-medium">Batal</button>
                   <button type="submit" className="px-5 py-2.5 bg-teal-600 text-white hover:bg-teal-700 rounded-lg shadow-lg shadow-teal-900/20 transition-all transform hover:-translate-y-0.5 font-medium">Simpan Data</button>
                 </div>
              </form>
           </div>
        </div>
      )}
    </div>
  );
}