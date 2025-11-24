import React from 'react';
import { Home, Users, Save, Database, X } from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab, isOpen, setIsOpen }) {
  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
          onClick={() => setIsOpen(false)}
        ></div>
      )}

      <aside className={`
        fixed inset-y-0 left-0 z-30 w-64 bg-slate-800 text-white transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:relative lg:translate-x-0 flex flex-col shadow-xl
      `}>
        <div className="p-6 border-b border-slate-700 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2">
              <Database className="w-6 h-6 text-teal-400" />
              Sistem RW
            </h1>
            <p className="text-xs text-slate-400 mt-1">Manajemen Data Lokal</p>
          </div>
          <button onClick={() => setIsOpen(false)} className="lg:hidden text-slate-300">
            <X size={24} />
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          <NavButton 
            id="dashboard" 
            label="Dashboard" 
            icon={<Home size={20} />} 
            activeTab={activeTab} 
            onClick={() => { setActiveTab('dashboard'); setIsOpen(false); }} 
          />
          <NavButton 
            id="warga" 
            label="Data Warga" 
            icon={<Users size={20} />} 
            activeTab={activeTab} 
            onClick={() => { setActiveTab('warga'); setIsOpen(false); }} 
          />
          <NavButton 
            id="settings" 
            label="Backup & Restore" 
            icon={<Save size={20} />} 
            activeTab={activeTab} 
            onClick={() => { setActiveTab('settings'); setIsOpen(false); }} 
          />
        </nav>

        <div className="p-4 border-t border-slate-700 text-xs text-center text-slate-500">
          Versi 1.0 (Modular)
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
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
        isActive ? 'bg-teal-600 text-white' : 'text-slate-300 hover:bg-slate-700'
      }`}
    >
      {icon} {label}
    </button>
  );
}
