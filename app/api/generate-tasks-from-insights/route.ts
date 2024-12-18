import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { callClaude } from '@/lib/claude';

interface Task {
  profile_id: string;
  title: string;
  description: string;
  status: string;
  feedback: string;
  created_at: string;
  metadata: {
    category: string;
    importance: string;
    estimated_time: string;
    expected_outcome: string;
    strategic_importance: string;
    shareable_text: string;
  };
  email_content?: string;
  completed_at: string | null;
  feedback_at: string | null;
  is_new: boolean;
}

interface RawTask {
  title?: unknown;
  description?: unknown;
  metadata?: {
    category?: unknown;
    importance?: unknown;
    estimated_time?: unknown;
    expected_outcome?: unknown;
    strategic_importance?: unknown;
    shareable_text?: unknown;
  };
}

function sanitizeJSON(input: string): string {
  let cleaned = input.replace(/,(\s*[}\]])/g, '$1');
  cleaned = cleaned.replace(/\\*"/g, '\\"');
  cleaned = cleaned.replace(/([":]\s*"[^"]*)\n([^"]*")/g, '$1\\n$2');
  
  if (!cleaned.trim().endsWith(']')) {
    const lastComplete = cleaned.lastIndexOf('"}');
    if (lastComplete !== -1) {
      cleaned = cleaned.substring(0, lastComplete + 2) + ']';
    }
  }
  
  return cleaned;
}

function isRawTask(value: unknown): value is RawTask {
  if (!value || typeof value !== 'object') return false;
  const task = value as Record<string, unknown>;
  return 'title' in task && 'description' in task;
}

function formatTask(task: Partial<Task>, profileId: string): Task {
  return {
    profile_id: profileId,
    title: task.title || '',
    description: task.description || '',
    status: 'pending',
    feedback: '',
    created_at: new Date().toISOString(),
    metadata: {
      category: task.metadata?.category || '',
      importance: task.metadata?.importance || '',
      estimated_time: task.metadata?.estimated_time || '',
      expected_outcome: task.metadata?.expected_outcome || '',
      strategic_importance: task.metadata?.strategic_importance || '',
      shareable_text: task.metadata?.shareable_text || ''
    },
    email_content: task.email_content || task.metadata?.shareable_text || '',
    completed_at: null,
    feedback_at: null,
    is_new: true
  };
}

async function generateTasksFromAnswers(
  answers: { question_id: string; answer: string }[],
  linkedInData: any,
  existingTasks: Task[],
  profileId: string
): Promise<Partial<Task>[]> {
  if (!answers?.length) {
    throw new Error('No answers provided');
  }

  const prompt = `Generate 3 NEW career tasks based on:

ANSWERS:
${answers.map(({ answer }) => answer).join('\n')}

PROFILE:
${JSON.stringify(linkedInData, null, 2)}

Return exactly this JSON array with 3 tasks (no additional text):
[{
  "title": "Action verb + objective",
  "description": "Multi-step implementation plan",
  "metadata": {
    "category": "strategic"|"operational"|"relational"|"growth",
    "importance": "high"|"medium"|"low",
    "estimated_time": "short"|"medium"|"long",
    "expected_outcome": "Measurable success metric",
    "strategic_importance": "Broader impact explanation",
    "shareable_text": "Team communication summary"
  }
}]`;

  let aiResponse: unknown;
  let retryCount = 0;
  const MAX_RETRIES = 3;
  
  while (retryCount < MAX_RETRIES) {
    try {
      aiResponse = await callClaude(prompt, 'tasks');
      
      let tasks: unknown[];
      
      if (typeof aiResponse === 'string') {
        try {
          tasks = JSON.parse(aiResponse.trim());
        } catch (initialError) {
          // Convert to sanitized JSON
          const sanitizedJson = sanitizeJSON(aiResponse);
          try {
            tasks = JSON.parse(sanitizedJson);
          } catch (sanitizeError) {
            console.error('Failed to parse after sanitization:', {
              original: aiResponse.substring(0, 200),
              sanitized: sanitizedJson.substring(0, 200)
            });
            throw new Error('Failed to parse AI response after sanitization');
          }
        }
      } else if (Array.isArray(aiResponse)) {
        tasks = aiResponse;
      } else {
        throw new Error('Invalid response format from AI');
      }

      const validTasks = tasks
        .filter(isRawTask)
        .map(task => ({
          title: String(task.title || ''),
          description: String(task.description || ''),
          metadata: {
            category: String(task.metadata?.category || 'strategic'),
            importance: String(task.metadata?.importance || 'medium'),
            estimated_time: String(task.metadata?.estimated_time || 'medium'),
            expected_outcome: String(task.metadata?.expected_outcome || ''),
            strategic_importance: String(task.metadata?.strategic_importance || ''),
            shareable_text: String(task.metadata?.shareable_text || '')
          }
        }));

      if (validTasks.length > 0) {
        return validTasks.slice(0, 3);
      }

      throw new Error('No valid tasks found in response');
    } catch (error) {
      if (retryCount === MAX_RETRIES - 1) {
        console.error('Task generation error:', { 
          error, 
          response: typeof aiResponse === 'string' 
            ? aiResponse.substring(0, 200) 
            : JSON.stringify(aiResponse).substring(0, 200) 
        });
        throw new Error(`Failed to generate tasks: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
      retryCount++;
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  throw new Error('Failed to generate valid tasks after retries');
}

export async function POST(request: Request) {
  const supabase = createRouteHandlerClient({ cookies });

  try {
    const { profileId, includeLinkedIn = true } = await request.json();

    if (!profileId) {
      return NextResponse.json({ error: 'Profile ID is required' }, { status: 400 });
    }

    const [profileData, answersData, existingTasksData] = await Promise.all([
      includeLinkedIn ? supabase
        .from('profiles')
        .select('linkedin_data')
        .eq('id', profileId)
        .single() : null,
      supabase
        .from('answers')
        .select('question_id, answer')
        .eq('profile_id', profileId),
      supabase
        .from('tasks')
        .select('*')
        .eq('profile_id', profileId)
    ]);

    if (answersData.error) {
      console.error('Error fetching answers:', answersData.error);
      return NextResponse.json({ error: 'Failed to fetch answers' }, { status: 500 });
    }

    const tasks = await generateTasksFromAnswers(
      answersData.data || [],
      profileData?.data?.linkedin_data || {},
      existingTasksData.data || [],
      profileId
    );

    const formattedTasks = tasks.map(task => formatTask(task, profileId));
    const { data: savedTasks, error: saveError } = await supabase
      .from('tasks')
      .insert(formattedTasks)
      .select();

    if (saveError) {
      if (saveError.code === '23505') {
        const { data: retriedSave, error: retryError } = await supabase
          .from('tasks')
          .insert(formattedTasks)
          .select();
          
        if (retryError) throw retryError;
        return NextResponse.json({ success: true, tasks: retriedSave });
      }
      throw saveError;
    }

    return NextResponse.json({ success: true, tasks: savedTasks });
  } catch (error: any) {
    console.error('Error:', error);
    return NextResponse.json({ error: error.message || 'Generation failed' }, { status: 500 });
  }
}