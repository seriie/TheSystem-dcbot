import { embedBuilder } from "../helpers/embedBuilder.js";
import { supabase } from "../config/supabase.js";
import { myLogs } from "../utils/myLogs.js";

export async function showClubRankEmbed(limit = 10) {
  const { data: rankings, error } = await supabase
    .from("club_rankings")
    .select("club_id, elo, clubs(club_name)")
    .order("elo ", { ascending: false })
    .limit(limit);

  if (error) {
    myLogs("❌ Failed to fetch leaderboard:" + JSON.stringify(error) || JSON.stringify(countError));
    return embedBuilder(
      "#FF0000",
      "⚠️ Error",
      "Failed to load leaderboard data 😭",
      null,
      "Please try again later 🔧",
      true
    );
  }

  let footerText = `Showing ${rankings.length} clubs  `;

  let text = "```\n";
  // text += "═════════════════════════════════════════════" + "\n";
  // text += "            TOP PLAYER — SEASON 1\n";
  text += "TOP CLUB — SEASON 1\n\n";
  // text += "═════════════════════════════════════════════\n\n";

  if (!rankings || rankings.length === 0) {
    for (let i = 1; i <= limit; i++) {
      text += `${i}. [ Vacant ]\n`;
    }
  } else {
    rankings.forEach((p, i) => {
      text += `${i + 1}. [ ${p.clubs.club_name} ] — ${p.elo} elo\n`;
    });

    for (let i = rankings.length + 1; i <= limit; i++) {
      text += `${i}. [ Vacant ]\n`;
    }
  }

  text += "```";

  return embedBuilder(
    "#FFD700",
    "🏆 TOP CLUB 🏆",
    text,
    "./src/assets/club-rank-bg.png",
    `${footerText} • Keep grinding noobs 💪`,
    true
  );
}
