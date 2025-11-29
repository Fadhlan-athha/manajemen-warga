import React from 'react';
import { Home, Users, Save, Database, X, LogOut, Wallet, AlertTriangle, FileText, Map, Megaphone } from 'lucide-react'; // Tambah Megaphone

export default function Sidebar({ activeTab, setActiveTab, isOpen, setIsOpen, onLogout }) {
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
        <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-950">
          <div>
            <h1 className="text-xl font-bold flex items-center gap-3 text-teal-400">
              <Database className="w-6 h-6" />
              Sistem RW
            </h1>
            <p className="text-xs text-slate-400 mt-1 font-medium tracking-wide">ADMINISTRATOR</p>
          </div>
          <button onClick={() => setIsOpen(false)} className="lg:hidden text-slate-400 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          <NavButton 
            id="dashboard" label="Dashboard" icon={<Home size={20} />} 
            activeTab={activeTab} onClick={() => { setActiveTab('dashboard'); setIsOpen(false); }} 
          />
          <NavButton 
            id="warga" label="Data Warga" icon={<Users size={20} />} 
            activeTab={activeTab} onClick={() => { setActiveTab('warga'); setIsOpen(false); }} 
          />
          <NavButton 
            id="peta" label="Peta Sebaran" icon={<Map size={20} />} 
            activeTab={activeTab} onClick={() => { setActiveTab('peta'); setIsOpen(false); }} 
          />
          <NavButton 
            id="keuangan" label="Keuangan & Kas" icon={<Wallet size={20} />} 
            activeTab={activeTab} onClick={() => { setActiveTab('keuangan'); setIsOpen(false); }} 
          />
          <NavButton 
            id="pengumuman" label="Papan Informasi" icon={<Megaphone size={20} />}  // <--- MENU BARU
            activeTab={activeTab} onClick={() => { setActiveTab('pengumuman'); setIsOpen(false); }} 
          />
          <NavButton 
            id="laporan" label="Laporan Darurat" icon={<AlertTriangle size={20} className="text-red-400"/>} 
            activeTab={activeTab} onClick={() => { setActiveTab('laporan'); setIsOpen(false); }} 
          />
          <NavButton 
            id="surat" label="Pengajuan Surat" icon={<FileText size={20} />} 
            activeTab={activeTab} onClick={() => { setActiveTab('surat'); setIsOpen(false); }} 
          />
          <NavButton 
            id="settings" label="Pengaturan" icon={<Save size={20} />} 
            activeTab={activeTab} onClick={() => { setActiveTab('settings'); setIsOpen(false); }} 
          />
        </nav>

        <div className="p-4 border-t border-slate-800 bg-slate-950">
          <button 
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all duration-200 group"
          >
            <LogOut size={20} className="group-hover:-translate-x-1 transition-transform"/>
            Keluar Aplikasi
          </button>
        </div>
        
        <div className="p-3 text-[10px] text-center text-slate-600 bg-slate-950">
          v2.0 (Cloud Connected)
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