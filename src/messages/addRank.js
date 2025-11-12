import {
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
} from "discord.js";
import { supabase } from "../config/supabase.js";
import { getUnrankedUsers } from "../db/getUnrankedUsers.js";

import { myLogs } from "../utils/myLogs.js";
import { fetchUser } from "../utils/fetchUser.js";

export const handleRankButton = async (interaction, client) => {
  if (!interaction.isButton()) return;
  if (interaction.customId !== "add_rank") return;

  await interaction.deferReply({ ephemeral: true }); // ⬅️ kasih waktu lebih
  const users = await getUnrankedUsers(50);

  if (!users.length) {
    return interaction.editReply({
      content: "✅ All players are already ranked!",
    });
  }

  const options = await Promise.all(
    users.map(async (u) => {
      const userData = await fetchUser(client, u.discord_id);
      return {
        label: `${u.roblox_username.slice(0, 100)} (${
          userData?.displayName || "Unknown"
        })`,
        value: u.discord_id,
      };
    })
  );

  const select = new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId("select_player_to_rank")
      .setPlaceholder("Choose player to rank")
      .addOptions(options)
  );

  await interaction.editReply({
    content: "Choose a player to rank:",
    components: [select],
  });
};

export const handleSelectPlayer = async (interaction, client) => {
  if (!interaction.isStringSelectMenu()) return;
  if (interaction.customId !== "select_player_to_rank") return;

  const player = interaction.values[0];
  const user = interaction.user;

  if (player === user.username) {
    myLogs(`⚠️  ${user.username} is trying to rank himself`);
    return interaction.reply({
      content: "🚫 You can’t rank yourself, silly!",
      ephemeral: true,
    });
  }

  const fetchedUser = await fetchUser(client, player);
  const displayName = fetchedUser?.displayName || "Unknown";

  myLogs(`📑  ${user.username} selected ${displayName}!`);

  const modal = new ModalBuilder()
    .setCustomId(`rank_modal_${player}`)
    .setTitle(`🏀 Rank ${displayName}`);

  const skills = [
    "offense",
    "defense",
    "playmaking",
    "style_mastery",
    "vision",
  ];
  const inputs = skills.map((skill) =>
    new TextInputBuilder()
      .setCustomId(skill)
      .setLabel(`${skill} (1.0 - 10.0)`)
      .setStyle(TextInputStyle.Short)
      .setPlaceholder("Example: 8.5")
      .setRequired(true)
  );

  modal.addComponents(
    inputs.map((i) => new ActionRowBuilder().addComponents(i))
  );

  await interaction.showModal(modal);
};

export const handleModalSubmit = async (interaction, client) => {
  if (!interaction.isModalSubmit()) return;
  if (!interaction.customId.startsWith("rank_modal_")) return;

  const player = interaction.customId.replace("rank_modal_", "");
  const skills = [
    "offense",
    "defense",
    "playmaking",
    "style_mastery",
    "vision",
  ];

  const fetchedUser = await fetchUser(client, player);
  const displayName = fetchedUser?.displayName || "Unknown";

  const data = {};
  for (const s of skills) {
    data[s] = parseFloat(interaction.fields.getTextInputValue(s));
  }

  // 🧮 Calculate the average score
  const total = Object.values(data).reduce((acc, val) => acc + val, 0);
  const rank = total / skills.length;

  // find user_id based on username
  const { data: userData, error: userError } = await supabase
    .from("users")
    .select("id")
    .eq("discord_id", player)
    .single();

  if (userError || !userData) {
    myLogs("🔎  User not found:", userError);
    return interaction.reply({
      content: "❌ Player not found in database.",
      ephemeral: true,
    });
  }

  const user_id = userData.id;

  // Save to rankings
  const { error } = await supabase.from("rankings").insert([
    {
      user_id,
      discord_username: displayName,
      ...data,
      rank, // ⬅️ average from the score
      created_at: new Date().toISOString(),
    },
  ]);

  // Update for user ranked marking
  try {
    myLogs("🔄  updating rank status...");
    await supabase
      .from("users")
      .update({ rank_verified: true })
      .eq("id", user_id);
  } catch (e) {
    myLogs("❌  Error updating user:", e);
  }

  if (error) {
    myLogs("❌  ", error);
    return interaction.reply({
      content: "❌ Failed to save data.",
      ephemeral: true,
    });
  }

  myLogs(`📊  ${interaction.user.username} have ranked ${displayName}`);

  await interaction.reply({
    content: `✅ Ranking for **${displayName}** saved successfully! Average rank: **${rank.toFixed(
      2
    )}** 🏀`,
    ephemeral: true,
  });
};
