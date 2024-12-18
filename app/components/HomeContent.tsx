'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Sparkles, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { fetchLinkedInProfile, fetchLinkedInActivities } from '@/lib/scrapin';
import { toast } from '@/components/ui/use-toast';
import { useAppContext } from '@/lib/AppContext';

export default function HomeContent() {
  const [url, setUrl] = useState('');
  const router = useRouter();
  const { 
    setProfileId, 
    setLinkedInUrl, 
    loading, 
    setLoading, 
    setError,
    generateTasks,
    fetchTasks,
    setTasks,
    tasks,
    tasksLoading 
  } = useAppContext();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // 1. Fetch LinkedIn Data
      console.log('Fetching LinkedIn data...');
      const [profile, activities] = await Promise.all([
        fetchLinkedInProfile(url),
        fetchLinkedInActivities(url),
      ]);

      // 2. Insert Profile
      console.log('Inserting profile data...');
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

      // 3. Set context values
      console.log('Setting context values...');
      setProfileId(profileData.id);
      setLinkedInUrl(url);

      // 4. Generate Initial Tasks and Fetch
      console.log('Generating initial tasks...');
      try {
        await generateTasks(profileData.id);
        console.log('Tasks generated, fetching tasks...');
        
        const tasksResponse = await fetchTasks(profileData.id);
        console.log('Tasks fetched:', tasksResponse?.tasks?.length || 0, 'tasks');
        
        if (tasksResponse?.tasks.length) {
          console.log('Setting tasks in context:', tasksResponse.tasks);
          setTasks(tasksResponse.tasks);
          setProfileId(profileData.id);

          await new Promise(resolve => setTimeout(resolve, 1500));
          console.log('Final state check:', {
            tasksLength: tasks.length,
            profileId: profileData.id
          });
         
          toast({
            title: "Success", 
            description: `Profile created and ${tasksResponse.tasks.length} tasks generated!`
          });
        } else {
          console.warn('No tasks found after generation');
          
          toast({
            title: "Warning",
            description: "Tasks were generated but couldn't be loaded. They will appear in the dashboard.",
          });
        }

        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // 5. Navigate to Dashboard
        console.log('Tasks loaded, navigating to dashboard...');
        router.push(`/dashboard?tab=tasks&profile=${profileData.id}`);
      } catch (taskError) {
        console.error('Error generating initial tasks:', taskError);
        toast({
          title: "Task Generation Warning",
          description: "Initial tasks could not be generated. You can try again from the dashboard.",
          variant: "destructive",
        });
        
        router.push(`/dashboard?tab=tasks&profile=${profileData.id}`);
      }
    } catch (err) {
      console.error('Error during submission:', err);
      setError(err instanceof Error ? err.message : 'Something went wrong');
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : 'Something went wrong',
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const isProcessing = loading || tasksLoading;

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
            disabled={isProcessing}
            required
          />
          <Button
            type="submit"
            className="w-full h-12 text-lg bg-gradient-to-r from-blue-600 to-sky-600 hover:opacity-90 transition-opacity"
            disabled={isProcessing}
          >
            {isProcessing ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="animate-spin" />
                {tasksLoading ? 'Generating Tasks...' : 'Processing...'}
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

