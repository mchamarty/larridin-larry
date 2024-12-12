import { supabase } from './supabase';
import { callClaude } from './claude';

export type Question = {
    id: string;
    text: string;
    type: 'multiple-choice' | 'free-text';
    options?: string[];
    category: 'work-style' | 'leadership' | 'priorities' | 'challenges' | 'goals' | 'professional-experiences';
};

const predefinedQuestions: Question[] = [
    {
        id: 'work-style-1',
        text: "What energizes you most in your role?",
        type: 'multiple-choice',
        options: [
            "Strategic planning and big picture thinking",
            "Direct problem solving and execution",
            "Building and managing relationships",
            "Process optimization and systems thinking"
        ],
        category: 'work-style'
    },
    {
        id: 'leadership-1',
        text: "How do you prefer to influence decisions?",
        type: 'multiple-choice',
        options: [
            "Through data and analytics",
            "By building consensus",
            "Through direct recommendations",
            "By facilitating discussions"
        ],
        category: 'leadership'
    },
    {
        id: 'priorities-1',
        text: "What's your biggest focus for the next quarter?",
        type: 'free-text',
        category: 'priorities'
    },
    {
        id: 'challenges-1',
        text: "What's your biggest challenge in your current role?",
        type: 'free-text',
        category: 'challenges'
    },
    // Add more questions to ensure a pool of at least 20
    {
        id: 'goals-1',
        text: "What is your long-term career goal?",
        type: 'free-text',
        category: 'goals'
    },
    {
        id: 'professional-experiences-1',
        text: "Describe a recent project or achievement you're proud of.",
        type: 'free-text',
        category: 'professional-experiences'
    },
    {
        id: 'work-style-2',
        text: "What type of tasks do you find most draining?",
        type: 'multiple-choice',
        options: [
            "Administrative tasks",
            "Long-term strategic planning",
            "Conflict resolution",
            "Monotonous or repetitive work"
        ],
        category: 'work-style'
    },
    {
        id: 'leadership-2',
        text: "What leadership style resonates with you the most?",
        type: 'multiple-choice',
        options: [
            "Transformational leadership",
            "Servant leadership",
            "Autocratic leadership",
            "Democratic leadership"
        ],
        category: 'leadership'
    }
    // Continue adding up to 20 predefined questions
];

export async function generateQuestions(profileId: string, count: number = 20): Promise<Question[]> {
    try {
        const { data: profile, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', profileId)
            .single();

        if (error || !profile) {
            throw new Error('Profile not found.');
        }

        const prompt = `
            Using the following profile data, generate ${count} multiple-choice questions to understand the user's work philosophy, challenges, goals, and preferences.
            Each question should be categorized as: work-style, leadership, priorities, challenges, goals, or professional experiences.
            Include a unique identifier, question text, and up to 4 multiple-choice options.

            Profile:
            Role: ${profile.linkedin_data.profile.person?.headline || 'Not specified'}
            Industry: ${profile.linkedin_data.profile.company?.industry || 'Not specified'}
            Activities: ${profile.linkedin_data.activities?.posts?.slice(0, 3).map((p: any) => p.text).join(' | ') || 'None'}

            Format:
            [
                {
                    "id": "unique-question-id",
                    "text": "Question text here",
                    "type": "multiple-choice",
                    "options": ["Option1", "Option2", "Option3", "Option4"],
                    "category": "work-style|leadership|priorities|challenges|goals|professional-experiences"
                }
            ]
        `;

        const generatedQuestions = await callClaude(prompt);

        return Array.isArray(generatedQuestions)
            ? generatedQuestions.map((q: any) => ({
                  id: q.id || `auto-${Math.random().toString(36).substring(2, 15)}`,
                  text: q.text,
                  type: q.type,
                  options: q.options || [],
                  category: q.category
              }))
            : predefinedQuestions.slice(0, count);
    } catch (error) {
        console.error('Error generating questions:', error);
        return predefinedQuestions.slice(0, count); // Fall back to predefined questions
    }
}

export async function updateProfileWithAnswers(profileId: string, answers: { [questionId: string]: string }) {
    try {
        const { error } = await supabase
            .from('question_responses')
            .insert(
                Object.entries(answers).map(([questionId, answer]) => ({
                    profile_id: profileId,
                    question_id: questionId,
                    answer
                }))
            );

        if (error) {
            throw new Error('Error saving responses.');
        }

        console.log('Responses successfully saved.');
    } catch (error) {
        console.error('Error updating profile with answers:', error);
        throw error;
    }
}

export async function handleUserCompletion(profileId: string, answers: { [questionId: string]: string }) {
    await updateProfileWithAnswers(profileId, answers);
    const newTasks = await callClaude(`
        Based on the following user responses, generate 5 tasks tailored to their role, preferences, and challenges:
        
        Responses: 
        ${Object.entries(answers).map(([qId, ans]) => `${qId}: ${ans}`).join('\n')}
    `);
    return newTasks;
}
