import { supabase } from "../config/supabase.js";
import { myLogs } from "../utils/myLogs.js";

export const clubInfo = async (msg, args, client = null) => {
  try {
    let query = supabase.from("clubs").select("*");

    if (args.length > 0) {
      query = query.eq("id", args[0]);
    }

    const { data, error } = await query;

    if (error) {
      myLogs("❌ Failed to fetch club info: " + JSON.stringify(error));
      await msg.reply("💥 Failed to fetch club info.");
      return;
    }

    if (!data || data.length === 0) {
      await msg.reply("⚠️ Club not found.");
      return;
    }

    let formatted = "";

    for (let i = 0; i < data.length; i++) {
      const club = data[i];
      let ownerName = "❓ Unknown";

      try {
        const cachedUser = client.users.cache.get(club.owner_id);
        if (cachedUser) {
          ownerName = cachedUser.displayName || cachedUser.username;
        } else {
          const fetchedUser = await client.users.fetch(club.owner_id).catch(() => null);
          if (fetchedUser) ownerName = fetchedUser.displayName || fetchedUser.username;
        }
      } catch (err) {
        myLogs("⚠️ Failed to fetch user name: " + err.message);
      }

      formatted += `**${i + 1}. ${club.club_name}**\n`;
      formatted += `🆔 ID: \`${club.id}\`\n`;
      formatted += `👑 Owner: ${ownerName}\n`;
      formatted += `🌐 Server ID: \`${club.club_id}\`\n\n`;
    }

    await msg.reply(`🏀 **Club Info:**\n${formatted}`);
  } catch (e) {
    myLogs("💥 Unexpected error while showing club info: " + e.message);
    await msg.reply("💥 Error while trying to show club info.");
  }
};