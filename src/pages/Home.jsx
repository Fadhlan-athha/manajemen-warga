import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Users, FileText, Wallet, Recycle, ArrowRight, 
  MapPin, ShieldCheck, ChevronRight, LogIn, 
  Building2, Trees, Activity, HeartHandshake, Star,
  Megaphone, CalendarRange, UserPlus, Heart
} from 'lucide-react';

export default function Home() {
  const [scrolled, setScrolled] = useState(false);

  // Efek untuk mengubah style navbar saat di-scroll
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="font-sans text-slate-800 bg-slate-50 min-h-screen">
      
      {/* --- 1. NAVBAR (Sticky & Glassmorphic) --- */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrolled ? 'bg-white/90 backdrop-blur-md shadow-md py-2' : 'bg-transparent py-4'}`}>
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl transition-colors ${scrolled ? 'bg-teal-600 text-white' : 'bg-white text-teal-800'}`}>
              <Building2 size={24} />
            </div>
            <div className={`leading-tight ${scrolled ? 'text-slate-800' : 'text-white'}`}>
              <h1 className="text-xl font-extrabold tracking-tight">Grand Residence</h1>
              <p className="text-[10px] font-bold tracking-widest uppercase opacity-80">RT 01 / RW 03 Jatimakmur</p>
            </div>
          </div>
          {/* Tombol Login Pengurus tetap ada di sini */}
          <Link to="/admin" className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-bold text-sm transition-all shadow-lg ${scrolled ? 'bg-slate-900 text-white hover:bg-slate-700' : 'bg-white text-teal-900 hover:bg-teal-50'}`}>
            <LogIn size={16} /> Portal Pengurus
          </Link>
        </div>
      </nav>

      {/* --- 2. HERO SECTION --- */}
      <header className="relative h-[85vh] flex items-center justify-center overflow-hidden">
        {/* Background Image Parallax */}
        <div className="absolute inset-0 z-0">
          <img 
            src="https://pbs.twimg.com/profile_images/378800000199005433/fb1918a600afc788d2a76ca2f9d7005c.jpeg" 
            alt="Perumahan Mewah" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-slate-900/70 via-slate-900/50 to-slate-50"></div>
        </div>

        <div className="relative z-10 text-center max-w-4xl px-4 mt-16 animate-in fade-in slide-in-from-bottom-10 duration-1000">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur border border-white/20 text-teal-100 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest mb-6">
            <Star size={12} className="text-yellow-400 fill-yellow-400"/> Lingkungan Asri & Aman
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold text-white mb-6 leading-tight drop-shadow-2xl">
            Hunian Nyaman <br/> 
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-200 to-emerald-400">Keluarga Bahagia</span>
          </h1>
          <p className="text-lg md:text-xl text-slate-200 mb-10 leading-relaxed font-light">
            Selamat datang di Portal Digital RT 01/03. Mewujudkan tata kelola lingkungan yang transparan, modern, dan guyub rukun.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link to="/sensus" className="bg-teal-500 hover:bg-teal-400 text-white px-8 py-4 rounded-xl font-bold text-lg shadow-xl shadow-teal-900/30 transition-transform transform hover:-translate-y-1 flex items-center justify-center gap-2">
              <Users size={20}/> Update Data Warga
            </Link>
            <a href="#layanan" className="bg-white hover:bg-slate-100 text-slate-800 px-8 py-4 rounded-xl font-bold text-lg shadow-xl transition-transform transform hover:-translate-y-1 flex items-center justify-center gap-2">
              Layanan Digital <ArrowRight size={20}/>
            </a>
          </div>
        </div>
      </header>

      {/* --- 3. STATISTIK SINGKAT --- */}
      <section className="relative z-20 -mt-20 max-w-6xl mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 bg-white rounded-2xl shadow-xl border border-slate-100 divide-x divide-slate-100 overflow-hidden">
          {[
            { label: 'Kepala Keluarga', val: '120+', icon: <Users className="text-blue-500" /> },
            { label: 'Total Warga', val: '450+', icon: <Activity className="text-teal-500" /> },
            { label: 'Luas Area', val: '2.5 Ha', icon: <MapPin className="text-orange-500" /> },
            { label: 'Fasilitas Umum', val: '8', icon: <Trees className="text-green-500" /> },
          ].map((stat, idx) => (
            <div key={idx} className="p-6 text-center hover:bg-slate-50 transition-colors group">
              <div className="flex justify-center mb-2 transform group-hover:scale-110 transition-transform">{stat.icon}</div>
              <h3 className="text-2xl font-extrabold text-slate-800">{stat.val}</h3>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* --- 4. TENTANG KAMI --- */}
      <section className="py-20 max-w-6xl mx-auto px-4">
        <div className="flex flex-col md:flex-row gap-12 items-center">
          <div className="flex-1 relative">
            <div className="absolute top-4 -left-4 w-full h-full bg-teal-100 rounded-3xl -z-10"></div>
            <img 
              src="https://images.unsplash.com/photo-1560518883-ce09059eeffa?q=80&w=2873&auto=format&fit=crop" 
              alt="Kegiatan Warga" 
              className="rounded-3xl shadow-2xl border-4 border-white w-full object-cover h-80 md:h-[400px]"
            />
            <div className="absolute -bottom-6 -right-6 bg-white p-4 rounded-xl shadow-xl flex items-center gap-3 animate-bounce-slow">
              <div className="bg-orange-100 p-2 rounded-full"><HeartHandshake className="text-orange-600"/></div>
              <div>
                <p className="text-xs text-slate-500 font-bold uppercase">Moto Kami</p>
                <p className="font-bold text-slate-800">Guyub Rukun Santoso</p>
              </div>
            </div>
          </div>
          <div className="flex-1 space-y-6">
            <h2 className="text-sm font-bold text-teal-600 uppercase tracking-widest flex items-center gap-2">
              <span className="w-8 h-[2px] bg-teal-600"></span> Profil Lingkungan
            </h2>
            <h3 className="text-3xl md:text-4xl font-extrabold text-slate-800 leading-tight">
              Menciptakan Lingkungan yang <span className="text-teal-600">Harmonis & Modern</span>
            </h3>
            <p className="text-slate-600 leading-relaxed">
              RT 01 / RW 03 Jatimakmur adalah kawasan hunian yang mengedepankan keamanan, kebersihan, dan kerukunan antar warga. Dengan dukungan teknologi, kami mempermudah setiap urusan administratif agar warga dapat hidup lebih nyaman.
            </p>
            <ul className="space-y-3 pt-2">
              {['Keamanan 24 Jam CCTV', 'Pengelolaan Sampah Terpadu', 'Taman Bermain Ramah Anak'].map((item, i) => (
                <li key={i} className="flex items-center gap-3 font-medium text-slate-700">
                  <div className="bg-green-100 text-green-600 p-1 rounded-full"><ShieldCheck size={14}/></div>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* --- 5. LAYANAN DIGITAL (Fitur Utama - 4 Grid) --- */}
      <section id="layanan" className="py-20 bg-slate-900 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 p-10 opacity-10"><Building2 size={300}/></div>
        
        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold mb-4">Pusat Layanan Warga</h2>
            <p className="text-slate-400">Akses semua kebutuhan administrasi dan informasi lingkungan dalam satu genggaman.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Card 1: Sensus */}
            <Link to="/sensus" className="group bg-slate-800 p-8 rounded-3xl border border-slate-700 hover:border-teal-500 hover:bg-slate-750 transition-all duration-300 flex flex-col justify-between h-full">
              <div>
                <div className="w-14 h-14 bg-teal-500/20 rounded-2xl flex items-center justify-center text-teal-400 mb-6 group-hover:bg-teal-500 group-hover:text-white transition-colors">
                  <Users size={28} />
                </div>
                <h3 className="text-xl font-bold mb-2">Sensus Digital</h3>
                <p className="text-slate-400 text-sm mb-6">Update data KK dan anggota keluarga secara mandiri untuk database lingkungan.</p>
              </div>
              <span className="text-teal-400 text-sm font-bold flex items-center gap-2 group-hover:gap-3 transition-all">Isi Data <ArrowRight size={16}/></span>
            </Link>

            {/* Card 2: Surat */}
            <Link to="/surat" className="group bg-slate-800 p-8 rounded-3xl border border-slate-700 hover:border-blue-500 hover:bg-slate-750 transition-all duration-300 flex flex-col justify-between h-full">
              <div>
                <div className="w-14 h-14 bg-blue-500/20 rounded-2xl flex items-center justify-center text-blue-400 mb-6 group-hover:bg-blue-500 group-hover:text-white transition-colors">
                  <FileText size={28} />
                </div>
                <h3 className="text-xl font-bold mb-2">Layanan Surat</h3>
                <p className="text-slate-400 text-sm mb-6">Buat surat pengantar RT/RW dari rumah tanpa perlu antri bertemu pengurus.</p>
              </div>
              <span className="text-blue-400 text-sm font-bold flex items-center gap-2 group-hover:gap-3 transition-all">Buat Surat <ArrowRight size={16}/></span>
            </Link>

            {/* Card 3: Keuangan */}
            <Link to="/transparansi" className="group bg-slate-800 p-8 rounded-3xl border border-slate-700 hover:border-purple-500 hover:bg-slate-750 transition-all duration-300 flex flex-col justify-between h-full">
              <div>
                <div className="w-14 h-14 bg-purple-500/20 rounded-2xl flex items-center justify-center text-purple-400 mb-6 group-hover:bg-purple-500 group-hover:text-white transition-colors">
                  <Wallet size={28} />
                </div>
                <h3 className="text-xl font-bold mb-2">Transparansi Kas</h3>
                <p className="text-slate-400 text-sm mb-6">Pantau laporan keuangan, pemasukan iuran, dan pengeluaran RT secara terbuka.</p>
              </div>
              <span className="text-purple-400 text-sm font-bold flex items-center gap-2 group-hover:gap-3 transition-all">Cek Laporan <ArrowRight size={16}/></span>
            </Link>

            {/* Card 4: Bank Sampah */}
            <Link to="/banksampah" className="group bg-slate-800 p-8 rounded-3xl border border-slate-700 hover:border-green-500 hover:bg-slate-750 transition-all duration-300 flex flex-col justify-between h-full">
              <div>
                <div className="w-14 h-14 bg-green-500/20 rounded-2xl flex items-center justify-center text-green-400 mb-6 group-hover:bg-green-500 group-hover:text-white transition-colors">
                  <Recycle size={28} />
                </div>
                <h3 className="text-xl font-bold mb-2">Bank Sampah</h3>
                <p className="text-slate-400 text-sm mb-6">Ubah sampah jadi rupiah. Cek saldo tabungan hasil setoran sampah anorganik.</p>
              </div>
              <span className="text-green-400 text-sm font-bold flex items-center gap-2 group-hover:gap-3 transition-all">Lihat Saldo <ArrowRight size={16}/></span>
            </Link>
          </div>
        </div>
      </section>

      {/* --- 6. ORGANISASI & KEGIATAN (Info Baru) --- */}
      <section className="py-20 bg-white max-w-7xl mx-auto px-4">
         <div className="text-center mb-16">
            <h2 className="text-sm font-bold text-teal-600 uppercase tracking-widest mb-2">Dinamika Warga</h2>
            <h3 className="text-3xl font-extrabold text-slate-800">Komunitas & Kegiatan</h3>
            <p className="text-slate-500 mt-3 max-w-2xl mx-auto">
                Berbagai organisasi dan jadwal rutin yang menghidupkan suasana kekeluargaan di Grand Residence.
            </p>
         </div>

         <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Card 1: Karang Taruna */}
            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 hover:shadow-xl transition-all duration-300 group">
                <div className="h-48 rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 mb-6 flex flex-col items-center justify-center text-white relative overflow-hidden">
                    <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1529156069898-49953e39b3ac?q=80&w=2832&auto=format&fit=crop')] bg-cover bg-center opacity-30 mix-blend-overlay"></div>
                    <UserPlus size={48} className="mb-2"/>
                    <h4 className="font-bold text-xl relative z-10">Karang Taruna</h4>
                    <p className="text-blue-100 text-sm relative z-10">"Tunas Muda Berkarya"</p>
                </div>
                <h4 className="text-xl font-bold text-slate-800 mb-2">Pemuda & Olahraga</h4>
                <p className="text-slate-500 text-sm mb-4 leading-relaxed">
                    Wadah kreativitas remaja RT 01. Aktif dalam kegiatan olahraga (Futsal/Badminton), kesenian, dan panitia 17 Agustusan.
                </p>
                <div className="flex items-center gap-2 text-sm font-bold text-blue-600">
                    <CalendarRange size={16}/> Jadwal: Sabtu Sore & Minggu
                </div>
            </div>

            {/* Card 2: PKK */}
            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 hover:shadow-xl transition-all duration-300 group">
                <div className="h-48 rounded-xl bg-gradient-to-br from-pink-400 to-rose-600 mb-6 flex flex-col items-center justify-center text-white relative overflow-hidden">
                    <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1528605248644-14dd04022da1?q=80&w=2940&auto=format&fit=crop')] bg-cover bg-center opacity-30 mix-blend-overlay"></div>
                    <Heart size={48} className="mb-2"/>
                    <h4 className="font-bold text-xl relative z-10">PKK & Dasawisma</h4>
                    <p className="text-pink-100 text-sm relative z-10">"Wanita Berdaya, Keluarga Sejahtera"</p>
                </div>
                <h4 className="text-xl font-bold text-slate-800 mb-2">Pemberdayaan Wanita</h4>
                <p className="text-slate-500 text-sm mb-4 leading-relaxed">
                    Fokus pada kesehatan ibu & anak (Posyandu), keterampilan tangan, arisan bulanan, dan program apotek hidup.
                </p>
                <div className="flex items-center gap-2 text-sm font-bold text-pink-600">
                    <CalendarRange size={16}/> Jadwal: Minggu Ke-2 Bulan Ini
                </div>
            </div>

            {/* Card 3: Keamanan */}
            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 hover:shadow-xl transition-all duration-300 group">
                <div className="h-48 rounded-xl bg-gradient-to-br from-slate-600 to-slate-800 mb-6 flex flex-col items-center justify-center text-white relative overflow-hidden">
                    <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1555436169-20e93ea9a7ff?q=80&w=2940&auto=format&fit=crop')] bg-cover bg-center opacity-30 mix-blend-overlay"></div>
                    <Megaphone size={48} className="mb-2"/>
                    <h4 className="font-bold text-xl relative z-10">Info Warga</h4>
                    <p className="text-slate-300 text-sm relative z-10">Jadwal & Pengumuman</p>
                </div>
                <h4 className="text-xl font-bold text-slate-800 mb-2">Jadwal Keamanan</h4>
                <ul className="text-slate-500 text-sm mb-4 space-y-2">
                    <li className="flex justify-between border-b border-slate-200 pb-1"><span>Ronda Malam:</span> <span className="font-bold text-slate-700">Setiap Hari (Shift)</span></li>
                    <li className="flex justify-between border-b border-slate-200 pb-1"><span>Pengambilan Sampah:</span> <span className="font-bold text-slate-700">Senin & Kamis</span></li>
                    <li className="flex justify-between border-b border-slate-200 pb-1"><span>Kerja Bakti:</span> <span className="font-bold text-slate-700">Sebulan Sekali</span></li>
                </ul>
            </div>
         </div>
      </section>

      {/* --- 7. FASILITAS LINGKUNGAN --- */}
      <section className="py-20 max-w-7xl mx-auto px-4 border-t border-slate-200">
        <div className="text-center mb-12">
          <h2 className="text-sm font-bold text-teal-600 uppercase tracking-widest mb-2">Fasilitas Kami</h2>
          <h3 className="text-3xl font-extrabold text-slate-800">Sarana Penunjang Warga</h3>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { title: "Masjid Al-Ikhlas", img: "https://images.unsplash.com/photo-1564123512399-633005a74962?q=80&w=2787&auto=format&fit=crop" },
            { title: "Taman Bermain", img: "https://images.unsplash.com/photo-1559157506-6df7e3372f7c?q=80&w=2940&auto=format&fit=crop" },
            { title: "Lapangan Olahraga", img: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=2940&auto=format&fit=crop" },
            { title: "Pos Keamanan", img: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?q=80&w=2940&auto=format&fit=crop" }
          ].map((item, idx) => (
            <div key={idx} className="group relative rounded-2xl overflow-hidden h-64 shadow-lg cursor-pointer">
              <img src={item.img} alt={item.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"/>
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-6">
                <h4 className="text-white font-bold text-lg">{item.title}</h4>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* --- 8. FOOTER --- */}
      <footer className="bg-white border-t border-slate-200 pt-16 pb-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
            <div>
              <div className="flex items-center gap-2 mb-4 text-teal-800 font-extrabold text-2xl">
                <Building2 /> Grand Residence
              </div>
              <p className="text-slate-500 text-sm leading-relaxed">
                Platform digital resmi untuk warga RT 01 / RW 03 Kelurahan Jatimakmur. Membangun lingkungan yang cerdas dan transparan.
              </p>
            </div>
            <div>
              <h4 className="font-bold text-slate-800 mb-4">Akses Cepat</h4>
              <ul className="space-y-2 text-sm text-slate-500">
                <li><Link to="/sensus" className="hover:text-teal-600 transition-colors">Sensus Warga</Link></li>
                <li><Link to="/surat" className="hover:text-teal-600 transition-colors">Pengajuan Surat</Link></li>
                <li><Link to="/transparansi" className="hover:text-teal-600 transition-colors">Laporan Kas</Link></li>
                <li><Link to="/admin" className="hover:text-teal-600 transition-colors">Login Admin</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-slate-800 mb-4">Hubungi Kami</h4>
              <ul className="space-y-3 text-sm text-slate-500">
                <li className="flex items-start gap-3">
                  <MapPin size={18} className="text-teal-600 shrink-0"/>
                  Jl. Damai Sejahtera No. 1, Jatimakmur, Pondok Gede, Bekasi 17413
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  Sekretariat Buka: Senin - Sabtu (08.00 - 16.00)
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-100 pt-8 text-center text-slate-400 text-sm font-medium">
            &copy; {new Date().getFullYear()} Pengurus RT 01 / RW 03. All rights reserved.
          </div>
        </div>
      </footer>

    </div>
  );
}