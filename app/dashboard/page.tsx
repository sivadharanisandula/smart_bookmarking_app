'use client'
import { useEffect, useState, useMemo } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'

export default function Dashboard() {
  const [bookmarks, setBookmarks] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  
  // States
  const [url, setUrl] = useState('')
  const [title, setTitle] = useState('')
  const [tags, setTags] = useState('')
  const [error, setError] = useState<string | null>(null) // For validation feedback

  const supabase = createClient()
  const router = useRouter()

  const fetchBookmarks = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data } = await supabase.from('bookmarks').select('*')
        .eq('user_id', user.id).order('created_at', { ascending: false })
      setBookmarks(data || [])
    }
  }

  useEffect(() => {
    fetchBookmarks()
    const channel = supabase.channel('realtime').on('postgres_changes', 
      { event: '*', schema: 'public', table: 'bookmarks' }, () => fetchBookmarks()).subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const addBookmark = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)

    // URL Validation Logic
    let validatedUrl = url.trim()
    try {
      // Logic: If user didn't add http, help them out
      if (!validatedUrl.startsWith('http://') && !validatedUrl.startsWith('https://')) {
        validatedUrl = `https://${validatedUrl}`
      }
      new URL(validatedUrl) // This throws an error if the URL is invalid
    } catch (err) {
      setError("Please enter a valid URL (e.g., https://google.com)")
      setIsSubmitting(false)
      return
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const tagArray = tags ? tags.split(',').map(t => t.trim()).filter(t => t !== '') : []
      
      const { error: dbError } = await supabase.from('bookmarks').insert([{ 
        url: validatedUrl, 
        title: title.trim() || "Untitled Mark", 
        tags: tagArray, 
        user_id: user.id 
      }])

      if (dbError) {
        setError("Database error. Please try again.")
      } else {
        setUrl(''); setTitle(''); setTags('')
      }
    }
    setIsSubmitting(false)
  }

  const filteredBookmarks = useMemo(() => {
    return bookmarks.filter(bm => 
      (bm.title?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      bm.tags?.some((t: string) => t.toLowerCase().includes(searchTerm.toLowerCase()))
    )
  }, [bookmarks, searchTerm])

  return (
    <div className="min-h-screen bg-[#08090d] text-slate-100 font-sans pb-20 selection:bg-indigo-500/30">
      {/* Navigation */}
      <nav className="p-6 border-b border-slate-800/40 flex justify-between items-center bg-[#08090d]/80 sticky top-0 z-40 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg>
          </div>
          <h1 className="text-xl font-black text-white tracking-tighter uppercase">SmartMark</h1>
        </div>
        
        <div className="flex items-center gap-4">
          <input 
            type="text" placeholder="Search library..." 
            className="hidden md:block w-64 bg-slate-900/40 border border-slate-800/60 px-5 py-2.5 rounded-2xl outline-none focus:border-indigo-500 transition-all text-sm font-medium"
            value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button 
            onClick={handleSignOut}
            className="px-6 py-2.5 rounded-xl border border-slate-800 text-slate-400 font-bold text-xs hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20 transition-all uppercase tracking-widest"
          >
            Sign Out
          </button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-6 mt-10">
        <div className="bg-[#11131a] border border-slate-800/60 p-8 rounded-[3rem] mb-16 shadow-2xl relative">
          {/* Error Message Tooltip */}
          {error && (
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-red-500 text-white text-[10px] font-bold px-4 py-1 rounded-full animate-bounce shadow-lg">
              {error}
            </div>
          )}

          <form onSubmit={addBookmark} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 ml-2 uppercase tracking-[0.15em]">Site Name</label>
              <input className="w-full bg-[#08090d] border border-slate-800/80 p-4 rounded-2xl outline-none text-white font-bold focus:border-indigo-500 transition-all shadow-inner" placeholder="e.g. GitHub" value={title} onChange={e => setTitle(e.target.value)} required />
            </div>
            
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 ml-2 uppercase tracking-[0.15em]">URL</label>
              <input className={`w-full bg-[#08090d] border ${error ? 'border-red-500/50' : 'border-slate-800/80'} p-4 rounded-2xl outline-none text-white font-bold focus:border-indigo-500 transition-all shadow-inner`} type="text" placeholder="google.com" value={url} onChange={e => setUrl(e.target.value)} required />
            </div>
            
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 ml-2 uppercase tracking-[0.15em]">Tags & Save</label>
              <div className="flex bg-[#08090d] border border-slate-800/80 rounded-2xl p-1.5 focus-within:border-indigo-500 transition-all shadow-inner">
                <input 
                  className="flex-1 bg-transparent px-4 outline-none text-white font-bold placeholder:text-slate-800" 
                  placeholder="dev, work..." 
                  value={tags} 
                  onChange={e => setTags(e.target.value)} 
                />
                
                {/* Spaced Action Zone */}
                <div className="flex items-center px-6 border-l border-slate-800/80 ml-2">
                  <button 
                    disabled={isSubmitting} 
                    className="bg-indigo-600 hover:bg-indigo-500 text-white w-14 h-12 rounded-xl flex items-center justify-center transition-all shadow-lg active:scale-95 disabled:bg-slate-800"
                  >
                    {isSubmitting ? (
                      <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    ) : (
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>

        {/* Grid Display */}
        <div className="columns-1 md:columns-2 lg:columns-3 xl:columns-4 gap-6 space-y-6">
          {filteredBookmarks.map(bm => (
            <div key={bm.id} className="break-inside-avoid bg-[#11131a] border border-slate-800/60 p-6 rounded-[2.5rem] hover:border-indigo-500/40 transition-all group relative">
              <div className="flex justify-between items-start mb-6">
                <div className="h-12 w-12 bg-[#08090d] rounded-2xl flex items-center justify-center border border-slate-800 shadow-inner">
                  <img src={`https://www.google.com/s2/favicons?domain=${bm.url}&sz=128`} className="w-6 h-6 object-contain" onError={(e) => (e.currentTarget.src = "https://www.google.com/favicon.ico")} />
                </div>
                <button onClick={() => setDeleteId(bm.id)} className="opacity-0 group-hover:opacity-100 p-2 text-slate-600 hover:text-red-400 transition-all">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
              </div>
              <h3 className="font-bold text-white text-lg mb-1 leading-tight">{bm.title || "Untitled"}</h3>
              <a href={bm.url} target="_blank" className="text-indigo-400 text-[10px] font-bold hover:underline block mb-5 truncate opacity-60 uppercase">{bm.url}</a>
              {Array.isArray(bm.tags) && bm.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {bm.tags.map((tag: string) => (
                    <span key={tag} className="text-[9px] font-black uppercase tracking-widest bg-indigo-500/5 text-indigo-400/80 px-3 py-1.5 rounded-lg border border-indigo-500/10">#{tag}</span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </main>

      {/* Delete Confirmation */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="bg-[#12141c] border border-slate-800 p-8 rounded-[2rem] max-w-sm w-full shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-6 text-center">Delete Mark?</h3>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="flex-1 px-4 py-3 rounded-xl bg-slate-800 font-bold hover:bg-slate-700 text-sm">Cancel</button>
              <button onClick={() => {
                setBookmarks(prev => prev.filter(b => b.id !== deleteId))
                supabase.from('bookmarks').delete().eq('id', deleteId).then(() => setDeleteId(null))
              }} className="flex-1 px-4 py-3 rounded-xl bg-red-500 text-white font-bold hover:bg-red-600 text-sm">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}