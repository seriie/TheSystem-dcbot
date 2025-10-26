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
    // bikin modal UI
    const modal = new ModalBuilder()
      .setCustomId("register_club_modal")
      .setTitle("🏆 Register Club");

    const clubIdInput = new TextInputBuilder()
      .setCustomId("club_id_input")
      .setLabel("Club ID (copy ur server ID)")
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
      .setLabel("Owner ID (copy owner club/sv ID))")
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

  // Insert to DB
  const { error } = await supabase.from("clubs").insert([
    {
      id: nanoIdFormat("CID", 12),
      club_id: clubId,
      club_name: serverName,
      owner_id: ownerId,
    },
  ]);

  if (error) {
    await interaction.reply({ content: "⚠️ Failed to store data.", ephemeral: true });
    myLogs("❌ Insert failed: " + JSON.stringify(error));
    return;
  }

  await interaction.reply({
    content: "✅ Club successfully registered!",
    ephemeral: true,
  });
}