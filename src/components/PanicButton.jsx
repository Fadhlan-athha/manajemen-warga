import React, { useState } from 'react';
import { AlertTriangle, X, Flame, ShieldAlert, Ambulance, AlertCircle } from 'lucide-react';
import { dbHelper } from '../utils/db';

export default function PanicButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const [form, setForm] = useState({
    pelapor_nama: '',
    lokasi: '',
    jenis_kejadian: '',
    deskripsi: ''
  });

  const handleLapor = async (jenis) => {
    if (!form.lokasi) {
      alert("Mohon isi lokasi kejadian (No. Rumah/Blok) terlebih dahulu!");
      return;
    }
    
    if (confirm(`Yakin ingin melaporkan ${jenis}? Laporan akan masuk ke Admin.`)) {
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
        className="fixed bottom-6 right-6 z-50 bg-red-600 hover:bg-red-700 text-white p-4 rounded-full shadow-2xl animate-bounce border-4 border-red-200 transition-all"
        title="Lapor Darurat"
      >
        <AlertTriangle size={32} />
      </button>

      {/* MODAL PELAPORAN */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-2xl overflow-hidden shadow-2xl relative">
            
            {/* Header */}
            <div className="bg-red-600 p-4 text-white flex justify-between items-center">
               <h3 className="font-bold text-lg flex items-center gap-2">
                 <AlertTriangle /> PELAPORAN DARURAT
               </h3>
               <button onClick={() => setIsOpen(false)} className="text-white/80 hover:text-white"><X size={24}/></button>
            </div>

            {success ? (
               <div className="p-8 text-center">
                  <div className="bg-green-100 text-green-600 p-4 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                    <ShieldAlert size={40} />
                  </div>
                  <h4 className="text-xl font-bold text-gray-800">Laporan Terkirim!</h4>
                  <p className="text-gray-500 mt-2">Petugas/RT telah menerima notifikasi.</p>
               </div>
            ) : (
               <div className="p-6 space-y-4">
                  <div className="bg-red-50 border border-red-100 p-3 rounded text-xs text-red-800 mb-2">
                    Gunakan fitur ini hanya untuk keadaan mendesak. Laporan palsu tidak akan ditindak.
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Lokasi Kejadian (Wajib)</label>
                    <input 
                      className="w-full border-2 border-red-100 p-3 rounded-lg focus:border-red-500 focus:outline-none font-bold"
                      placeholder="Contoh: Blok C No. 12"
                      value={form.lokasi}
                      onChange={e => setForm({...form, lokasi: e.target.value})}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nama Pelapor (Opsional)</label>
                    <input 
                      className="w-full border border-gray-200 p-2 rounded-lg"
                      placeholder="Nama Anda"
                      value={form.pelapor_nama}
                      onChange={e => setForm({...form, pelapor_nama: e.target.value})}
                    />
                  </div>

                  <p className="text-center font-bold text-gray-700 pt-2">Pilih Jenis Kejadian:</p>
                  
                  <div className="grid grid-cols-2 gap-3">
                     <ReportBtn 
                        label="KEBAKARAN" 
                        icon={<Flame size={24}/>} 
                        color="bg-orange-500 hover:bg-orange-600" 
                        onClick={() => handleLapor('Kebakaran')} 
                        disabled={loading}
                     />
                     <ReportBtn 
                        label="MALING / KRIMINAL" 
                        icon={<ShieldAlert size={24}/>} 
                        color="bg-gray-800 hover:bg-gray-900" 
                        onClick={() => handleLapor('Maling')} 
                        disabled={loading}
                     />
                     <ReportBtn 
                        label="MEDIS / SAKIT" 
                        icon={<Ambulance size={24}/>} 
                        color="bg-green-600 hover:bg-green-700" 
                        onClick={() => handleLapor('Medis')} 
                        disabled={loading}
                     />
                     <ReportBtn 
                        label="LAINNYA" 
                        icon={<AlertCircle size={24}/>} 
                        color="bg-blue-600 hover:bg-blue-700" 
                        onClick={() => handleLapor('Lainnya')} 
                        disabled={loading}
                     />
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
      className={`${color} text-white p-4 rounded-xl flex flex-col items-center justify-center gap-2 transition-transform active:scale-95 shadow-md`}
    >
      {icon}
      <span className="font-bold text-xs">{label}</span>
    </button>
  );
}