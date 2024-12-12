import { NextResponse } from 'next/server';
import { applyBestPractices } from '@/lib/tasks';
import { callClaude } from '@/lib/claude';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
    const { profileId, selectedPractices } = await request.json();
    const { data: profile } = await supabase.from('profiles').select('*').eq('id', profileId).single();

    const prompt = `Generate tasks incorporating these best practices: ${selectedPractices.join(', ')}

Leader Context:
- Current Focus: ${profile.linkedin_data.person?.headline}
- Recent Leadership Activities: ${profile.linkedin_data.posts?.slice(0,2).map((p: { text: string | any[]; }) => p.text?.slice(0,50)).join('\n')}
- Key Skills: ${profile.linkedin_data.skills?.slice(0,5).join(', ')}

Tasks should:
1. Align with leader's demonstrated capabilities
2. Address current industry challenges
3. Leverage organizational context
4. Drive measurable impact

Return JSON array with task schema as specified.`;

    const tasks = await callClaude(prompt);
    return NextResponse.json({ success: true, tasks });
}
