import React, { useState } from 'react';
import { dbHelper } from '../utils/db';
import { Send, CheckCircle, Plus, Trash2, UploadCloud, User } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function PublicForm() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // State 1: Data Rumah / KK (Berlaku untuk semua anggota)
  const [household, setHousehold] = useState({
    kk: '', noRumah: '', rt: '01', alamat: '', status: 'Tetap', fotoFile: null
  });

  // State 2: Daftar Anggota Keluarga
  const [members, setMembers] = useState([
    { nama: '', nik: '', email: '', noHp: '', jenisKelamin: 'Laki-laki', peran: 'Kepala Keluarga' }
  ]);

  // Handler Data Rumah
  const handleHouseholdChange = (e) => {
    setHousehold({ ...household, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    setHousehold({ ...household, fotoFile: e.target.files[0] });
  };

  // Handler Anggota Keluarga Dinamis
  const handleMemberChange = (index, field, value) => {
    const updatedMembers = [...members];
    updatedMembers[index][field] = value;
    setMembers(updatedMembers);
  };

  const addMember = () => {
    setMembers([...members, { nama: '', nik: '', email: '', noHp: '', jenisKelamin: 'Laki-laki', peran: 'Anggota' }]);
  };

  const removeMember = (index) => {
    if (members.length > 1) {
      const updatedMembers = [...members];
      updatedMembers.splice(index, 1);
      setMembers(updatedMembers);
    }
  };

  // SUBMIT
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // 1. Upload Foto KK dulu (jika ada)
      let fotoUrl = null;
      if (household.fotoFile) {
        fotoUrl = await dbHelper.uploadKK(household.fotoFile, household.kk || 'unknown');
      }

      // 2. Simpan Data Keluarga ke Database
      const householdDataFinal = { ...household, fotoUrl };
      await dbHelper.addFamily(members, householdDataFinal);

      setSuccess(true);
      // Reset form (opsional, atau biarkan user melihat sukses screen)
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-xl shadow-lg text-center max-w-md w-full animate-in zoom-in">
          <div className="bg-green-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800">Data Keluarga Tersimpan!</h2>
          <p className="text-gray-600 mt-2">Data No. Rumah <b>{household.noRumah}</b> berhasil diperbarui.</p>
          <button onClick={() => window.location.reload()} className="mt-6 w-full bg-teal-600 text-white py-3 rounded-lg font-bold">Isi Data Baru</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-10 px-4 font-sans">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
        <div className="bg-teal-800 p-8 text-white relative">
           <h1 className="text-3xl font-bold relative z-10">Formulir Sensus Warga</h1>
           <p className="text-teal-200 mt-2 relative z-10">Update Data Keluarga & Nomor Rumah.</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-8">
          
          {/* --- BAGIAN 1: DATA RUMAH (KK) --- */}
          <div className="bg-teal-50 p-6 rounded-xl border border-teal-100">
            <h3 className="text-xl font-bold text-teal-800 mb-4 flex items-center gap-2"><UploadCloud size={20}/> Data Kartu Keluarga & Rumah</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
               <div>
                  <label className="label">Nomor Kartu Keluarga (KK)</label>
                  <input className="input-field" name="kk" value={household.kk} onChange={handleHouseholdChange} required placeholder="16 Digit No. KK" />
               </div>
               <div>
                  <label className="label">Nomor Rumah</label>
                  <input className="input-field bg-yellow-50 border-yellow-300" name="noRumah" value={household.noRumah} onChange={handleHouseholdChange} required placeholder="Contoh: A-210" />
               </div>
               <div>
                  <label className="label">RT</label>
                  <select className="input-field" name="rt" value={household.rt} onChange={handleHouseholdChange}>
                    <option value="01">RT 01</option><option value="02">RT 02</option><option value="03">RT 03</option>
                  </select>
               </div>
               <div className="md:col-span-2">
                  <label className="label">Alamat Lengkap</label>
                  <input className="input-field" name="alamat" value={household.alamat} onChange={handleHouseholdChange} required placeholder="Nama Jalan, Blok..." />
               </div>
               <div>
                  <label className="label">Foto Fisik KK</label>
                  <input type="file" accept="image/*" onChange={handleFileChange} className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100"/>
               </div>
            </div>
          </div>

          {/* --- BAGIAN 2: ANGGOTA KELUARGA (LOOPING) --- */}
          <div>
            <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2"><User size={20}/> Anggota Keluarga</h3>
            
            <div className="space-y-4">
              {members.map((member, index) => (
                <div key={index} className="p-5 rounded-xl border border-gray-200 bg-white shadow-sm relative group hover:border-teal-300 transition-all">
                   <div className="absolute -left-3 top-5 bg-teal-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shadow">
                     {index + 1}
                   </div>
                   
                   {/* Tombol Hapus Anggota */}
                   {members.length > 1 && (
                     <button type="button" onClick={() => removeMember(index)} className="absolute top-4 right-4 text-gray-300 hover:text-red-500">
                       <Trash2 size={20} />
                     </button>
                   )}

                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pl-4">
                      <div className="lg:col-span-1">
                        <label className="label">Nama Lengkap</label>
                        <input className="input-field" value={member.nama} onChange={(e) => handleMemberChange(index, 'nama', e.target.value)} required placeholder="Sesuai KTP" />
                      </div>
                      <div>
                        <label className="label">NIK</label>
                        <input type="number" className="input-field" value={member.nik} onChange={(e) => handleMemberChange(index, 'nik', e.target.value)} required placeholder="16 Digit" />
                      </div>
                      <div>
                        <label className="label">Peran Keluarga</label>
                        <select className="input-field bg-gray-50" value={member.peran} onChange={(e) => handleMemberChange(index, 'peran', e.target.value)}>
                           <option value="Kepala Keluarga">Kepala Keluarga</option>
                           <option value="Istri">Istri</option>
                           <option value="Anak">Anak</option>
                           <option value="Famili Lain">Famili Lain</option>
                        </select>
                      </div>
                      <div>
                        <label className="label">Email</label>
                        <input type="email" className="input-field" value={member.email} onChange={(e) => handleMemberChange(index, 'email', e.target.value)} placeholder="email@contoh.com" />
                      </div>
                      <div>
                        <label className="label">No. HP</label>
                        <input className="input-field" value={member.noHp} onChange={(e) => handleMemberChange(index, 'noHp', e.target.value)} placeholder="08..." />
                      </div>
                      <div>
                        <label className="label">Jenis Kelamin</label>
                        <select className="input-field" value={member.jenisKelamin} onChange={(e) => handleMemberChange(index, 'jenisKelamin', e.target.value)}>
                           <option value="Laki-laki">Laki-laki</option>
                           <option value="Perempuan">Perempuan</option>
                        </select>
                      </div>
                   </div>
                </div>
              ))}
            </div>

            <button type="button" onClick={addMember} className="mt-4 flex items-center gap-2 text-teal-700 font-bold hover:bg-teal-50 px-4 py-2 rounded-lg transition-colors border border-teal-200 border-dashed w-full justify-center">
               <Plus size={20} /> Tambah Anggota Keluarga Lain
            </button>
          </div>

          <div className="pt-6 border-t border-gray-100">
             <button type="submit" disabled={loading} className="w-full bg-teal-800 text-white font-bold py-4 rounded-xl hover:bg-teal-900 transition-all shadow-lg flex justify-center items-center gap-2">
                {loading ? 'Sedang Menyimpan...' : <><Send size={20} /> Kirim Data Keluarga</>}
             </button>
          </div>
        </form>
        
        <div className="bg-gray-50 p-4 text-center text-sm text-gray-500">
           <Link to="/admin" className="hover:text-teal-700">Login Admin</Link>
        </div>
      </div>
      
      {/* CSS Helper dalam file yang sama (atau bisa di index.css) */}
      <style>{`
        .label { display: block; font-size: 0.75rem; font-weight: 600; color: #4b5563; margin-bottom: 0.25rem; text-transform: uppercase; letter-spacing: 0.05em; }
        .input-field { width: 100%; padding: 0.75rem; border: 1px solid #d1d5db; border-radius: 0.5rem; outline: none; transition: all; }
        .input-field:focus { border-color: #0f766e; box-shadow: 0 0 0 3px rgba(20, 184, 166, 0.2); }
      `}</style>
    </div>
  );
}