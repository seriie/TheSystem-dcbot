import {
  ModalBuilder,
  ActionRowBuilder,
  TextInputBuilder,
  TextInputStyle,
} from "discord.js";
import { myLogs } from "../utils/myLogs.js";
import { supabase } from "../config/supabase.js";
import { nanoIdFormat } from "../utils/nanoid.js";

export async function handleRegisterClubs(interaction) {
  if (!interaction.isButton()) return;
  if (interaction.customId !== "open_register_club_rank_ui") return;

  try {
    const modal = new ModalBuilder()
      .setCustomId("register_club_modal")
      .setTitle("🏆 Register Club");

    const clubIdInput = new TextInputBuilder()
      .setCustomId("club_id_input")
      .setLabel("Club ID (copy your server ID)")
      .setStyle(TextInputStyle.Short)
      .setPlaceholder("Put your server ID here")
      .setRequired(true);

    const serverNameInput = new TextInputBuilder()
      .setCustomId("server_name_input")
      .setLabel("Server Name")
      .setStyle(TextInputStyle.Short)
      .setPlaceholder("Please input a valid club/server name")
      .setRequired(true);

    const ownerIdInput = new TextInputBuilder()
      .setCustomId("owner_id_input")
      .setLabel("Owner ID (copy owner club/sv ID)")
      .setStyle(TextInputStyle.Short)
      .setPlaceholder("Input owner club/server ID here")
      .setRequired(true);

    modal.addComponents(
      new ActionRowBuilder().addComponents(clubIdInput),
      new ActionRowBuilder().addComponents(serverNameInput),
      new ActionRowBuilder().addComponents(ownerIdInput)
    );

    await interaction.showModal(modal);
  } catch (err) {
    myLogs("❌ Error showing register modal: " + err);
  }
}

export async function handleRegisterClubModal(interaction) {
  if (!interaction.isModalSubmit()) return;
  if (interaction.customId !== "register_club_modal") return;

  const clubId = interaction.fields.getTextInputValue("club_id_input");
  const serverName = interaction.fields.getTextInputValue("server_name_input");
  const ownerId = interaction.fields.getTextInputValue("owner_id_input");

  const { data: existingClub, error: checkError } = await supabase
    .from("clubs")
    .select("*")
    .eq("club_id", clubId)
    .single();

  if (checkError && checkError.code !== "PGRST116") {
    myLogs("❌ Failed checking existing club: " + JSON.stringify(checkError));
    return interaction.reply({
      content: "⚠️ Error checking existing data.",
      ephemeral: true,
    });
  }

  if (existingClub) {
    return interaction.reply({
      content: `🚫 Club **${existingClub.club_name}** already registered!`,
      ephemeral: true,
    });
  }

  const clubIdFormat = nanoIdFormat("CID", 12);
  const clubRankingIdFormat = nanoIdFormat("CRID", 12);

  const { error: insertClubErr } = await supabase.from("clubs").insert([
    {
      id: clubIdFormat,
      club_id: clubId,
      club_name: serverName,
      owner_id: ownerId,
    },
  ]);

  if (insertClubErr) {
    myLogs("❌ Insert club failed: " + JSON.stringify(insertClubErr));
    return interaction.reply({
      content: "⚠️ Failed to store club data.",
      ephemeral: true,
    });
  }

  const { error: insertRankErr } = await supabase.from("club_rankings").insert([
    {
      id: clubRankingIdFormat,
      club_id: clubIdFormat,
      club_discord_id: clubId
    },
  ]);

  if (insertRankErr) {
    await supabase.from("clubs").delete().eq("id", clubIdFormat);
    myLogs("❌ Insert ranking failed: " + JSON.stringify(insertRankErr));
    return interaction.reply({
      content: "⚠️ Failed to update ranking data.",
      ephemeral: true,
    });
  }

  await interaction.reply({
    content: `✅ Club **${serverName}** successfully registered!`,
    ephemeral: true,
  });

  myLogs(`✅ Registered club: ${serverName} by ${interaction.user.username}`);
}