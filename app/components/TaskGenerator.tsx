'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { generateTasks } from '@/lib/tasks';
import { Button } from '@/components/ui/button';

interface Profile {
  id: string;
  name: string;
  email: string;
}

export default function TaskGenerator({ profile }: { profile: Profile }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const tasks = await generateTasks(profile.id);
      console.log('Generated tasks:', tasks);
      router.push(`/dashboard?profile=${profile.id}`);
    } catch (err) {
      console.error('Error generating initial tasks:', err);
      setError('Failed to generate tasks. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-8 p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">Generate Tasks for {profile.name}</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <p className="text-gray-600">Email: {profile.email}</p>
        </div>
        <Button type="submit" disabled={loading} className="w-full">
          {loading ? 'Generating...' : 'Generate Tasks'}
        </Button>
        {error && <div className="text-red-500 mt-2">{error}</div>}
      </form>
    </div>
  );
}

