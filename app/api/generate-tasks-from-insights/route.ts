import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { Task } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const { profileId } = await request.json();

    if (!profileId) {
      return NextResponse.json({ error: 'Profile ID is required' }, { status: 400 });
    }

    // Fetch insights for the profile
    const { data: insights, error: insightsError } = await supabase
      .from('insights')
      .select('*')
      .eq('profile_id', profileId);

    if (insightsError) {
      console.error('Error fetching insights:', insightsError);
      return NextResponse.json({ error: 'Failed to fetch insights' }, { status: 500 });
    }

    // Fetch existing tasks for the profile
    const { data: existingTasks, error: tasksError } = await supabase
      .from('tasks')
      .select('*')
      .eq('profile_id', profileId);

    if (tasksError) {
      console.error('Error fetching existing tasks:', tasksError);
      return NextResponse.json({ error: 'Failed to fetch existing tasks' }, { status: 500 });
    }

    // Generate new tasks based on insights and existing tasks using Claude
    const newTasks = await generateTasksFromInsights(insights || [], existingTasks || []);

    // Save new tasks to the database
    const { data: savedTasks, error: saveError } = await supabase
      .from('tasks')
      .insert(newTasks)
      .select();

    if (saveError) {
      console.error('Error saving new tasks:', saveError);
      return NextResponse.json({ error: 'Failed to save new tasks' }, { status: 500 });
    }

    return NextResponse.json(savedTasks);
  } catch (error: any) {
    console.error('Error generating tasks from insights:', error);
    return NextResponse.json(
      { error: error.message || 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

async function generateTasksFromInsights(insights: any[], existingTasks: Task[]) {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY is not configured');
  }

  const insightsText = insights.map(insight => 
    `Question: ${insight.question_id}, Answer: ${insight.answer}`
  ).join('\n');

  const existingTasksText = existingTasks.map(task => 
    `Title: ${task.title}, Description: ${task.description}`
  ).join('\n');

  const prompt = `Based on the following insights from a user and their existing tasks, generate 5 new personalized tasks that would be beneficial for their professional growth and productivity. Each task should be unique and not duplicate existing tasks. Each new task should include a title, description, category (strategic, operational, relational, or growth), expected outcome, strategic importance, and time estimate. Return ONLY a valid JSON array with no additional text or formatting.

User Insights:
${insightsText}

Existing Tasks:
${existingTasksText}

Format the response as a JSON array like this:
[
  {
    "title": "Task title",
    "description": "Detailed task description",
    "status": "pending",
    "metadata": {
      "category": "strategic",
      "expected_outcome": "Expected outcome of the task",
      "strategic_importance": "High",
      "time_estimate": "2 hours",
      "shareable_text": "Brief description for sharing"
    }
  }
]`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
      },
      body: JSON.stringify({
        model: 'claude-3-opus-20240229',
        max_tokens: 2048,
        messages: [
          {
            role: 'user',
            content: prompt,
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
    console.log('Raw Claude response:', data); // Debug log

    const textContent = data.content?.[0]?.text;
    if (!textContent) {
      console.error('No valid text content received from Claude:', data);
      throw new Error('No valid text content received from Claude');
    }

    console.log('Claude text content:', textContent); // Debug log

    try {
      // Try to parse the response as JSON, removing any potential non-JSON content
      const cleanedContent = textContent.trim().replace(/^\`\`\`json\s*|\s*\`\`\`$/g, '');
      console.log('Cleaned content:', cleanedContent); // Debug log
      
      const tasks = JSON.parse(cleanedContent);
      
      if (!Array.isArray(tasks)) {
        throw new Error('Generated content is not a valid JSON array');
      }

      return tasks.map((task: any) => ({
        ...task,
        profile_id: insights[0].profile_id,
        is_new: true,
      }));
    } catch (parseError) {
      console.error('Error parsing Claude response:', parseError);
      console.error('Raw content that failed to parse:', textContent);
      if (parseError instanceof Error) {
        throw new Error(`Failed to parse Claude response: ${parseError.message}`);
      } else {
        throw new Error('Failed to parse Claude response: Unknown error');
      }
    }
  } catch (error: any) {
    console.error('Error calling Claude API:', error);
    throw new Error(`Failed to generate tasks: ${error.message}`);
  }
}

