'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Questionnaire } from '@/app/components/Questionnaire'
import { generateTasks } from '@/lib/tasks'
import type { Profile } from '@/lib/supabase'

export default function QuestionnairePage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const profileId = searchParams.get('profile')
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadProfile() {
      if (!profileId) return

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', profileId)
        .single()

      if (!error && data) {
        setProfile(data)
      }
      setLoading(false)
    }

    loadProfile()
  }, [profileId])

  const handleQuestionnaireComplete = async () => {
    if (!profileId) return
  
    setLoading(true)
    try {
      await fetch('/api/tasks', {
        method: 'POST',
        body: JSON.stringify({ profileId })
      })
      router.push(`/dashboard?profile=${profileId}`)
    } catch (err) {
      console.error('Error generating tasks:', err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin w-8 h-8 text-blue-500" />
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Profile not found</p>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Lets get to know you better</h1>
        <Questionnaire 
          profileId={profile.id}
          onComplete={handleQuestionnaireComplete}
        />
      </div>
    </main>
  )
}