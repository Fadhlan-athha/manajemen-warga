import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Tambahkan log ini sementara untuk mengecek apakah terbaca
console.log("Supabase URL:", supabaseUrl);
console.log("Supabase Key:", supabaseKey ? "Ada (Terbaca)" : "KOSONG!");

export const supabase = createClient(supabaseUrl, supabaseKey)