'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

export interface ResourceRating {
  average: number | null;
  ratingCount: number;
  myRating: number | null;
}

export async function getResourceRating(resourceId: string): Promise<ResourceRating> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('get_resource_rating', { p_resource_id: resourceId });
  const row = data?.[0];
  if (error || !row) return { average: null, ratingCount: 0, myRating: null };
  return { average: row.average, ratingCount: row.rating_count, myRating: row.my_rating };
}

export async function rateResource(resourceId: string, rating: number): Promise<void> {
  const supabase = await createClient();
  await supabase.rpc('rate_resource', { p_resource_id: resourceId, p_rating: rating });
  revalidatePath(`/estudar/${resourceId}`);
}

export async function removeResourceRating(resourceId: string): Promise<void> {
  const supabase = await createClient();
  await supabase.rpc('remove_resource_rating', { p_resource_id: resourceId });
  revalidatePath(`/estudar/${resourceId}`);
}
