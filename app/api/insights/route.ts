import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { callClaude } from '@/lib/claude';

export async function GET(request: Request) {
 const { searchParams } = new URL(request.url);
 const profileId = searchParams.get('profileId');

 if (!profileId) {
   return NextResponse.json({ error: 'Profile ID is required' }, { status: 400 });
 }

 try {
   const { data: profile, error: profileError } = await supabase
     .from('profiles')
     .select('*')
     .eq('id', profileId)
     .single();

   if (profileError) {
     throw new Error('Failed to fetch profile data');
   }

   const prompt = `Generate deep strategic insights for this leader's profile:

PROFESSIONAL HISTORY:
- Current: ${profile.linkedin_data.person?.headline}
- Experience: ${profile.linkedin_data.positions?.positionHistory?.slice(0,3).map((p: { title: any; companyName: any; description: string | any[]; }) => 
   `${p.title} at ${p.companyName} (${p.description?.slice(0,100)}...)`).join('\n')}
- Skills: ${profile.linkedin_data.skills?.join(', ')}

ENGAGEMENT & INFLUENCE:
Posts (Last 5):
${profile.linkedin_data.posts?.slice(0,5).map((p: { text: string | any[]; likesCount: any; commentsCount: any; activityDate: any; }) => 
 `• Topic: ${p.text?.slice(0,100)}
  • Impact: ${p.likesCount} likes, ${p.commentsCount} comments
  • Date: ${p.activityDate}`).join('\n')}

Professional Interactions:
${profile.linkedin_data.reactions?.slice(0,5).map((r: { relatedPost: { text: string | any[]; }; }) => 
 `• Engaged: ${r.relatedPost?.text?.slice(0,100)}`).join('\n')}

Network Value:
${profile.linkedin_data.recommendations?.recommendationHistory?.slice(0,3).map((r: { description: string | any[]; authorFullname: any; caption: any; }) =>
 `• "${r.description?.slice(0,100)}..." - ${r.authorFullname}, ${r.caption}`).join('\n')}

Generate strategic analysis covering:
1. Leadership trajectory and impact areas
2. Network influence patterns
3. Professional growth opportunities
4. Industry positioning
5. Content engagement effectiveness

Return JSON: {
 "strategic_insights": [{
   "area": string,
   "insight": string,
   "evidence": string[],
   "recommendations": string[]
 }],
 "metrics": {
   "influence_score": number,
   "engagement_rate": number,
   "expertise_domains": string[],
   "growth_vectors": string[]
 },
 "priority_actions": {
   "immediate": string[],
   "short_term": string[],
   "long_term": string[]
 }
}`;

   const insights = await callClaude(prompt);
   
   await supabase.from('insights').upsert({ 
     profile_id: profileId,
     data: insights,
     created_at: new Date().toISOString()
   });

   return NextResponse.json({ insights });

 } catch (error) {
   console.error('Error in /api/insights:', error);
   return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
 }
}