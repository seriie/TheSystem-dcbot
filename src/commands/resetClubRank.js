import { myLogs } from "../utils/myLogs.js";
import { supabase } from "../config/supabase.js";

export const resetClubRank = async (msg, args) => {
  const allowedRole = process.env.OFFICIAL_RANKER_ROLE_ID;
  if (!msg.member.roles.cache.has(allowedRole)) {
    myLogs(
      `🚫  ${msg.author.displayName} trying to reset club rank not allowed!`
    );
    msg.reply(`🚫 You are not allowed **${msg.author.displayName}**`);
    return;
  }

  if (args) {
    const { data } = await supabase
    .from("clubs")
    .select("*")
    .eq("club_id", args);

    const { error } = await supabase
    .from("club_rankings")
    .update({ win: 0, lose: 0, elo: 1000 })
    .eq("club_discord_id", args)

    if (error) {
        myLogs(`❌  ${msg.author.id} failed to update club ranking ${data.club_name}!`);
        msg.reply("❌ Failed to update club ranking");
        return;
    }

    myLogs(`${msg.author.displayName} successfully updated club ranking for club ${data.club_name}`);
    msg.reply(`Successfully updated club ranking for club ${data.club_name}`);
  } else {
    const { error } = await supabase
    .from("club_rankings")
    .update({ win: 0, lose: 0, elo: 1000 })
    .gt("club_discord_id", 0);

    if (error) {
        myLogs(`❌  ${msg.author.displayName} Failed to reset club ranking` + JSON.stringify(error, null, 2));
        msg.reply("❌ Failed to reset club rankiing!");
        return;
    }

    myLogs(`✅  ${msg.author.displayName} successfully reset club ranking!`);
    msg.reply("✅ All ranking data has been reset!");
  }
};
