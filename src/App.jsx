import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import PublicForm from './components/PublicForm';
import AdminDashboard from './pages/AdminDashboard';

export default function App() {
  return (
    <Router>
      <Routes>
        {/* Rute Utama (/) untuk Warga mengisi data */}
        <Route path="/" element={<PublicForm />} />

        {/* Rute Admin (/admin) untuk Dashboard & Login */}
        <Route path="/admin" element={<AdminDashboard />} />

        {/* Jika halaman tidak ditemukan (404), kembalikan ke form warga */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}