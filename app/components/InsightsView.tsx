'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAppContext } from '@/lib/AppContext';
import { useToast } from "@/components/ui/use-toast";
import { useRouter } from 'next/navigation';
import { generateTasks } from '@/lib/tasks';
import { generateQuestions, Question as BaseQuestion, QuestionResponse } from '@/lib/questions';

interface Question extends BaseQuestion {
  id: string;
}

export function InsightsView() {
  const router = useRouter();
  const { profileId, setTasks, setActiveTab } = useAppContext();
  const { toast } = useToast();
  const [allQuestions, setAllQuestions] = useState<Question[]>([]);
  const [currentSet, setCurrentSet] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [currentSetIndex, setCurrentSetIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isGeneratingTasks, setIsGeneratingTasks] = useState(false);
  const [progress, setProgress] = useState(0);
  const [answeredQuestionIds, setAnsweredQuestionIds] = useState<string[]>([]);

  const fetchProgress = async () => {
    if (!profileId) return;
    try {
      const response = await fetch(`/api/insights/progress?profileId=${profileId}`);
      if (!response.ok) throw new Error('Failed to fetch progress');
      const data = await response.json();
      setAnsweredQuestionIds(data.answeredQuestionIds);
    } catch (error) {
      console.error('Error fetching progress:', error);
    }
  };

  useEffect(() => {
    const fetchQuestionsAndProgress = async () => {
      if (!profileId) {
        setError('Profile ID is missing');
        setLoading(false);
        return;
      }

      try {
        await fetchProgress();

        const { data: existingQuestions, error: fetchError } = await supabase
          .from('pre_generated_questions')
          .select('*')
          .eq('profile_id', profileId);

        if (fetchError) throw fetchError;

        if (existingQuestions && existingQuestions.length > 0) {
          setAllQuestions(existingQuestions);
          const unansweredQuestions = existingQuestions.filter(q => !answeredQuestionIds.includes(q.id));
          setCurrentSet(unansweredQuestions.slice(0, 5));
          setCurrentSetIndex(Math.floor(answeredQuestionIds.length / 5));
        } else {
          await loadQuestions();
        }
      } catch (err) {
        console.error('Error loading questions:', err);
        setError('Failed to load questions. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchQuestionsAndProgress();
  }, [profileId]);

  useEffect(() => {
    if (allQuestions.length > 0) {
      const startIdx = currentSetIndex * 5;
      setCurrentSet(allQuestions.slice(startIdx, startIdx + 5));
    }
  }, [currentSetIndex, allQuestions]);

  const handleAnswer = async (answer: string) => {
    if (!profileId) return;
    const currentQuestion = currentSet[currentQuestionIndex];
    setAnswers(prev => ({ ...prev, [currentQuestion.id]: answer }));
    setAnsweredQuestionIds(prev => [...prev, currentQuestion.id]);

    try {
      await supabase.from('insights').insert({
        profile_id: profileId,
        question_id: currentQuestion.id,
        answer: answer
      });

      if (currentQuestionIndex < currentSet.length - 1) {
        setCurrentQuestionIndex(prev => prev + 1);
      } else if (answeredQuestionIds.length < allQuestions.length -1) {
        setCurrentSetIndex(prev => prev + 1);
        setCurrentQuestionIndex(0);
        const nextSetStart = (currentSetIndex + 1) * 5;
        setCurrentSet(allQuestions.slice(nextSetStart, nextSetStart + 5));
      } else {
        handleAllQuestionsAnswered();
      }
    } catch (err) {
      console.error('Error saving answer:', err);
      toast({
        title: "Error",
        description: "Failed to save your answer. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleAllQuestionsAnswered = async () => {
    toast({
      title: "All Questions Answered",
      description: "Thank you for answering all questions. Generating new questions for you.",
    });
    await generateNewQuestions();
  };

  const handleDone = async () => {
    if (!profileId) {
      toast({
        title: "Error",
        description: "Profile ID is missing. Please try again.",
        variant: "destructive"
      });
      return;
    }

    setIsGeneratingTasks(true);
    try {
      const newTasks = await generateTasks(profileId);
      setTasks(prevTasks => [...newTasks, ...prevTasks]);
      toast({
        title: "Tasks Generated",
        description: `${newTasks.length} new tasks have been created based on your insights.`,
      });
    } catch (err) {
      console.error('Error generating tasks:', err);
      toast({
        title: "Error",
        description: "Failed to generate new tasks. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGeneratingTasks(false);
      setActiveTab('tasks');
    }
  };

  const loadQuestions = async () => {
    if (!profileId) {
      setError('Profile ID is missing');
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/generate-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileId })
      });

      const data: QuestionResponse = await response.json();

      if (!response.ok || data.error) {
        throw new Error(data.error || 'Failed to load questions');
      }

      if (data.questions && data.questions.length > 0) {
        setAllQuestions(data.questions as Question[]);
        setCurrentSet(data.questions.slice(0, 5) as Question[]);
        setError(null);
      } else {
        throw new Error('No questions received');
      }
    } catch (err) {
      console.error('Error:', err);
      setError(`Failed to load questions: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const generateNewQuestions = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/generate-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileId })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      if (data.questions) {
        setAllQuestions(data.questions);
        setCurrentSet(data.questions.slice(0, 5));
        setCurrentSetIndex(0);
        setCurrentQuestionIndex(0);
        setAnsweredQuestionIds([]);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err) {
      console.error('Error generating new questions:', err);
      setError('Failed to generate new questions. Please try again.');
    } finally {
      setLoading(false);
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
        <Button onClick={() => {
          window.location.reload();
        }}>Try Again</Button>
      </div>
    );
  }

  const currentQuestion = currentSet[currentQuestionIndex];

  return (
    <Card className="p-6 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">More About You</h2>
      <Progress 
        value={((currentSetIndex * 5 + currentQuestionIndex + 1) / 20) * 100} 
        className="mb-6" 
      />

      {currentQuestion ? (
        <>
          <h3 className="text-xl mb-2">{currentQuestion.text}</h3>
          <p className="text-gray-600 mb-6">{currentQuestion.subtext}</p>

          <div className="space-y-3">
            {currentQuestion.options?.map((option, index) => (
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
              Question {currentSetIndex * 5 + currentQuestionIndex + 1} of 20
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
                Generating Tasks...
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