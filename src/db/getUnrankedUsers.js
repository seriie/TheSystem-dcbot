// db/getUnrankedUsers.js
import { supabase } from '../config/supabase.js';

export async function getUnrankedUsers(limit = 100) {
  // note: select top `limit` users (select menu limit = 25)
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('rank_verified', false)
    .order('joined_at', { ascending: true })
    .limit(limit);

  if (error) {
    console.error('Error fetching unranked users:', error);
    return [];
  }
  return data || [];
}
