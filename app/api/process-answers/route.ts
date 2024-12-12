// app/api/process-answers/route.ts
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
    try {
        const { profileId, answers } = await request.json();
        
        const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', profileId)
            .single();

        const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/claude`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                prompt: `Based on these answers and profile, generate 5 highly personalized tasks:

Profile Info:
${JSON.stringify(profile.linkedin_data, null, 2)}

Question Responses:
${answers.map((a: { question: any; answers: any[]; }) => `Q: ${a.question}\nA: ${a.answers.join(', ')}`).join('\n\n')}

Generate 5 NEW tasks that specifically address insights from their answers while leveraging their role and experience. Tasks should be highly actionable and contextually relevant.

Return ONLY a JSON array:
[{
    "title": "Specific action item",
    "description": "Detailed implementation steps",
    "status": "pending",
    "metadata": {
        "category": "strategic|operational|relational|growth",
        "importance": "high|medium|low",
        "estimated_time": "short|medium|long"
    },
    "is_new": true,
    "email_content": "Compelling pitch explaining value and implementation"
}]`
            })
        });

        const data = await response.json();
        const tasks = JSON.parse(data.content[0].text);

        const { data: storedTasks, error } = await supabase
            .from('tasks')
            .insert(tasks.map((task: any) => ({
                ...task,
                profile_id: profileId
            })))
            .select();

        if (error) throw error;

        return NextResponse.json({ success: true, tasks: storedTasks });
    } catch (error) {
        return NextResponse.json({ 
            success: false, 
            error: String(error) 
        }, { status: 500 });
    }
}