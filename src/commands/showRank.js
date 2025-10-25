import { EmbedBuilder } from "discord.js";
import { supabase } from "../config/supabase.js";

import { myLogs } from "../utils/myLogs.js";

export async function showRankEmbed(limit = 20) {
  const { count: totalRanked, error: countError } = await supabase
    .from("rankings")
    .select("*", { count: "exact", head: true });

  const { data: rankings, error } = await supabase
    .from("rankings")
    .select("discord_username, rank")
    .order("rank", { ascending: false })
    .limit(limit);

  if (error || countError) {
    myLogs("❌ Failed to fetch leaderboard:", error || countError)
    return new EmbedBuilder()
      .setColor("#FF0000")
      .setTitle("⚠️ Error")
      .setDescription("Failed to load leaderboard data 😭");
  }

  let footerText = "";
  if (limit > totalRanked) {
    footerText = `Only ${totalRanked} players are currently ranked 👀`;
  } else if (limit < totalRanked) {
    footerText = `Showing top ${limit} of ${totalRanked} ranked players 🔝`;
  } else {
    footerText = `Showing top ${totalRanked} ranked players 🔝`;
  }

  let text = "```\n";
  const lineLength = Math.max(30, 10 + footerText.length);
  text += "═".repeat(lineLength) + "\n";
  text += "    TOP PLAYER — SEASON 1\n";
  text += "==============================\n\n";

  if (!rankings || rankings.length === 0) {
    for (let i = 1; i <= limit; i++) {
      text += `${i}. [ Vacant ]\n`;
    }
  } else {
    rankings.forEach((p, i) => {
      text += `${i + 1}. [ ${p.discord_username} ] — ${p.rank.toFixed(
        2
      )} ovr\n`;
    });

    for (let i = rankings.length + 1; i <= limit; i++) {
      text += `${i}. [ Vacant ]\n`;
    }
  }

  text += "```";


  return new EmbedBuilder()
    .setColor("#FFD700")
    .setTitle("🏆 TOP PLAYER 🏆")
    .setDescription(text)
    .setFooter({ text: `${footerText} • Keep grinding noobs 💪` })
    .setTimestamp();
}
