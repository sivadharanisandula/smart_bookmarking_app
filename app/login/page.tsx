'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'

export default function Dashboard() {
  const [bookmarks, setBookmarks] = useState<any[]>([])
  const supabase = createClient()

  // 1. Function to fetch data
  const fetchBookmarks = async () => {
    const { data } = await supabase
      .from('bookmarks')
      .select('*')
      .order('created_at', { ascending: false })
    if (data) setBookmarks(data)
  }

  useEffect(() => {
    fetchBookmarks()

    // 2. REAL-TIME SUBSCRIPTION
    // This listens for any change in the 'bookmarks' table
    const channel = supabase
      .channel('realtime-bookmarks')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'bookmarks' },
        (payload) => {
          console.log('Change received!', payload)
          fetchBookmarks() // Refresh the list automatically when a change happens
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6 text-white">Your Bookmarks</h1>
      
      {/* Your existing Add Bookmark Input/Form goes here */}

      <div className="grid gap-4">
        {bookmarks.map((b) => (
          <div key={b.id} className="p-4 bg-[#11131a] border border-slate-800 rounded-xl">
            <h3 className="text-white font-medium">{b.title}</h3>
            <p className="text-slate-400 text-sm">{b.url}</p>
          </div>
        ))}
      </div>
    </div>
  )
}