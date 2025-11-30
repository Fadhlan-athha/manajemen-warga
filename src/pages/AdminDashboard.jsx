import React, { useState, useEffect } from 'react';
import { 
  Users, Home, Plus, Trash2, Edit, Menu, Search, ExternalLink, 
  Wallet, TrendingUp, TrendingDown, AlertTriangle, FileText, Check, 
  X as XIcon, Map as MapIcon, MapPin, ChevronDown, ChevronRight, 
  User, Calendar, Briefcase, Heart, BookOpen, Mail, Eye, Filter, 
  Locate, Megaphone, FileSpreadsheet, CreditCard, Bell, BadgeCheck, 
  CheckCircle, Recycle, Scale
} from 'lucide-react';

import { dbHelper } from '../utils/db';
import { supabase } from '../utils/supabaseClient';
import Sidebar from '../components/Sidebar';
import StatCard from '../components/StatCard';
import Login from '../components/Login';
import DashboardCharts from '../components/DashboardCharts';
import { generateSuratPDF } from '../utils/suratGenerator';
import { exportToExcel } from '../utils/exportHelper';

// --- LEAFLET MAP IMPORTS ---
import { MapContainer, TileLayer, Marker, Popup, useMap, CircleMarker } from 'react-leaflet';
import L from 'leaflet';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// Fix Icon Leaflet agar muncul
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({ 
  iconRetinaUrl: markerIcon2x, 
  iconUrl: markerIcon, 
  shadowUrl: markerShadow 
});

// Komponen Marker Lokasi GPS
function LocationMarker() {
  const [position, setPosition] = useState(null);
  const map = useMap();

  const handleLocate = () => { 
    map.locate()
      .on("locationfound", function (e) { 
        setPosition(e.latlng); 
        map.flyTo(e.latlng, 18); 
      })
      .on("locationerror", function (e) { 
        alert("Gagal lokasi: " + e.message); 
      }); 
  };

  return ( 
    <>
      <div 
        className="leaflet-bottom leaflet-right" 
        style={{marginBottom: '90px', marginRight: '10px', pointerEvents: 'auto', zIndex: 1000}}
      >
        <div 
          className="bg-white border-2 border-gray-300 rounded shadow-sm cursor-pointer hover:bg-gray-100" 
          onClick={handleLocate} 
          title="Lokasi Saya"
        >
          <div className="p-2 text-gray-700"><Locate size={20}/></div>
        </div>
      </div>
      {position && (
        <CircleMarker 
          center={position} 
          radius={8} 
          pathOptions={{ color: 'white', fillColor: '#3b82f6', fillOpacity: 1, weight: 2 }}
        >
          <Popup>📍 Lokasi Anda</Popup>
        </CircleMarker>
      )}
    </> 
  );
}

// ==========================================
// KOMPONEN UTAMA ADMIN DASHBOARD
// ==========================================
export default function AdminDashboard() {
  
  // --- 1. STATES (DATA & UI) ---
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
  const [infoList, setInfoList] = useState([]);
  const [iuranList, setIuranList] = useState([]); 
  const [sampahList, setSampahList] = useState([]);

  // UI States
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentId, setCurrentId] = useState(null); 
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedFamilyHead, setSelectedFamilyHead] = useState(null);
  const [expandedKK, setExpandedKK] = useState({});
  const [mapFilter, setMapFilter] = useState('Semua');

  // Form States
  const [formData, setFormData] = useState({ 
    nik: '', nama: '', kk: '', noRumah: '', rt: '01', rw: '03', alamat: '', 
    jenisKelamin: 'Laki-laki', status: 'Tetap', noHp: '', email: '', 
    peran: 'Anggota', tempatLahir: '', tanggalLahir: '', agama: 'Islam', 
    pekerjaan: '', statusPerkawinan: 'Kawin', golonganDarah: '-', 
    latitude: '', longitude: '' 
  });
  
  const [financeForm, setFinanceForm] = useState({ 
    tipe: 'Pemasukan', kategori: 'Iuran Warga', nominal: '', keterangan: '' 
  });
  
  const [infoForm, setInfoForm] = useState({ 
    judul: '', isi: '', kategori: 'Info', tanggal_kegiatan: '', useAI: true 
  });
  
  const [sampahForm, setSampahForm] = useState({ 
    nik: '', nama: '', jenis: 'Kardus/Karton', berat: '', harga: 3000 
  });

  const HARGA_SAMPAH = { 
    'Kardus/Karton': 3000, 
    'Botol Plastik Bersih': 2500, 
    'Kaleng/Logam': 5000, 
    'Minyak Jelantah': 4000, 
    'Kertas HVS/Buku': 2000 
  };

  // --- 2. EFFECTS (LOAD DATA) ---
  useEffect(() => { 
    supabase.auth.getSession().then(({ data: { session } }) => { setSession(session); }); 
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => { setSession(session); }); 
    return () => subscription.unsubscribe(); 
  }, []);

  useEffect(() => { 
    if (session) loadData(); 
  }, [session]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Ambil filter RT dari local storage (diset saat login)
      const myRT = localStorage.getItem('adminRT'); 

      const [warga, keuangan, laporan, surat, info, iuran, sampah] = await Promise.all([
        dbHelper.getAll(myRT),
        dbHelper.getKeuangan(myRT),
        dbHelper.getLaporan(myRT),
        dbHelper.getSurat(myRT),
        dbHelper.getPengumuman(), // Pengumuman bersifat global
        dbHelper.getIuran(myRT),
        dbHelper.getRiwayatSampah(myRT)
      ]);

      setWargaList(warga || []);
      setTransaksiList(keuangan || []);
      setLaporanList(laporan || []);
      setSuratList(surat || []);
      setInfoList(info || []);
      setIuranList(iuran || []);
      setSampahList(sampah || []);
    } catch (error) { 
      console.error("Gagal memuat data:", error); 
    } finally { 
      setLoading(false); 
    }
  };

  // --- 3. HELPER FUNCTIONS ---
  const calculateAge = (dateString) => { 
    if (!dateString) return 0; 
    const today = new Date(); 
    const birthDate = new Date(dateString); 
    let age = today.getFullYear() - birthDate.getFullYear(); 
    const m = today.getMonth() - birthDate.getMonth(); 
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) { age--; } 
    return age; 
  };

  const toggleKK = (kk) => { 
    setExpandedKK(prev => ({ ...prev, [kk]: !prev[kk] })); 
  };

  const resetForm = () => { 
    setFormData({ 
      nik: '', nama: '', kk: '', noRumah: '', rt: '01', rw: '03', alamat: '', 
      jenisKelamin: 'Laki-laki', status: 'Tetap', noHp: '', email: '', 
      peran: 'Anggota', tempatLahir: '', tanggalLahir: '', agama: 'Islam', 
      pekerjaan: '', statusPerkawinan: 'Kawin', golonganDarah: '-', 
      latitude: '', longitude: '' 
    }); 
    setEditMode(false); 
    setCurrentId(null); 
  };

  // --- 4. HANDLERS (LOGIC) ---

  // Handler Data Warga
  const handleSubmit = async (e) => { 
    e.preventDefault(); 
    setLoading(true); 
    try { 
      if (editMode) { 
        await dbHelper.update({ ...formData, id: currentId }); 
      } else { 
        const memberData = [{ 
          nama: formData.nama, nik: formData.nik, email: formData.email, 
          noHp: formData.noHp, jenisKelamin: formData.jenisKelamin, 
          peran: formData.peran, status: formData.status, tempatLahir: formData.tempatLahir, 
          tanggalLahir: formData.tanggalLahir, agama: formData.agama, 
          pekerjaan: formData.pekerjaan, statusPerkawinan: formData.statusPerkawinan, 
          golonganDarah: formData.golonganDarah 
        }]; 
        const householdData = { 
          kk: formData.kk, noRumah: formData.noRumah, rt: formData.rt, 
          rw: formData.rw, alamat: formData.alamat, fotoUrl: null, 
          latitude: formData.latitude, longitude: formData.longitude 
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
  
  // Handler Keuangan
  const handleFinanceSubmit = async (e) => { 
    e.preventDefault(); 
    setLoading(true); 
    try { 
      const myRT = localStorage.getItem('adminRT') || '01'; 
      await dbHelper.addTransaksi({...financeForm, rt: myRT}); 
      alert("Transaksi berhasil!"); 
      setFinanceForm({ tipe: 'Pemasukan', kategori: 'Iuran Warga', nominal: '', keterangan: '' }); 
      setShowModal(false); 
      loadData(); 
    } catch (err) { 
      alert(err.message); 
    } finally { 
      setLoading(false); 
    } 
  };

  const handleDeleteTransaksi = async (id) => { 
    if(confirm('Hapus?')) { 
      try { 
        await dbHelper.deleteTransaksi(id); 
        loadData(); 
      } catch(err) { 
        alert(err.message) 
      } 
    } 
  };
  
  // Handler Pengumuman
  const handleInfoSubmit = async (e) => { 
    e.preventDefault(); 
    setLoading(true); 
    try { 
      await dbHelper.addPengumuman(infoForm, infoForm.useAI); 
      alert(infoForm.useAI ? "Pengumuman dibuat & Broadcast WA terkirim!" : "Pengumuman berhasil disimpan!"); 
      setInfoForm({ judul: '', isi: '', kategori: 'Info', tanggal_kegiatan: '', useAI: true }); 
      setShowModal(false); 
      loadData(); 
    } catch (err) { 
      alert(err.message); 
    } finally { 
      setLoading(false); 
    } 
  };

  const handleDeleteInfo = async (id) => { 
    if(confirm('Hapus pengumuman ini?')) { 
      try { 
        await dbHelper.deletePengumuman(id); 
        loadData(); 
      } catch(err) { 
        alert(err.message) 
      } 
    } 
  };
  
  // Handler Laporan & Surat
  const handleDeleteLaporan = async (id) => { 
    if(confirm('Hapus?')) { 
      await dbHelper.deleteLaporan(id); 
      loadData(); 
    } 
  };

  const handleStatusLaporan = async (id, status) => { 
    try { 
      await dbHelper.updateStatusLaporan(id, status); 
      loadData(); 
    } catch(err) { 
      alert(err.message); 
    } 
  };

  const handleStatusSurat = async (id, status, nomor = null) => { 
    try { 
      await dbHelper.updateStatusSurat(id, status, nomor); 
      loadData(); 
    } catch(err) { 
      alert(err.message); 
    } 
  };

  const handleApproveSurat = async (suratItem) => { 
    const noSurat = prompt("Masukkan Nomor Surat (Contoh: 001):"); 
    if (!noSurat) return; 
    
    const btn = document.getElementById(`btn-approve-${suratItem.id}`); 
    if(btn) btn.innerText = "⏳"; 
    
    try { 
      const wargaFull = await dbHelper.getWargaByNIK(suratItem.nik); 
      const pdfBlob = generateSuratPDF(wargaFull, suratItem, noSurat); 
      const pdfFile = new File([pdfBlob], `Surat_Pengantar_${suratItem.nik}_${Date.now()}.pdf`, { type: "application/pdf" }); 
      const publicUrl = await dbHelper.uploadFileSurat(pdfFile); 
      
      await dbHelper.updateStatusSurat(suratItem.id, 'Disetujui', noSurat, publicUrl); 
      alert("Surat berhasil disetujui & PDF telah dibuat!"); 
      loadData(); 
    } catch (error) { 
      console.error(error); 
      alert("Gagal: " + error.message); 
    } 
  };
  
  // Handler Iuran
  const handleVerifikasiIuran = async (item) => { 
    if(confirm(`Verifikasi pembayaran dari ${item.nama}? Data akan masuk ke kas.`)) { 
      try { 
        await dbHelper.verifikasiIuran(item.id, item); 
        alert("Pembayaran Terverifikasi & Masuk Kas!"); 
        loadData(); 
      } catch(err) { 
        alert("Gagal: " + err.message); 
      } 
    } 
  };

  const handleBroadcastTagihan = async (hari) => { 
    if(confirm(`Kirim Broadcast Reminder Tagihan Hari ke-${hari}?`)) { 
      try { 
        await dbHelper.broadcastTagihan(hari); 
        alert("Reminder terkirim ke Grup WA!"); 
      } catch(err) { 
        alert("Gagal: " + err.message); 
      } 
    } 
  };

  // Handler Bank Sampah
  const handleJenisSampahChange = (e) => { 
    const jenis = e.target.value; 
    setSampahForm({ ...sampahForm, jenis: jenis, harga: HARGA_SAMPAH[jenis] }); 
  };

  const handleCariWarga = async () => { 
    if(sampahForm.nik.length === 16) { 
      const w = await dbHelper.getWargaByNIK(sampahForm.nik); 
      if(w) setSampahForm(prev => ({...prev, nama: w.nama})); 
    } 
  };

  const handleSampahSubmit = async (e) => {
    e.preventDefault();
    if(!sampahForm.berat || sampahForm.berat <= 0) return alert("Berat harus diisi!");
    setLoading(true);
    try {
      const total = Number(sampahForm.berat) * Number(sampahForm.harga);
      const myRT = localStorage.getItem('adminRT') || '01';
      
      await dbHelper.addSetoranSampah({
        nik: sampahForm.nik, 
        nama: sampahForm.nama, 
        jenis_sampah: sampahForm.jenis,
        berat_kg: sampahForm.berat, 
        harga_per_kg: sampahForm.harga, 
        total_rp: total, 
        rt: myRT
      });
      alert(`Berhasil! Saldo Rp ${total.toLocaleString('id-ID')} ditambahkan ke ${sampahForm.nama}`);
      setSampahForm({ nik: '', nama: '', jenis: 'Kardus/Karton', berat: '', harga: 3000 });
      setShowModal(false);
      loadData();
    } catch (err) { 
      alert("Gagal: " + err.message); 
    } finally { 
      setLoading(false); 
    }
  };

  // --- 5. CALCULATIONS ---
  const groupedFamilies = {}; 
  wargaList.forEach(person => { 
    const kkKey = person.kk || 'unknown'; 
    if (!groupedFamilies[kkKey]) { groupedFamilies[kkKey] = { head: null, members: [] }; } 
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

  // ==========================================
  // 6. RENDER UI
  // ==========================================
  return (
    <div className="flex h-screen bg-gray-50 font-sans text-gray-800 overflow-hidden">
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        isOpen={isSidebarOpen} 
        setIsOpen={setIsSidebarOpen} 
        onLogout={() => supabase.auth.signOut()} 
      />
      
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        <header className="bg-white shadow-sm p-4 flex items-center justify-between lg:hidden z-10">
          <button onClick={() => setIsSidebarOpen(true)} className="text-gray-600"><Menu size={24} /></button>
          <span className="font-bold text-gray-700">Admin Panel</span>
          <div className="w-6"></div>
        </header>
        
        <div className="flex-1 overflow-auto p-4 lg:p-8">
          
          {/* === DASHBOARD TAB === */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6 animate-in fade-in duration-500">
               <h2 className="text-2xl font-bold text-gray-800">Dashboard Overview</h2>
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <StatCard title="Total Warga" value={wargaList.length} icon={<Users className="text-blue-500" />} color="bg-blue-50 border-blue-200" />
                  <StatCard title="Kepala Keluarga" value={Object.keys(groupedFamilies).length} icon={<Home className="text-purple-500" />} color="bg-purple-50 border-purple-200" />
                  <StatCard title="Saldo Kas" value={`Rp ${saldoAkhir.toLocaleString('id-ID')}`} icon={<Wallet className="text-teal-500" />} color="bg-teal-50 border-teal-200" />
                  <StatCard title="Menunggu Verifikasi" value={iuranList.filter(i => i.status === 'Pending').length} icon={<BadgeCheck className="text-orange-500" />} color="bg-orange-50 border-orange-200" />
               </div>
               <div className="mt-8 w-full"><DashboardCharts wargaList={wargaList} transaksiList={transaksiList} laporanList={laporanList} /></div>
            </div>
          )}

          {/* === VERIFIKASI IURAN TAB === */}
          {activeTab === 'verifikasi' && (
            <div className="animate-in fade-in duration-300">
               <div className="flex justify-between items-center mb-6">
                 <div>
                    <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2"><BadgeCheck className="text-blue-600" /> Verifikasi Iuran Warga</h2>
                    <p className="text-sm text-gray-500 mt-1">Validasi bukti pembayaran yang masuk.</p>
                 </div>
                 <div className="flex gap-2">
                    <button onClick={() => handleBroadcastTagihan(1)} className="bg-orange-100 text-orange-700 px-4 py-2 rounded-lg text-xs font-bold hover:bg-orange-200 flex items-center gap-2 transition-colors"><Bell size={16}/> Reminder H-1</button>
                    <button onClick={() => handleBroadcastTagihan(3)} className="bg-red-100 text-red-700 px-4 py-2 rounded-lg text-xs font-bold hover:bg-red-200 flex items-center gap-2 transition-colors"><Bell size={16}/> Reminder Final</button>
                    <button onClick={() => exportToExcel(iuranList, 'Laporan_Iuran_Bulanan')} className="bg-green-600 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-green-700 flex items-center gap-2 transition-colors shadow"><FileSpreadsheet size={16}/> Export Laporan</button>
                 </div>
               </div>
               <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  <table className="w-full text-left text-sm">
                      <thead className="bg-blue-50 border-b border-blue-100 uppercase text-xs font-bold text-blue-700">
                          <tr>
                            <th className="p-4">Bulan</th>
                            <th className="p-4">Warga</th>
                            <th className="p-4">Bukti Transfer</th>
                            <th className="p-4">Status</th>
                            <th className="p-4 text-right">Aksi</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                          {iuranList.length === 0 ? ( 
                            <tr><td colSpan="5" className="p-8 text-center text-gray-400 italic">Belum ada data pembayaran masuk.</td></tr> 
                          ) : iuranList.map(iuran => (
                              <tr key={iuran.id} className="hover:bg-gray-50">
                                  <td className="p-4 font-mono font-bold text-gray-600">{iuran.bulan_tahun}</td>
                                  <td className="p-4">
                                    <div className="font-bold text-gray-800">{iuran.nama}</div>
                                    <div className="text-xs text-gray-500 font-mono">{iuran.nik}</div>
                                  </td>
                                  <td className="p-4">
                                    {iuran.bukti_url ? (
                                      <a href={iuran.bukti_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 bg-blue-50 text-blue-600 px-3 py-1 rounded border border-blue-100 text-xs font-bold hover:bg-blue-100 transition-colors">
                                        <FileText size={14}/> Lihat Bukti
                                      </a>
                                    ) : <span className="text-gray-400 italic">Tidak ada file</span>}
                                  </td>
                                  <td className="p-4">
                                    <span className={`px-2 py-1 rounded text-[10px] uppercase font-bold ${iuran.status === 'Lunas' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                      {iuran.status}
                                    </span>
                                  </td>
                                  <td className="p-4 text-right">
                                    {iuran.status === 'Pending' ? (
                                      <button onClick={() => handleVerifikasiIuran(iuran)} className="bg-green-600 text-white px-4 py-2 rounded-lg text-xs font-bold shadow hover:bg-green-700 transition-all flex items-center gap-1 ml-auto">
                                        <Check size={14}/> Validasi Lunas
                                      </button>
                                    ) : (
                                      <span className="text-green-600 text-xs font-bold flex items-center justify-end gap-1"><CheckCircle size={14}/> Selesai</span>
                                    )}
                                  </td>
                              </tr>
                          ))}
                      </tbody>
                  </table>
               </div>
            </div>
          )}

          {/* === BANK SAMPAH TAB === */}
          {activeTab === 'sampah' && (
            <div className="animate-in fade-in duration-300">
               <div className="flex justify-between items-center mb-6">
                 <div>
                    <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2"><Recycle className="text-green-600" /> Bank Sampah Digital</h2>
                    <p className="text-sm text-gray-500 mt-1">Kelola setoran sampah warga untuk dikonversi jadi Rupiah.</p>
                 </div>
                 <button onClick={() => { setCurrentId('sampah'); setShowModal(true); }} className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow hover:bg-green-700 font-bold transition-colors"><Scale size={18}/> Input Timbangan Baru</button>
               </div>
               
               {/* Ringkasan Statistik */}
               <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-green-50 p-4 rounded-xl border border-green-200">
                    <p className="text-xs font-bold text-green-700 uppercase">Total Sampah Terkumpul</p>
                    <p className="text-2xl font-bold text-gray-800 mt-1">{sampahList.reduce((acc, curr) => acc + Number(curr.berat_kg), 0).toFixed(1)} <span className="text-sm text-gray-500">Kg</span></p>
                  </div>
                  <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
                    <p className="text-xs font-bold text-blue-700 uppercase">Total Nilai Rupiah</p>
                    <p className="text-2xl font-bold text-gray-800 mt-1">Rp {sampahList.reduce((acc, curr) => acc + Number(curr.total_rp), 0).toLocaleString('id-ID')}</p>
                  </div>
                  <div className="bg-orange-50 p-4 rounded-xl border border-orange-200">
                    <p className="text-xs font-bold text-orange-700 uppercase">Partisipasi Warga</p>
                    <p className="text-2xl font-bold text-gray-800 mt-1">{[...new Set(sampahList.map(item => item.nik))].length} <span className="text-sm text-gray-500">KK</span></p>
                  </div>
               </div>
               
               {/* Tabel Riwayat */}
               <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  <table className="w-full text-left text-sm">
                      <thead className="bg-gray-50 border-b border-gray-200 uppercase text-xs font-bold text-gray-500">
                          <tr>
                            <th className="p-4">Tanggal</th>
                            <th className="p-4">Nasabah</th>
                            <th className="p-4">Jenis Sampah</th>
                            <th className="p-4 text-right">Berat (Kg)</th>
                            <th className="p-4 text-right">Total (Rp)</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                          {sampahList.length === 0 ? (<tr><td colSpan="5" className="p-8 text-center text-gray-400">Belum ada setoran sampah.</td></tr>) : sampahList.map(item => (
                              <tr key={item.id} className="hover:bg-gray-50">
                                  <td className="p-4 text-gray-500 font-mono text-xs">{new Date(item.created_at).toLocaleDateString('id-ID', {day:'numeric', month:'short', hour:'2-digit', minute:'2-digit'})}</td>
                                  <td className="p-4 font-bold text-gray-700">{item.nama}</td>
                                  <td className="p-4"><span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs border border-gray-200">{item.jenis_sampah}</span></td>
                                  <td className="p-4 text-right font-mono">{item.berat_kg}</td>
                                  <td className="p-4 text-right font-bold text-green-600">Rp {item.total_rp.toLocaleString('id-ID')}</td>
                              </tr>
                          ))}
                      </tbody>
                  </table>
               </div>
            </div>
          )}

          {/* === DATA WARGA TAB === */}
          {activeTab === 'warga' && (
            <div className="animate-in fade-in duration-300">
              <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                <h2 className="text-2xl font-bold text-gray-800">Data Keluarga</h2>
                <div className="flex gap-2 w-full md:w-auto">
                  <button onClick={() => exportToExcel(wargaList, 'Data_Warga_RW')} className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow hover:bg-green-700 transition-colors w-full md:w-auto justify-center cursor-pointer">
                    <FileSpreadsheet size={18} /> Export Excel
                  </button>
                  <button onClick={() => {setShowModal(true); resetForm();}} className="bg-teal-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow hover:bg-teal-700 transition-colors w-full md:w-auto justify-center cursor-pointer">
                    <Plus size={18} /> Tambah Manual
                  </button>
                </div>
              </div>
              <div className="relative mb-6">
                <Search className="absolute left-3 top-3 text-gray-400" size={20}/>
                <input className="pl-10 border border-gray-300 p-2.5 rounded-lg w-full md:w-1/3 focus:ring-2 focus:ring-teal-500 outline-none shadow-sm" placeholder="Cari nama, NIK, atau No Rumah..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-gray-100 border-b border-gray-200 text-gray-600 font-semibold uppercase tracking-wider">
                      <tr>
                        <th className="p-4 w-10"></th>
                        <th className="p-4">Rumah & KK</th>
                        <th className="p-4">Kepala Keluarga / Anggota</th>
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
                        if (searchTerm && !head.nama.toLowerCase().includes(searchTerm.toLowerCase()) && !head.noRumah.toLowerCase().includes(searchTerm.toLowerCase()) && !head.kk.includes(searchTerm)) return null;
                        const isExpanded = expandedKK[kkKey];
                        
                        return (
                          <React.Fragment key={kkKey}>
                            <tr className={`cursor-pointer transition-colors ${isExpanded ? 'bg-teal-50 hover:bg-teal-100 border-l-4 border-l-teal-600' : 'bg-white hover:bg-gray-50 border-l-4 border-l-transparent'}`} onClick={() => toggleKK(kkKey)}>
                              <td className="p-4 text-center">{isExpanded ? <ChevronDown size={20} className="text-teal-600"/> : <ChevronRight size={20} className="text-gray-400"/>}</td>
                              <td className="p-4 align-top">
                                <div className="font-bold text-gray-800 text-lg">{head.noRumah || '-'}</div>
                                <div className="text-gray-500 text-xs mb-1">RT {head.rt} / RW {head.rw}</div>
                                <div className="text-xs font-mono bg-gray-200 inline-block px-2 py-0.5 rounded text-gray-600">{head.kk}</div>
                              </td>
                              <td className="p-4 align-top">
                                <div className="font-bold text-gray-900 flex items-center gap-2"><User size={16} className="text-teal-600"/> {head.nama}</div>
                                <div className="text-[10px] bg-teal-100 text-teal-700 px-2 py-0.5 rounded-full inline-block mt-1 font-bold">{head.peran}</div>
                                <div className="text-xs text-gray-500 mt-1 flex items-center gap-1"><Briefcase size={10}/> {head.pekerjaan || '-'}</div>
                              </td>
                              <td className="p-4 align-top">
                                <div className="font-mono text-gray-600 text-xs mb-1">{head.nik}</div>
                                <div className="text-xs text-gray-500 flex items-center gap-1"><Calendar size={10}/> {head.tempatLahir}, {head.tanggalLahir ? new Date(head.tanggalLahir).toLocaleDateString() : '-'}</div>
                                <div className="text-xs text-gray-500 flex items-center gap-1 mt-1"><BookOpen size={10}/> {head.agama}</div>
                              </td>
                              <td className="p-4 align-top text-gray-600">
                                <div>{head.noHp || '-'}</div>
                                <div className="text-xs text-gray-400 mt-1 flex items-center gap-1"><Mail size={10}/> {head.email || '-'}</div>
                              </td>
                              <td className="p-4 text-right space-x-2" onClick={(e) => e.stopPropagation()}>
                                <button onClick={() => { setSelectedFamilyHead(head); setShowDetailModal(true); }} className="text-teal-600 hover:bg-teal-100 p-2 rounded transition-colors" title="Lihat Detail & Foto KK"><Eye size={18}/></button>
                                <button onClick={() => { setFormData(head); setCurrentId(head.id); setEditMode(true); setShowModal(true); }} className="text-blue-600 hover:bg-blue-100 p-2 rounded transition-colors" title="Edit"><Edit size={18}/></button>
                                <button onClick={() => handleDelete(head.id)} className="text-red-500 hover:bg-red-100 p-2 rounded transition-colors" title="Hapus"><Trash2 size={18}/></button>
                              </td>
                            </tr>
                            {isExpanded && members.map((member) => (
                              <tr key={member.id} className="bg-gray-50 hover:bg-gray-100 animate-in slide-in-from-top-1">
                                <td className="p-4 text-center relative"><div className="absolute top-0 bottom-0 left-1/2 w-px bg-gray-300 -z-10"></div><div className="absolute top-1/2 left-1/2 w-4 h-px bg-gray-300"></div></td>
                                <td className="p-4"></td>
                                <td className="p-4 align-top">
                                  <div className="font-bold text-gray-700 flex items-center gap-2"><User size={14} className="text-gray-400"/> {member.nama}</div>
                                  <div className="text-[10px] bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full inline-block mt-1 font-bold">{member.peran}</div>
                                  <div className="text-xs text-gray-500 mt-1 flex items-center gap-1"><Briefcase size={10}/> {member.pekerjaan || '-'}</div>
                                </td>
                                <td className="p-4 align-top">
                                  <div className="font-mono text-gray-500 text-xs mb-1">{member.nik}</div>
                                  <div className="text-xs text-gray-500 flex items-center gap-1"><Calendar size={10}/> {member.tempatLahir}, {member.tanggalLahir ? new Date(member.tanggalLahir).toLocaleDateString() : '-'}</div>
                                  <div className="text-xs text-gray-500 flex items-center gap-1 mt-1"><BookOpen size={10}/> {member.agama}</div>
                                </td>
                                <td className="p-4 align-top text-gray-600">
                                  <div>{member.noHp || '-'}</div>
                                  <div className="text-xs text-gray-400 mt-1 flex items-center gap-1"><Mail size={10}/> {member.email || '-'}</div>
                                </td>
                                <td className="p-4 text-right space-x-2">
                                  <button onClick={() => { setFormData(member); setCurrentId(member.id); setEditMode(true); setShowModal(true); }} className="text-blue-500 hover:bg-blue-50 p-1.5 rounded" title="Edit"><Edit size={16}/></button>
                                  <button onClick={() => handleDelete(member.id)} className="text-red-500 hover:bg-red-50 p-1.5 rounded" title="Hapus"><Trash2 size={16}/></button>
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

          {/* === PETA TAB === */}
          {activeTab === 'peta' && (
            <div className="h-[80vh] bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col animate-in fade-in">
              <div className="p-4 border-b border-gray-200 bg-gray-50 flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                  <h3 className="font-bold text-gray-700 flex items-center gap-2"><MapIcon size={20}/> Peta Sebaran Warga</h3>
                  <div className="text-xs text-gray-500">Menampilkan lokasi tempat tinggal warga.</div>
                </div>
                <div className="flex items-center gap-2">
                  <Filter size={16} className="text-gray-500"/>
                  <select className="bg-white border border-gray-300 text-gray-700 text-sm rounded-lg p-2 focus:ring-teal-500 focus:border-teal-500 outline-none" value={mapFilter} onChange={(e) => setMapFilter(e.target.value)}>
                    <option value="Semua">Semua Warga</option>
                    <option value="Lansia">Ada Lansia ({'>'}60 Thn)</option>
                    <option value="Balita">Ada Balita (0-5 Thn)</option>
                    <option value="Perempuan">KK Perempuan</option>
                  </select>
                </div>
              </div>
              <div className="flex-1 z-0 relative">
                <MapContainer center={[-6.200000, 106.816666]} zoom={15} style={{ height: '100%', width: '100%' }}>
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap contributors' />
                  <LocationMarker />
                  {Object.keys(groupedFamilies).map(kkKey => {
                    const family = groupedFamilies[kkKey];
                    const head = family.head;
                    if (!head || !head.latitude || !head.longitude) return null;
                    
                    let isVisible = true;
                    const allMembers = [head, ...family.members];
                    
                    if (mapFilter === 'Lansia') { isVisible = allMembers.some(m => calculateAge(m.tanggalLahir) >= 60); } 
                    else if (mapFilter === 'Balita') { isVisible = allMembers.some(m => calculateAge(m.tanggalLahir) > 0 && calculateAge(m.tanggalLahir) <= 5); } 
                    else if (mapFilter === 'Perempuan') { isVisible = head.jenisKelamin === 'Perempuan'; }
                    
                    if (!isVisible) return null;
                    
                    return (
                      <Marker key={head.id} position={[head.latitude, head.longitude]}>
                        <Popup>
                          <div className="min-w-[180px]">
                            <div className="flex items-center gap-2 mb-2 border-b pb-2">
                              <div className={`w-2 h-8 rounded ${mapFilter !== 'Semua' ? 'bg-orange-500' : 'bg-teal-500'}`}></div>
                              <div>
                                <h4 className="font-bold text-sm leading-tight">{head.nama}</h4>
                                <span className="text-[10px] text-gray-500">KK: {head.kk}</span>
                              </div>
                            </div>
                            <div className="space-y-1 text-xs text-gray-600 mb-2">
                              <div className="flex justify-between"><span>Rumah:</span> <b>{head.noRumah}</b></div>
                              <div className="flex justify-between"><span>RT/RW:</span> <b>{head.rt}/{head.rw}</b></div>
                              <div className="flex justify-between"><span>Jml Anggota:</span> <b>{allMembers.length} Orang</b></div>
                            </div>
                            {mapFilter === 'Lansia' && <div className="bg-orange-50 text-orange-800 p-1.5 rounded text-[10px] font-bold text-center border border-orange-100">👴 Rumah ini memiliki Lansia</div>}
                            {mapFilter === 'Balita' && <div className="bg-blue-50 text-blue-800 p-1.5 rounded text-[10px] font-bold text-center border border-blue-100">👶 Rumah ini memiliki Balita</div>}
                            <button onClick={() => { setFormData(head); setCurrentId(head.id); setEditMode(true); setShowModal(true); }} className="mt-2 w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-1 rounded text-xs font-bold transition-colors">Edit Data</button>
                          </div>
                        </Popup>
                      </Marker>
                    )
                  })}
                </MapContainer>
                {mapFilter !== 'Semua' && (<div className="absolute bottom-6 left-6 z-[1000] bg-white/90 backdrop-blur px-4 py-2 rounded-lg shadow-lg border border-orange-200 flex items-center gap-2 text-xs font-bold text-orange-700 animate-in slide-in-from-bottom-2"><Filter size={14}/> Mode Filter: {mapFilter}</div>)}
              </div>
            </div>
          )}

          {/* === KEUANGAN TAB === */}
          {activeTab === 'keuangan' && (
            <div className="animate-in fade-in duration-300 space-y-8">
              <div>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                  <div><h2 className="text-2xl font-bold text-gray-800">Kas RT/RW</h2></div>
                  <div className="bg-white p-4 rounded-xl shadow border border-teal-100 flex items-center gap-4">
                    <div className="p-3 bg-teal-50 rounded-full text-teal-600"><Wallet /></div>
                    <div><p className="text-xs text-gray-500 font-bold uppercase">Saldo</p><p className="text-2xl font-bold text-teal-700">Rp {saldoAkhir.toLocaleString('id-ID')}</p></div>
                  </div>
                </div>
                <div className="flex gap-2 mb-6">
                  <button onClick={() => exportToExcel(transaksiList, 'Laporan_Keuangan_RT')} className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow hover:bg-green-700 cursor-pointer"><FileSpreadsheet size={18} /> Export Excel</button>
                  <button onClick={() => { setEditMode(false); setCurrentId('finance'); setShowModal(true); }} className="bg-teal-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow hover:bg-teal-700 cursor-pointer"><Plus size={18} /> Catat Transaksi</button>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 border-b border-gray-200 uppercase text-xs font-bold text-gray-500">
                      <tr>
                        <th className="p-4">Tanggal</th>
                        <th className="p-4">Keterangan</th>
                        <th className="p-4">Nominal</th>
                        <th className="p-4">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {transaksiList.map((item) => (
                        <tr key={item.id} className="hover:bg-gray-50">
                          <td className="p-4 text-gray-500">{new Date(item.created_at).toLocaleDateString()}</td>
                          <td className="p-4">
                            <div>{item.keterangan}</div>
                            <div className="text-xs text-gray-400">{item.kategori}</div>
                          </td>
                          <td className={`p-4 font-mono font-bold ${item.tipe === 'Pemasukan' ? 'text-green-600' : 'text-red-500'}`}>{item.tipe === 'Pemasukan' ? '+' : '-'} Rp {Number(item.nominal).toLocaleString('id-ID')}</td>
                          <td className="p-4"><button onClick={() => handleDeleteTransaksi(item.id)} className="text-red-400"><Trash2 size={16} /></button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* === PENGUMUMAN TAB === */}
          {activeTab === 'pengumuman' && (
            <div className="animate-in fade-in duration-300">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2"><Megaphone className="text-orange-500" /> Papan Informasi & Agenda</h2>
                <button onClick={() => { setCurrentId('info'); setShowModal(true); }} className="bg-teal-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow hover:bg-teal-700 text-sm font-bold"><Plus size={16}/> Buat Pengumuman</button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {infoList.length === 0 ? (
                  <div className="col-span-3 text-center text-gray-400 py-10">Belum ada pengumuman.</div>
                ) : infoList.map(info => {
                  const offset = new Date().getTimezoneOffset() * 60000;
                  const todayStr = (new Date(Date.now() - offset)).toISOString().slice(0, 10);
                  const isExpired = info.tanggal_kegiatan && info.tanggal_kegiatan < todayStr;
                  return (
                    <div key={info.id} className={`rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col hover:shadow-md transition-shadow ${isExpired ? 'bg-gray-50 opacity-70' : 'bg-white'}`}>
                      <div className={`h-2 w-full ${isExpired ? 'bg-gray-300' : info.kategori === 'Penting' ? 'bg-red-500' : info.kategori === 'Agenda' ? 'bg-teal-500' : 'bg-blue-500'}`}></div>
                      <div className="p-5 flex-1">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex flex-wrap gap-2">
                            <span className={`text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider ${info.kategori === 'Penting' ? 'bg-red-100 text-red-700' : info.kategori === 'Agenda' ? 'bg-teal-100 text-teal-700' : 'bg-blue-100 text-blue-700'}`}>{info.kategori}</span>
                            {isExpired && <span className="text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider bg-gray-200 text-gray-500">KADALUARSA</span>}
                          </div>
                          <button onClick={() => handleDeleteInfo(info.id)} className="text-gray-300 hover:text-red-500"><Trash2 size={16}/></button>
                        </div>
                        <h3 className="font-bold text-lg text-gray-800 mb-2">{info.judul}</h3>
                        <p className="text-gray-600 text-sm whitespace-pre-wrap">{info.isi}</p>
                        {info.tanggal_kegiatan && (
                          <div className={`mt-4 pt-4 border-t border-gray-100 flex items-center gap-2 text-sm ${isExpired ? 'text-red-400 line-through' : 'text-gray-500'}`}>
                            <Calendar size={16}/>{new Date(info.tanggal_kegiatan).toLocaleDateString('id-ID', {weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'})}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* === LAPORAN TAB === */}
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
                      <div className="flex items-center gap-3 mb-1">
                        <span className="px-2 py-0.5 rounded text-xs font-bold bg-red-100 text-red-800 uppercase">{item.jenis_kejadian}</span>
                        <span className="text-xs text-gray-400">{new Date(item.created_at).toLocaleString()}</span>
                      </div>
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

          {/* === SURAT TAB === */}
          {activeTab === 'surat' && (
            <div className="animate-in fade-in duration-300">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Pengajuan Surat</h2>
                <button onClick={loadData} className="text-sm text-teal-600 underline">Refresh</button>
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200 uppercase text-xs font-bold text-gray-500">
                    <tr>
                      <th className="p-4">Tanggal</th>
                      <th className="p-4">Pemohon</th>
                      <th className="p-4">Jenis</th>
                      <th className="p-4">Status</th>
                      <th className="p-4">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {suratList.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="p-4 text-gray-500">{new Date(item.created_at).toLocaleDateString()}</td>
                        <td className="p-4">
                          <div>{item.nama}</div>
                          <div className="text-xs text-gray-500">{item.nik}</div>
                        </td>
                        <td className="p-4">
                          <b>{item.jenis_surat}</b>
                          <p className="text-xs text-gray-600">{item.keperluan}</p>
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-1 rounded text-xs font-bold ${item.status === 'Disetujui' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{item.status}</span>
                        </td>
                        <td className="p-4">
                          {item.status === 'Pending' && (
                            <div className="flex gap-2">
                              <button id={`btn-approve-${item.id}`} onClick={() => handleApproveSurat(item)} className="bg-green-100 text-green-700 p-2 rounded hover:bg-green-200 transition-colors" title="Setujui & Buat PDF"><Check size={16}/></button>
                              <button onClick={() => { if(confirm("Tolak?")) handleStatusSurat(item.id, 'Ditolak'); }} className="bg-red-100 text-red-700 p-2 rounded hover:bg-red-200"><XIcon size={16}/></button>
                            </div>
                          )}
                          {item.status === 'Disetujui' && item.file_url && (<a href={item.file_url} target="_blank" rel="noreferrer" className="text-teal-600 text-xs underline flex items-center gap-1"><FileText size={12}/> Lihat PDF</a>)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* === SETTINGS TAB === */}
          {activeTab === 'settings' && (<div className="p-6 bg-white rounded-xl border border-gray-200"><h2 className="text-xl font-bold">Pengaturan</h2><p className="text-gray-500">Dalam pengembangan.</p></div>)}
        </div>
      </main>

      {/* ==========================================
          MODALS
      ========================================== */}
      
      {/* MODAL EDIT/ADD UMUM (WARGA, INFO, KEUANGAN) */}
      {showModal && currentId !== 'sampah' && ( 
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <div className="bg-white p-6 rounded-2xl w-full max-w-3xl shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-center mb-6 border-b pb-4">
              <h3 className="text-xl font-bold text-gray-800">
                {currentId === 'finance' ? 'Catat Transaksi' : currentId === 'info' ? 'Buat Pengumuman Baru' : (editMode ? 'Edit Data Warga' : 'Tambah Warga')}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-3xl">&times;</button>
            </div>
            <form onSubmit={currentId === 'finance' ? handleFinanceSubmit : currentId === 'info' ? handleInfoSubmit : handleSubmit}>
              
              {/* Form Keuangan */}
              {currentId === 'finance' && ( 
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 border p-3 rounded w-full has-[:checked]:bg-green-50">
                      <input type="radio" name="tipe" value="Pemasukan" checked={financeForm.tipe === 'Pemasukan'} onChange={e => setFinanceForm({...financeForm, tipe: e.target.value})} /> Pemasukan
                    </label>
                    <label className="flex items-center gap-2 border p-3 rounded w-full has-[:checked]:bg-red-50">
                      <input type="radio" name="tipe" value="Pengeluaran" checked={financeForm.tipe === 'Pengeluaran'} onChange={e => setFinanceForm({...financeForm, tipe: e.target.value})} /> Pengeluaran
                    </label>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold uppercase">Kategori</label>
                      <select className="w-full border p-2 rounded mt-1" value={financeForm.kategori} onChange={e => setFinanceForm({...financeForm, kategori: e.target.value})}>
                        <option>Iuran Warga</option><option>Sumbangan</option><option>Lain-lain</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-bold uppercase">Nominal</label>
                      <input type="number" className="w-full border p-2 rounded mt-1" value={financeForm.nominal} onChange={e => setFinanceForm({...financeForm, nominal: e.target.value})} />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase">Keterangan</label>
                    <textarea className="w-full border p-2 rounded mt-1" value={financeForm.keterangan} onChange={e => setFinanceForm({...financeForm, keterangan: e.target.value})}></textarea>
                  </div>
                </div> 
              )}

              {/* Form Info */}
              {currentId === 'info' && ( 
                <div className="space-y-4">
                  <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg text-sm text-blue-800 flex gap-2 items-start">
                    <Megaphone size={18} className="mt-0.5 shrink-0"/>
                    <div><b>Fitur Auto-Broadcast:</b> Cukup isi Judul, Kategori, dan Tanggal. Isi pesan akan dibuat otomatis oleh sistem dan dikirim ke Grup WhatsApp Warga.</div>
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase">Judul Pengumuman</label>
                    <input className="w-full border p-2 rounded mt-1" placeholder="Contoh: Kerja Bakti Minggu Ini" value={infoForm.judul} onChange={e => setInfoForm({...infoForm, judul: e.target.value})} required/>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold uppercase">Kategori</label>
                      <select className="w-full border p-2 rounded mt-1" value={infoForm.kategori} onChange={e => setInfoForm({...infoForm, kategori: e.target.value})}>
                        <option>Info</option><option>Agenda</option><option>Penting</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-bold uppercase">Tanggal Kegiatan (Jika Ada)</label>
                      <input type="date" className="w-full border p-2 rounded mt-1" value={infoForm.tanggal_kegiatan} onChange={e => setInfoForm({...infoForm, tanggal_kegiatan: e.target.value})}/>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-2 p-3 bg-gray-50 rounded border border-gray-200">
                    <input type="checkbox" id="aiBroadcast" className="w-5 h-5 text-teal-600 rounded focus:ring-teal-500" checked={infoForm.useAI} onChange={e => setInfoForm({...infoForm, useAI: e.target.checked})}/>
                    <label htmlFor="aiBroadcast" className="text-sm font-bold text-gray-700 cursor-pointer select-none">Buat isi otomatis (AI) & Kirim ke WhatsApp</label>
                  </div>
                  {!infoForm.useAI && (
                    <div className="animate-in fade-in">
                      <label className="text-xs font-bold uppercase">Isi Manual (Opsional)</label>
                      <textarea rows="5" className="w-full border p-2 rounded mt-1" placeholder="Tulis detail lengkap di sini..." value={infoForm.isi} onChange={e => setInfoForm({...infoForm, isi: e.target.value})}></textarea>
                    </div>
                  )}
                </div> 
              )}

              {/* Form Warga */}
              {currentId !== 'finance' && currentId !== 'info' && ( 
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="md:col-span-2 bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <h4 className="text-sm font-bold text-gray-700 mb-3 uppercase">Data Rumah & KK</h4>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="md:col-span-2">
                        <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1">No. KK</label>
                        <input className="w-full border p-2 rounded mt-1" value={formData.kk} onChange={e => setFormData({...formData, kk: e.target.value})} />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-gray-500 uppercase">No. Rumah</label>
                        <input className="w-full border p-2 rounded mt-1" value={formData.noRumah} onChange={e => setFormData({...formData, noRumah: e.target.value})} />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-xs font-bold text-gray-500 uppercase">RT</label>
                          <select className="w-full border p-2 rounded mt-1" value={formData.rt} onChange={e => setFormData({...formData, rt: e.target.value})}>
                            <option>01</option><option>02</option><option>03</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-xs font-bold text-gray-500 uppercase">RW</label>
                          <input className="w-full border p-2 rounded mt-1" value={formData.rw} onChange={e => setFormData({...formData, rw: e.target.value})} />
                        </div>
                      </div>
                      <div className="md:col-span-4">
                        <label className="text-xs font-bold text-gray-500 uppercase">Alamat</label>
                        <input className="w-full border p-2 rounded mt-1" value={formData.alamat} onChange={e => setFormData({...formData, alamat: e.target.value})} />
                      </div>
                      <div className="md:col-span-4 grid grid-cols-2 gap-4 mt-2">
                        <div>
                          <label className="text-xs font-bold text-teal-600 uppercase flex items-center gap-1"><MapPin size={12}/> Latitude</label>
                          <input className="w-full border border-teal-200 bg-teal-50 p-2 rounded mt-1" placeholder="-6.200000" value={formData.latitude || ''} onChange={e => setFormData({...formData, latitude: e.target.value})} />
                        </div>
                        <div>
                          <label className="text-xs font-bold text-teal-600 uppercase flex items-center gap-1"><MapPin size={12}/> Longitude</label>
                          <input className="w-full border border-teal-200 bg-teal-50 p-2 rounded mt-1" placeholder="106.816666" value={formData.longitude || ''} onChange={e => setFormData({...formData, longitude: e.target.value})} />
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1"><User size={12}/> Nama Lengkap</label>
                      <input className="w-full border p-2 rounded mt-1" value={formData.nama} onChange={e => setFormData({...formData, nama: e.target.value})} />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1"><FileText size={12}/> NIK</label>
                      <input className="w-full border p-2 rounded mt-1" value={formData.nik} onChange={e => setFormData({...formData, nik: e.target.value})} disabled={editMode} />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1"><MapPin size={12}/> Tempat Lahir</label>
                      <input className="w-full border p-2 rounded mt-1" value={formData.tempatLahir} onChange={e => setFormData({...formData, tempatLahir: e.target.value})} />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1"><Calendar size={12}/> Tanggal Lahir</label>
                      <input type="date" className="w-full border p-2 rounded mt-1" value={formData.tanggalLahir} onChange={e => setFormData({...formData, tanggalLahir: e.target.value})} />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1"><BookOpen size={12}/> Agama</label>
                        <select className="w-full border p-2 rounded mt-1" value={formData.agama} onChange={e => setFormData({...formData, agama: e.target.value})}>
                          <option>Islam</option><option>Kristen</option><option>Katolik</option><option>Hindu</option><option>Buddha</option><option>Konghucu</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1"><Heart size={12}/> Gol. Darah</label>
                        <select className="w-full border p-2 rounded mt-1" value={formData.golonganDarah} onChange={e => setFormData({...formData, golonganDarah: e.target.value})}>
                          <option>-</option><option>A</option><option>B</option><option>AB</option><option>O</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1"><Briefcase size={12}/> Pekerjaan</label>
                      <input className="w-full border p-2 rounded mt-1" value={formData.pekerjaan} onChange={e => setFormData({...formData, pekerjaan: e.target.value})} />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1"><Users size={12}/> Status Perkawinan</label>
                      <select className="w-full border p-2 rounded mt-1" value={formData.statusPerkawinan} onChange={e => setFormData({...formData, statusPerkawinan: e.target.value})}>
                        <option>Kawin</option><option>Belum Kawin</option><option>Cerai Hidup</option><option>Cerai Mati</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1"><User size={12}/> Peran Keluarga</label>
                      <select className="w-full border p-2 rounded mt-1" value={formData.peran} onChange={e => setFormData({...formData, peran: e.target.value})}>
                        <option>Kepala Keluarga</option><option>Anggota</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1"><Briefcase size={12}/> No HP</label>
                      <input className="w-full border p-2 rounded mt-1" value={formData.noHp} onChange={e => setFormData({...formData, noHp: e.target.value})} />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1"><Mail size={12}/> Email</label>
                      <input className="w-full border p-2 rounded mt-1" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1"><User size={12}/> Jenis Kelamin</label>
                      <select className="w-full border p-2 rounded mt-1" value={formData.jenisKelamin} onChange={e => setFormData({...formData, jenisKelamin: e.target.value})}>
                        <option>Laki-laki</option><option>Perempuan</option>
                      </select>
                    </div>
                  </div>
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

      {/* MODAL KHUSUS BANK SAMPAH */}
      {showModal && currentId === 'sampah' && (
         <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50 p-4">
            <div className="bg-white p-6 rounded-2xl w-full max-w-md shadow-2xl">
                <div className="flex justify-between items-center mb-6 border-b pb-4">
                    <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2"><Recycle className="text-green-600"/> Setor Sampah</h3>
                    <button onClick={() => setShowModal(false)} className="text-2xl">&times;</button>
                </div>
                <form onSubmit={handleSampahSubmit} className="space-y-4">
                    <div>
                        <label className="text-xs font-bold uppercase text-gray-500">NIK Warga</label>
                        <input className="w-full border p-2 rounded mt-1" placeholder="Scan / Ketik NIK" value={sampahForm.nik} onChange={e => setSampahForm({...sampahForm, nik: e.target.value})} onBlur={handleCariWarga} required />
                    </div>
                    <div>
                        <label className="text-xs font-bold uppercase text-gray-500">Nama Nasabah</label>
                        <input className="w-full border p-2 rounded mt-1 bg-gray-50" placeholder="Otomatis terisi..." value={sampahForm.nama} onChange={e => setSampahForm({...sampahForm, nama: e.target.value})} required />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-bold uppercase text-gray-500">Jenis Sampah</label>
                            <select className="w-full border p-2 rounded mt-1" value={sampahForm.jenis} onChange={handleJenisSampahChange}>
                                {Object.keys(HARGA_SAMPAH).map(k => <option key={k} value={k}>{k}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-bold uppercase text-gray-500">Harga / Kg</label>
                            <input className="w-full border p-2 rounded mt-1 bg-gray-100 text-gray-500 cursor-not-allowed" value={sampahForm.harga} readOnly />
                        </div>
                    </div>
                    <div>
                        <label className="text-xs font-bold uppercase text-gray-500">Berat Timbangan (Kg)</label>
                        <div className="relative">
                            <input type="number" step="0.1" className="w-full border p-2 rounded mt-1 text-lg font-bold pl-10" placeholder="0.0" value={sampahForm.berat} onChange={e => setSampahForm({...sampahForm, berat: e.target.value})} autoFocus required />
                            <Scale className="absolute left-3 top-4 text-gray-400" size={18}/>
                        </div>
                    </div>
                    
                    <div className="bg-green-50 p-3 rounded-lg flex justify-between items-center text-green-800">
                        <span className="text-sm font-medium">Estimasi Pendapatan:</span>
                        <span className="text-xl font-extrabold">Rp {((Number(sampahForm.berat) || 0) * sampahForm.harga).toLocaleString('id-ID')}</span>
                    </div>

                    <button type="submit" disabled={loading} className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl shadow-lg transition-colors">
                        {loading ? 'Menyimpan...' : 'Simpan Setoran'}
                    </button>
                </form>
            </div>
         </div>
      )}

      {/* MODAL DETAIL KK */}
      {showDetailModal && selectedFamilyHead && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 relative">
            <button onClick={() => setShowDetailModal(false)} className="absolute top-4 right-4 bg-gray-100 hover:bg-gray-200 rounded-full p-1 text-gray-600 transition-colors">
              <XIcon size={20}/>
            </button>
            <div className="bg-teal-600 p-6 text-white">
              <h3 className="text-xl font-bold flex items-center gap-2"><FileText/> Detail Kartu Keluarga</h3>
              <p className="opacity-80 mt-1 font-mono">No. KK: {selectedFamilyHead.kk}</p>
            </div>
            <div className="p-6 md:p-8 space-y-6">
              <div>
                <h4 className="text-sm font-bold text-gray-500 uppercase mb-3 flex items-center gap-2"><Home size={16}/> Alamat Lengkap</h4>
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 text-gray-800">
                  <p className="font-bold text-lg">{selectedFamilyHead.alamat}</p>
                  <p className="mt-1">Nomor Rumah: <b>{selectedFamilyHead.noRumah}</b></p>
                  <p>RT <b>{selectedFamilyHead.rt}</b> / RW <b>{selectedFamilyHead.rw}</b></p>
                  <p className="text-gray-500 text-sm mt-2">Kelurahan Sukamaju, Kecamatan Sukajaya, Jakarta Selatan</p>
                </div>
              </div>
              <div>
                <h4 className="text-sm font-bold text-gray-500 uppercase mb-3 flex items-center gap-2"><FileText size={16}/> Foto Fisik KK</h4>
                <div className="bg-gray-100 rounded-lg border border-gray-200 overflow-hidden flex items-center justify-center min-h-[200px]">
                  {selectedFamilyHead.foto_kk_url ? (
                    <img src={selectedFamilyHead.foto_kk_url} alt="Foto KK" className="w-full h-auto object-contain hover:scale-105 transition-transform cursor-zoom-in" onClick={() => window.open(selectedFamilyHead.foto_kk_url, '_blank')} />
                  ) : (
                    <div className="text-gray-400 flex flex-col items-center gap-2"><FileText size={40} className="opacity-50"/><p>Foto fisik KK belum diunggah.</p></div>
                  )}
                </div>
                {selectedFamilyHead.foto_kk_url && <p className="text-center text-xs text-gray-500 mt-2">Klik gambar untuk memperbesar.</p>}
              </div>
            </div>
            <div className="bg-gray-50 p-4 text-right border-t border-gray-100">
              <button onClick={() => setShowDetailModal(false)} className="px-5 py-2.5 bg-gray-200 text-gray-700 rounded-lg font-bold hover:bg-gray-300 transition-colors">Tutup</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}