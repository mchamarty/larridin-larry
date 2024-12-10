'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Task } from '@/lib/supabase';
import { useAppContext } from '@/lib/AppContext';
import { useToast } from "@/components/ui/use-toast";

interface Question {
  id: string;
  text: string;
  subtext: string;
  options: string[];
}

export function InsightsView() {
  const { profileId, setTasks, setActiveTab } = useAppContext();
  const { toast } = useToast();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isGeneratingTasks, setIsGeneratingTasks] = useState(false);

  useEffect(() => {
    if (profileId) {
      loadQuestions();
    }
  }, [profileId]);

  const loadQuestions = async () => {
    if (!profileId) {
      setError('Profile ID is missing');
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('pre_generated_questions')
        .select('*')
        .eq('profile_id', profileId)
        .order('id', { ascending: true });

      if (error) throw error;

      if (data && data.length > 0) {
        setQuestions(data);
      } else {
        // If no pre-generated questions, fetch new ones
        const newQuestions = await fetchNewQuestions();
        setQuestions(newQuestions);
      }
    } catch (err) {
      console.error('Error loading questions:', err);
      setError('Failed to load questions. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchNewQuestions = async (): Promise<Question[]> => {
    if (!profileId) throw new Error('Profile ID is missing');
    const response = await fetch(`/api/generate-questions?profileId=${profileId}`);
    if (!response.ok) {
      throw new Error('Failed to generate new questions');
    }
    const newQuestions = await response.json();
    return newQuestions;
  };

  const handleAnswer = async (answer: string) => {
    if (!profileId) return;
    const currentQuestion = questions[currentQuestionIndex];
    setAnswers(prev => ({ ...prev, [currentQuestion.id]: answer }));

    try {
      await supabase.from('insights').insert({
        profile_id: profileId,
        question_id: currentQuestion.id,
        answer: answer
      });

      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(prev => prev + 1);
      }
    } catch (err) {
      console.error('Error saving answer:', err);
      setError('Failed to save your answer. Please try again.');
    }
  };

  const handleDone = async () => {
    setIsGeneratingTasks(true);
    setError(null);
    try {
      const response = await fetch('/api/generate-tasks-from-insights', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ profileId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate new tasks');
      }

      if (!Array.isArray(data)) {
        throw new Error('Invalid response format from server');
      }

      setTasks(prevTasks => [...data, ...prevTasks]);
      toast({
        title: "Tasks Generated",
        description: `${data.length} new tasks have been created based on your insights.`,
      });
      setActiveTab('tasks');
    } catch (err: any) {
      console.error('Error generating new tasks:', err);
      setError(err.message || 'An error occurred while generating new tasks. Please try again.');
    } finally {
      setIsGeneratingTasks(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        <p className="mt-4 text-lg font-medium text-gray-700">Loading questions...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500 mb-4">{error}</p>
        <Button onClick={loadQuestions}>Try Again</Button>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];

  return (
    <Card className="p-6 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">More About You</h2>
      <Progress value={((currentQuestionIndex + 1) / questions.length) * 100} className="mb-6" />

      {currentQuestion ? (
        <>
          <h3 className="text-xl mb-2">{currentQuestion.text}</h3>
          <p className="text-gray-600 mb-6">{currentQuestion.subtext}</p>

          <div className="space-y-3">
            {currentQuestion.options.map((option, index) => (
              <Button
                key={index}
                variant="outline"
                className="w-full justify-start text-left py-3"
                onClick={() => handleAnswer(option)}
              >
                {option}
              </Button>
            ))}
          </div>

          <div className="mt-8 flex justify-between items-center">
            <p className="text-sm text-gray-500">
              Question {currentQuestionIndex + 1} of {questions.length}
            </p>
            <Button onClick={handleDone} variant="outline" disabled={isGeneratingTasks}>
              {isGeneratingTasks ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating Tasks...
                </>
              ) : (
                "I'm done for now"
              )}
            </Button>
          </div>
        </>
      ) : (
        <div className="text-center py-8">
          <h3 className="text-2xl font-bold text-green-600 mb-4">All Done!</h3>
          <p className="text-lg text-gray-700 mb-6">
            Thank you for answering all the questions. Your insights will help us provide better recommendations.
          </p>
          <Button onClick={handleDone} disabled={isGeneratingTasks}>
            {isGeneratingTasks ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating New Tasks...
              </>
            ) : (
              'Generate New Tasks'
            )}
          </Button>
        </div>
      )}
    </Card>
  );
}

