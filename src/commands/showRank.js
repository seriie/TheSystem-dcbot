import { embedBuilder } from "../helpers/embedBuilder.js";
import { supabase } from "../config/supabase.js";

import { myLogs } from "../utils/myLogs.js";
import { fetchUser } from "../utils/fetchUser.js";

export async function showRankEmbed(client, limit = 20) {
  // if(msg.author.id == "1392481215205871618") {
  //   return msg.reply("STFU MIZU NOOOBBB")
  // } else if(msg.author.id == "878215711779090443") {
  //   msg.reply("YESS MY GOAT HEARTLY :heart:")
  // }

  const { count: totalRanked, error: countError } = await supabase
    .from("rankings")
    .select("*", { count: "exact", head: true });

  const { data: rankings, error } = await supabase
    .from("rankings")
    .select("users(discord_id), rank")
    .order("rank", { ascending: false })
    .limit(limit);

  if (error || countError) {
    myLogs("❌ Failed to fetch leaderboard:", error || countError);
    return embedBuilder(
      "#FF0000",
      "⚠️ Error",
      "Failed to load leaderboard data 😭",
      null,
      "Please try again later 🔧",
      true
    );
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
  // text += "═════════════════════════════════════════════" + "\n";
  // text += "            TOP PLAYER — SEASON 1\n";
  text += "TOP PLAYER — SEASON 1\n\n";
  // text += "═════════════════════════════════════════════\n\n";

  if (!rankings || rankings.length === 0) {
    for (let i = 1; i <= limit; i++) {
      text += `${i}. [ Vacant ]\n`;
    }
  } else {
    for (const [i, p] of rankings.entries()) {
      const user = await fetchUser(client, p.users.discord_id);
      const username = user ? user.username : "Unknown";
      text += `${i + 1}. [ ${username} ] — ${p.rank.toFixed(2)} ovr\n`;
    }

    for (let i = rankings.length + 1; i <= limit; i++) {
      text += `${i}. [ Vacant ]\n`;
    }
  }

  text += "```";

  return embedBuilder(
    "#FFD700",
    "🏆 TOP PLAYER 🏆",
    text,
    null,
    `${footerText} • Keep grinding noobs 💪`,
    true
  );
}
