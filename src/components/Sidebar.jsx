import React, { useEffect, useState } from 'react';
import { 
  Home, Users, Save, Database, X, LogOut, Wallet, 
  AlertTriangle, FileText, Map, Megaphone, BadgeCheck, Recycle 
} from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab, isOpen, setIsOpen, onLogout }) {
  const [role, setRole] = useState(''); 
  const [displayName, setDisplayName] = useState('Admin'); // Nama Tampilan (RT 01, RW, dll)

  useEffect(() => {
    // Ambil Role & Nama dari penyimpanan
    const savedRole = localStorage.getItem('userRole');
    const savedName = localStorage.getItem('userName');
    
    if (savedRole) setRole(savedRole);
    if (savedName) setDisplayName(savedName);
  }, []);

  // --- LOGIKA HAK AKSES ---
  const hasAccess = (allowedRoles) => {
    const currentRole = (role || '').toLowerCase();

    // 1. GOD MODE: Super Admin / Developer boleh akses semua
    if (currentRole === 'super admin' || currentRole === 'developer') {
      return true;
    }

    // 2. Cek Role Biasa
    return allowedRoles.some(r => r.toLowerCase() === currentRole);
  };

  // Daftar Menu & Siapa yang boleh akses
  const menuItems = [
    { 
      id: 'dashboard', label: 'Dashboard', icon: <Home size={20} />, 
      allowed: ['RW', 'RT', 'Sekretaris', 'Bendahara'] 
    },
    { 
      id: 'warga', label: 'Data Warga', icon: <Users size={20} />, 
      allowed: ['RW', 'RT', 'Sekretaris'] 
    },
    { 
      id: 'verifikasi', label: 'Verifikasi Iuran', icon: <BadgeCheck size={20} />, 
      allowed: ['RW', 'Bendahara'] 
    },
    { 
      id: 'sampah', label: 'Bank Sampah', icon: <Recycle size={20} />, 
      allowed: ['RW', 'Bendahara', 'RT'] 
    },
    { 
      id: 'peta', label: 'Peta Sebaran', icon: <Map size={20} />, 
      allowed: ['RW', 'RT'] 
    },
    { 
      id: 'keuangan', label: 'Keuangan & Kas', icon: <Wallet size={20} />, 
      allowed: ['RW', 'Bendahara'] 
    },
    { 
      id: 'pengumuman', label: 'Papan Informasi', icon: <Megaphone size={20} />, 
      allowed: ['RW', 'Sekretaris', 'RT'] 
    },
    { 
      id: 'laporan', label: 'Laporan Darurat', icon: <AlertTriangle size={20} className="text-red-400"/>, 
      allowed: ['RW', 'RT', 'Sekretaris'] 
    },
    { 
      id: 'surat', label: 'Pengajuan Surat', icon: <FileText size={20} />, 
      allowed: ['RW', 'RT', 'Sekretaris'] 
    },
    { 
      id: 'settings', label: 'Pengaturan', icon: <Save size={20} />, 
      allowed: ['RW'] 
    },
  ];

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-20 lg:hidden"
          onClick={() => setIsOpen(false)}
        ></div>
      )}

      <aside className={`
        fixed inset-y-0 left-0 z-30 w-64 bg-slate-900 text-white transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:relative lg:translate-x-0 flex flex-col shadow-2xl border-r border-slate-800
      `}>
        <div className="p-6  border-b border-slate-800 flex justify-between items-center bg-slate-950">
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2 text-teal-400">
              <Database className="w-6 h-6" />
              Sistem RW
            </h1>

            <p className={`text-[10px] mt-1 font-bold tracking-wide uppercase inline-block px-2 py-0.5 rounded
              ${role.toLowerCase() === 'super admin' ? 'bg-red-600 text-white animate-pulse' : 'bg-slate-800 text-slate-400'}
            `}>
              {displayName} 
            </p>
          </div>
          <button onClick={() => setIsOpen(false)} className="lg:hidden text-slate-400 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Menu Navigation */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto custom-scrollbar">
          {menuItems.map((item) => {
            if (hasAccess(item.allowed)) {
              return (
                <NavButton 
                  key={item.id}
                  id={item.id} 
                  label={item.label} 
                  icon={item.icon} 
                  activeTab={activeTab} 
                  onClick={() => { setActiveTab(item.id); setIsOpen(false); }} 
                />
              );
            }
            return null;
          })}
        </nav>

        <div className="p-4 border-t border-slate-800 bg-slate-950">
          <button 
            onClick={() => {
              localStorage.removeItem('userRole');
              localStorage.removeItem('userName');
              onLogout();
            }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all duration-200 group"
          >
            <LogOut size={20} className="group-hover:-translate-x-1 transition-transform"/>
            Keluar Aplikasi
          </button>
        </div>
        
        <div className="p-3 text-[10px] text-center text-slate-600 bg-slate-950">
          v2.2 (Multi-Role + Identity)
        </div>
      </aside>
    </>
  );
}

function NavButton({ id, label, icon, activeTab, onClick }) {
  const isActive = activeTab === id;
  return (
    <button 
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 font-medium ${
        isActive 
        ? 'bg-teal-600 text-white shadow-lg shadow-teal-900/50 translate-x-1' 
        : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
      }`}
    >
      {icon} {label}
    </button>
  );
}