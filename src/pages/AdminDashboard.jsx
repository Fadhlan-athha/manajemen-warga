import React, { useState, useEffect } from 'react';
import { Users, Home, Plus, Trash2, Edit, Menu, Search, ExternalLink, ChevronDown, ChevronRight } from 'lucide-react';
import { dbHelper } from '../utils/db';
import { supabase } from '../utils/supabaseClient';
import Sidebar from '../components/Sidebar';
import StatCard from '../components/StatCard';
import Login from '../components/Login';

export default function AdminDashboard() {
  // --- STATE ---
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
  
  // Form Data
  const [formData, setFormData] = useState({
    nik: '', nama: '', kk: '', 
    noRumah: '', rt: '01', 
    alamat: '', jenisKelamin: 'Laki-laki', 
    status: 'Tetap', noHp: '', 
    email: '', peran: 'Anggota'
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

  // --- HANDLERS ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
        if (editMode) {
            await dbHelper.update({ ...formData, id: currentId });
        } else {
            // Logic tambah manual 1 orang (dianggap 1 keluarga baru atau nambah anggota)
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
                fotoUrl: null 
            };
            await dbHelper.addFamily(memberData, householdData);
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
    if(confirm('Hapus data warga ini?')) { 
      try {
        await dbHelper.delete(id); 
        loadData();
      } catch (err) {
        alert("Error: " + err.message);
      }
    }
  };

  const resetForm = () => {
    setFormData({
        nik: '', nama: '', kk: '', 
        noRumah: '', rt: '01', 
        alamat: '', jenisKelamin: 'Laki-laki', 
        status: 'Tetap', noHp: '', 
        email: '', peran: 'Anggota'
    });
    setEditMode(false);
    setCurrentId(null);
  };

  // --- LOGIC PENGELOMPOKAN KELUARGA ---
  // 1. Filter dulu berdasarkan search
  const filteredRaw = wargaList.filter(w => 
    (w.nama && w.nama.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (w.nik && w.nik.includes(searchTerm)) ||
    (w.noRumah && w.noRumah.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // 2. Grouping by KK
  const groupedFamilies = {};
  filteredRaw.forEach(person => {
    const kkKey = person.kk || 'unknown';
    if (!groupedFamilies[kkKey]) {
        groupedFamilies[kkKey] = { head: null, members: [] };
    }
    
    // Cek apakah dia Kepala Keluarga
    if (person.peran === 'Kepala Keluarga') {
        // Jika sudah ada kepala keluarga (duplicate data error), masukkan ke members
        if (groupedFamilies[kkKey].head) {
            groupedFamilies[kkKey].members.push(person);
        } else {
            groupedFamilies[kkKey].head = person;
        }
    } else {
        groupedFamilies[kkKey].members.push(person);
    }
  });

  // --- RENDER ---
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
               {/* Statistik Dashboard Tetap Sama */}
               <h2 className="text-2xl font-bold text-gray-800">Dashboard Overview</h2>
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <StatCard title="Total Warga" value={wargaList.length} icon={<Users className="text-blue-500" />} color="bg-blue-50 border-blue-200" />
                  <StatCard title="Kepala Keluarga" value={Object.keys(groupedFamilies).length} icon={<Home className="text-purple-500" />} color="bg-purple-50 border-purple-200" />
                  <StatCard title="Laki-laki" value={wargaList.filter(w => w.jenisKelamin === 'Laki-laki').length} icon={<span>👨</span>} color="bg-green-50 border-green-200" />
                  <StatCard title="Perempuan" value={wargaList.filter(w => w.jenisKelamin === 'Perempuan').length} icon={<span>👩</span>} color="bg-pink-50 border-pink-200" />
               </div>
            </div>
          )}

          {activeTab === 'warga' && (
            <div className="animate-in fade-in duration-300">
               <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                 <h2 className="text-2xl font-bold text-gray-800">Data Keluarga</h2>
                 <button onClick={() => {setShowModal(true); resetForm();}} className="bg-teal-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow hover:bg-teal-700 transition-colors w-full md:w-auto justify-center">
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
                          <th className="p-4 w-1/5">Rumah & KK</th>
                          <th className="p-4 w-1/4">Nama Lengkap</th>
                          <th className="p-4 w-1/5">Identitas (NIK)</th>
                          <th className="p-4 w-1/5">Kontak</th>
                          <th className="p-4 w-1/6 text-right">Aksi</th>
                       </tr>
                     </thead>
                     <tbody className="divide-y divide-gray-100">
                       {Object.keys(groupedFamilies).map(kkKey => {
                           const family = groupedFamilies[kkKey];
                           // Jika tidak ada kepala keluarga (data error), ambil anggota pertama sebagai display
                           const head = family.head || family.members[0]; 
                           const members = family.members;
                           
                           if (!head) return null; // Safety check

                           return (
                               <React.Fragment key={kkKey}>
                                   {/* BARIS KEPALA KELUARGA (MAIN ROW) */}
                                   <tr className="bg-white hover:bg-gray-50 transition-colors border-l-4 border-l-teal-500">
                                     <td className="p-4 align-top">
                                        <div className="font-bold text-teal-800 text-lg">{head.noRumah || '-'}</div>
                                        <div className="text-gray-500 text-xs mb-1">RT {head.rt}</div>
                                        <div className="text-xs font-mono bg-gray-100 inline-block px-1 rounded text-gray-600">{head.kk}</div>
                                        {head.fotoUrl && (
                                          <a href={head.fotoUrl} target="_blank" rel="noreferrer" className="text-xs text-blue-600 flex items-center mt-2 hover:underline font-medium">
                                             <ExternalLink size={12} className="mr-1"/> Lihat KK
                                          </a>
                                        )}
                                     </td>
                                     <td className="p-4 align-top">
                                        <div className="flex items-center gap-2">
                                            <div className="font-bold text-gray-900 text-base">{head.nama}</div>
                                            <span className="text-[10px] bg-teal-100 text-teal-700 px-2 py-0.5 rounded-full border border-teal-200 font-bold">
                                                {head.peran || 'Kepala Keluarga'}
                                            </span>
                                        </div>
                                        <div className="text-xs text-gray-500 mt-1">{head.jenisKelamin}</div>
                                     </td>
                                     <td className="p-4 align-top font-mono text-gray-600">
                                        {head.nik}
                                     </td>
                                     <td className="p-4 align-top">
                                        <div>{head.noHp || '-'}</div>
                                        <div className="text-xs text-gray-500 mt-1 truncate max-w-[150px]" title={head.email}>{head.email}</div>
                                     </td>
                                     <td className="p-4 text-right align-top space-x-2">
                                       <button onClick={() => { setFormData(head); setCurrentId(head.id); setEditMode(true); setShowModal(true); }} className="text-blue-600 hover:bg-blue-50 p-2 rounded"><Edit size={16}/></button>
                                       <button onClick={() => handleDelete(head.id)} className="text-red-500 hover:bg-red-50 p-2 rounded"><Trash2 size={16}/></button>
                                     </td>
                                   </tr>

                                   {/* BARIS ANGGOTA KELUARGA (CHILD ROWS) */}
                                   {members.map((member) => (
                                       <tr key={member.id} className="bg-gray-50/50 hover:bg-gray-100 transition-colors">
                                          <td className="p-4 align-top border-r border-gray-100">
                                              {/* Kosongkan kolom rumah untuk anggota agar rapi */}
                                          </td>
                                          <td className="p-4 align-top pl-8 relative">
                                              {/* Garis hierarki visual */}
                                              <div className="absolute left-0 top-1/2 w-6 h-px bg-gray-300"></div>
                                              <div className="absolute left-0 top-0 bottom-1/2 w-px bg-gray-300"></div>

                                              <div className="font-medium text-gray-700">{member.nama}</div>
                                              <span className="text-[10px] bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full border border-gray-300 mt-1 inline-block">
                                                {member.peran || 'Anggota'}
                                              </span>
                                          </td>
                                          <td className="p-4 align-top font-mono text-gray-500 text-sm">
                                              {member.nik}
                                          </td>
                                          <td className="p-4 align-top text-sm text-gray-500">
                                              <div>{member.noHp || '-'}</div>
                                              <div className="text-xs mt-0.5">{member.email}</div>
                                          </td>
                                          <td className="p-4 text-right align-top space-x-2 opacity-60 hover:opacity-100">
                                              <button onClick={() => { setFormData(member); setCurrentId(member.id); setEditMode(true); setShowModal(true); }} className="text-blue-600 hover:bg-blue-100 p-1.5 rounded"><Edit size={14}/></button>
                                              <button onClick={() => handleDelete(member.id)} className="text-red-500 hover:bg-red-100 p-1.5 rounded"><Trash2 size={14}/></button>
                                          </td>
                                       </tr>
                                   ))}
                                   
                                   {/* Divider antar keluarga */}
                                   <tr><td colSpan="5" className="border-b border-gray-200 h-1 bg-gray-50"></td></tr>
                               </React.Fragment>
                           );
                       })}
                     </tbody>
                   </table>
                   {wargaList.length === 0 && <div className="p-8 text-center text-gray-500">Data tidak ditemukan.</div>}
                 </div>
               </div>
            </div>
          )}

          {activeTab === 'settings' && (
             <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-200 animate-in fade-in">
                <h2 className="text-xl font-bold mb-4">Pengaturan</h2>
                <p className="text-gray-500">Fitur pengaturan sedang dalam pengembangan.</p>
             </div>
          )}
        </div>
      </main>

      {/* MODAL EDIT / TAMBAH (Sama seperti sebelumnya) */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50 p-4">
           <div className="bg-white p-6 rounded-2xl w-full max-w-3xl shadow-2xl overflow-y-auto max-h-[90vh] animate-in zoom-in duration-200">
              <div className="flex justify-between items-center mb-6 border-b pb-4">
                <h3 className="text-xl font-bold text-gray-800">{editMode ? 'Edit Data Warga' : 'Tambah Data Manual'}</h3>
                <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors"><Trash2 className="hidden" /><span className="text-3xl">&times;</span></button>
              </div>
              
              <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-5">
                 {/* Data Rumah */}
                 <div className="md:col-span-2 bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <h4 className="text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide">Data Rumah & KK</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                           <label className="text-xs font-bold text-gray-500 uppercase">No. Kartu Keluarga</label>
                           <input className="w-full border border-gray-300 p-2 rounded mt-1 bg-white" value={formData.kk || ''} onChange={e => setFormData({...formData, kk: e.target.value})} />
                        </div>
                        <div>
                           <label className="text-xs font-bold text-gray-500 uppercase">No. Rumah</label>
                           <input className="w-full border border-gray-300 p-2 rounded mt-1 bg-white" value={formData.noRumah || ''} onChange={e => setFormData({...formData, noRumah: e.target.value})} placeholder="A-12" />
                        </div>
                        <div>
                           <label className="text-xs font-bold text-gray-500 uppercase">RT</label>
                           <select className="w-full border border-gray-300 p-2 rounded mt-1 bg-white" value={formData.rt || '01'} onChange={e => setFormData({...formData, rt: e.target.value})}>
                             <option value="01">RT 01</option> <option value="02">RT 02</option> <option value="03">RT 03</option>
                           </select>
                        </div>
                        <div className="md:col-span-3">
                           <label className="text-xs font-bold text-gray-500 uppercase">Alamat Lengkap</label>
                           <input className="w-full border border-gray-300 p-2 rounded mt-1 bg-white" value={formData.alamat || ''} onChange={e => setFormData({...formData, alamat: e.target.value})} />
                        </div>
                    </div>
                 </div>

                 {/* Data Personal */}
                 <div className="md:col-span-2">
                    <h4 className="text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide mt-2">Data Personal</h4>
                 </div>

                 <div>
                   <label className="text-xs font-bold text-gray-500 uppercase">Nama Lengkap</label>
                   <input className="w-full border border-gray-300 p-2.5 rounded-lg mt-1 focus:ring-2 focus:ring-teal-500 outline-none" value={formData.nama || ''} onChange={e => setFormData({...formData, nama: e.target.value})} required />
                 </div>
                 
                 <div>
                   <label className="text-xs font-bold text-gray-500 uppercase">NIK</label>
                   <input className="w-full border border-gray-300 p-2.5 rounded-lg mt-1 focus:ring-2 focus:ring-teal-500 outline-none bg-gray-50" value={formData.nik || ''} onChange={e => setFormData({...formData, nik: e.target.value})} required disabled={editMode} />
                 </div>

                 <div>
                   <label className="text-xs font-bold text-gray-500 uppercase">Peran Keluarga</label>
                   <select className="w-full border border-gray-300 p-2.5 rounded-lg mt-1 bg-white" value={formData.peran || 'Anggota'} onChange={e => setFormData({...formData, peran: e.target.value})}>
                     <option value="Kepala Keluarga">Kepala Keluarga</option>
                     <option value="Istri">Istri</option>
                     <option value="Anak">Anak</option>
                     <option value="Anggota">Anggota Lain</option>
                   </select>
                 </div>

                 <div>
                   <label className="text-xs font-bold text-gray-500 uppercase">Jenis Kelamin</label>
                   <select className="w-full border border-gray-300 p-2.5 rounded-lg mt-1 bg-white" value={formData.jenisKelamin || 'Laki-laki'} onChange={e => setFormData({...formData, jenisKelamin: e.target.value})}>
                     <option value="Laki-laki">Laki-laki</option>
                     <option value="Perempuan">Perempuan</option>
                   </select>
                 </div>

                 <div>
                   <label className="text-xs font-bold text-gray-500 uppercase">No. HP</label>
                   <input className="w-full border border-gray-300 p-2.5 rounded-lg mt-1" value={formData.noHp || ''} onChange={e => setFormData({...formData, noHp: e.target.value})} />
                 </div>

                 <div>
                   <label className="text-xs font-bold text-gray-500 uppercase">Email</label>
                   <input type="email" className="w-full border border-gray-300 p-2.5 rounded-lg mt-1" value={formData.email || ''} onChange={e => setFormData({...formData, email: e.target.value})} />
                 </div>

                 <div>
                   <label className="text-xs font-bold text-gray-500 uppercase">Status Tempat Tinggal</label>
                   <select className="w-full border border-gray-300 p-2.5 rounded-lg mt-1 bg-white" value={formData.status || 'Tetap'} onChange={e => setFormData({...formData, status: e.target.value})}>
                     <option value="Tetap">Tetap</option> <option value="Kontrak">Kontrak</option> <option value="Kos">Kos</option>
                   </select>
                 </div>

                 <div className="md:col-span-2 flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
                   <button type="button" onClick={() => setShowModal(false)} className="px-5 py-2.5 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors font-medium">Batal</button>
                   <button type="submit" className="px-6 py-2.5 bg-teal-600 text-white hover:bg-teal-700 rounded-lg shadow-lg shadow-teal-900/20 transition-all transform hover:-translate-y-0.5 font-medium">Simpan Data</button>
                 </div>
              </form>
           </div>
        </div>
      )}
    </div>
  );
}