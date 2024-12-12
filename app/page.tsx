'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Sparkles, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { fetchLinkedInProfile, fetchLinkedInActivities } from '@/lib/scrapin';
import { generateTasks } from '@/lib/tasks';
import { toast } from '@/components/ui/use-toast';

export default function Home() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. Fetch LinkedIn Data
      const [profile, activities] = await Promise.all([
        fetchLinkedInProfile(url),
        fetchLinkedInActivities(url),
      ]);

      // 2. Insert Profile
      const { data: profileData, error: dbError } = await supabase
        .from('profiles')
        .insert({
          linkedin_url: url,
          linkedin_data: { profile, activities },
        })
        .select()
        .single();

      if (dbError) throw dbError;

      if (!profileData?.id) {
        throw new Error('Failed to retrieve profile ID for navigation.');
      }

      // 3. Generate Initial Tasks
      try {
        await generateTasks(profileData.id);
      } catch (taskError) {
        console.error('Error generating initial tasks:', taskError);
        toast({
          title: "Task Generation Warning",
          description: "Initial tasks could not be generated. You can try again later from the dashboard.",
          variant: "destructive",
        });
      }

      // 4. Navigate to Dashboard
      router.push(`/dashboard?profile=${profileData.id}`);
    } catch (err) {
      console.error('Error during submission:', err);
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : 'Something went wrong',
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-blue-50 to-sky-50 p-4">
      <Card className="w-full max-w-lg p-8">
        <header className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Sparkles className="w-8 h-8 text-blue-500" />
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-sky-600 bg-clip-text text-transparent">
              Your Personal Chief of Staff
            </h1>
          </div>
          <p className="text-gray-600">
            Get AI-powered guidance to maximize your impact
          </p>
        </header>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="url"
            placeholder="Paste your LinkedIn URL"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="h-12 px-4"
            disabled={loading}
            required
          />
          <Button
            type="submit"
            className="w-full h-12 text-lg bg-gradient-to-r from-blue-600 to-sky-600 hover:opacity-90 transition-opacity"
            disabled={loading}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="animate-spin" />
                Processing...
              </span>
            ) : (
              'Get Started'
            )}
          </Button>
        </form>
      </Card>
    </main>
  );
}

