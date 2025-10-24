import { supabase } from "../config/supabase.js";
import { EmbedBuilder } from "discord.js";
import { formatDate } from "../utils/formatDate.js";

export const showUsers = async (msg) => {
  const { data, error } = await supabase.from("users").select("*");

  if (error) {
    console.error(error);
    return msg.reply("⚠️ Failed to get data from database!");
  }

  if (!data || data.length === 0) {
    return msg.reply("No users found 😅");
  }

  const embed = new EmbedBuilder()
    .setColor("#00BFFF")
    .setTitle("👥 Registered users list")
    .setDescription(
      data
        .map(
          (user, i) =>
            `**${i + 1}.** ${user.discord_username} — Joined: ${formatDate(user.joined_at) || "❓"}`
        )
        .join("\n")
    )
    .setFooter({ text: `Total users: ${data.length}` })
    .setTimestamp();

  await msg.reply({ embeds: [embed] });
};
