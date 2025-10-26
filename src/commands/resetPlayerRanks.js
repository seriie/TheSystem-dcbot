// src/commands/resetPlayerRank.js
import { supabase } from "../config/supabase.js";
import { myLogs } from "../utils/myLogs.js";

export const resetPlayerRank = async (interaction) => {
  if (!interaction.isChatInputCommand()) return;
  if (interaction.commandName !== "resetplayerrank") return;

  try {
    const { error } = await supabase.from("rankings").delete().neq("id", 0); 

    if (error) {
      myLogs("❌ Failed to reset player rankings: " + JSON.stringify(error));
      await interaction.reply({
        content: "⚠️ Failed to delete all players.",
        ephemeral: true,
      });
      return;
    }

    myLogs("✅ All player ranks have been reset.");
    await interaction.reply({
      content: "✅ All data**player rank** successfully deleted from database.",
      ephemeral: true,
    });
  } catch (e) {
    myLogs("❌ Unexpected error while resetting ranks: " + e.message);
    await interaction.reply({
      content: "💥 Error while trying to reset rank.",
      ephemeral: true,
    });
  }
};