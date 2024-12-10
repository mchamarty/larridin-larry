'use client';

import React, { useEffect, useState } from 'react';
import { useAppContext } from '@/lib/AppContext';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

export const InsightsView: React.FC = () => {
  const { profileId, callClaudeAPI, setError, setTasks } = useAppContext();
  const [questions, setQuestions] = useState<string[]>([]);
  const [answers, setAnswers] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState<number>(0);

  useEffect(() => {
    const fetchQuestions = async () => {
      if (!profileId) return;

      setLoading(true);
      setProgress(0);

      try {
        const response = await callClaudeAPI('generate-questions', { profileId });
        setProgress(50);
        setTimeout(() => {
          setQuestions(response.questions || []);
          setProgress(100);
        }, 1000);
      } catch (error) {
        console.error('Error fetching questions:', error);
        setError('Failed to load questions. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchQuestions();
  }, [profileId, callClaudeAPI, setError]);

  const handleAnswerChange = (question: string, answer: string) => {
    setAnswers((prev) => ({ ...prev, [question]: answer }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    setProgress(0);

    try {
      const tasks = await callClaudeAPI('process-answers', { profileId, answers });
      setProgress(100);
      setTasks((prev) => [...prev, ...tasks]); // Add generated tasks to the context
    } catch (error) {
      console.error('Error submitting answers:', error);
      setError('Failed to submit answers. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Tell Us More About You</h2>

      {loading && (
        <div className="relative w-full h-4 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="absolute top-0 left-0 h-full bg-blue-500 transition-width duration-500"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      )}

      {!loading && questions.length === 0 && <p>No questions available. Please try again later.</p>}

      {questions.map((question, index) => (
        <div key={index} className="space-y-2">
          <p>{question}</p>
          <input
            type="text"
            value={answers[question] || ''}
            onChange={(e) => handleAnswerChange(question, e.target.value)}
            className="border rounded p-2 w-full"
          />
        </div>
      ))}

      <div className="mt-4">
        <Button onClick={handleSubmit} disabled={loading || questions.length === 0}>
          {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
          Submit Answers
        </Button>
      </div>
    </div>
  );
};
