import {
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
} from "discord.js";
import { supabase } from "../config/supabase.js";
import { getUnrankedUsers } from "../db/getUnrankedUsers.js";

export const handleRankButton = async (interaction) => {
  if (!interaction.isButton()) return;
  if (interaction.customId !== "add_rank") return;

  const users = await getUnrankedUsers(25);

  if (!users.length) {
    return interaction.reply({
      content: "✅ All players are already ranked!",
      ephemeral: true,
    });
  }

  const options = users.map((u) => ({
    label: u.discord_username.slice(0, 100),
    value: u.discord_username,
  }));

  const select = new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId("select_player_to_rank")
      .setPlaceholder("Choose player to rank")
      .addOptions(options)
  );

  await interaction.reply({
    content: "Choose a player to rank:",
    components: [select],
    ephemeral: true,
  });
};

export const handleSelectPlayer = async (interaction) => {
  if (!interaction.isStringSelectMenu()) return;
  if (interaction.customId !== "select_player_to_rank") return;

  const player = interaction.values[0];

  const modal = new ModalBuilder()
    .setCustomId(`rank_modal_${player}`)
    .setTitle(`🏀 Rank ${player}`);

  const skills = ["offense", "defense", "playmaking", "style_mastery", "vision"];
  const inputs = skills.map((skill) =>
    new TextInputBuilder()
      .setCustomId(skill)
      .setLabel(`${skill} (1.0 - 10.0)`)
      .setStyle(TextInputStyle.Short)
      .setPlaceholder("Example: 8.5")
      .setRequired(true)
  );

  modal.addComponents(inputs.map((i) => new ActionRowBuilder().addComponents(i)));

  await interaction.showModal(modal);
};

export const handleModalSubmit = async (interaction) => {
  if (!interaction.isModalSubmit()) return;
  if (!interaction.customId.startsWith("rank_modal_")) return;

  const player = interaction.customId.replace("rank_modal_", "");
  const skills = ["offense", "defense", "playmaking", "style_mastery", "vision"];

  const data = {};
  for (const s of skills) {
    data[s] = parseFloat(interaction.fields.getTextInputValue(s));
  }

  const { data: userData, error: userError } = await supabase
    .from("users")
    .select("id")
    .eq("discord_username", player)
    .single();

  if (userError || !userData) {
    console.error("User not found:", userError);
    return interaction.reply({
      content: "❌ Player not found in database.",
      ephemeral: true,
    });
  }

  const user_id = userData.id;

  const { error } = await supabase.from("rankings").insert([
    {
      user_id,
      discord_username: player,
      ...data,
      created_at: new Date().toISOString(),
    },
  ]);

  if (error) {
    console.error(error);
    return interaction.reply({
      content: "❌ Failed to save data.",
      ephemeral: true,
    });
  }

  await interaction.reply({
    content: `✅ Ranking for **${player}** saved successfully!`,
    ephemeral: true,
  });
};