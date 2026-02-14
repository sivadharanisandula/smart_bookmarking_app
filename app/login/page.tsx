'use client'
import { createClient } from '@/utils/supabase/client'

export default function LoginPage() {
  const supabase = createClient()

  const handleLogin = async () => {
    // Dynamically detects if you are on localhost or Vercel
    const origin = window.location.origin
    
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${origin}/auth/callback`,
      },
    })
  }

  return (
    <div className="min-h-screen bg-[#08090d] flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-[#11131a] border border-slate-800 p-10 rounded-[3rem] text-center shadow-2xl">
        <h1 className="text-2xl font-black text-white uppercase mb-8">SmartMark</h1>
        <p className="text-slate-400 mb-8 text-sm uppercase tracking-widest font-bold">Internship Project</p>
        <button 
          onClick={handleLogin}
          className="w-full flex items-center justify-center gap-3 bg-white text-black font-bold py-4 rounded-2xl hover:bg-slate-100 transition-all active:scale-95"
        >
          <img src="https://www.google.com/favicon.ico" className="w-5 h-5" alt="G" />
          Continue with Google
        </button>
      </div>
    </div>
  )
}