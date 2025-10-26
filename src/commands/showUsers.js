import { supabase } from "../config/supabase.js";
import { embedBuilder } from "../helpers/embedBuilder.js";
import { formatDate } from "../utils/formatDate.js";
import { myLogs } from "../utils/myLogs.js";

export const showUsers = async (msg) => {
  const { data, error } = await supabase.from("users").select("*");

  if (error) {
    myLogs(error);
    return msg.reply("⚠️ Failed to get data from database!");
  }

  if (!data || data.length === 0) {
    return msg.reply("No users found 😅");
  }

  const description = data
    .map(
      (user, i) =>
        `**${i + 1}.** ${user.discord_username} ⬩ (${
          user.roblox_username
        }) — Joined: ${formatDate(user.joined_at) || "❓"}`
    )
    .join("\n");

  const embed = embedBuilder(
    "#00BFFF",
    "👥 Registered users list",
    description,
    null,
    `Total users: ${data.length}`,
    true
  );

  await msg.reply(embed);
};
