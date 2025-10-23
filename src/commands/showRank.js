import { EmbedBuilder } from "discord.js";
import { supabase } from "../config/supabase.js";

export function showRankEmbed() {
  const leaderboardEmbed = new EmbedBuilder()
    .setColor("#FFD700")
    .setTitle("🏆 Asia Ranking Leaderboard")
    .setDescription("Top 5 players of the week!")
    .addFields(
      { name: "1️⃣ Zii", value: "1500 pts" },
      { name: "2️⃣ Shiro", value: "1320 pts" },
      { name: "3️⃣ Renz", value: "1280 pts" }
    )
    .setFooter({ text: "Keep grinding noobs 💪" })
    .setTimestamp();

  return leaderboardEmbed;
}
