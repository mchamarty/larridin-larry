import { supabase } from './supabase';
import type { Profile, Task } from './supabase';
import { NextResponse } from 'next/server';

async function callClaudeAPI(prompt: string) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  
  try {
    const response = await fetch(`${baseUrl}/api/claude`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `API call failed: ${response.statusText}`);
    }

    const data = await response.json();
    return NextResponse.json({
      success: true,
      data: {
        content: [{ text: data.content[0].text }]
      }
    });
    
    if (!data.success || !data.data?.content?.[0]?.text) {
      throw new Error('Invalid response format from API');
    }

    const jsonMatch = data.data.content[0].text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error('No JSON array found in response');
    }

    try {
      return JSON.parse(jsonMatch[0]);
    } catch (error) {
      console.error('JSON parse error:', error);
      throw new Error('Failed to parse response JSON');
    }
  } catch (error) {
    console.error('Error in callClaudeAPI:', error);
    throw error;
  }
}

function formatTasks(tasks: any[], profileId: string): Partial<Task>[] {
  return tasks.map(task => ({
    profile_id: profileId,
    title: task.task || task.title, // Handle both possible response formats
    description: task.description,
    status: 'pending',
    feedback: '', // text field, not null
    created_at: new Date().toISOString(),
    metadata: task.metadata || {
      category: task.category || 'strategic',
      importance: task.importance || 'high',
      estimated_time: task.estimated_time || 'medium',
      expected_outcome: task.expected_outcome || task.metadata?.expected_outcome,
      strategic_importance: task.strategic_importance || task.metadata?.strategic_importance,
      shareable_text: task.shareable_text || task.metadata?.shareable_text
    },
    email_content: task.description,
    completed_at: null, // timestamptz can be null
    feedback_at: null, // timestamptz can be null
    is_new: true // boolean
  }));
}

export async function generateTasks(profileId: string, bestPractices?: string[]): Promise<Task[]> {
  console.log('Generating new tasks for profile ID:', profileId);

  try {
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', profileId)
      .single();

    if (profileError || !profile) {
      console.error(`Profile not found for ID: ${profileId}`, profileError);
      throw new Error(`Profile not found for ID: ${profileId}`);
    }

    console.log('Fetched profile data:', profile);

    const { data: responses, error: responsesError } = await supabase
      .from('question_responses')
      .select('*')
      .eq('profile_id', profileId);

    if (responsesError) {
      console.error('Error fetching responses:', responsesError);
      console.log('Continuing with empty responses');
    }

    const { data: existingTasks, error: tasksError } = await supabase
      .from('tasks')
      .select('*')
      .eq('profile_id', profileId);

    if (tasksError) {
      console.error('Error fetching existing tasks:', tasksError);
      console.log('Continuing without existing tasks');
    }

    const profileData = profile.linkedin_data.profile;
    const person = profileData?.person || {};
    const company = profileData?.company || {};
    const positions = profile.linkedin_data.positions?.positionHistory || [];
    const skills = profile.linkedin_data.skills || [];
    const activities = profile.linkedin_data.activities || {};
    const posts = activities.posts || [];

    const bestPracticesText = bestPractices && bestPractices.length > 0
      ? `Best Practices Sources: ${bestPractices.join(', ')}`
      : 'No specific best practices selected';

      const prompt = `Generate 3 strategic tasks based on this leader's profile. Return ONLY a JSON array, no additional text:

      BACKGROUND:
      - Current Role: ${person.headline || 'Not specified'}
      - Industry: ${person.industry || company.industry || 'Not specified'}
      - Company: ${company.name || 'Not specified'} (${company.employeeCount || ''} employees)
      - Leadership Style: Customer-centric, advocate for customer voice, builds strong teams
      - Core Strengths: Product strategy, customer success, startup leadership, strategic partnerships
      
      CAREER PROGRESSION:
      ${positions.slice(0,3).map((p: { title: any; companyName: any; description: string | any[]; }) => 
      `- ${p.title} at ${p.companyName}: ${p.description?.slice(0,100)}...`).join('\n')}
      
      SKILLS EMPHASIS:
      ${skills.slice(0,10).map((s: any) => `- ${s}`).join('\n')}
      
      KEY ACTIVITIES:
      ${posts.slice(0,3).map((p: { text: string | any[]; }) => 
      `- ${p.text?.slice(0,100)}...`).join('\n')}
      
      EXISTING TASKS:
      ${existingTasks ? existingTasks.map(task => task.title).join(', ') : 'None'}
      
      USER RESPONSES:
      ${responses ? responses.map((r: any) => `${r.question_id}: ${r.answer}`).join('\n') : 'None'}
      
      ${bestPracticesText}
      
      Return exactly 3 tasks with context-rich descriptions formatted as JSON:
      [{
        "title": "Clear, actionable objective starting with a verb",
        "description": "Contextual guidance written as a thoughtful chief of staff would, explaining the approach, key considerations, and path to success",
        "metadata": {
          "category": "strategic"|"operational"|"relational"|"growth",
          "importance": "high"|"medium"|"low",
          "estimated_time": "short"|"medium"|"long",
          "expected_outcome": "Clear success criteria with both quantitative and qualitative metrics",
          "strategic_importance": "Thorough explanation of how this ties to broader business goals and leadership development",
          "shareable_text": "Compelling summary that motivates the team by connecting what, why, and expected impact"
        }
      }]`;

    try {
      console.log('Calling Claude for task generation');
      const tasks = await callClaudeAPI(prompt);
      console.log('Received tasks from Claude:', tasks);

      const formattedTasks = formatTasks(tasks, profileId);
      console.log('Formatted tasks for insertion:', formattedTasks);

      const { data: insertedTasks, error: insertError } = await supabase
        .from('tasks')
        .insert(formattedTasks)
        .select();

      if (insertError) {
        console.error('Error inserting tasks:', insertError);
        throw insertError;
      }

      console.log('Successfully inserted tasks:', insertedTasks);
      return insertedTasks as Task[];
    } catch (error) {
      console.error('Error in task generation:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error in generateTasks:', error);
    throw error;
  }
}

export async function applyBestPractices(profileId: string, selectedPractices: string[]): Promise<Task[]> {
  try {
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', profileId)
      .single();

    if (profileError || !profile) {
      throw new Error(`Profile not found for ID: ${profileId}`);
    }

    const prompt = `Generate 3 professional development tasks incorporating these best practices. Return ONLY a JSON array with exactly this schema and no additional text:

Profile Context:
Role: ${profile.linkedin_data.person?.headline || 'Not specified'}
Industry: ${profile.linkedin_data.person?.industry || 'Not specified'}
Best Practices: ${selectedPractices.join(', ')}

Return array of exactly 3 tasks in this format:
[{
  "title": "Clear action item with action verb",
  "description": "Detailed steps to accomplish this task",
  "metadata": {
    "category": "strategic",
    "importance": "high",
    "estimated_time": "medium",
    "expected_outcome": "Specific success metric",
    "strategic_importance": "Why this matters",
    "shareable_text": "Brief shareable description"
  },
  "email_content": "Brief description for team communication"
}]`;

    try {
      const tasks = await callClaudeAPI(prompt);
      const formattedTasks = formatTasks(tasks, profileId);

      const { data: insertedTasks, error: insertError } = await supabase
        .from('tasks')
        .insert(formattedTasks)
        .select();

      if (insertError) {
        throw new Error('Error inserting refined tasks into database');
      }

      return insertedTasks as Task[];
    } catch (error) {
      console.error('Error generating tasks:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error in applyBestPractices:', error);
    throw error;
  }
}