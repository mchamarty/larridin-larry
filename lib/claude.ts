const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

export interface Question {
  id: string;
  text: string;
  subtext: string;
  options: string[];
}

export async function callClaude(prompt: string, type: 'tasks' | 'questions' | 'insights'): Promise<any> {
  if (!ANTHROPIC_API_KEY) {
    console.error('ANTHROPIC_API_KEY is not configured');
    throw new Error('ANTHROPIC_API_KEY is not configured');
  }

  try {
    console.log('Sending request to Claude API');

    let structuredPrompt: string;
    if (type === 'tasks') {
      structuredPrompt = `Human: Based on this context:
${prompt}

Generate professional development tasks in a JSON array format. Each task must include exactly these fields:
{
    "title": "Task title as a clear action item",
    "description": "Detailed explanation of how to complete the task",
    "status": "pending",
    "metadata": {
        "category": "strategic" | "operational" | "relational" | "growth",
        "importance": "high" | "medium" | "low",
        "estimated_time": "short" | "medium" | "long"
    },
    "is_new": true,
    "email_content": "Optional email template for task if needed"
}

Return ONLY a valid JSON array of 10 tasks without any additional text or explanation.`;
    } else if (type === 'questions') {
      structuredPrompt = `Human: Based on this context:
${prompt}

Generate 5 insightful multiple-choice questions in a JSON array format. Each question must include exactly these fields:
{
    "text": "Question text",
    "subtext": "Additional context or explanation for the question",
    "options": ["Option 1", "Option 2", "Option 3", "Option 4"]
}

Return ONLY a valid JSON array of 5 questions without any additional text or explanation.`;
    } else {
      structuredPrompt = prompt; // For insights, use the provided prompt as-is
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01',
        'x-api-key': ANTHROPIC_API_KEY,
      },
      body: JSON.stringify({
        model: 'claude-3-opus-20240229',
        max_tokens: 2048,
        messages: [{ role: 'user', content: structuredPrompt }],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Claude API error response:', errorText);
      throw new Error(`Failed to generate content: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('Received response from Claude API');

    const messageContent = data.content?.[0]?.text;
    if (!messageContent) {
      throw new Error('No message content received from Claude');
    }

    if (type === 'insights') {
      // For insights, we expect a single JSON object
      const jsonMatch = messageContent.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.error('No JSON object found in Claude response text:', messageContent);
        throw new Error('Failed to parse JSON object from Claude response');
      }
      return JSON.parse(jsonMatch[0]);
    } else {
      // For tasks and questions, we expect a JSON array
      const jsonMatch = messageContent.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        console.error('No JSON array found in Claude response text:', messageContent);
        throw new Error('Failed to parse JSON array from Claude response');
      }
      const parsedContent = JSON.parse(jsonMatch[0]);
      if (!Array.isArray(parsedContent) || parsedContent.length === 0) {
        console.error('Invalid response format or empty array from Claude');
        throw new Error('Invalid response format or empty array from Claude');
      }
      return parsedContent;
    }
  } catch (error) {
    console.error('Error in callClaude function:', error);
    throw error;
  }
}

function validateTasks(tasks: any[]): any[] {
  return tasks.map(task => {
    if (!task.title || !task.description || !task.metadata) {
      throw new Error('Task missing required fields');
    }
    return {
      ...task,
      status: task.status || 'pending',
      is_new: true,
      email_content: task.email_content || '',
      feedback: '',
      completed_at: null,
      feedback_at: null
    };
  });
}

function validateQuestions(questions: any[]): Question[] {
  return questions.map(question => {
    if (!question.text || !question.subtext || !Array.isArray(question.options) || question.options.length !== 4) {
      throw new Error('Question missing required fields or has incorrect format');
    }
    return question as Question;
  });
}

export async function generateQuestionsWithClaude(linkedInData: any): Promise<Question[]> {
  const prompt = `Generate 5 insightful multiple-choice questions based on this LinkedIn profile data:
${JSON.stringify(linkedInData, null, 2)}

Each question should help understand the person's professional goals, skills, or potential areas for growth.`;

  const rawQuestions = await callClaude(prompt, 'questions');
  const validatedQuestions = validateQuestions(rawQuestions);

  return validatedQuestions.map((q, index) => ({
    id: `q_${index + 1}`,
    text: q.text,
    subtext: q.subtext,
    options: q.options
  }));
}

