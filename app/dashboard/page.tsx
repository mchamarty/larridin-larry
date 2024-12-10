'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TasksView } from '../components/TasksView';
import { InsightsView } from '../components/InsightsView';
import { BestPracticesView } from '../components/BestPracticesView';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@/components/ui/alert-dialog';
import ErrorBoundary from '@/app/components/ErrorBoundary';
import { AppProvider, useAppContext } from '@/lib/AppContext';

export default function Dashboard() {
  return (
    <AppProvider>
      <DashboardContent />
    </AppProvider>
  );
}

function DashboardContent() {
  const searchParams = useSearchParams();
  const {
    loading,
    error,
    profileId,
    setProfileId,
    activeTab,
    setActiveTab,
    showSwitchProfileDialog,
    setShowSwitchProfileDialog,
    fetchTasks,
  } = useAppContext();

  useEffect(() => {
    const id = searchParams.get('profile');
    if (id && id !== profileId) {
      console.log('Setting profile ID:', id);
      setProfileId(id);
      fetchTasks(id);
    } else if (!id) {
      console.error('Profile ID is missing from the URL.');
    }
  }, [searchParams, profileId, setProfileId, fetchTasks]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  if (!profileId && !loading) {
    return <p className="text-center text-red-500">Profile ID is missing from the URL.</p>;
  }

  if (error) {
    return <p className="text-center text-red-500">{error}</p>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-blue-50 to-sky-50">
      <div className="max-w-6xl mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
          <Button onClick={() => setShowSwitchProfileDialog(true)}>Switch Profile</Button>
        </div>

        {loading && (
          <div className="fixed inset-0 bg-background/50 flex items-center justify-center z-50">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        )}

        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-4">
          <TabsList>
            <TabsTrigger value="tasks">Recommended Tasks</TabsTrigger>
            <TabsTrigger value="moreAboutYou" className="flex items-center gap-2">
              More About You
              <span className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full">New</span>
            </TabsTrigger>
            <TabsTrigger value="bestPractices" className="flex items-center gap-2">
              Harness Best Practices
              <span className="bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded-full">New</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="tasks" className="animate-in fade-in-50 duration-300 ease-in-out">
            <ErrorBoundary>
              <TasksView />
            </ErrorBoundary>
          </TabsContent>

          <TabsContent value="moreAboutYou" className="animate-in fade-in-50 duration-300 ease-in-out">
            <ErrorBoundary>
              <InsightsView />
            </ErrorBoundary>
          </TabsContent>

          <TabsContent value="bestPractices" className="animate-in fade-in-50 duration-300 ease-in-out">
            <ErrorBoundary>
              <BestPracticesView />
            </ErrorBoundary>
          </TabsContent>
        </Tabs>

        <AlertDialog open={showSwitchProfileDialog} onOpenChange={setShowSwitchProfileDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Switch Profile</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to switch profiles? This action will redirect you to the main page.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => {
                window.location.href = '/';
              }}>Confirm</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
