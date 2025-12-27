import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Minimize2, User, Bot } from 'lucide-react';

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([
    { id: 1, text: "Halo! Ada yang bisa saya bantu terkait layanan RT 01?", sender: 'bot' }
  ]);
  const messagesEndRef = useRef(null);

  // Auto-scroll ke pesan terakhir
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isOpen]);

  const toggleChat = () => {
    setIsOpen(!isOpen);
    setIsMinimized(false);
  };

  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    // 1. Tambahkan pesan user
    const newMsg = { id: Date.now(), text: input, sender: 'user' };
    setMessages(prev => [...prev, newMsg]);
    setInput('');

    // 2. Simulasi balasan bot (Logic sederhana)
    setTimeout(() => {
      let botResponse = "Maaf, saya belum mengerti. Silakan hubungi pengurus RT langsung.";
      const lowerInput = input.toLowerCase();

      if (lowerInput.includes('sensus') || lowerInput.includes('data')) {
        botResponse = "Untuk mengisi data sensus, silakan klik menu 'Sensus Digital' di halaman utama atau navigasi.";
      } else if (lowerInput.includes('surat') || lowerInput.includes('pengantar')) {
        botResponse = "Layanan surat bisa diakses di menu 'Layanan Surat'. Anda bisa membuat surat pengantar secara online.";
      } else if (lowerInput.includes('sampah') || lowerInput.includes('bank')) {
        botResponse = "Bank Sampah menerima setoran setiap Sabtu. Cek saldo Anda di menu 'Bank Sampah'.";
      } else if (lowerInput.includes('kas') || lowerInput.includes('uang') || lowerInput.includes('iuran')) {
        botResponse = "Laporan keuangan RT bersifat transparan. Anda bisa mengeceknya di menu 'Transparansi Kas'.";
      } else if (lowerInput.includes('halo') || lowerInput.includes('hi') || lowerInput.includes('selamat')) {
        botResponse = "Halo juga! Semoga hari Anda menyenangkan.";
      }

      setMessages(prev => [...prev, { id: Date.now() + 1, text: botResponse, sender: 'bot' }]);
    }, 1000);
  };

  // Tampilan Tombol Chat (Saat tertutup)
  if (!isOpen) {
    return (
      <button 
        onClick={toggleChat}
        className="fixed bottom-6 right-6 bg-teal-600 text-white p-4 rounded-full shadow-2xl hover:bg-teal-700 transition-all z-40 hover:scale-110 flex items-center gap-2"
      >
        <MessageSquare size={24} />
        <span className="font-bold text-sm hidden md:inline">Tanya Bot</span>
      </button>
    );
  }

  // Tampilan Chat Window
  return (
    <div className={`fixed bottom-6 right-6 bg-white w-80 md:w-96 rounded-2xl shadow-2xl border border-gray-200 z-50 flex flex-col overflow-hidden transition-all duration-300 ${isMinimized ? 'h-16' : 'h-[500px]'}`}>
      
      {/* Header */}
      <div className="bg-teal-600 p-4 text-white flex justify-between items-center cursor-pointer" onClick={() => setIsMinimized(!isMinimized)}>
        <div className="flex items-center gap-2">
          <div className="bg-white/20 p-1.5 rounded-lg"><Bot size={20}/></div>
          <div>
            <h3 className="font-bold text-sm">Asisten Warga</h3>
            <p className="text-[10px] text-teal-100 flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span> Online
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={(e) => { e.stopPropagation(); setIsMinimized(!isMinimized); }} className="p-1 hover:bg-white/20 rounded">
            <Minimize2 size={16} />
          </button>
          <button onClick={toggleChat} className="p-1 hover:bg-red-500/80 rounded">
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Body (Chat List) - Sembunyikan jika minimized */}
      {!isMinimized && (
        <>
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] p-3 rounded-2xl text-sm leading-relaxed shadow-sm ${
                  msg.sender === 'user' 
                    ? 'bg-teal-600 text-white rounded-tr-none' 
                    : 'bg-white text-gray-700 border border-gray-100 rounded-tl-none'
                }`}>
                  {msg.text}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Footer */}
          <form onSubmit={handleSend} className="p-3 bg-white border-t border-gray-100 flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ketik pertanyaan..."
              className="flex-1 bg-gray-100 border-none rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-teal-500 outline-none"
            />
            <button 
              type="submit" 
              disabled={!input.trim()}
              className="bg-teal-600 text-white p-2.5 rounded-xl hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Send size={18} />
            </button>
          </form>
        </>
      )}
    </div>
  );
}