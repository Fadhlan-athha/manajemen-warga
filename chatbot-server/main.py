import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from langchain_groq import ChatGroq
from langchain_core.messages import SystemMessage, HumanMessage
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()

app = FastAPI()

# Konfigurasi Supabase
url: str = os.environ.get("VITE_SUPABASE_URL")
key: str = os.environ.get("VITE_SUPABASE_ANON_KEY")
supabase: Client = create_client(url, key)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

llm = ChatGroq(
    temperature=0.3, # Suhu rendah agar jawaban lebih akurat/faktual
    groq_api_key=os.getenv("GROQ_API_KEY"),
    model_name="llama-3.3-70b-versatile"
)

# FUNGSI UNTUK COLLECT DATA DARI DATABASE
def get_community_context():
    try:
        # 1. Hitung Jumlah Warga
        warga = supabase.table("warga").select("id", count="exact").execute()
        total_warga = warga.count if warga.count else 0

        # 2. Hitung Saldo Kas (Pemasukan - Pengeluaran)
        keuangan = supabase.table("transaksi_keuangan").select("tipe, nominal").execute()
        total_masuk = sum(float(item['nominal']) for item in keuangan.data if item['tipe'] == 'Pemasukan')
        total_keluar = sum(float(item['nominal']) for item in keuangan.data if item['tipe'] == 'Pengeluaran')
        saldo_kas = total_masuk - total_keluar

        # 3. Ambil Pengumuman Terbaru
        pengumuman = supabase.table("pengumuman").select("judul").order("created_at", desc=True).limit(2).execute()
        info_terbaru = ", ".join([p['judul'] for p in pengumuman.data]) if pengumuman.data else "Tidak ada"

        return f"""
        DATA REAL-TIME SAAT INI:
        - Total Warga Terdaftar: {total_warga} orang.
        - Saldo Kas RT saat ini: Rp {saldo_kas:,.0f}
        - Pengumuman Terbaru: {info_terbaru}
        """
    except Exception as e:
        print(f"Error collect data: {e}")
        return "Data saat ini tidak tersedia."

class ChatRequest(BaseModel):
    message: str

@app.post("/chat")
async def chat_endpoint(req: ChatRequest):
    # Ambil konteks data terbaru setiap ada chat masuk
    context = get_community_context()
    
    messages = [
        SystemMessage(content=f"""Anda adalah asisten virtual 'Manajemen Warga'. 
        Gunakan data berikut untuk menjawab pertanyaan warga jika relevan:
        {context}
        
        Tugas Anda:
        - Jika warga bertanya tentang saldo atau jumlah warga, gunakan data di atas.
        - Jika bertanya tentang fitur, jelaskan fitur Sensus, Surat, Keuangan, dan Bank Sampah.
        - Selalu gunakan bahasa Indonesia yang sopan dan ramah."""),
        HumanMessage(content=req.message)
    ]
    
    response = llm.invoke(messages)
    return {"reply": response.content}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)