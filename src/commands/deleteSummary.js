import { supabase } from "../config/supabase.js";
import { matchSummaryMsg } from "../helpers/matchSummaryMsg.js";
import { myLogs } from "../utils/myLogs.js";

export const delSummary = async (msg, args) => {
  try {
    const allowedRoleId = process.env.OFFICIAL_RANKER_ROLE_ID;

    if (!msg.member.roles.cache.has(allowedRoleId)) {
      await msg.reply("🚫 You are not allowed.");
      return;
    }

    // 1️⃣ Delete summary from DB
    const { error: deleteError } = await supabase
      .from("match_summary")
      .delete()
      .eq("id", args);

    if (deleteError) throw deleteError;

    await msg.reply(`✅ Summary ${args} deleted!`);
    myLogs(`✅ Summary ${args} deleted from database`);

    // 2️⃣ Get summary channel
    const summaryChannel = await msg.client.channels.fetch(
      process.env.MATCH_SUMMARY_LOG_CHANNEL_ID
    );

    let deletedCount = 0;
    let messages;
    do {
      messages = await summaryChannel.messages.fetch({ limit: 100 });
      const filtered = messages.filter(
        (m) => Date.now() - m.createdTimestamp < 14 * 24 * 60 * 60 * 1000
      );
      if (filtered.size > 0) {
        await summaryChannel.bulkDelete(filtered);
        deletedCount += filtered.size;
      }
    } while (messages.size >= 2);
    myLogs(`🧹 Deleted ${deletedCount} old summary messages`);

    // 4️⃣ Fetch data from db
    const { data: matches, error: fetchError } = await supabase
      .from("match_summary")
      .select("*")
      .order("created_at", { ascending: true });

    if (fetchError) throw fetchError;

    if (!matches || matches.length === 0) {
      await summaryChannel.send("📭 No match summaries yet.");
      return;
    }

    // 6️⃣ Resend summary
    for (let i = 0; i < matches.length; i++) {
      const match = matches[i];

      const { data: clubAData } = await supabase
        .from("clubs")
        .select("club_name")
        .eq("id", match.club_a_id)
        .single();

      const { data: clubBData } = await supabase
        .from("clubs")
        .select("club_name")
        .eq("id", match.club_b_id)
        .single();

      const textMsg = matchSummaryMsg({
        index: i,
        clubA: clubAData.club_name,
        clubB: clubBData.club_name,
        gameType: match.game_type,
        gameFormat: match.game_format,
        games: match.games,
        summary: match.summary,
        ranker: match.ranker,
        summaryId: match.id,
      });

      await summaryChannel.send(textMsg);
    }

    myLogs(`✅ Summary channel refreshed with ${matches.length} entries`);
  } catch (e) {
    console.error("❌ Error:", e);
    myLogs("❌ Failed to delete summary: " + e);
    await msg.reply("❌ Failed to delete summary");
  }
};