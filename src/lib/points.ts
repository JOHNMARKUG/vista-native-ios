import { supabase } from './supabase';

export async function awardPoints(
  userId: string | undefined | null,
  points: number,
  type: string,
  description: string,
  bookingRef: string | null = null
): Promise<void> {
  if (!userId || !points) return;
  try {
    await supabase.from('points_transactions').insert({
      user_id: userId,
      points,
      type,
      description,
      booking_ref: bookingRef,
    });
    // Atomic increment — single UPDATE, no prior SELECT — avoids a
    // read-modify-write race when two awards land concurrently.
    await supabase.rpc('increment_points', { user_id: userId, points_to_add: points });
  } catch (err) {
    console.warn('[points] award failed:', (err as Error).message);
  }
}
