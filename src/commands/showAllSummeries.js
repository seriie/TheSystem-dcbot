import { supabase } from "../config/supabase.js";
import { matchSummaryMsg } from "../helpers/matchSummaryMsg.js";

export const showAllSummaries = async (interaction) => {
  if (!interaction.isButton()) return;
  if (interaction.customId !== "show_all_summary") return;

  const summaryChannelId = process.env.MATCH_SUMMARY_LOG_CHANNEL_ID;
  const summaryChannel = await interaction.client.channels.fetch(
    summaryChannelId
  );

  const { data: matches, error } = await supabase
    .from("match_summary")
    .select("*")
    .order("created_at", { ascending: true });

  if (error || !matches || matches.length === 0) {
    console.log("⚠️ No match summaries found.");
    return;
  }

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

  await interaction.reply({
    content: `✅ All ${matches.length} summary has showen!`,
  });
};
