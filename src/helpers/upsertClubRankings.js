import { supabase } from "../config/supabase.js";
import { myLogs } from "../utils/myLogs.js";
import { nanoIdFormat } from "../utils/nanoid.js";

export async function upsertClubRanking(clubId, win, lose, elo, ranker) {
  const matchDate = new Date().toISOString();

  const { data: existing, error: fetchError } = await supabase
    .from("club_rankings")
    .select("*")
    .eq("club_id", clubId)
    .maybeSingle();
    
  if (fetchError) {
    myLogs("❌ Failed to fetch club ranking: " + JSON.stringify(fetchError));
    return;
  }

  if (existing) {
    const { error: updateError } = await supabase
      .from("club_rankings")
      .update({
        win: existing.win + win,
        lose: existing.lose + lose,
        elo,
        ranker,
        created_at: matchDate,
      })
      .eq("club_id", clubId);

    if (updateError) {
      myLogs("❌ Failed to update ranking: " + JSON.stringify(updateError));
    } else {
      myLogs(`✅ Updated ranking for ${clubId}: W${existing.win + win}/L${existing.lose + lose} ELO ${elo}`);
    }
  } else {
    const { error: insertError } = await supabase.from("club_rankings").insert([
      {
        id: nanoIdFormat("CRID", 12),
        club_id: clubId,
        win,
        lose,
        elo,
        ranker,
        created_at: matchDate,
      },
    ]);

    if (insertError) {
      myLogs("❌ Failed to insert ranking: " + JSON.stringify(insertError));
    } else {
      myLogs(`✅ Inserted new club ranking for ${clubId}: W${win}/L${lose} ELO ${elo}`);
    }
  }
}
