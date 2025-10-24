// db/saveRanking.js
import { supabase } from '../config/supabase.js';

export async function saveRankingAndVerifyUser(ranking) {
  // Insert ranking row
  const { data, error: insertErr } = await supabase
    .from('rankings')
    .insert([{
      user_id: ranking.user_id,
      discord_username: ranking.discord_username,
      offense: ranking.offense,
      defense: ranking.defense,
      dribbling: ranking.dribbling,
      shooting: ranking.shooting,
      blocking: ranking.blocking,
      playmaking: ranking.playmaking,
      style_mastery: ranking.style_mastery,
      vision: ranking.vision,
      created_at: ranking.created_at,
    }]);

  if (insertErr) {
    console.error('Insert ranking error:', insertErr);
    throw new Error('Failed to insert ranking');
  }

  // Update users.rank_verified -> true
  const { error: updateErr } = await supabase
    .from('users')
    .update({ rank_verified: true })
    .eq('discord_username', ranking.user_id);

  if (updateErr) {
    console.error('Update user error:', updateErr);
    // optionally rollback inserted ranking (left as exercise)
    throw new Error('Failed to update user verification');
  }

  return data;
}