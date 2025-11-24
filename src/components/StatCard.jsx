import React from 'react';

export default function StatCard({ title, value, icon, color }) {
  return (
    <div className={`p-6 rounded-xl border ${color} shadow-sm flex items-center gap-4 transition-transform hover:scale-105 bg-white`}>
      <div className="p-3 bg-gray-50 rounded-full shadow-sm">
        {icon}
      </div>
      <div>
        <p className="text-sm text-gray-500 font-medium">{title}</p>
        <p className="text-2xl font-bold text-gray-800">{value}</p>
      </div>
    </div>
  );
}
