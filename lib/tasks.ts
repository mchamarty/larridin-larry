import { supabase } from './supabase';
import type { Profile, Task } from './supabase';


async function callClaude(prompt: string): Promise<Array<{
  title: string;
  description: string;
  metadata: {
    category: 'strategic' | 'operational' | 'relational' | 'growth';
    importance: 'high' | 'medium' | 'low';
    estimated_time: 'short' | 'medium' | 'long';
    expected_outcome: string;
  };
  email_content: string;
}>> {
  try {
    console.log('Sending prompt to Claude:', prompt);

    // Make API request via the API route instead of directly to Claude
    const response = await fetch('/api/claude', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Claude API error response:', errorText);
      throw new Error(`Claude API error: ${errorText}`);
    }

    const data = await response.json();
    console.log('Claude API response:', data);

    const textContent = data.content?.[0]?.text;
    if (!textContent) {
      console.error('No valid text content received from Claude.');
      throw new Error('No valid text content received from Claude');
    }

    console.log('Raw text content from Claude:', textContent);

    const jsonMatch = textContent.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const jsonString = jsonMatch[0];
      console.log('Extracted JSON string:', jsonString);
      
      try {
        const parsedResponse = JSON.parse(jsonString);
        if (Array.isArray(parsedResponse)) {
          return parsedResponse;
        } else {
          throw new Error('Parsed response is not an array');
        }
      } catch (parseError) {
        console.error('Failed to parse extracted JSON:', parseError);
        throw new Error('Failed to parse extracted JSON from Claude response');
      }
    } else {
      console.error('No JSON array found in Claude response');
      throw new Error('No JSON array found in Claude response');
    }
  } catch (error) {
    console.error('Error in callClaude:', error);
    throw error;
  }
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

 console.log('Fetched responses:', responses || []);

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

 const prompt = `Generate deeply personalized tasks based on this leader's profile:

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

Generate 3-5 strategic tasks that:
1. Build on this executive's trajectory and current role
2. Leverage demonstrated strengths while pushing growth areas
3. Connect to recent professional activities and industry trends
4. Factor in leadership impact across organizational levels
5. Do not duplicate existing tasks
6. Incorporate selected best practices (if any)

Return as JSON array with schema: {
"title": "Specific executive-level action item",
"description": "Detailed steps with strategic context",
"metadata": {
 "category": "strategic" | "operational" | "relational" | "growth",
 "importance": "high" | "medium" | "low",
 "estimated_time": "short" | "medium" | "long",
 "expected_outcome": "Specific success metric or result"
},
"email_content": "Brief shareable description for team communication"
}`;

 try {
  console.log('Calling Claude with prompt:', prompt);
  const claudeTasks = await callClaude(prompt);
  console.log('Claude response:', claudeTasks);

  const formattedTasks = formatTasks(claudeTasks, profileId);
  console.log('Formatted tasks for insertion:', formattedTasks);

  const { data: insertedTasks, error: insertError } = await supabase
    .from('tasks')
    .insert(formattedTasks)
    .select();

  if (insertError) {
    console.error('Error inserting tasks into database:', insertError);
    throw new Error(`Error inserting tasks into database: ${insertError.message}`);
  }

  console.log('Successfully inserted tasks into database:', insertedTasks);
  return insertedTasks as Task[];
 } catch (error) {
  console.error('Error calling Claude API:', error);
  throw new Error('Failed to generate tasks from Claude API');
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

 const prompt = `Based on this professional's LinkedIn profile:
Role: ${profile.linkedin_data.person?.headline || 'Not specified'}
Industry: ${profile.linkedin_data.person?.industry || 'Not specified'}
Best Practices: ${selectedPractices.join(', ')}

Generate 3-5 professional development tasks that incorporate these best practices. Return ONLY a JSON array where each task has:
{
 "title": "Task title as clear action item",
 "description": "Detailed steps and explanation",
 "metadata": {
     "category": "strategic" | "operational" | "relational" | "growth",
     "importance": "high" | "medium" | "low", 
     "estimated_time": "short" | "medium" | "long",
     "expected_outcome": "Specific success metric or result"
 },
 "email_content": "Brief shareable description for team communication"
}

Tasks should combine industry best practices with specific role requirements.`;

 try {
  const claudeTasks = await callClaude(prompt);
  console.log('Claude response:', claudeTasks);
  const formattedTasks = formatTasks(claudeTasks, profileId);

  const { data: insertedTasks, error: insertError } = await supabase
    .from('tasks')
    .insert(formattedTasks)
    .select();

  if (insertError) {
    throw new Error('Error inserting refined tasks into database');
  }

  return insertedTasks as Task[];
 } catch (error) {
  console.error('Error calling Claude API:', error);
  throw new Error('Failed to generate tasks from Claude API');
 }
} catch (error) {
 console.error('Error in applyBestPractices:', error);
 throw error;
}
}

function formatTasks(tasks: any[], profileId: string): Partial<Task>[] {
  return tasks.map(task => ({
    profile_id: profileId,
    title: task.title,
    description: task.description,
    status: 'pending',
    metadata: {
      category: task.metadata.category,
      importance: task.metadata.importance,
      estimated_time: task.metadata.estimated_time,
      expected_outcome: task.metadata.expected_outcome,
      shareable_text: task.email_content,
      strategic_importance: task.metadata.strategic_importance || 'Not specified',
      best_practice_source: task.metadata.best_practice_source || undefined
    }
  }));
}

