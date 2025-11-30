import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';

// Import semua halaman
import PublicForm from './components/PublicForm';
import AdminDashboard from './pages/AdminDashboard';
import PublicFinance from './pages/PublicFinance';
import PublicSurat from './pages/PublicSurat';
import PublicBankSampah from './pages/PublicBankSampah'; 

import PanicButton from './components/PanicButton';

// Komponen Wrapper untuk menampilkan PanicButton
function LayoutWithPanicButton({ children }) {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');

  return (
    <>
      {children}
      {/* Tampilkan tombol Panic hanya jika BUKAN halaman admin */}
      {!isAdmin && <PanicButton />}
    </>
  );
}

export default function App() {
  return (
    <Router>
      <LayoutWithPanicButton>
        <Routes>
          {/* 1. Halaman Utama (Sensus & Menu) */}
          <Route path="/" element={<PublicForm />} />

          {/* 2. Halaman Transparansi Keuangan */}
          <Route path="/transparansi" element={<PublicFinance />} />

          {/* 3. Halaman Layanan Surat */}
          <Route path="/surat" element={<PublicSurat />} />
          
          {/* 4. Halaman Bank Sampah (INI YANG SEBELUMNYA HILANG/BELUM ADA) */}
          <Route path="/banksampah" element={<PublicBankSampah />} />

          {/* 5. Halaman Admin */}
          <Route path="/admin" element={<AdminDashboard />} />

          {/* Fallback: Jika halaman tidak ditemukan, balik ke utama */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </LayoutWithPanicButton>
    </Router>
  );
}