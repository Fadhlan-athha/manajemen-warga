import React, { useState } from 'react';
import { AlertTriangle, X, Flame, ShieldAlert, Ambulance, AlertCircle, MapPin, Loader2 } from 'lucide-react';
import { dbHelper } from '../utils/db';

export default function PanicButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [locLoading, setLocLoading] = useState(false); // Loading khusus lokasi
  const [success, setSuccess] = useState(false);
  
  const [form, setForm] = useState({
    pelapor_nama: '',
    lokasi: '',
    jenis_kejadian: '',
    deskripsi: ''
  });

  // --- FUNGSI AMBIL LOKASI GPS ---
  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      alert("Browser Anda tidak mendukung fitur lokasi otomatis.");
      return;
    }

    setLocLoading(true);
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        // Format link Google Maps agar Admin bisa langsung klik & navigasi
        const gmapsLink = `https://www.google.com/maps?q=${latitude},${longitude}`;
        
        setForm(prev => ({ 
            ...prev, 
            lokasi: `📍 Lokasi GPS Terkini: ${gmapsLink}` 
        }));
        setLocLoading(false);
      },
      (error) => {
        console.error(error);
        alert("Gagal mengambil lokasi. Pastikan GPS aktif dan izin lokasi diberikan.");
        setLocLoading(false);
      },
      { enableHighAccuracy: true } // Minta akurasi tinggi (GPS)
    );
  };

  const handleLapor = async (jenis) => {
    if (!form.lokasi) {
      alert("Mohon isi lokasi kejadian (No. Rumah/Blok) atau gunakan tombol 'Ambil Lokasi'!");
      return;
    }
    
    if (confirm(`Yakin ingin melaporkan ${jenis}? Laporan akan masuk ke Admin & Keamanan.`)) {
      setLoading(true);
      try {
        await dbHelper.addLaporan({
          ...form,
          jenis_kejadian: jenis
        });
        setSuccess(true);
        setTimeout(() => {
            setSuccess(false);
            setIsOpen(false);
            setForm({ pelapor_nama: '', lokasi: '', jenis_kejadian: '', deskripsi: '' });
        }, 3000);
      } catch (err) {
        alert("Gagal mengirim laporan: " + err.message);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <>
      {/* TOMBOL MENGAMBANG UTAMA */}
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 bg-red-600 hover:bg-red-700 text-white p-4 rounded-full shadow-2xl animate-bounce border-4 border-red-200 transition-all shadow-red-900/50"
        title="Lapor Darurat"
      >
        <AlertTriangle size={32} />
      </button>

      {/* MODAL PELAPORAN */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-2xl overflow-hidden shadow-2xl relative">
            
            {/* Header */}
            <div className="bg-red-600 p-4 text-white flex justify-between items-center shadow-md relative z-10">
               <h3 className="font-bold text-lg flex items-center gap-2">
                 <AlertTriangle className="animate-pulse"/> SOS / DARURAT
               </h3>
               <button onClick={() => setIsOpen(false)} className="text-white/80 hover:text-white bg-red-700/50 rounded-full p-1"><X size={20}/></button>
            </div>

            {success ? (
               <div className="p-8 text-center bg-white">
                  <div className="bg-green-100 text-green-600 p-4 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-4 animate-bounce">
                    <ShieldAlert size={48} />
                  </div>
                  <h4 className="text-2xl font-bold text-gray-800">Laporan Terkirim!</h4>
                  <p className="text-gray-500 mt-2">Bantuan akan segera datang ke lokasi Anda.</p>
               </div>
            ) : (
               <div className="p-6 space-y-5 bg-white">
                  <div className="bg-red-50 border-l-4 border-red-500 p-3 text-xs text-red-800 rounded-r">
                    <b>PENTING:</b> Gunakan fitur ini hanya untuk keadaan mendesak yang mengancam keselamatan.
                  </div>

                  {/* INPUT LOKASI DENGAN TOMBOL GPS */}
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Lokasi Kejadian (Wajib)</label>
                    <div className="relative flex gap-2">
                        <input 
                          className="flex-1 border-2 border-red-100 bg-red-50/30 p-3 rounded-lg focus:border-red-500 focus:outline-none font-bold text-gray-700 text-sm"
                          placeholder="Blok / No. Rumah / Patokan..."
                          value={form.lokasi}
                          onChange={e => setForm({...form, lokasi: e.target.value})}
                        />
                        <button 
                            type="button"
                            onClick={handleGetLocation}
                            disabled={locLoading}
                            className="bg-red-100 text-red-600 px-3 rounded-lg font-bold text-xs flex flex-col items-center justify-center hover:bg-red-200 transition-colors border border-red-200 min-w-[70px]"
                        >
                            {locLoading ? <Loader2 size={18} className="animate-spin"/> : <MapPin size={18}/>}
                            <span className="mt-0.5">{locLoading ? 'Mencari' : 'Lokasi Saya'}</span>
                        </button>
                    </div>
                    <p className="text-[10px] text-gray-400 mt-1">*Klik tombol pin untuk ambil lokasi GPS otomatis.</p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nama Pelapor (Opsional)</label>
                    <input 
                      className="w-full border border-gray-200 p-3 rounded-lg focus:ring-2 focus:ring-red-200 outline-none text-sm"
                      placeholder="Nama Anda (Boleh dikosongkan)"
                      value={form.pelapor_nama}
                      onChange={e => setForm({...form, pelapor_nama: e.target.value})}
                    />
                  </div>

                  <div>
                    <p className="text-center font-bold text-gray-700 pt-2 mb-3 text-sm uppercase tracking-wide">Pilih Jenis Bantuan:</p>
                    <div className="grid grid-cols-2 gap-3">
                       <ReportBtn 
                          label="KEBAKARAN" 
                          icon={<Flame size={28}/>} 
                          color="bg-orange-500 hover:bg-orange-600 shadow-orange-200" 
                          onClick={() => handleLapor('Kebakaran')} 
                          disabled={loading}
                       />
                       <ReportBtn 
                          label="MALING / KRIMINAL" 
                          icon={<ShieldAlert size={28}/>} 
                          color="bg-gray-800 hover:bg-gray-900 shadow-gray-300" 
                          onClick={() => handleLapor('Maling')} 
                          disabled={loading}
                       />
                       <ReportBtn 
                          label="MEDIS / SAKIT" 
                          icon={<Ambulance size={28}/>} 
                          color="bg-green-600 hover:bg-green-700 shadow-green-200" 
                          onClick={() => handleLapor('Medis')} 
                          disabled={loading}
                       />
                       <ReportBtn 
                          label="DARURAT LAIN" 
                          icon={<AlertCircle size={28}/>} 
                          color="bg-blue-600 hover:bg-blue-700 shadow-blue-200" 
                          onClick={() => handleLapor('Lainnya')} 
                          disabled={loading}
                       />
                    </div>
                  </div>
               </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

function ReportBtn({ label, icon, color, onClick, disabled }) {
  return (
    <button 
      onClick={onClick}
      disabled={disabled}
      className={`${color} text-white p-5 rounded-xl flex flex-col items-center justify-center gap-2 transition-all active:scale-95 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed`}
    >
      {icon}
      <span className="font-bold text-xs tracking-wider">{label}</span>
    </button>
  );
}