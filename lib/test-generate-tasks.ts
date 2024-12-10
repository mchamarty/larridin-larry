import { config } from 'dotenv';
import { resolve } from 'path';
import { generateTasks } from './tasks';

// Load .env.local file
config({ path: resolve(__dirname, '../.env.local') });

// Debug logs to verify environment variables
console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
console.log('Supabase ANON KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set' : 'Not set');
console.log('Anthropic API Key:', process.env.ANTHROPIC_API_KEY ? 'Set' : 'Not set');

const profileId = '6eb16129-828c-4122-8cb8-3282464b0b50'; // Replace with a valid profile ID

(async () => {
  try {
    console.log('Starting test task generation for profile:', profileId);
    const tasks = await generateTasks(profileId);
    console.log('Generated tasks:', tasks);
  } catch (error) {
    console.error('Task generation failed:', error);
  }
})();