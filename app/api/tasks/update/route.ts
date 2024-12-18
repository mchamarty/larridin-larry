import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { Task } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const { taskId, status, feedback, ...updateData } = await request.json();

    if (!taskId) {
      console.error('Missing task ID in update request');
      return NextResponse.json({ error: 'Task ID is required' }, { status: 400 });
    }

    console.log(`Updating task ${taskId} with status: ${status}`);

    const updateObject: Partial<Task> = {
      ...updateData,
      status: status || undefined,
      feedback: feedback || undefined,
      completed_at: status === 'completed' ? new Date().toISOString() : undefined,
      feedback_at: feedback ? new Date().toISOString() : undefined,
      is_new: false // Remove new flag when task is updated
    };

    // Remove undefined values
    Object.keys(updateObject).forEach(key => 
      updateObject[key as keyof Task] === undefined && delete updateObject[key as keyof Task]
    );

    console.log('Update payload:', updateObject);

    const { data, error } = await supabase
      .from('tasks')
      .update(updateObject)
      .eq('id', taskId)
      .select()
      .single();

    if (error) {
      console.error('Error updating task:', error);
      return NextResponse.json({ 
        error: 'Failed to update task',
        details: error.message 
      }, { status: 500 });
    }

    console.log('Task updated successfully:', data);
    return NextResponse.json({
      success: true,
      task: data
    });
  } catch (error) {
    console.error('Unexpected error in /api/tasks/update:', error);
    return NextResponse.json({ 
      error: 'An unexpected error occurred',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}