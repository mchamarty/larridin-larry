import { supabase } from './supabase';
import { callClaude } from './claude';

export interface Question {
    id: string;
    text: string;
    type: 'multiple-choice' | 'free-text';
    options?: string[];
    category: 'work-style' | 'leadership' | 'priorities' | 'challenges' | 'goals' | 'professional-experiences';
    subtext?: string;  // Made optional
}

export interface QuestionResponse {
    success: boolean;
    questions?: Question[];
    error?: string;
    message?: string;
}


export const predefinedQuestions: Question[] = [
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
        category: 'work-style',
        subtext: "Understanding your energy drivers helps optimize role alignment"
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
        category: 'leadership',
        subtext: "Identifying your natural leadership approach guides development"
    }
];

export const questions = predefinedQuestions;

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

        const prompt = `Generate ${count} multiple-choice questions to assess the user's work philosophy, challenges, goals, and preferences based on their LinkedIn profile:

Profile:
Role: ${profile.linkedin_data.profile.person?.headline || 'Not specified'}
Industry: ${profile.linkedin_data.profile.company?.industry || 'Not specified'}
Activities: ${profile.linkedin_data.activities?.posts?.slice(0, 3).map((p: any) => p.text).join(' | ') || 'None'}

Return ONLY a JSON array of questions with format:
{
    "id": "unique-question-id",
    "text": "Question text",
    "type": "multiple-choice",
    "options": ["Option1", "Option2", "Option3", "Option4"],
    "category": "work-style|leadership|priorities|challenges|goals|professional-experiences"
}`;

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
        return predefinedQuestions.slice(0, count);
    }
}

export async function updateProfileWithAnswers(profileId: string, answers: { [questionId: string]: string }) {
    const { error } = await supabase
        .from('question_responses')
        .insert(
            Object.entries(answers).map(([questionId, answer]) => ({
                profile_id: profileId,
                question_id: questionId,
                answer
            }))
        );

    if (error) throw new Error('Error saving responses.');
}

export async function handleUserCompletion(profileId: string, answers: { [questionId: string]: string }) {
    await updateProfileWithAnswers(profileId, answers);
    return await callClaude(`Generate 5 professional development tasks based on these responses:
${Object.entries(answers).map(([qId, ans]) => `${qId}: ${ans}`).join('\n')}`);
}