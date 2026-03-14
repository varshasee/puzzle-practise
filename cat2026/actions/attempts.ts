'use server';

import { createServerClient } from '@/lib/db/server';
import { revalidatePath } from 'next/cache';

export async function startAttempt(puzzleId: string) {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  // Check if an in-progress attempt already exists (for resume)
  const { data: existing } = await supabase
    .from('attempts')
    .select('id, final_state, elapsed_seconds')
    .eq('user_id', user.id)
    .eq('puzzle_id', puzzleId)
    .eq('completed', false)
    .maybeSingle();

  if (existing) return existing;

  // Create new attempt
  const { data, error } = await supabase
    .from('attempts')
    .insert({ user_id: user.id, puzzle_id: puzzleId })
    .select('id')
    .single();

  if (error) throw error;
  return data;
}

export async function saveAttemptProgress(
  attemptId: string,
  state: Record<string, unknown>,
  elapsedSeconds: number
) {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  await supabase
    .from('attempts')
    .update({ final_state: state, elapsed_seconds: elapsedSeconds })
    .eq('id', attemptId)
    .eq('user_id', user.id);  // RLS double-check
}

export async function completeAttempt(
  attemptId: string,
  puzzleId: string,
  payload: {
    success: boolean;
    mistakes_count: number;
    hints_used: number;
    elapsed_seconds: number;
    final_state: Record<string, unknown>;
  }
) {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  await supabase
    .from('attempts')
    .update({
      ...payload,
      completed: true,
      completed_at: new Date().toISOString(),
    })
    .eq('id', attemptId)
    .eq('user_id', user.id);

  // Update assignment status
  await supabase
    .from('daily_assignments')
    .update({ status: payload.success ? 'completed' : 'in_progress' })
    .eq('user_id', user.id)
    .eq('puzzle_id', puzzleId);

  revalidatePath('/today');
  revalidatePath('/progress');
}
