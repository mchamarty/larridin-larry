import { NextResponse } from 'next/server'
import { generateTasks } from '@/lib/tasks'

export async function POST(req: Request) {
  const { profileId } = await req.json()
  try {
    const tasks = await generateTasks(profileId)
    return NextResponse.json(tasks)
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Error generating tasks' }, { status: 500 })
  }
}