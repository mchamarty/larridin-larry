'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Sparkles, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { fetchLinkedInProfile, fetchLinkedInActivities } from '@/lib/scrapin';

export default function Home() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      console.log('Fetching LinkedIn data for:', url);

      const [profile, activities] = await Promise.all([
        fetchLinkedInProfile(url),
        fetchLinkedInActivities(url),
      ]);

      console.log('Fetched LinkedIn Profile:', profile);
      console.log('Fetched LinkedIn Activities:', activities);

      const { data, error: dbError } = await supabase
        .from('profiles')
        .insert({
          linkedin_url: url,
          linkedin_data: { profile, activities },
        })
        .select()
        .single();

      console.log('Inserted Profile Data:', data);

      if (dbError) throw dbError;

      // Ensure navigation happens after successful insert
      if (data?.id) {
        console.log('Navigating to Dashboard with Profile ID:', data.id);
        window.location.href = `/dashboard?profile=${data.id}`;
      } else {
        throw new Error('Failed to retrieve profile ID for navigation.');
      }
    } catch (err) {
      console.error('Error during submission:', err);
      setError(err instanceof Error ? err.message : 'Something went wrong');
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
          />
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <Button
            type="submit"
            className="w-full h-12 text-lg bg-gradient-to-r from-blue-600 to-sky-600 hover:opacity-90"
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
