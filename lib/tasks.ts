import { supabase } from './supabase';
import type { Profile, QuestionResponse, Task } from './supabase';

export async function callClaude(prompt: string): Promise<any[]> {
  try {
    console.log('Sending prompt to Claude:', prompt);

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01',
        'x-api-key': process.env.ANTHROPIC_API_KEY!,
      },
      body: JSON.stringify({
        model: 'claude-3-opus-20240229',
        max_tokens: 2048,
        messages: [
          {
            role: 'user',
            content: `Generate 5 personalized Chief of Staff tasks based on this profile and incorporating the specified best practices. Return only JSON with no extra text.

Profile:
${prompt}

Format:
{
"tasks": [
{
"title": "Brief task name",
"description": "Clear directive",
"expected_outcome": "Success metric",
"strategic_importance": "Key impact", 
"time_estimate": "Duration",
"category": "strategic|operational|relational|growth",
"shareable_text": "A brief few sentences outlining how this task is valuable and interesting, providing professional rationale for sharing with team, customers, or superiors."
}
]
}`,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Claude API error response:', errorText);
      throw new Error(`Claude API error: ${errorText}`);
    }

    const data = await response.json();
    console.log('Claude API response:', data);

    const textContent = data.content?.find((item: any) => item.type === 'text')?.text;

    if (!textContent) {
      console.error('No valid text content received from Claude.');
      throw new Error('No valid text content received from Claude');
    }

    let parsedResponse;
    try {
      parsedResponse = JSON.parse(textContent);
    } catch (parseError) {
      console.error('Failed to parse JSON from Claude response:', textContent, parseError);
      throw new Error('Failed to parse JSON from Claude response');
    }

    if (!parsedResponse.tasks || !Array.isArray(parsedResponse.tasks)) {
      console.error('Unexpected tasks format received from Claude:', parsedResponse);
      throw new Error('Unexpected tasks format received from Claude');
    }

    return parsedResponse.tasks;
  } catch (error) {
    console.error('Error in callClaude:', error);
    throw error;
  }
}

export async function generateTasks(profileId: string, bestPractices?: string[]) {
  //const cacheKey = `tasks_${profileId}_${bestPractices?.join('_') || ''}`;
  //const cachedTasks = cache.get(cacheKey);

  //if (cachedTasks) {
  //  console.log('Returning cached tasks');
  //  return cachedTasks;
  //}

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

    console.log('Fetched responses:', responses || []);

    const { data: tasks, error: tasksError } = await supabase
      .from('tasks')
      .select('*')
      .eq('profile_id', profileId);

    if (tasksError) {
      console.error('Error fetching tasks:', tasksError);
      console.log('Continuing without previous tasks feedback');
    }

    const taskFeedback = tasks?.map(task => 
      `Task: ${task.title}
       Feedback: ${task.feedback || 'none'}`
    ).join('\n') || 'No previous task feedback';


    const profileData = profile.linkedin_data.profile;
    const activities = profile.linkedin_data.activities;

    const bestPracticesText = bestPractices && bestPractices.length > 0
      ? `Best Practices Sources: ${bestPractices.join(', ')}`
      : 'No specific best practices selected';

    const prompt = `
      Role: ${profileData?.person?.headline || 'Not specified'}
      Industry: ${profileData?.company?.industry || 'Not specified'}
      Company Size: ${profileData?.company?.employeeCount || 'Not specified'}
      Activities: ${activities?.posts?.slice(0, 3).map((p: any) => p.text).join(' | ') || 'None'}
      Previous Task Feedback: ${taskFeedback}
      Responses: ${responses ? responses.map((r: QuestionResponse) => `${r.question_id}: ${r.answer}`).join('\n') : 'None'}
      ${bestPracticesText}
    `;

    console.log('Generated prompt for Claude:', prompt);

    const claudeTasks = await callClaude(prompt);
    console.log('Tasks generated by Claude:', claudeTasks);

    const formattedTasks: Omit<Task, 'id' | 'created_at'>[] = claudeTasks.map((task: any) => ({
      profile_id: profileId,
      title: task.title,
      description: task.description,
      metadata: {
        expected_outcome: task.expected_outcome,
        strategic_importance: task.strategic_importance,
        time_estimate: task.time_estimate,
        category: task.category as 'strategic' | 'operational' | 'relational' | 'growth',
        shareable_text: task.shareable_text,
      },
      status: 'pending' as const,
      is_new: true, 
    }));

    console.log('Formatted tasks for insertion:', formattedTasks);

    const { data: insertedTasks, error: insertError } = await supabase
      .from('tasks')
      .insert(formattedTasks)
      .select();

    if (insertError) {
      console.error('Error inserting tasks into database:', insertError);
      throw new Error('Error inserting tasks into database');
    }

    console.log('Successfully inserted tasks into database:', insertedTasks);
    //cache.set(cacheKey, insertedTasks);
    return insertedTasks;
  } catch (error) {
    console.error('Error in generateTasks:', error);
    throw error;
  }
}

