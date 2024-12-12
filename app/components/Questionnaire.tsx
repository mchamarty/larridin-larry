'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { predefinedQuestions as questions, type Question } from '@/lib/questions'
import { supabase } from '@/lib/supabase'
import { Loader2, ArrowRight, CheckCircle } from 'lucide-react'

interface QuestionnaireProps {
  profileId: string
  onComplete: () => void
}

export function Questionnaire({ profileId, onComplete }: QuestionnaireProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)

  const currentQuestion = questions[currentIndex]
  const isLastQuestion = currentIndex === questions.length - 1

  const handleAnswer = async (questionId: string, answer: string) => {
    setLoading(true)
    
    try {
      await supabase.from('responses').insert({
        profile_id: profileId,
        question_id: questionId,
        answer
      })

      setAnswers(prev => ({
        ...prev,
        [questionId]: answer
      }))

      if (isLastQuestion) {
        onComplete()
      } else {
        setCurrentIndex(prev => prev + 1)
      }
    } catch (error) {
      console.error('Error saving answer:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardContent className="p-6">
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">
              Question {currentIndex + 1} of {questions.length}
            </h2>
            <span className="text-sm text-slate-500">
              {Math.round(((currentIndex + 1) / questions.length) * 100)}% complete
            </span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2">
            <div 
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
            />
          </div>
        </div>

        <h3 className="text-lg mb-6">{currentQuestion.text}</h3>

        {currentQuestion.type === 'multiple-choice' && currentQuestion.options ? (
          <div className="space-y-3">
            {currentQuestion.options.map((option: string) => (
              <button
                key={option}
                onClick={() => handleAnswer(currentQuestion.id, option)}
                disabled={loading}
                className="w-full text-left p-4 rounded-lg border hover:bg-slate-50 transition-all duration-200 disabled:opacity-50"
              >
                {option}
              </button>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            <textarea
              className="w-full p-4 border rounded-lg min-h-[120px]"
              placeholder="Share your thoughts..."
              disabled={loading}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && e.metaKey) {
                  handleAnswer(currentQuestion.id, e.currentTarget.value)
                }
              }}
            />
            <Button
              onClick={(e) => {
                const textarea = e.currentTarget.previousElementSibling as HTMLTextAreaElement
                handleAnswer(currentQuestion.id, textarea.value)
              }}
              disabled={loading}
              className="w-full"
            >
              {loading ? (
                <Loader2 className="animate-spin mr-2" />
              ) : isLastQuestion ? (
                <>
                  <CheckCircle className="mr-2" />
                  Complete
                </>
              ) : (
                <>
                  <ArrowRight className="mr-2" />
                  Next Question
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}