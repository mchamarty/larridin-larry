'use client'
import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Sparkles } from 'lucide-react'

const InsightsQuestions = () => {
  const [activeQuestion, setActiveQuestion] = useState(0)

  return (
    <div className="max-w-2xl mx-auto p-6">
      <Card className="p-6 bg-gradient-to-br from-white to-blue-50">
        <div className="flex items-center gap-2 mb-6">
          <Sparkles className="text-blue-500" />
          <h2 className="text-xl font-semibold">Enhance Your Impact</h2>
        </div>
        
        <p className="text-gray-600 mb-4">Share your insights to unlock more personalized recommendations</p>
        
        {/* Question component here */}
      </Card>
    </div>
  )
}

export default InsightsQuestions