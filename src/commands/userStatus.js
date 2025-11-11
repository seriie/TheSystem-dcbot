import { supabase } from "../config/supabase.js";
import { myLogs } from "../utils/myLogs.js";

export const userStatus = async (msg, args) => {
  const targetId = msg.mentions.users.first()?.id || args[0];

  if (!targetId) {
    return msg.reply("❌ Please mention a user or provide their Discord ID!");
  }

  const userObj = await msg.client.users.fetch(targetId).catch(() => null);

  if (!userObj) {
    return msg.reply("🚫 User not found on Discord!");
  }

  const userDisplayname = userObj.globalName || userObj.username; // kalau display name ada, pake itu

  const { data: user, error } = await supabase
    .from("users")
    .select("*")
    .eq("discord_id", targetId)
    .single();

  if (error && error.code !== "PGRST116") {
    myLogs("⚠️  Error fetching user:", error);
    return msg.reply("⚠️ Database error, please try again later!");
  }

  if (!user) {
    return msg.reply(`🚫 ${userDisplayname} is **not registered**.`);
  }

  const joinedAt = new Date(user.joined_at).toLocaleString();
  const regMsg = `✅ **${userDisplayname}** is registered!\n🎮 Roblox: **${user.roblox_username}**\n📅 Joined: **${joinedAt}**`;

  msg.reply(regMsg);
};