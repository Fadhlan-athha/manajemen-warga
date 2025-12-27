import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, Send, X } from 'lucide-react';

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef(null);

  // Auto-scroll ke bawah saat ada pesan baru
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMsg = { role: 'user', text: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('http://localhost:8000/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input }),
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: 'bot', text: data.reply }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'bot', text: 'Maaf, gagal menghubungi asisten.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-24 right-6 z-50">
      {isOpen ? (
        <div className="bg-white shadow-2xl rounded-2xl w-85 h-[450px] flex flex-col border border-gray-200 overflow-hidden">
          <div className="p-4 bg-blue-600 text-white flex justify-between items-center">
            <span className="font-bold flex items-center gap-2">
              <MessageCircle size={18} /> Asisten Digital
            </span>
            <button onClick={() => setIsOpen(false)} className="hover:bg-blue-700 p-1 rounded"><X size={20} /></button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${
                  m.role === 'user' ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-gray-100 text-gray-800 rounded-tl-none'
                }`}>
                  {m.text}
                </div>
              </div>
            ))}
            {loading && <div className="text-xs text-gray-400 italic">Mengetik...</div>}
            <div ref={chatEndRef} />
          </div>

          <div className="p-3 border-t bg-gray-50 flex gap-2">
            <input 
              className="flex-1 text-sm border p-2 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Tanya info desa..."
            />
            <button onClick={handleSend} className="bg-blue-600 text-white p-2 rounded-xl hover:bg-blue-700">
              <Send size={18} />
            </button>
          </div>
        </div>
      ) : (
        <button 
          onClick={() => setIsOpen(true)}
          className="bg-blue-600 text-white p-4 rounded-full shadow-lg hover:scale-110 transition-transform flex items-center gap-2"
        >
          <MessageCircle size={24} />
          <span className="font-semibold pr-2 text-sm">Tanya Asisten</span>
        </button>
      )}
    </div>
  );
}