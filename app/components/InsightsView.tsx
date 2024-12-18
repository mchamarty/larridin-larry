'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useAppContext } from '@/lib/AppContext';
import { Loader2, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useRouter } from 'next/navigation';

interface Question {
  id: string;
  text: string;
  subtext: string;
  options: string[];
}

export function InsightsView() {
  const { profileId } = useAppContext();
  const router = useRouter();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentSetIndex, setCurrentSetIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isGeneratingTasks, setIsGeneratingTasks] = useState(false);
  const [taskGenerationProgress, setTaskGenerationProgress] = useState(0);

  const currentQuestions = questions.slice(Math.floor(currentSetIndex / 5) * 5, Math.floor(currentSetIndex / 5) * 5 + 5);
  const currentQuestion = currentQuestions[currentSetIndex % 5];
  const isSetComplete = (currentSetIndex + 1) % 5 === 0 && selectedAnswers[currentQuestion?.id];
  const hasMoreQuestions = currentSetIndex < 15;
  const showQuestions = !isGeneratingTasks && currentQuestion;
  const progressPercent = ((currentSetIndex % 5) + 1) * 20;

  const loadQuestions = useCallback(async () => {
    if (!profileId) return;
    try {
      const response = await fetch(
        `${window.location.origin}/api/insights?profileId=${profileId}&_=${Date.now()}`,
        { cache: 'no-store' }
      );
      if (!response.ok) throw new Error('Failed to load questions');
      const data = await response.json();
      if (!data.insights || data.insights.length === 0) {
        throw new Error('No questions available');
      }
      setQuestions(data.insights);
    } catch (e) {
      console.error('Load error:', e);
      setError(e instanceof Error ? e.message : 'Failed to load questions');
    } finally {
      setLoading(false);
    }
  }, [profileId]);

  useEffect(() => {
    loadQuestions();
  }, [loadQuestions]);

  const handleAnswerSelect = useCallback((questionId: string, answer: string) => {
    setSelectedAnswers(prev => ({ ...prev, [questionId]: answer }));
  }, []);

  const handleAnswerMoreQuestions = useCallback(() => {
    const nextSetIndex = Math.floor(currentSetIndex / 5) * 5 + 5;
    setCurrentSetIndex(nextSetIndex);
    setSelectedAnswers({});
  }, [currentSetIndex]);

  const handleSubmitAnswer = useCallback(async () => {
    if (!currentQuestion?.id || !selectedAnswers[currentQuestion.id] || !profileId) return;

    try {
      const response = await fetch('/api/insights/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profileId,
          questionId: currentQuestion.id,
          answer: selectedAnswers[currentQuestion.id],
          currentSetIndex,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to save answer: ${errorText}`);
      }

      await loadQuestions();
      
      if ((currentSetIndex + 1) % 5 !== 0) {
        setCurrentSetIndex(prev => prev + 1);
      }
    } catch (e) {
      console.error('Save error:', e);
      setError(e instanceof Error ? e.message : 'Failed to save answer');
    }
  }, [currentQuestion, selectedAnswers, currentSetIndex, profileId, loadQuestions]);

  // Transform selectedAnswers into the expected format:
const handleDoneForNow = useCallback(async () => {
  if (!profileId) {
    setError('Missing profile ID');
    return;
  }

  setIsGeneratingTasks(true);
  setTaskGenerationProgress(0);
  let progressInterval: NodeJS.Timeout | undefined = undefined;

  try {
    progressInterval = setInterval(() => {
      setTaskGenerationProgress(prev => Math.min(prev + 5, 90));
    }, 500);

    // Transform the answers format
    const formattedAnswers = Object.entries(selectedAnswers).map(([question_id, answer]) => ({
      question_id,
      answer
    }));

    const response = await fetch('/api/generate-tasks-from-insights', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        profileId, 
        includeLinkedIn: true,
        answers: formattedAnswers
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to generate tasks: ${errorText}`);
    }

    setTaskGenerationProgress(100);
    await new Promise(resolve => setTimeout(resolve, 500));
    router.push(`/dashboard?profile=${profileId}&tab=tasks`);
  } catch (error) {
    console.error('Task generation error:', error);
    setError(error instanceof Error ? error.message : 'Failed to generate tasks');
  } finally {
    clearInterval(progressInterval);
    setIsGeneratingTasks(false);
  }
}, [profileId, router, selectedAnswers]);

  if (loading || isGeneratingTasks) {
    return (
      <Card className="w-full">
        <CardHeader>
          <h3 className="text-2xl font-semibold">More About You</h3>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="w-8 h-8 animate-spin" />
              <p className="text-sm text-gray-600">
                {isGeneratingTasks ? 'Generating personalized tasks...' : 'Loading questions...'}
              </p>
            </div>
            {isGeneratingTasks && (
              <Progress value={taskGenerationProgress} className="w-full" />
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full">
        <CardHeader>
          <h3 className="text-2xl font-semibold">More About You</h3>
        </CardHeader>
        <CardContent>
          <div className="text-center space-y-4">
            <p className="text-red-500">{error}</p>
            <Button onClick={() => { setError(null); loadQuestions(); }}>
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isSetComplete) {
    return (
      <Card className="w-full">
        <CardHeader>
          <h3 className="text-2xl font-semibold">More About You</h3>
          <p className="text-sm text-gray-600 mt-2">Set Completed!</p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Set Completed</h3>
            <p>You've completed this set of questions. What would you like to do next?</p>
            <div className="flex space-x-4">
              {hasMoreQuestions && (
                <Button onClick={handleAnswerMoreQuestions}>Answer More Questions</Button>
              )}
              <Button variant="outline" onClick={handleDoneForNow}>I'm Done for Now</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <h3 className="text-2xl font-semibold">More About You</h3>
        <p className="text-sm text-gray-600 mt-2">
          This section helps us understand your goals and aspirations to provide personalized recommendations.
        </p>
      </CardHeader>
      <CardContent>
        {showQuestions && (
          <div className="mb-6 space-y-2">
            <Progress value={progressPercent} className="w-full" />
            <p className="text-sm text-gray-500">
              Question {(currentSetIndex % 5) + 1} of 5 in current set
            </p>
          </div>
        )}

        {currentQuestion && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Question {(currentSetIndex % 5) + 1} of 5</h3>
            <p className="text-base">{currentQuestion.text}</p>
            <p className="text-sm text-gray-600">{currentQuestion.subtext}</p>
            <RadioGroup
              onValueChange={(value) => handleAnswerSelect(currentQuestion.id, value)}
              value={selectedAnswers[currentQuestion.id]}
            >
              {currentQuestion.options.map((option, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <RadioGroupItem value={option} id={`option-${index}`} />
                  <Label htmlFor={`option-${index}`} className="flex items-center">
                    {option}
                    {selectedAnswers[currentQuestion.id] === option && (
                      <CheckCircle className="w-4 h-4 ml-2 text-green-500" />
                    )}
                  </Label>
                </div>
              ))}
            </RadioGroup>
            <div className="flex space-x-4">
              <Button
                onClick={handleSubmitAnswer}
                disabled={!selectedAnswers[currentQuestion.id]}
              >
                {(currentSetIndex + 1) % 5 === 0 ? 'Finish Set' : 'Next Question'}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}