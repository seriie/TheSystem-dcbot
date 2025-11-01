import { supabase } from "../config/supabase.js";
import { myLogs } from "../utils/myLogs.js";

export const delClub = async (msg, args) => {
  const allowedRoleId = process.env.DEVELOPER_ROLE_ID;
  if (!msg.member.roles.cache.has(allowedRoleId)) {
    await msg.reply(`🚫 You are not allowed <@${msg.author.id}>`);
    return;
  }

  const clubName = args.trim().toLowerCase();

  const { data: clubData, error: fetchError } = await supabase
    .from("clubs")
    .select("id, club_name")
    .ilike("club_name", clubName)
    .single();

  if (fetchError || !clubData) {
    await msg.reply(`⚠️ Club **${clubName}** gnot found.`);
    return;
  }

  const clubId = clubData.id;

  const { error: deleteChildError } = await supabase
    .from("club_rankings")
    .delete()
    .eq("club_id", clubId);

  if (deleteChildError) {
    myLogs(`❌ Failed to delete child rows for ${clubName}: ${deleteChildError.message}`);
    await msg.reply(`⚠️ FAiled to delete relation for data **${clubName}**.`);
    return;
  }

  const { data, error } = await supabase
    .from("clubs")
    .delete()
    .eq("id", clubId)
    .select("id");

  if (error) {
    myLogs(`❌ Failed to delete ${clubName} club: ${error.message}`);
    await msg.reply(`❌ Failed to delete **${clubName}** club.`);
    return;
  }

  if (!data || data.length === 0) {
    await msg.reply(`⚠️ Club **${clubName}** not found.`);
    return;
  }

  myLogs(`✅ Successfully deleted ${clubName} club by ${msg.author.displayName}`);
  await msg.reply(`✅ **${clubName}** and all data successfully deleted!`);
};