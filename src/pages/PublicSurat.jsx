import React, { useState } from 'react';
import { FileText, Send, Search, CheckCircle, Clock, XCircle, ArrowLeft } from 'lucide-react';
// PERBAIKAN: Menambahkan ekstensi .js agar resolusi modul lebih pasti
import { dbHelper } from '../utils/db.js'; 
import { Link } from 'react-router-dom';

export default function PublicSurat() {
  const [activeTab, setActiveTab] = useState('buat'); // 'buat' or 'cek'
  const [loading, setLoading] = useState(false);
  
  // State baru untuk fitur pencarian nama otomatis
  const [loadingNama, setLoadingNama] = useState(false); 
  
  const [cekNIK, setCekNIK] = useState('');
  const [riwayatSurat, setRiwayatSurat] = useState([]);
  const [searched, setSearched] = useState(false);

  // Form Request
  const [form, setForm] = useState({
    nik: '', nama: '', jenis_surat: 'Pengantar KTP', keperluan: ''
  });

  // --- LOGIKA BARU: Cek NIK Otomatis saat mengetik ---
  const checkNamaByNIK = async (nikInput) => {
    // Hanya cek jika panjang NIK 16 digit
    if (nikInput.length === 16) {
        setLoadingNama(true);
        // Kosongkan nama dulu agar terlihat efek "sedang mencari"
        setForm(prev => ({ ...prev, nama: '' }));

        try {
            // FAKE DELAY: Tahan selama 1.5 detik agar loading terlihat jelas
            await new Promise(resolve => setTimeout(resolve, 1500));

            const warga = await dbHelper.getWargaByNIK(nikInput);
            if (warga) {
                // Jika ketemu, isi nama otomatis
                setForm(prev => ({ ...prev, nama: warga.nama }));
            }
        } catch (err) {
            console.error("Gagal cari NIK:", err);
        } finally {
            setLoadingNama(false);
        }
    }
  };

  // Handler yang diupdate
  const handleNikChange = (e) => {
      const val = e.target.value;
      // Update state form
      setForm(prev => ({ ...prev, nik: val }));
      
      // Trigger pencarian jika sudah 16 digit
      if (val.length === 16) {
          checkNamaByNIK(val);
      }
  };
  // ----------------------------------------------------

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
        await dbHelper.addSurat(form);
        alert("Pengajuan surat berhasil dikirim! Silakan cek status secara berkala.");
        setForm({ nik: '', nama: '', jenis_surat: 'Pengantar KTP', keperluan: '' });
        setActiveTab('cek'); 
        setCekNIK(form.nik); 
    } catch (err) {
        alert("Gagal: " + err.message);
    } finally {
        setLoading(false);
    }
  };

  const handleCekSurat = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSearched(true);
    try {
        const data = await dbHelper.getSuratByNIK(cekNIK);
        setRiwayatSurat(data || []);
    } catch (err) {
        alert("Gagal memuat data: " + err.message);
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans pb-20">
      {/* Header */}
      <div className="bg-teal-800 text-white p-6 pb-20">
        <div className="max-w-2xl mx-auto">
           <Link to="/" className="inline-flex items-center gap-2 text-teal-200 hover:text-white mb-4 transition-colors"><ArrowLeft size={16}/> Kembali</Link>
           <h1 className="text-3xl font-bold flex items-center gap-3"><FileText /> Layanan Surat</h1>
           <p className="text-teal-200 mt-2">Buat pengantar RT secara online tanpa harus ketemu langsung.</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 -mt-12 relative z-10">
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
            {/* Tabs */}
            <div className="flex border-b border-gray-100">
                <button onClick={() => setActiveTab('buat')} className={`flex-1 py-4 font-bold text-center transition-colors ${activeTab === 'buat' ? 'text-teal-600 border-b-2 border-teal-600 bg-teal-50' : 'text-gray-500 hover:bg-gray-50'}`}>
                    Buat Pengajuan Baru
                </button>
                <button onClick={() => setActiveTab('cek')} className={`flex-1 py-4 font-bold text-center transition-colors ${activeTab === 'cek' ? 'text-teal-600 border-b-2 border-teal-600 bg-teal-50' : 'text-gray-500 hover:bg-gray-50'}`}>
                    Cek Status Surat
                </button>
            </div>

            <div className="p-6">
                {activeTab === 'buat' ? (
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="bg-blue-50 text-blue-700 p-3 rounded-lg text-sm mb-4">
                            💡 Masukkan NIK yang terdaftar. Nama akan terisi otomatis jika data warga sudah ada.
                        </div>
                        
                        {/* INPUT NIK DENGAN HANDLER BARU */}
                        <div>
                            <label className="label block text-xs font-bold text-gray-500 uppercase mb-1">NIK Pemohon</label>
                            <div className="relative">
                                <input 
                                    className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none" 
                                    required 
                                    placeholder="16 digit angka" 
                                    value={form.nik} 
                                    onChange={handleNikChange} // <-- Panggil handler baru
                                    type="number"
                                />
                                {loadingNama && (
                                    <span className="absolute right-9 top-3 text-xm text-teal-900 font-bold animate-pulse">
                                        Mencari...
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* INPUT NAMA DENGAN EFEK LOADING */}
                        <div>
                            <label className="label block text-xs font-bold text-gray-500 uppercase mb-1">Nama Lengkap</label>
                            <input 
                                className={`w-full border border-gray-300 p-3 rounded-lg transition-colors duration-300 ${loadingNama ? 'bg-gray-100 text-gray-400' : 'bg-white text-gray-900'}`} 
                                required 
                                placeholder={loadingNama ? "Sedang mengambil data..." : "Nama sesuai KTP"} 
                                value={form.nama} 
                                onChange={e => setForm({...form, nama: e.target.value})} 
                                disabled={loadingNama} // Disable input saat loading
                            />
                            <p className="text-[10px] text-gray-400 mt-1">*Akan terisi otomatis jika NIK ditemukan.</p>
                        </div>

                        <div>
                            <label className="label block text-xs font-bold text-gray-500 uppercase mb-1">Jenis Surat</label>
                            <select className="w-full border border-gray-300 p-3 rounded-lg bg-white" value={form.jenis_surat} onChange={e => setForm({...form, jenis_surat: e.target.value})}>
                                <option>Pengantar KTP</option>
                                <option>Pengantar KK</option>
                                <option>Surat Keterangan Domisili</option>
                                <option>Surat Keterangan Tidak Mampu (SKTM)</option>
                                <option>Surat Pengantar SKCK</option>
                                <option>Surat Keterangan Kematian</option>
                                <option>Surat Izin Keramaian</option>
                                <option>Lainnya</option>
                            </select>
                        </div>
                        <div>
                            <label className="label block text-xs font-bold text-gray-500 uppercase mb-1">Keperluan Detail</label>
                            <textarea className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none" rows="3" required placeholder="Contoh: Untuk persyaratan mendaftar sekolah anak" value={form.keperluan} onChange={e => setForm({...form, keperluan: e.target.value})}></textarea>
                        </div>
                        <button disabled={loading} className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 rounded-lg shadow-lg transition-all flex justify-center items-center gap-2">
                            {loading ? 'Mengirim...' : <><Send size={18}/> Kirim Pengajuan</>}
                        </button>
                    </form>
                ) : (
                    <div className="space-y-6">
                        <form onSubmit={handleCekSurat} className="flex gap-2">
                            <input className="flex-1 border border-gray-300 p-3 rounded-lg outline-none focus:border-teal-500" placeholder="Masukkan NIK Anda..." value={cekNIK} onChange={e => setCekNIK(e.target.value)} required />
                            <button type="submit" className="bg-teal-600 text-white px-6 rounded-lg font-bold hover:bg-teal-700"><Search /></button>
                        </form>

                        {searched && (
                            <div className="space-y-3">
                                {riwayatSurat.length === 0 ? (
                                    <div className="text-center text-gray-500 py-8">Belum ada pengajuan surat untuk NIK ini.</div>
                                ) : (
                                    riwayatSurat.map(item => (
                                        <div key={item.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                                            <div className="flex justify-between items-start mb-2">
                                                <div>
                                                    <h4 className="font-bold text-gray-800">{item.jenis_surat}</h4>
                                                    <p className="text-xs text-gray-500">{new Date(item.created_at).toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric'})}</p>
                                                </div>
                                                <BadgeStatus status={item.status} />
                                            </div>
                                            <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded mb-2">"{item.keperluan}"</p>
                                            {item.status === 'Disetujui' && (
                                                <div className="bg-green-50 text-green-800 text-sm p-4 rounded-lg border border-green-200 mt-3 animate-in fade-in">
                                                    <div className="flex items-start gap-3">
                                                        <CheckCircle className="mt-1 shrink-0" size={18} />
                                                        <div className="flex-1">
                                                            <p className="font-bold mb-1">Pengajuan Disetujui!</p>
                                                            <p className="mb-3 text-green-700/80">Nomor Surat: <span className="font-mono font-bold">{item.nomor_surat}</span></p>
                                                            
                                                            {/* Tombol Download PDF */}
                                                            {item.file_url ? (
                                                                <a 
                                                                    href={item.file_url} 
                                                                    target="_blank" 
                                                                    rel="noopener noreferrer"
                                                                    className="inline-flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg font-bold shadow-sm hover:bg-green-700 transition-colors text-xs sm:text-sm"
                                                                >
                                                                    <FileText size={16} /> Download Surat Pengantar (PDF)
                                                                </a>
                                                            ) : (
                                                                <p className="text-xs text-red-500 italic">*File PDF belum tersedia, hubungi RT.</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
}

function BadgeStatus({ status }) {
    if (status === 'Disetujui') return <span className="flex items-center gap-1 bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-bold"><CheckCircle size={12}/> Disetujui</span>;
    if (status === 'Ditolak') return <span className="flex items-center gap-1 bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-bold"><XCircle size={12}/> Ditolak</span>;
    return <span className="flex items-center gap-1 bg-yellow-100 text-yellow-700 px-2 py-1 rounded text-xs font-bold"><Clock size={12}/> Pending</span>;
}