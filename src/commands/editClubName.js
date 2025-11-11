import { supabase } from "../config/supabase.js";
import { myLogs } from "../utils/myLogs.js";

export const editClubName = async (msg, args) => {
  try {
    const parts = args.trim().split(" ");
    const clubId = parts.shift();
    const newName = parts.join(" ");

    if (!clubId || !newName) {
      await msg.reply("⚠️ Invalid format! Example: `$editclubname {clubId} {new club name}`");
      return;
    }

    const { data: oldData, error: fetchError } = await supabase
      .from("clubs")
      .select("club_name")
      .eq("id", clubId)
      .single();

    if (fetchError || !oldData) {
      await msg.reply(`⚠️ Club with ID **${clubId}** not found.`);
      return;
    }

    const oldName = oldData.club_name;

    const { error: updateError } = await supabase
      .from("clubs")
      .update({ club_name: newName })
      .eq("id", clubId);

    if (updateError) {
      myLogs("❌ Failed to update club name: " + JSON.stringify(updateError));
      await msg.reply("💥 Failed to update club name.");
      return;
    }

    myLogs(`✅ Club name updated: ${oldName} → ${newName}`);
    await msg.reply(`✅ Successfully updated club name **${oldName}** → **${newName}**!`);
  } catch (e) {
    myLogs("💥 Unexpected error while editing club: " + e.message);
    await msg.reply("💥 Error while updating club name.");
  }
};