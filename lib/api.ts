import { Question, Answer, ProgressData } from './types';

export async function fetchQuestions(profileId: string): Promise<Question[]> {
  const response = await fetch('/api/questions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ profileId }),
  });

  if (!response.ok) {
    throw new Error('Failed to fetch questions');
  }

  return response.json();
}

export async function saveAnswer(profileId: string, answer: Answer): Promise<void> {
  const response = await fetch('/api/insights/save', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ profileId, ...answer }),
  });

  if (!response.ok) {
    throw new Error('Failed to save answer');
  }
}

export async function fetchProgress(profileId: string): Promise<ProgressData> {
  const response = await fetch(`/api/progress?profileId=${profileId}`);

  if (!response.ok) {
    throw new Error('Failed to fetch progress');
  }

  return response.json();
}

export async function generateTasks(profileId: string): Promise<void> {
  const response = await fetch('/api/tasks/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ profileId }),
  });

  if (!response.ok) {
    throw new Error('Failed to generate tasks');
  }
}