import { supabase } from "../config/supabase.js";
import { myLogs } from "../utils/myLogs.js";

export const showClubs = async (msg) => {
  try {
    const { data, error } = await supabase.from("clubs").select("*");

    if (error) {
      myLogs("❌ Failed to fetch clubs: " + JSON.stringify(error));
      await msg.reply("💥 Failed to fetch club data.");
      return;
    }

    if (!data || data.length === 0) {
      await msg.reply("⚠️ No clubs found.");
      return;
    }

    // biar rapi, atur max length buat align spacing
    const maxNameLength = Math.max(...data.map(c => c.club_name.length));
    const formatted = data
      .map(
        (club, i) =>
          `${i + 1}. ${club.club_name.padEnd(maxNameLength)} | ${club.id}`
      )
      .join("\n");

    await msg.reply(`🏀 **Club List:**\n\`\`\`yaml\n${formatted}\n\`\`\``);
  } catch (e) {
    myLogs("💥 Unexpected error while showing clubs: " + e.message);
    await msg.reply("💥 Error while trying to show clubs.");
  }
};