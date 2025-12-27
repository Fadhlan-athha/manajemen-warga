import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';

// Import semua halaman
import Home from './pages/Home';
import PublicForm from './components/PublicForm';
import AdminDashboard from './pages/AdminDashboard';
import PublicFinance from './pages/PublicFinance';
import PublicSurat from './pages/PublicSurat';
import PublicBankSampah from './pages/PublicBankSampah'; 
import PanicButton from './components/PanicButton';
import Chatbot from './components/Chatbot'; // Import Chatbot

// Komponen Wrapper untuk menampilkan PanicButton dan Chatbot
function LayoutWithPanicButton({ children }) {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');

  return (
    <>
      {children}
      {/* Tampilkan tombol Panic & Chatbot hanya jika BUKAN halaman admin */}
      {!isAdmin && (
        <>
          <PanicButton />
          <Chatbot />
        </>
      )}
    </>
  );
}

export default function App() {
  return (
    <Router>
      <LayoutWithPanicButton>
        <Routes>
          {/* Halaman Utama (Home) */}
          <Route path="/" element={<Home />} />

          {/* Halaman Fitur Lainnya */}
          <Route path="/sensus" element={<PublicForm />} />
          <Route path="/transparansi" element={<PublicFinance />} />
          <Route path="/surat" element={<PublicSurat />} />
          <Route path="/banksampah" element={<PublicBankSampah />} />
          <Route path="/admin" element={<AdminDashboard />} />

          {/* Fallback jika halaman tidak ditemukan */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </LayoutWithPanicButton>
    </Router>
  );
}