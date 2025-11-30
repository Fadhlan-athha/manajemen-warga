import React, { useState, useEffect } from 'react';
import { dbHelper } from '../utils/db.js';
import { 
  Send, CheckCircle, Plus, Trash2, UploadCloud, User, FileText, ArrowRight, 
  Briefcase, Calendar, Heart, MapPin, BookOpen, Users, Phone, Mail, UserCheck, 
  AlertCircle, Megaphone, XCircle, Recycle // <--- Pastikan Recycle ada di sini
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function PublicForm() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState({});
  const [announcements, setAnnouncements] = useState([]); 

  // --- STATE STATUS DUPLIKAT ---
  const [duplicateStatus, setDuplicateStatus] = useState({
    kk: false,
    members: {} // format: { 0: false, 1: true }
  });

  const [household, setHousehold] = useState({
    kk: '', noRumah: '', rt: '01', rw: '03', alamat: '', status: 'Tetap', fotoFile: null
  });

  const [members, setMembers] = useState([
    { 
      nama: '', nik: '', email: '', noHp: '', 
      jenisKelamin: 'Laki-laki', peran: 'Kepala Keluarga',
      tempatLahir: '', tanggalLahir: '', agama: 'Islam',
      pekerjaan: '', statusPerkawinan: 'Kawin', golonganDarah: '-'
    }
  ]);

  // --- FUNGSI CEK KETERSEDIAAN DATA (REAL-TIME) ---
  const checkAvailability = async (type, value, index = null) => {
    if (!value || value.length < 16) return; 

    try {
        let isDuplicate = false;
        
        if (type === 'kk') {
            isDuplicate = await dbHelper.checkDuplicate('kk', value);
            setDuplicateStatus(prev => ({ ...prev, kk: isDuplicate }));
        } 
        else if (type === 'nik') {
            isDuplicate = await dbHelper.checkDuplicate('nik', value);
            setDuplicateStatus(prev => ({
                ...prev,
                members: { ...prev.members, [index]: isDuplicate }
            }));
        }
    } catch (err) {
        console.error("Gagal cek duplikasi:", err);
    }
  };

  useEffect(() => {
    const fetchInfo = async () => {
        try {
            const data = await dbHelper.getPengumuman();
            const offset = new Date().getTimezoneOffset() * 60000;
            const todayStr = (new Date(Date.now() - offset)).toISOString().slice(0, 10);

            const activeData = (data || []).filter(item => {
                if (!item.tanggal_kegiatan) return true;
                return item.tanggal_kegiatan >= todayStr;
            });

            setAnnouncements(activeData);
        } catch (err) { console.error("Gagal load info", err); }
    };
    fetchInfo();
  }, []);

  const handleHouseholdChange = (e) => {
    setHousehold({ ...household, [e.target.name]: e.target.value });
    if (errors[e.target.name]) setErrors({ ...errors, [e.target.name]: null });
  };

  const handleFileChange = (e) => {
    setHousehold({ ...household, fotoFile: e.target.files[0] });
    if (errors.fotoFile) setErrors({ ...errors, fotoFile: null });
  };

  const handleMemberChange = (index, field, value) => {
    const updatedMembers = [...members];
    updatedMembers[index][field] = value;
    setMembers(updatedMembers);
    const errorKey = `member_${index}_${field}`;
    if (errors[errorKey]) setErrors({ ...errors, [errorKey]: null });
  };

  const addMember = () => setMembers([...members, { 
    nama: '', nik: '', email: '', noHp: '', 
    jenisKelamin: 'Laki-laki', peran: 'Anggota',
    tempatLahir: '', tanggalLahir: '', agama: 'Islam',
    pekerjaan: '', statusPerkawinan: 'Belum Kawin', golonganDarah: '-'
  }]);
  
  const removeMember = (index) => {
    if (members.length > 1) {
      const updatedMembers = [...members];
      updatedMembers.splice(index, 1);
      setMembers(updatedMembers);
    }
  };

  const validateForm = () => {
      const newErrors = {};
      if (!household.kk) newErrors.kk = "No. KK wajib diisi";
      if (household.kk && household.kk.length !== 16) newErrors.kk = "No. KK harus 16 digit";
      if (!household.noRumah) newErrors.noRumah = "Nomor rumah wajib diisi";
      if (!household.alamat) newErrors.alamat = "Alamat lengkap wajib diisi";
      if (!household.fotoFile) newErrors.fotoFile = "Foto fisik KK wajib diupload";

      members.forEach((member, index) => {
          if (!member.nama) newErrors[`member_${index}_nama`] = "Nama lengkap wajib diisi";
          if (!member.nik) newErrors[`member_${index}_nik`] = "NIK wajib diisi";
          if (member.nik && member.nik.length !== 16) newErrors[`member_${index}_nik`] = "NIK harus 16 digit";
          if (!member.tempatLahir) newErrors[`member_${index}_tempatLahir`] = "Tempat lahir wajib diisi";
          if (!member.tanggalLahir) newErrors[`member_${index}_tanggalLahir`] = "Tanggal lahir wajib diisi";
          if (!member.pekerjaan) newErrors[`member_${index}_pekerjaan`] = "Pekerjaan wajib diisi";
          if (!member.noHp && index === 0) newErrors[`member_${0}_noHp`] = "Kepala Keluarga wajib mengisi No HP";
      });
      return newErrors;
  };

  const handleSubmit = async (e, isUpdateMode = false) => {
    if (e) e.preventDefault();

    // 1. CEK DUPLIKASI (Hanya jika BUKAN mode update)
    if (!isUpdateMode) {
        const isKKDuplicate = duplicateStatus.kk;
        const isAnyNIKDuplicate = Object.values(duplicateStatus.members).some(val => val === true);

        if (isKKDuplicate || isAnyNIKDuplicate) {
            alert("Data duplikat terdeteksi! Gunakan tombol Update jika ingin menimpa data lama.");
            return;
        }
    }

    const formErrors = validateForm();
    if (Object.keys(formErrors).length > 0) {
        setErrors(formErrors);
        alert("Mohon periksa kembali formulir Anda.");
        window.scrollTo(0, 0);
        return;
    }

    setLoading(true);
    try {
      let fotoUrl = null;
      if (household.fotoFile) {
        fotoUrl = await dbHelper.uploadKK(household.fotoFile, household.kk);
      }
      
      const householdDataFinal = { ...household, fotoUrl };
      await dbHelper.addFamily(members, householdDataFinal);
      setSuccess(true);
    } catch (err) {
      alert("Terjadi Kesalahan: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const ErrorMsg = ({ msg }) => msg ? <p className="text-red-500 text-xs mt-1 flex items-center gap-1 animate-pulse"><AlertCircle size={12}/> {msg}</p> : null;

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-xl shadow-lg text-center max-w-md w-full animate-in zoom-in">
          <div className="bg-green-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800">Data Keluarga Tersimpan!</h2>
          <p className="text-gray-600 mt-2">Terima kasih sudah melakukan sensus mandiri.</p>
          <button onClick={() => window.location.reload()} className="mt-6 w-full bg-teal-600 text-white py-3 rounded-lg font-bold">Kembali ke Menu</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <div 
        className="relative bg-teal-900 text-white py-18 px-6 text-center bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('https://pbs.twimg.com/profile_images/378800000199005433/fb1918a600afc788d2a76ca2f9d7005c.jpeg')" }}
      >
         <div className="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>
         <div className="relative z-10">
            <h1 className="text-4xl font-extrabold mb-4 tracking-tight drop-shadow-md">Portal Warga Digital</h1>
            <p className="text-teal-100 mb-10 text-lg font-light">Sistem Pelayanan & Data Warga Terpadu</p>
            
            {/* --- NAVIGATION BUTTONS --- */}
            <div className="flex flex-col sm:flex-row justify-center gap-4 max-w-4xl mx-auto">
                <Link to="/surat" className="bg-white/90 backdrop-blur text-teal-900 px-6 py-4 rounded-xl font-bold flex items-center justify-center gap-3 shadow-xl hover:bg-white transition-all transform hover:-translate-y-1 hover:scale-105">
                    <FileText size={24} className="text-teal-700" /> Layanan Surat Pengantar <ArrowRight size={18} className="text-gray-400" />
                </Link>
                <Link to="/transparansi" className="bg-teal-600/90 backdrop-blur text-white px-6 py-4 rounded-xl font-bold flex items-center justify-center gap-3 shadow-xl border border-teal-500 hover:bg-teal-600 transition-all transform hover:-translate-y-1 hover:scale-105">
                    <span>💰 Cek Kas RT</span>
                </Link>
                
                {/* TOMBOL BANK SAMPAH (BARU) */}
                <Link to="/banksampah" className="bg-green-600/90 backdrop-blur text-white px-6 py-4 rounded-xl font-bold flex items-center justify-center gap-3 shadow-xl border border-green-500 hover:bg-green-500 transition-all transform hover:-translate-y-1 hover:scale-105">
                    <Recycle size={20} /> <span>Bank Sampah</span>
                </Link>
            </div>
         </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 pb-20 relative z-20 -mt-8">
        
        {/* SECTION PENGUMUMAN OTOMATIS */}
        {announcements.length > 0 && (
            <div className="mb-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {announcements.slice(0, 3).map(info => (
                    <div key={info.id} className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden flex flex-col transform hover:-translate-y-1 transition-all">
                        <div className={`h-1.5 w-full ${info.kategori === 'Penting' ? 'bg-red-500' : info.kategori === 'Agenda' ? 'bg-teal-500' : 'bg-blue-500'}`}></div>
                        <div className="p-4 flex-1">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider mb-2 inline-block ${info.kategori === 'Penting' ? 'bg-red-50 text-red-600' : info.kategori === 'Agenda' ? 'bg-teal-50 text-teal-600' : 'bg-blue-50 text-blue-600'}`}>
                                📢 {info.kategori}
                            </span>
                            <h3 className="font-bold text-gray-800 text-sm mb-1">{info.judul}</h3>
                            <p className="text-gray-600 text-xs line-clamp-3">{info.isi}</p>
                            {info.tanggal_kegiatan && (
                                <div className="mt-3 pt-3 border-t border-gray-50 flex items-center gap-1 text-xs text-gray-400 font-medium">
                                    <Calendar size={12}/> {new Date(info.tanggal_kegiatan).toLocaleDateString('id-ID', {day: 'numeric', month: 'short', year: 'numeric'})}
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        )}

        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100">
            <div className="bg-gray-50 p-4 border-b border-gray-100 text-center">
               <h3 className="font-bold text-gray-500 uppercase text-xs tracking-wider">Formulir Sensus Warga</h3>
            </div>

            <form onSubmit={(e) => handleSubmit(e, false)} className="p-6 md:p-8 space-y-8" noValidate>
            
            {/* DATA RUMAH */}
            <div className="bg-teal-50/50 p-6 rounded-xl border border-teal-100 relative">
                {Object.keys(errors).some(k => !k.startsWith('member')) && <div className="absolute top-4 right-4 text-red-500 text-xs font-bold flex items-center gap-1"><AlertCircle size={14}/> Data Rumah Belum Lengkap</div>}
                <h3 className="text-xl font-bold text-teal-800 mb-4 flex items-center gap-2"><UploadCloud size={20}/> Data Kartu Keluarga & Rumah</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                    <div className="md:col-span-2">
                        <label className="label">No. Kartu Keluarga (KK) *</label>
                        <div className="relative">
                            <input 
                                className={`input-field ${errors.kk || duplicateStatus.kk ? 'border-red-500 bg-red-50' : ''}`} 
                                name="kk" 
                                value={household.kk} 
                                onChange={handleHouseholdChange} 
                                onBlur={(e) => checkAvailability('kk', e.target.value)}
                                placeholder="16 Digit No. KK" 
                                type="number" 
                            />
                        </div>
                        {duplicateStatus.kk && (
                            <p className="text-red-600 text-xs mt-1 font-bold animate-pulse flex items-center gap-1">
                                <XCircle size={12}/> Nomor KK ini sudah terdaftar!
                            </p>
                        )}
                        <ErrorMsg msg={errors.kk} />
                    </div>
                    <div>
                        <label className="label">Nomor Rumah *</label>
                        <input className={`input-field ${errors.noRumah ? 'border-red-500 bg-red-50' : 'bg-yellow-50 border-yellow-300 focus:border-yellow-500'}`} name="noRumah" value={household.noRumah} onChange={handleHouseholdChange} placeholder="Contoh: A-210" />
                        <ErrorMsg msg={errors.noRumah} />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <label className="label">RT</label>
                            <select className="input-field" name="rt" value={household.rt} onChange={handleHouseholdChange}>
                                <option value="01">01</option><option value="02">02</option><option value="03">03</option>
                            </select>
                        </div>
                        <div>
                            <label className="label">RW</label>
                            <input className="input-field" name="rw" value={household.rw} onChange={handleHouseholdChange} placeholder="Contoh: 03" />
                        </div>
                    </div>
                    <div className="md:col-span-3">
                        <label className="label">Alamat Lengkap *</label>
                        <input className={`input-field ${errors.alamat ? 'border-red-500 bg-red-50' : ''}`} name="alamat" value={household.alamat} onChange={handleHouseholdChange} placeholder="Nama Jalan, Gang, Blok..." />
                        <ErrorMsg msg={errors.alamat} />
                    </div>
                    <div>
                        <label className="label">Foto Fisik KK *</label>
                        <input type="file" accept="image/*" onChange={handleFileChange} className={`block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold ${errors.fotoFile ? 'file:bg-red-100 file:text-red-700' : 'file:bg-teal-100 file:text-teal-700 hover:file:bg-teal-200'} cursor-pointer`}/>
                        <ErrorMsg msg={errors.fotoFile} />
                    </div>
                </div>
            </div>

            {/* DATA ANGGOTA KELUARGA */}
            <div>
                <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2"><User size={20}/> Anggota Keluarga</h3>
                <div className="space-y-6">
                {members.map((member, index) => (
                    <div key={index} className={`p-6 rounded-xl border ${Object.keys(errors).some(k => k.startsWith(`member_${index}`)) ? 'border-red-300 bg-red-50/30' : 'border-gray-200 bg-white'} shadow-sm relative group hover:border-teal-400 transition-all`}>
                        <div className="absolute -left-3 top-6 bg-teal-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold shadow ring-4 ring-white">{index + 1}</div>
                        {members.length > 1 && (
                            <button type="button" onClick={() => removeMember(index)} className="absolute top-4 right-4 text-gray-300 hover:text-red-500 transition-colors"><Trash2 size={20} /></button>
                        )}
                        
                        {Object.keys(errors).some(k => k.startsWith(`member_${index}`)) && <div className="mb-4 text-red-500 text-xs font-bold flex items-center gap-1 ml-4"><AlertCircle size={14}/> Lengkapi data anggota ini</div>}

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 pl-4">
                            <div className="lg:col-span-2">
                                <label className="label flex items-center gap-1"><User size={12}/> Nama Lengkap *</label>
                                <input className={`input-field font-bold ${errors[`member_${index}_nama`] ? 'border-red-500 bg-red-50' : ''}`} value={member.nama} onChange={(e) => handleMemberChange(index, 'nama', e.target.value)} placeholder="Sesuai KTP" />
                                <ErrorMsg msg={errors[`member_${index}_nama`]} />
                            </div>
                            <div className="lg:col-span-2">
                                <label className="label flex items-center gap-1"><FileText size={12}/> NIK *</label>
                                <div className="relative">
                                    <input 
                                        type="number" 
                                        className={`input-field font-mono ${errors[`member_${index}_nik`] || duplicateStatus.members[index] ? 'border-red-500 bg-red-50' : ''}`} 
                                        value={member.nik} 
                                        onChange={(e) => handleMemberChange(index, 'nik', e.target.value)} 
                                        onBlur={(e) => checkAvailability('nik', e.target.value, index)}
                                        placeholder="16 Digit Angka" 
                                    />
                                </div>
                                {duplicateStatus.members[index] && (
                                    <p className="text-red-600 text-xs mt-1 font-bold animate-pulse flex items-center gap-1">
                                        <XCircle size={12}/> NIK ini sudah terdaftar!
                                    </p>
                                )}
                                <ErrorMsg msg={errors[`member_${index}_nik`]} />
                            </div>
                            <div>
                                <label className="label flex items-center gap-1"><MapPin size={12}/> Tempat Lahir *</label>
                                <input className={`input-field ${errors[`member_${index}_tempatLahir`] ? 'border-red-500 bg-red-50' : ''}`} value={member.tempatLahir} onChange={(e) => handleMemberChange(index, 'tempatLahir', e.target.value)} placeholder="Kota Kelahiran" />
                                <ErrorMsg msg={errors[`member_${index}_tempatLahir`]} />
                            </div>
                            <div>
                                <label className="label flex items-center gap-1"><Calendar size={12}/> Tanggal Lahir *</label>
                                <input type="date" className={`input-field ${errors[`member_${index}_tanggalLahir`] ? 'border-red-500 bg-red-50' : ''}`} value={member.tanggalLahir} onChange={(e) => handleMemberChange(index, 'tanggalLahir', e.target.value)} />
                                <ErrorMsg msg={errors[`member_${index}_tanggalLahir`]} />
                            </div>
                             <div>
                                <label className="label flex items-center gap-1"><BookOpen size={12}/> Agama</label>
                                <select className="input-field" value={member.agama} onChange={(e) => handleMemberChange(index, 'agama', e.target.value)}>
                                    <option>Islam</option><option>Kristen</option><option>Katolik</option><option>Hindu</option><option>Buddha</option><option>Konghucu</option>
                                </select>
                            </div>
                            <div>
                                <label className="label flex items-center gap-1"><Heart size={12}/> Gol. Darah</label>
                                <select className="input-field" value={member.golonganDarah} onChange={(e) => handleMemberChange(index, 'golonganDarah', e.target.value)}>
                                    <option>-</option><option>A</option><option>B</option><option>AB</option><option>O</option>
                                </select>
                            </div>
                             <div>
                                <label className="label flex items-center gap-1"><Users size={12}/> Status Perkawinan</label>
                                <select className="input-field" value={member.statusPerkawinan} onChange={(e) => handleMemberChange(index, 'statusPerkawinan', e.target.value)}>
                                    <option>Belum Kawin</option><option>Kawin</option><option>Cerai Hidup</option><option>Cerai Mati</option>
                                </select>
                            </div>
                            <div className="lg:col-span-2">
                                <label className="label flex items-center gap-1"><Briefcase size={12}/> Pekerjaan *</label>
                                <input className={`input-field ${errors[`member_${index}_pekerjaan`] ? 'border-red-500 bg-red-50' : ''}`} value={member.pekerjaan} onChange={(e) => handleMemberChange(index, 'pekerjaan', e.target.value)} placeholder="Contoh: Karyawan Swasta / Pelajar" />
                                <ErrorMsg msg={errors[`member_${index}_pekerjaan`]} />
                            </div>
                            <div>
                                <label className="label flex items-center gap-1"><UserCheck size={12}/> Peran Keluarga</label>
                                <select className="input-field bg-blue-50 text-blue-800 font-bold" value={member.peran} onChange={(e) => handleMemberChange(index, 'peran', e.target.value)}>
                                <option>Kepala Keluarga</option><option>Istri</option><option>Anak</option><option>Famili Lain</option>
                                </select>
                            </div>
                            <div>
                                <label className="label flex items-center gap-1"><Phone size={12}/> No. HP (WA) {index === 0 && '*'}</label>
                                <input className={`input-field ${errors[`member_${index}_noHp`] ? 'border-red-500 bg-red-50' : ''}`} value={member.noHp} onChange={(e) => handleMemberChange(index, 'noHp', e.target.value)} placeholder="08..." />
                                <ErrorMsg msg={errors[`member_${index}_noHp`]} />
                            </div>
                            <div className="lg:col-span-2">
                                <label className="label flex items-center gap-1"><Mail size={12}/> Email</label>
                                <input type="email" className="input-field" value={member.email} onChange={(e) => handleMemberChange(index, 'email', e.target.value)} placeholder="email@contoh.com" />
                            </div>
                             <div>
                                <label className="label flex items-center gap-1"><User size={12}/> Jenis Kelamin</label>
                                <select className="input-field" value={member.jenisKelamin} onChange={(e) => handleMemberChange(index, 'jenisKelamin', e.target.value)}>
                                <option>Laki-laki</option><option>Perempuan</option>
                                </select>
                            </div>
                        </div>
                    </div>
                ))}
                </div>
                <button type="button" onClick={addMember} className="mt-6 flex items-center gap-2 text-teal-700 font-bold hover:bg-teal-50 px-6 py-4 rounded-xl transition-colors border-2 border-teal-100 border-dashed w-full justify-center hover:border-teal-300">
                    <Plus size={20} /> Tambah Anggota Keluarga Lain
                </button>
            </div>

            {/* --- BAGIAN TOMBOL KIRIM / UPDATE YANG DINAMIS --- */}
            <div className="pt-6 border-t border-gray-100">
                {Object.values(duplicateStatus.members).some(v => v) || duplicateStatus.kk ? (
                    // KONDISI JIKA ADA DUPLIKAT -> TOMBOL UPDATE
                    <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-200 text-center animate-in slide-in-from-bottom-2">
                        <div className="flex items-center justify-center gap-2 text-yellow-800 font-bold mb-2">
                            <AlertCircle size={24} />
                            <span>Data Sudah Terdaftar!</span>
                        </div>
                        <p className="text-sm text-yellow-700 mb-4">
                            NIK atau No. KK yang Anda masukkan sudah ada di sistem. <br/>
                            Apakah Anda ingin memperbarui (menimpa) data lama dengan data baru ini?
                        </p>
                        
                        <div className="flex gap-3 justify-center">
                            <button 
                                type="button" 
                                onClick={(e) => handleSubmit(e, true)} // True = Force Update
                                disabled={loading} 
                                className="w-full md:w-auto px-8 bg-yellow-600 text-white font-bold py-3 rounded-xl hover:bg-yellow-700 transition-all shadow-lg flex justify-center items-center gap-2"
                            >
                                {loading ? 'Memproses Update...' : <><CheckCircle size={20} /> Ya, Update Data Ini</>}
                            </button>
                        </div>
                    </div>
                ) : (
                    // KONDISI NORMAL -> TOMBOL KIRIM
                    <button 
                        type="submit" 
                        disabled={loading} 
                        className="w-full bg-teal-800 text-white font-bold py-4 rounded-xl hover:bg-teal-900 transition-all shadow-lg shadow-teal-900/20 flex justify-center items-center gap-2 transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Sedang Memvalidasi & Menyimpan...' : <><Send size={20} /> Kirim Data Sensus</>}
                    </button>
                )}

                {Object.keys(errors).length > 0 && (
                    <p className="text-red-500 text-center mt-4 font-bold flex items-center justify-center gap-2">
                        <AlertCircle/> Terdapat data yang belum diisi di atas.
                    </p>
                )}
            </div>
            </form>
            
            <div className="bg-gray-50 p-4 text-center text-sm text-gray-500">
            <Link to="/admin" className="hover:text-teal-700 font-medium">Login Admin</Link>
            </div>
        </div>
      </div>
      
      <style>{`
        .label { display: flex; align-items: center; font-size: 0.70rem; font-weight: 700; color: #6b7280; margin-bottom: 0.35rem; text-transform: uppercase; letter-spacing: 0.05em; }
        .input-field { width: 100%; padding: 0.75rem; border: 1px solid #e5e7eb; border-radius: 0.5rem; outline: none; transition: all 0.2s; font-size: 0.95rem; }
        .input-field:focus { border-color: #0d9488; box-shadow: 0 0 0 4px rgba(20, 184, 166, 0.1); }
      `}</style>
    </div>
  );
}