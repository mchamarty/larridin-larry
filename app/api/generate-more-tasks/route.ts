// app/api/generate-more-tasks/route.ts
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
    try {
        const { profileId, existingTasks, count = 5 } = await request.json();
        
        const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', profileId)
            .single();

        const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/claude`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                prompt: `Generate ${count} NEW and DIFFERENT professional development tasks for this profile, avoiding these existing tasks: ${existingTasks.join(', ')}

Profile:
${JSON.stringify(profile.linkedin_data, null, 2)}

Return ONLY a JSON array in this format:
[{
    "title": "Task title as action item",
    "description": "Detailed how-to",
    "status": "pending",
    "metadata": {
        "category": "strategic|operational|relational|growth",
        "importance": "high|medium|low",
        "estimated_time": "short|medium|long"
    },
    "is_new": true,
    "email_content": "Email-ready pitch explaining task importance and implementation steps"
}]`
            })
        });

        const data = await response.json();
        const tasks = JSON.parse(data.content[0].text.match(/\[[\s\S]*\]/)[0]);

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
        return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
    }
}