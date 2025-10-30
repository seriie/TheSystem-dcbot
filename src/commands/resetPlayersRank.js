import { myLogs } from "../utils/myLogs.js";
import { supabase } from "../config/supabase.js";

export const resetPlayersRank = async (msg) => {
  try {
    const allowedRoleId = process.env.OFFICIAL_RANKER_ROLE_ID;
    if (!msg.member.roles.cache.has(allowedRoleId)) {
      await msg.reply("🚫 You are not allowed.");
      return;
    }

    const mentionedUser = msg.mentions.users.first();

    if (mentionedUser) {
      const userIdDiscord = mentionedUser.id;

      const { data: userData, error: fetchError } = await supabase
        .from("users")
        .select("id")
        .eq("discord_id", userIdDiscord)
        .single();

      if (fetchError || !userData) {
        myLogs("⚠️ Failed to find user data: " + JSON.stringify(fetchError));
        await msg.reply("⚠️ Failed to find player data.");
        return;
      }

      const { error: deleteError } = await supabase
        .from("rankings")
        .delete()
        .eq("user_id", userData.id);

      if (deleteError) {
        myLogs("❌ Failed to delete user data: " + JSON.stringify(deleteError));
        await msg.reply("⚠️ Failed to delete player rank.");
        return;
      }

      const { error: updateError } = await supabase
        .from("users")
        .update({ rank_verified: false })
        .eq("id", userData.id);

      if (updateError) {
        myLogs("⚠️ Failed to update rank_verified: " + JSON.stringify(updateError));
        await msg.reply("⚠️ User data deleted but failed to update rank_verified.");
        return;
      }

      myLogs(`✅ Rank data for ${mentionedUser.tag} deleted.`);
      await msg.reply(`✅ Rank data for **${mentionedUser.username}** deleted!`);
      return;
    }

    const { error: updateError } = await supabase
      .from("users")
      .update({ rank_verified: false })
      .eq("rank_verified", true);

    if (updateError) {
      myLogs("❌ Failed to update rank_verified: " + JSON.stringify(updateError));
      await msg.reply("⚠️ Failed to update rank_verified field.");
      return;
    }

    const { error: deleteError } = await supabase
      .from("rankings")
      .delete()
      .neq("id", 0);

    if (deleteError) {
      myLogs("❌ Failed to reset player rankings: " + JSON.stringify(deleteError));
      await msg.reply("⚠️ Failed to delete rank data.");
      return;
    }

    myLogs("✅ All rank players have been deleted.");
    await msg.reply("✅ All player rank data deleted, and rank_verified reset!");
  } catch (e) {
    myLogs("💥 Unexpected error while trying to reset: " + e.message);
    await msg.reply("💥 Error while trying to delete data.");
  }
};