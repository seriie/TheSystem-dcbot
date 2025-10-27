import { supabase } from "../config/supabase.js";

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

    let textMsg = `# Match #${i + 1} #\n\n # ${clubAData.club_name} vs ${
      clubBData.club_name
    } #\n## Game Type: ${match.game_type} ##\n**Game Format: ${match.game_format}**`;

    for (let j = 0; j < match.games.length; j++) {
      const g = match.games[j];
      const winner = g.a > g.b ? clubAData.club_name : clubBData.club_name;
      textMsg += `Game ${j + 1}: ${g.a}-${g.b} win for ${winner}\n\n`;
    }

    textMsg += `Summary: **${match.summary}**\nRecorded by: **${match.ranker}**\n-# Summary ID: **${match.id}**`;

    await summaryChannel.send(textMsg);
  }

  await interaction.reply({
    content: `✅ All ${matches.length + 1} summary has showen!`,
  });
};
