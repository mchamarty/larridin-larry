// lib/claude.ts
export async function callClaude(prompt: string): Promise<any[]> {
    try {
        const structuredPrompt = `Human: Based on this context:
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

Return ONLY a valid JSON array of 3-5 tasks without any additional text or explanation.`;

const response = await fetch('/api/claude', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
    },
    body: JSON.stringify({ prompt: structuredPrompt }),
});

        if (!response.ok) {
            throw new Error('Failed to call Claude API');
        }

        const data = await response.json();
        console.log('Claude API raw response:', data);


        const messageContent = data.content?.[0]?.text || '';
        if (!messageContent) {
            throw new Error('No message content received from Claude');
        }

        const jsonMatch = messageContent.match(/\[[\s\S]*\]/);
        if (!jsonMatch) {
            throw new Error('No JSON array found in Claude response');
        }

        const parsedTasks = JSON.parse(jsonMatch[0]);
        if (!Array.isArray(parsedTasks)) {
            throw new Error('Parsed content is not an array');
        }

        const validatedTasks = parsedTasks.map(task => {
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

        return validatedTasks;
    } catch (error) {
        console.error('Error in callClaude function:', error);
        throw error;
    }
}